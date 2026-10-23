// Thumbnail-wide history. Selection and navigation never create editing steps.
(()=>{
 const ids=['text','size','fillColor','strokeColor','letterSpace','lineSpace','outlineWidth','shadowColor','shadowWidth','shadowOpacity','shadowDistance','shadowAngle','markSize','markStrokeColor','markOutlineWidth','outline','shadow','markOutlineLinked','markOutlineEnabled'];
 const ignored=new Set(['loadVersion','fontVersion','fontLoading','captionPresent']);
 const retired=new Set();let entries=[],index=-1,timer=null,applying=false;const pointers=new Set();
 const toolbar=document.createElement('div');toolbar.className='editor-history';toolbar.dataset.editorHistory='';toolbar.setAttribute('role','group');toolbar.setAttribute('aria-label','전체 작업 기록');
 const back=document.createElement('button'),forward=document.createElement('button');
 for(const [button,label,path] of [[back,'전체 작업 되돌리기','M9 5 3 11l6 6M3 11h11a7 7 0 0 1 7 7v2'],[forward,'전체 작업 다시 실행','m15 5 6 6-6 6m6-6H10a7 7 0 0 0-7 7v2']]){button.type='button';button.setAttribute('aria-label',label);button.title=label;button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg>';toolbar.append(button);}
 const feedback=document.createElement('span');feedback.className='editor-history-feedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');toolbar.append(feedback);
 document.querySelector('.mobile-canvas').append(toolbar);
 function capture(){
  const savedState=Object.fromEntries(Object.entries(state).filter(([key])=>!ignored.has(key)));
  return {state:structuredClone(savedState),controls:Object.fromEntries(ids.map(id=>[id,{value:$(id).value,checked:$(id).checked}])),extras:extraTexts.map(({fontRequest,...item})=>structuredClone(item)),overlays:photoOverlays.map(item=>({...item})),markPosition:{...markPosition},original:backgroundOriginal,name:$('photoName').textContent,alt:photo.alt};
 }
 function fingerprint(entry){return JSON.stringify({...entry,overlays:entry.overlays.map(({image,originalImage,...item})=>item)});}
 function updateButtons(){back.disabled=applying||index<=0;forward.disabled=applying||index>=entries.length-1;}
 function referencedURLs(){const urls=new Set();for(const {value} of entries){for(const url of [value.state.photoURL,value.original,...value.overlays.flatMap(item=>[item.url,item.originalUrl])])if(url)urls.add(url);}for(const url of [state.photoURL,backgroundOriginal,...photoOverlays.flatMap(item=>[item.url,item.originalUrl])])if(url)urls.add(url);return urls;}
 function cleanup(){const used=referencedURLs();for(const url of retired)if(!used.has(url)){URL.revokeObjectURL(url);retired.delete(url);}}
 window.editorHistoryRetainURL=url=>{if(url)retired.add(url);setTimeout(cleanup,0);};
 function commit(){
  clearTimeout(timer);timer=null;if(applying||pointers.size)return;
  const value=capture(),key=fingerprint(value);if(entries[index]?.key===key){cleanup();return;}
  entries.splice(index+1);entries.push({value,key});if(entries.length>100)entries.shift();index=entries.length-1;updateButtons();cleanup();
 }
 function queue(delay=250){if(applying||pointers.size)return;clearTimeout(timer);timer=setTimeout(commit,delay);}
 async function restore(next){
  applying=true;clearTimeout(timer);timer=null;updateButtons();
  const previousIndex=index,saved=entries[next].value;
  try{
   drag=null;markDrag=null;state.loadVersion++;state.fontVersion++;
   for(const key of Object.keys(state))if(!ignored.has(key)&&!(key in saved.state))delete state[key];
   Object.assign(state,structuredClone(saved.state));state.captionPresent=!!saved.controls.text.value.trim();
   for(const [id,control] of Object.entries(saved.controls)){const el=$(id);el.value=control.value;if(control.checked!==undefined)el.checked=control.checked;}
   extraTexts.splice(0,extraTexts.length,...saved.extras.map(item=>structuredClone(item)));
   photoOverlays.splice(0,photoOverlays.length,...saved.overlays.map(item=>({...item})));
   for(const map of [extraTextNodes,photoOverlayNodes]){for(const node of map.values())node.remove();map.clear();}
   backgroundOriginal=saved.original;markPosition={...saved.markPosition};
   if(photoPreviewCanvas){photoPreviewCanvas.remove();photoPreviewCanvas=null;}correctedPhotoCache=null;rotatedPhotoCache=null;
   photo.hidden=!state.photoURL;stage.classList.toggle('has-photo',!!state.photoURL);removePhoto.disabled=!state.photoURL;
   if(state.photoURL){photo.src=state.photoURL;await photo.decode();}else{photo.removeAttribute('src');if(photoPreviewCanvas)photoPreviewCanvas.hidden=true;}
   photo.alt=saved.alt;$('photoName').textContent=saved.name;$('photoName').title=saved.name;
   state.fontLoading=true;$('saveResult').disabled=true;
   fontSelect.value=state.fontFamily;shapeSelect.value=state.shape;
   fontPending=document.fonts.load('400 '+size.value+'px "'+state.fontFamily+'"',text.value||'한글');await fontPending;state.fontLoading=false;
   syncFontPicker();shapePickerUI.sync();updateShapePalette();syncGymSelection();updateRatio();update();renderPosition();
   setEditorSelection('none',null,{origin:'history',showTools:false});
   window.dispatchEvent(new Event('editorhistoryrestore'));
   index=next;feedback.textContent='작업을 '+(next<previousIndex?'되돌렸어요.':'다시 실행했어요.');
  }finally{state.fontLoading=false;$('saveResult').disabled=false;applying=false;updateButtons();}
 }
 async function step(direction){if(applying||exporting)return;commit();const next=index+direction;if(next<0||next>=entries.length)return;await restore(next);}
 back.onclick=()=>step(-1);forward.onclick=()=>step(1);
 document.addEventListener('pointerdown',e=>{if(!pointers.size)commit();if((stage.contains(e.target)||e.target.matches('input[type=range]'))&&!e.target.closest('[data-editor-history]'))pointers.add(e.pointerId);},true);
 for(const event of ['pointerup','pointercancel'])window.addEventListener(event,e=>{pointers.delete(e.pointerId);if(!pointers.size)queue(0);},true);
 for(const event of ['input','change','click'])document.addEventListener(event,e=>{if(!e.target.closest('[data-editor-history]'))queue(event==='input'?500:0);},true);
 const wrap=fn=>function(...args){const result=fn.apply(this,args);queue();return result;};
 update=wrap(update);renderPosition=wrap(renderPosition);renderPhotoOverlays=wrap(renderPhotoOverlays);renderExtraTexts=wrap(renderExtraTexts);updateRatio=wrap(updateRatio);
 document.addEventListener('keydown',e=>{if(!(e.metaKey||e.ctrlKey)||e.altKey||e.target.closest('input,textarea,[contenteditable=true]'))return;const key=e.key.toLowerCase();if(key==='z'||key==='y'){e.preventDefault();step(key==='y'||e.shiftKey?1:-1);}});
 commit();updateButtons();
})();
