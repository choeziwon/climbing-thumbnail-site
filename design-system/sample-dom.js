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
