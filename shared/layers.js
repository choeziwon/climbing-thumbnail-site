// Layer list uses the service's tool strip, dialog and button components.
(()=>{
 const dialog=document.createElement('dialog');dialog.className='color-dialog editor-layer-dialog';dialog.setAttribute('aria-label','레이어 순서');
 const heading=document.createElement('h2');heading.textContent='레이어';
 const hint=document.createElement('p');hint.textContent='위에 있는 요소가 앞에 보여요. 배경 이미지는 맨 뒤에 고정돼요.';
 const list=document.createElement('ol');list.className='editor-layer-list';list.setAttribute('aria-label','앞에서 뒤로 레이어 목록');
 const actions=document.createElement('div');actions.className='reset-dialog-actions';const done=document.createElement('button');done.type='button';done.textContent='완료';done.onclick=()=>dialog.close();actions.append(done);dialog.append(heading,hint,list,actions);document.body.append(dialog);
 function render(){list.replaceChildren();const entries=editorLayerEntries();for(const entry of [...entries].reverse()){
  const row=document.createElement('li'),select=document.createElement('button'),front=document.createElement('button'),back=document.createElement('button');
  select.type=front.type=back.type='button';select.textContent=(entry.kind==='image'?'이미지 · ':entry.kind==='marks'?'':'글자 · ')+entry.label;select.title=entry.label;
  select.setAttribute('aria-pressed',String(editorSelection.kind===entry.kind&&editorSelection.id===entry.id));select.onclick=()=>{setEditorSelection(entry.kind,entry.id,{origin:'canvas'});dialog.close()};
  front.textContent='앞으로';back.textContent='뒤로';front.setAttribute('aria-label',entry.label+' 앞으로');back.setAttribute('aria-label',entry.label+' 뒤로');front.disabled=entry===entries.at(-1);back.disabled=entry===entries[0];front.onclick=()=>moveEditorLayer(entry.key,1);back.onclick=()=>moveEditorLayer(entry.key,-1);
  row.append(select,front,back);list.append(row);
 }
 }
 for(const strip of document.querySelectorAll('#mobile-image-panel .menu-overview .image-tool-strip,#mobile-text-panel .text-action-strip'))addButton(strip);
 // Image overview and text overview use the same existing tool-strip component.
 if(!document.querySelector('#mobile-image-panel [data-layer-list]'))addButton(document.querySelector('#mobile-image-panel .image-tool-strip'));
 function addButton(strip){if(!strip)return;const button=document.createElement('button');button.type='button';button.dataset.layerList='';button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/></svg><span>레이어</span>';button.onclick=()=>{render();dialog.showModal()};strip.append(button);}
 window.addEventListener('editorlayerchange',render);window.addEventListener('editorhistoryrestore',()=>{applyEditorLayerOrder();if(dialog.open)render()});
})();
