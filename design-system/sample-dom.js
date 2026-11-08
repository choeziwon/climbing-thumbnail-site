// Render examples in the page document so browser annotations can select the
// actual controls. CSS scopes preserve the service styles without iframe walls.
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
 const selector=text=>rewriteIds(text.replace(/(?<![\w-])(?:html|body)(?![\w-])/g,':scope').replace(/:root\b/g,':scope'));
 const urls=(text,base)=>text.replace(/url\((['"]?)([^)'"\s]+)\1\)/g,(all,quote,url)=>url.startsWith('#')?rewriteIds(all):'url("'+new URL(url,base).href+'")');
 const rules=(list,base)=>[...list].map(rule=>{
  if(rule.type===CSSRule.STYLE_RULE)return selector(rule.selectorText)+'{'+urls(rewriteIds(rule.style.cssText),base)+'}';
  if(rule.type===CSSRule.FONT_FACE_RULE)return '';
  if(rule.cssRules)return rule.cssText.slice(0,rule.cssText.indexOf('{')+1)+rules(rule.cssRules,base)+'}';
  return urls(rule.cssText,base);
 }).join('\n');
 const css=[...doc.styleSheets].map(sheet=>rules(sheet.cssRules,sheet.href||doc.baseURI)).join('\n');
 const style=document.createElement('style');style.textContent='@scope (#'+host.id+'){'+css+'}';host.append(style);
 for(const el of doc.body.querySelectorAll('*')){
  if(el instanceof doc.defaultView.HTMLImageElement)el.src=el.src;
  for(const attr of [...el.attributes]){
   if(attr.name==='id')el.id=ids.get(attr.value);
   else if(['for','aria-labelledby','aria-describedby','aria-controls'].includes(attr.name))el.setAttribute(attr.name,attr.value.split(/\s+/).map(id=>ids.get(id)||id).join(' '));
   else if(attr.name==='style'||attr.name==='href'||attr.name==='xlink:href'||attr.value.includes('url(#'))el.setAttribute(attr.name,rewriteIds(attr.value));
  }
 }
 host.append(...doc.body.childNodes);
 frame.replaceWith(host);
 return host;
}
