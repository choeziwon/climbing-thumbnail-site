// Render examples in the page document so browser annotations can select the
// actual controls. Ordinary prefixed rules keep the examples inspectable by
// browser style editors while isolating each service sample.
let catalogSampleSequence=0;
function mountCatalogSample(frame){
 const doc=frame.contentDocument;
 const host=document.createElement('div');
 host.id='ds-example-'+(++catalogSampleSequence);
 host.className='ds-sample '+doc.body.className;
 host.setAttribute('aria-label',frame.title);
 host.dataset.selector=frame.dataset.selector||'';
 const ids=new Map([...doc.body.querySelectorAll('[id]')].map(el=>[el.id,host.id+'-'+el.id]));
 const rewriteIds=text=>text.replace(/#([\w-]+)/g,(all,id)=>ids.has(id)?'#'+ids.get(id):all);
 const splitSelectors=text=>{const parts=[];let start=0,depth=0,quote='';for(let i=0;i<text.length;i++){const c=text[i];if(quote){if(c===quote&&text[i-1]!==String.fromCharCode(92))quote='';continue;}if(c==='"'||c==="'")quote=c;else if(c==='('||c==='[')depth++;else if(c===')'||c===']')depth--;else if(c===','&&!depth){parts.push(text.slice(start,i));start=i+1;}}parts.push(text.slice(start));return parts;};
 const selector=text=>splitSelectors(text).map(part=>{
  const normalized=rewriteIds(part.trim().replace(/(?<![\w-])(?:html|body)(?![\w-])/g,':scope').replace(/:root\b/g,':scope'));
  return normalized.startsWith(':scope')?normalized.replaceAll(':scope','#'+host.id):'#'+host.id+' '+normalized.replaceAll(':scope','#'+host.id);
 }).join(',');
 const urls=(text,base)=>text.replace(/url\((['"]?)([^)'"\s]+)\1\)/g,(all,quote,url)=>url.startsWith('#')?rewriteIds(all):'url("'+new URL(url,base).href+'")');
 const rules=(list,base)=>[...list].map(rule=>{
  if(rule.type===CSSRule.STYLE_RULE)return selector(rule.selectorText)+'{'+urls(rewriteIds(rule.style.cssText),base)+'}';
  if(rule.type===CSSRule.FONT_FACE_RULE)return '';
  if(rule.type===CSSRule.KEYFRAMES_RULE)return rule.cssText;
  if(rule.cssRules)return rule.cssText.slice(0,rule.cssText.indexOf('{')+1)+rules(rule.cssRules,base)+'}';
  return urls(rule.cssText,base);
 }).join('\n');
 const css=[...doc.styleSheets].map(sheet=>rules(sheet.cssRules,sheet.href||doc.baseURI)).join('\n');
 const style=document.createElement('style');style.textContent=css;host.append(style);
 for(const el of doc.body.querySelectorAll('*')){
  if(el instanceof doc.defaultView.HTMLImageElement)el.src=el.src;
  for(const attr of [...el.attributes]){
   if(attr.name==='id')el.id=ids.get(attr.value);
   else if(['for','aria-labelledby','aria-describedby','aria-controls'].includes(attr.name))el.setAttribute(attr.name,attr.value.split(/\s+/).map(id=>ids.get(id)||id).join(' '));
   else if(attr.name==='style'||attr.name==='href'||attr.name==='xlink:href'||attr.value.includes('url(#'))el.setAttribute(attr.name,rewriteIds(attr.value));
  }
 }
 // Import instead of adopting: annotation tools use the current document’s
 // HTMLElement constructors when resolving a selectable target.
 host.append(...[...doc.body.childNodes].map(node=>document.importNode(node,true)));

 frame.replaceWith(host);
 return host;
}

function observeCatalogLogoSizes(scope){
 const fit=copy=>{const height=Math.ceil(copy.getBoundingClientRect().height);if(height>0)copy.parentElement.style.setProperty('--logo-info-measured-height',height+'px');};
 const observer=new ResizeObserver(entries=>entries.forEach(({target})=>fit(target)));
 scope.querySelectorAll('.wc-logo-info-copy').forEach(copy=>{fit(copy);observer.observe(copy);});
}
function hydrateCatalogSample(d,kind){
 if(kind==='v2'){
    observeCatalogLogoSizes(d);

    d.querySelectorAll('.wc-nav [data-menu]').forEach(button=>button.onclick=()=>{const nav=button.closest('.wc-nav');nav.dataset.selected=button.dataset.menu;nav.querySelectorAll('[data-menu]').forEach(b=>b.setAttribute('aria-current',b===button?'page':'false'));});
    d.querySelectorAll('[role=switch]').forEach(button=>button.onclick=()=>button.setAttribute('aria-checked',String(button.getAttribute('aria-checked')!=='true')));
    d.querySelectorAll('[role=group] button[aria-pressed]').forEach(button=>button.onclick=()=>button.parentElement.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button))));
    d.querySelectorAll('[data-count]').forEach(button=>button.onclick=()=>{const step=button.closest('.wc-level-stepper'),out=step.querySelector('output');let n=Math.max(0,Math.min(99,Number(out.value||out.textContent)+Number(button.dataset.delta)));out.value=n;step.querySelectorAll('button').forEach(b=>b.disabled=Number(b.dataset.delta)<0?n===0:n===99);});
 }else{

 for(const tabs of d.querySelectorAll('[role=tablist],.order-options,.alignment-options'))for(const b of tabs.querySelectorAll('button'))b.onclick=()=>{for(const other of tabs.querySelectorAll('button'))other.setAttribute(b.hasAttribute('aria-selected')?'aria-selected':'aria-pressed',String(other===b))};
 for(const sw of d.querySelectorAll('[role=switch]'))sw.onclick=()=>sw.setAttribute('aria-checked',String(sw.getAttribute('aria-checked')!=='true'));
 for(const range of d.querySelectorAll('input[type=range]'))range.oninput=()=>{const out=range.closest('label')?.querySelector('output');if(out)out.value=range.value+(out.textContent.match(/px|%|°/)?.[0]||'')};
 for(const root of d.querySelectorAll('.simple-picker')){const trigger=root.querySelector('.gym-trigger'),list=root.querySelector('[role=listbox]'),select=root.querySelector('select');if(!trigger||!list||!select)continue;trigger.onclick=()=>{list.replaceChildren();for(const option of select.options){const item=document.createElement('div');item.className='gym-option';item.role='option';item.tabIndex=0;item.textContent=option.textContent;item.setAttribute('aria-selected',String(option.value===select.value));item.onclick=()=>{select.value=option.value;trigger.textContent=option.textContent;list.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus()};item.onkeydown=e=>{if(e.key==='Enter'||e.key===' ')item.click();if(e.key==='ArrowDown')(item.nextElementSibling||list.firstChild).focus();if(e.key==='ArrowUp')(item.previousElementSibling||list.lastChild).focus();if(e.key==='Escape'){list.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus()}};list.append(item);}list.hidden=trigger.getAttribute('aria-expanded')==='true';trigger.setAttribute('aria-expanded',String(!list.hidden));if(!list.hidden)list.firstChild?.focus();};}
 }
}
