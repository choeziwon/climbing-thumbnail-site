// Move the existing controls into a mobile workspace, retaining their listeners
// and state. Comment anchors restore the desktop DOM when the breakpoint changes.
var mobileWorkspace;
function fitMobilePreview(){
  if(!mobileWorkspace?.active)return;
  const {canvas,frame,shell}=mobileWorkspace;
  const previewHeight=Math.max(100,shell.classList.contains('editing-tool')?shell.clientHeight*.7-(mobileWorkspace.panelInset||0):shell.querySelector('.mobile-content').clientHeight-shell.querySelector('.mobile-feedback').offsetHeight);
  const scale=Math.min(canvas.clientWidth/stage.offsetWidth,previewHeight/stage.offsetHeight,1);
  stage.style.transform=`scale(${scale})`;
  frame.style.width=(stage.offsetWidth*scale)+'px';
  frame.style.height=(stage.offsetHeight*scale)+'px';
  canvas.style.height=previewHeight+'px';
}
function renderMobileCanvas(){
  if(!mobileWorkspace?.active)return false;
  // Wrap within the same logical canvas used by export, before preview scaling.
  const canvasWidth=1032; // Match the desktop editor content width.
  const measure=mobileWorkspace.measure;
  measure.font=getComputedStyle(preview).font;
  const layout=explicitExportLayout(measure,text.value,marksLinked()?arrangedMarks(state.hearts,state.problemOrder):[],Number(size.value),letterGap(),state.alignment,canvasWidth-40);
  const wrappedText=layout.lines.join('\n');
  renderVerticalPreview(layout);
  updateHearts(marksLinked()?layout.marks:arrangedMarks(state.hearts,state.problemOrder));
  const [rw,rh]=state.ratio.split(':').map(Number);
  const frame=exportFrame({width:canvasWidth,height:state.photoURL?canvasWidth*rh/rw:Math.max(260,mobileWorkspace.shell.clientHeight*.7*canvasWidth/mobileWorkspace.canvas.clientWidth)},layout,Boolean(state.photoURL));
  mobileWorkspace.bounds=frame.bounds;editorViewport.bounds=frame.bounds;
  stage.style.width=frame.width+'px';stage.style.height=frame.height+'px';
  layer.style.width=layout.width+'px';layer.style.maxWidth='none';
  layer.style.transform=`scale(${frame.fit})`;layer.style.transformOrigin='top left';

  return true;
}
function setupMobileWorkspace(){
  const shell=document.createElement('div');shell.className='mobile-editor';shell.hidden=true;
  shell.innerHTML=`<header class="mobile-header"><h1>완등 한 컷</h1></header>
    <div class="mobile-content">
    <div class="mobile-feedback"></div>
    <div class="mobile-canvas" aria-label="썸네일 미리보기"></div>
    <div class="mobile-tools" id="mobile-tools">
      <div class="mobile-panel-heading"><h2 id="mobile-panel-title">텍스트</h2></div>
      <section id="mobile-text-panel" class="mobile-panel text-section" role="region" aria-labelledby="mobile-text-tab"></section>
      <section id="mobile-marks-panel" class="mobile-panel text-section" role="region" aria-labelledby="mobile-marks-tab" hidden></section>
      <section id="mobile-image-panel" class="mobile-panel" role="region" aria-labelledby="mobile-image-tab" hidden></section>
    </div></div>
    <nav class="mobile-panel-bar mobile-menu" aria-label="썸네일 편집 메뉴">
      <button type="button" id="mobile-image-tab" aria-controls="mobile-image-panel" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/></svg><span>이미지</span></button>
      <button type="button" id="mobile-text-tab" aria-controls="mobile-text-panel" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6V4h14v2M12 4v16M8 20h8"/></svg><span>텍스트</span></button>
      <button type="button" id="mobile-marks-tab" aria-controls="mobile-marks-panel" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3c2-1 8 1 11 3s2 7 0 12-7 3-12 2-5-4-4-8 3-8 5-9Z"/><circle cx="12" cy="11" r="2"/></svg><span>완등 표시</span></button>
    </nav>`;
  document.body.append(shell);
  const header=shell.querySelector('.mobile-header'),canvas=shell.querySelector('.mobile-canvas'),tools=shell.querySelector('.mobile-tools');
  const bar=shell.querySelector('.mobile-panel-bar'),feedback=shell.querySelector('.mobile-feedback');
  const panels=['text','marks','image'].map(name=>$(`mobile-${name}-panel`));
  const tabs=['text','marks','image'].map(name=>$(`mobile-${name}-tab`));
  const menuTabs=Array.from(bar.querySelectorAll('button'));
  const content=shell.querySelector('.mobile-content');let selected=0;
  const textTabs=document.createElement('div');textTabs.className='mobile-text-tabs';textTabs.setAttribute('role','tablist');textTabs.setAttribute('aria-label','텍스트 편집 항목');
  const textGroups=['글자','폰트','정렬','테두리','그림자'].map((name,i)=>{
    const panel=document.createElement('div');panel.id='mobile-text-group-'+i;panel.className='mobile-text-group';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','mobile-text-option-'+i);
    const button=document.createElement('button');button.type='button';button.id='mobile-text-option-'+i;button.textContent=name;button.setAttribute('role','tab');button.setAttribute('aria-controls',panel.id);
    button.addEventListener('click',()=>{scrollingUp=false;expandTools();selectTextGroup(i);});button.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%5;if(e.key==='ArrowLeft')n=(i+4)%5;if(n!==undefined){e.preventDefault();selectTextGroup(n);textTabs.children[n].focus();}});
    textTabs.append(button);return panel;
  });
  panels[0].append(textTabs,...textGroups);
  let selectedImageGroup=0;
  const imageTabs=document.createElement('div');imageTabs.className='mobile-text-tabs mobile-image-tabs';imageTabs.setAttribute('role','tablist');imageTabs.setAttribute('aria-label','이미지 편집 항목');
  const imageGroups=['구도','보정'].map((name,i)=>{const group=document.createElement('div');group.id='mobile-image-group-'+i;group.className='mobile-image-group';group.setAttribute('role','tabpanel');group.setAttribute('aria-labelledby','mobile-image-option-'+i);const button=document.createElement('button');button.type='button';button.id='mobile-image-option-'+i;button.textContent=name;button.setAttribute('role','tab');button.setAttribute('aria-controls',group.id);button.onclick=()=>{selectImageGroup(i);syncImage();};button.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();selectImageGroup(1-i);imageTabs.children[1-i].focus();}};imageTabs.append(button);return group;});
  panels[2].append(imageTabs);
  function selectImageGroup(index){selectedImageGroup=index;imageGroups.forEach((g,i)=>{g.hidden=i!==index;imageTabs.children[i].setAttribute('aria-selected',String(i===index));imageTabs.children[i].tabIndex=i===index?0:-1;});tools.scrollTop=0;}
  selectImageGroup(0);
  function commitImage(){if(!state.photoURL)return;state.loadVersion++;renderPhotoView();updateRatio();syncImage();}
  function imageRange(group,id,name,min,max,step,initial,unit){const label=document.createElement('label');label.className='image-range';label.innerHTML=`<span>${name}</span><input type="range" aria-label="사진 ${name}" min="${min}" max="${max}" step="${step}" value="${initial}" data-image-setting="${id}"><output>${initial}${unit}</output>`;label.querySelector('input').oninput=e=>{if(!state.photoURL)return;state.photoView[id]=Number(e.target.value);commitImage();};label.dataset.unit=unit;if(min===-max){const input=label.querySelector('input'),track=document.createElement('span');track.className='image-range-track';input.before(track);track.append(input);input.classList.add('centered-range');}group.append(label);}
  const framingGuide=document.createElement('div');framingGuide.className='photo-crop-grid mobile-framing-guide';framingGuide.setAttribute('aria-hidden','true');stage.append(framingGuide);
  const imageActions=document.createElement('div');imageActions.className='image-tool-strip';imageActions.setAttribute('role','group');imageActions.setAttribute('aria-label','구도 도구');imageGroups[0].append(imageActions);
  function toolButton(label,icon){const b=document.createElement('button');b.type='button';b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+icon+'</svg><span>'+label+'</span>';return b;}
  const rotateImage=toolButton('회전','<rect x="3" y="10" width="11" height="11" rx="1.5"/><path d="M7 3h5a8 8 0 0 1 8 8M16 7l4 4 3-4"/>');rotateImage.setAttribute('aria-label','회전');rotateImage.title='오른쪽으로 90도 회전';rotateImage.onclick=()=>{if(!state.photoURL)return;const v=state.photoView,cx=v.cx;v.cx=1-v.cy;v.cy=cx;v.rotation=((v.rotation||0)+90)%360;if(v.ratioMode==='original'){const d=photoDimensions();state.ratio=d.width+':'+d.height;}commitImage();};
  const flipImage=toolButton('좌우','<path d="M12 3v18M3 18h5V6L3 18ZM21 18h-5V6l5 12Z"/>');flipImage.onclick=()=>{if(state.photoURL){state.photoView.flip=!state.photoView.flip;state.photoView.cx=1-state.photoView.cx;commitImage();}};
  const divider=document.createElement('span');divider.className='image-tool-divider';divider.setAttribute('aria-hidden','true');imageActions.append(rotateImage,flipImage,divider);
  const imageRatios=document.createElement('div');imageRatios.className='image-ratio-tools';imageRatios.setAttribute('aria-label','사진 비율');imageRatios.setAttribute('role','group');imageActions.append(imageRatios);
  const freeCrop=document.createElement('div');freeCrop.className='free-crop-frame';freeCrop.hidden=true;canvas.append(freeCrop);
  let cropDrag=null;
  function placeCrop(){if(cropDrag)return;const r=stage.getBoundingClientRect(),c=canvas.getBoundingClientRect();Object.assign(freeCrop.style,{left:(r.left-c.left)+'px',top:(r.top-c.top)+'px',width:r.width+'px',height:r.height+'px'});}
  for(const [edge,name] of [['nw','왼쪽 위'],['n','위'],['ne','오른쪽 위'],['e','오른쪽'],['se','오른쪽 아래'],['s','아래'],['sw','왼쪽 아래'],['w','왼쪽']]){const handle=document.createElement('button');handle.type='button';handle.dataset.cropEdge=edge;handle.setAttribute('aria-label',name+' 자르기 조절');freeCrop.append(handle);
    handle.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();handle.setPointerCapture(e.pointerId);const r=stage.getBoundingClientRect();cropDrag={edge,x:e.clientX,y:e.clientY,r,source:photoCrop(photoDimensions().width,photoDimensions().height,state.ratio,state.photoView),left:0,top:0,right:r.width,bottom:r.height};});
    handle.addEventListener('pointermove',e=>{if(!cropDrag)return;e.preventDefault();const d=cropDrag,dx=e.clientX-d.x,dy=e.clientY-d.y,minW=Math.max(44,d.r.width*state.photoView.zoom/4),minH=Math.max(44,d.r.height*state.photoView.zoom/4);if(edge.includes('w'))d.left=clamp(dx,0,d.r.width-minW);if(edge.includes('e'))d.right=clamp(d.r.width+dx,minW,d.r.width);if(edge.includes('n'))d.top=clamp(dy,0,d.r.height-minH);if(edge.includes('s'))d.bottom=clamp(d.r.height+dy,minH,d.r.height);const c=canvas.getBoundingClientRect();Object.assign(freeCrop.style,{left:(d.r.left-c.left+d.left)+'px',top:(d.r.top-c.top+d.top)+'px',width:(d.right-d.left)+'px',height:(d.bottom-d.top)+'px'});});
    handle.addEventListener('pointerup',()=>{if(!cropDrag)return;const d=cropDrag,dims=photoDimensions(),sw=d.source.sw*(d.right-d.left)/d.r.width,sh=d.source.sh*(d.bottom-d.top)/d.r.height;state.ratio=sw+':'+sh;Object.assign(state.photoView,{cx:(d.source.sx+d.source.sw*(d.left+d.right)/2/d.r.width)/dims.width,cy:(d.source.sy+d.source.sh*(d.top+d.bottom)/2/d.r.height)/dims.height,zoom:clamp(Math.min(dims.width,dims.height*sw/sh)/sw,1,4)});cropDrag=null;commitImage();placeCrop();});
    handle.addEventListener('pointercancel',()=>{cropDrag=null;placeCrop();});
  }
  new ResizeObserver(placeCrop).observe(stage);
  for(const ratio of ['free','original','3:4','1:1','9:16','4:5']){let icon='<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 8h8v8H8Z"/>';if(ratio==='original')icon='<rect x="3" y="5" width="18" height="14" rx="1"/>';else if(ratio.includes(':')){const [rw,rh]=ratio.split(':').map(Number),w=16*rw/rh;icon=`<rect x="${(24-w)/2}" y="4" width="${w}" height="16" rx="1"/>`;}
    const b=toolButton(ratio==='free'?'자유':ratio==='original'?'원본':ratio,icon);b.dataset.imageRatio=ratio;b.onclick=()=>{if(!state.photoURL)return;state.photoView.ratioMode=ratio;if(ratio==='original'){const d=photoDimensions();state.ratio=d.width+':'+d.height;}else if(ratio!=='free')state.ratio=ratio;commitImage();};imageRatios.append(b);
  }
  imageRange(imageGroups[0],'zoom','확대',1,4,.01,1,'%');
  imageRange(imageGroups[0],'tilt','각도',-45,45,.1,0,'°');
  const correctionTools=document.createElement('div');correctionTools.className='image-tool-strip image-correction-tools';correctionTools.setAttribute('role','group');correctionTools.setAttribute('aria-label','보정 항목');imageGroups[1].append(correctionTools);
  const corrections=[
    ['brightness','밝기','<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>'],
    ['contrast','대비','<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor"/>'],
    ['saturation','채도','<path d="M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/><path d="M8 15a4 4 0 0 0 4 4"/>'],
    ['warmth','색온도','<path d="M9 5a3 3 0 0 1 6 0v9a5 5 0 1 1-6 0Z"/><path d="M12 8v10m6-12h3m-3 4h2"/>'],
    ['shadows','그림자','<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>'],
    ['highlights','하이라이트','<circle cx="12" cy="12" r="9"/><path d="M12 3v18M12 6h6M12 9h8M12 12h9M12 15h8M12 18h6"/>'],
    ['sharpness','선명함','<path d="m12 3 9 18H3Z"/><path d="M12 8v9m-3 0h6"/>']
  ];
  const correctionRows=[];let selectedCorrection='brightness';
  function selectCorrection(id){selectedCorrection=id;correctionRows.forEach(({key,row,button})=>{row.hidden=key!==id;button.setAttribute('aria-pressed',String(key===id));});}
  for(const [id,name,icon] of corrections){
    const button=toolButton(name,icon);button.setAttribute('aria-pressed',String(id===selectedCorrection));button.onclick=()=>selectCorrection(id);correctionTools.append(button);
    imageRange(imageGroups[1],id,name,id==='sharpness'?0:-100,100,1,0,'');
    const row=imageGroups[1].lastElementChild;correctionRows.push({key:id,row,button});
  }
  selectCorrection(selectedCorrection);
  const imageReset=document.createElement('button');imageReset.type='button';imageReset.id='resetImageSettings';imageReset.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2.5 8M3 4v6h6"/></svg><span>초기화</span>';imageReset.onclick=()=>{if(!state.photoURL)return;if(selectedImageGroup===1){for(const key of ['brightness','contrast','saturation','warmth','shadows','highlights','sharpness'])state.photoView[key]=0;}else{Object.assign(state.photoView,{zoom:1,cx:.5,cy:.5,rotation:0,tilt:0,flip:false,ratioMode:'3:4'});state.ratio='3:4';}commitImage();};
  function syncImage(){for(const {key,button} of correctionRows){const changed=Boolean(state.photoView[key]);button.classList.toggle('is-adjusted',changed);button.setAttribute('aria-label',corrections.find(c=>c[0]===key)[1]+(changed?' · 조절됨':''));button.disabled=!state.photoURL;}imageReset.hidden=!state.photoURL;imageReset.setAttribute('aria-label',selectedImageGroup===0?'구도 초기화':'보정 초기화');for(const input of panels[2].querySelectorAll('[data-image-setting]')){const key=input.dataset.imageSetting,value=state.photoView[key]??(key==='zoom'?1:0);input.value=value;input.closest('label').querySelector('output').value=(key==='zoom'?Math.round(value*100):value)+input.closest('label').dataset.unit;input.disabled=!state.photoURL;}const ratioMode=state.photoView.ratioMode||state.ratio;freeCrop.hidden=ratioMode!=='free'||!state.photoURL;placeCrop();flipImage.setAttribute('aria-pressed',String(!!state.photoView.flip));for(const b of imageRatios.children)b.setAttribute('aria-pressed',String(b.dataset.imageRatio===ratioMode));imageGroups.forEach(g=>g.classList.toggle('image-empty',!state.photoURL));}
  new MutationObserver(syncImage).observe($('photoDetails'),{attributes:true,attributeFilter:['hidden']});window.addEventListener('editorreset',syncImage);
  let imageDrag=null,imagePinch=null;const imageTouches=new Map();
  canvas.addEventListener('pointerdown',e=>{if(e.target.closest('[data-crop-edge]'))return;if(selected!==2||!state.photoURL||tools.hidden||e.button!==0)return;const r=stage.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;e.preventDefault();e.stopImmediatePropagation();canvas.setPointerCapture(e.pointerId);imageTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(imageTouches.size===2){const [a,b]=[...imageTouches.values()];imagePinch={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom:state.photoView.zoom};return;}imageDrag={x:e.clientX,y:e.clientY,cx:state.photoView.cx,cy:state.photoView.cy,rect:r,crop:photoCrop(photoDimensions().width,photoDimensions().height,state.ratio,state.photoView)};},true);
  canvas.addEventListener('pointermove',e=>{if(!imageDrag)return;e.preventDefault();e.stopImmediatePropagation();if(imageTouches.has(e.pointerId))imageTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(imagePinch&&imageTouches.size===2){const [a,b]=[...imageTouches.values()];state.photoView.zoom=clamp(imagePinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,imagePinch.distance),1,4);commitImage();return;}const d=imageDrag,dims=photoDimensions();state.photoView.cx=clamp(d.cx-(e.clientX-d.x)/d.rect.width*d.crop.sw/dims.width,d.crop.sw/2/dims.width,1-d.crop.sw/2/dims.width);state.photoView.cy=clamp(d.cy-(e.clientY-d.y)/d.rect.height*d.crop.sh/dims.height,d.crop.sh/2/dims.height,1-d.crop.sh/2/dims.height);commitImage();},true);
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{imageTouches.delete(e.pointerId);imageDrag=null;imagePinch=null;});
  function selectTextGroup(index){textGroups.forEach((panel,i)=>{panel.hidden=i!==index;textTabs.children[i].setAttribute('aria-selected',String(i===index));textTabs.children[i].tabIndex=i===index?0:-1;});tools.scrollTop=0;}
  selectTextGroup(0);
  function setToolsExpanded(expanded){
    if(shell.classList.contains('tools-expanded')===expanded)return;
    shell.classList.toggle('tools-expanded',expanded);
    cancelAnimationFrame(mobileWorkspace.panelAnimation);
    const from=mobileWorkspace.panelInset||0,to=expanded?110:0,start=performance.now();
    const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:280;
    function tick(now){
      const progress=duration?Math.min(1,(now-start)/duration):1;
      const eased=1-Math.pow(1-progress,3);
      mobileWorkspace.panelInset=from+(to-from)*eased;fitMobilePreview();
      if(progress<1)mobileWorkspace.panelAnimation=requestAnimationFrame(tick);
    }
    mobileWorkspace.panelAnimation=requestAnimationFrame(tick);
  }
  function expandTools(){setToolsExpanded(true);}
  let scrollingUp=false,touchY=0,scrollGesture=false,touchStartedAtTop=false;
  let lastWheelAt=-Infinity,wheelStartedAtTop=false,wheelDirection=0;
  tools.addEventListener('wheel',event=>{
    if(Math.abs(event.deltaY)<=Math.abs(event.deltaX)||event.deltaY===0)return;
    const now=performance.now(),direction=Math.sign(event.deltaY);
    // A wheel/trackpad burst is one gesture, including its momentum tail.
    if(now-lastWheelAt>240||direction!==wheelDirection)wheelStartedAtTop=tools.scrollTop<=1;
    lastWheelAt=now;wheelDirection=direction;scrollingUp=direction<0;
    if(direction>0)expandTools();
    else if(wheelStartedAtTop&&tools.scrollTop<=1)setToolsExpanded(false);
  },{passive:true});
  tools.addEventListener('scroll',()=>{if(tools.scrollTop>1)expandTools();},{passive:true});
  tools.addEventListener('touchstart',e=>{
    touchY=e.touches[0].clientY;scrollingUp=false;touchStartedAtTop=tools.scrollTop<=1;
    scrollGesture=!e.target.closest('input,textarea,select,button');
  },{passive:true});
  tools.addEventListener('touchmove',e=>{
    if(!scrollGesture)return;
    const nextY=e.touches[0].clientY,delta=touchY-nextY;
    if(Math.abs(delta)<8)return;
    scrollingUp=delta<0;
    if(delta>0)expandTools();
    else if(touchStartedAtTop&&tools.scrollTop<=1)setToolsExpanded(false);
    touchY=nextY;
  },{passive:true});
  const fontCards=document.createElement('div');fontCards.className='mobile-font-cards';fontCards.setAttribute('role','group');fontCards.setAttribute('aria-label','폰트 선택');
  fontMenuChoices.forEach(font=>{const card=document.createElement('button');card.type='button';card.dataset.fontCard=font.family;card.textContent=font.label;card.classList.toggle('font-card-small-glyphs',['한컷체','느좋체','떡상체','히피체'].includes(font.label));card.style.fontFamily='"'+font.family+'",sans-serif';card.setAttribute('aria-pressed',String(font.family===state.fontFamily));card.addEventListener('click',()=>{fontSelect.value=font.family;fontSelect.dispatchEvent(new Event('change'));});fontCards.append(card);});
  textGroups[1].append(fontCards);
  const frame=document.querySelector('.preview-frame');
  mobileWorkspace={shell,canvas,frame,header,bar,feedback,collapsed:false,measure:document.createElement('canvas').getContext('2d'),active:false};
  const shapeRow=document.createElement('div');shapeRow.className='mobile-shape-options';shapeRow.setAttribute('role','group');shapeRow.setAttribute('aria-label','표시 모양 선택');
  for(const [key,design] of Object.entries(markShapes)){
    const button=document.createElement('button');button.type='button';button.dataset.shape=key;button.title=design.label;button.setAttribute('aria-label',design.label);
    const icon=markSVG(markKey(key,'🤍'));icon.setAttribute('aria-hidden','true');button.append(icon);
    button.addEventListener('click',()=>{shapeSelect.value=key;shapeSelect.dispatchEvent(new Event('change'));syncShapeOptions();});shapeRow.append(button);
  }
  document.querySelector('.shape-field').append(shapeRow);
  function syncShapeOptions(){for(const button of shapeRow.children)button.setAttribute('aria-pressed',String(button.dataset.shape===state.shape));}
  shapeSelect.addEventListener('change',syncShapeOptions);window.addEventListener('editorreset',syncShapeOptions);syncShapeOptions();
  // Keep descriptive accessible names while shortening mobile visual labels.
  for(const [id,caption] of [['size','크기'],['markSize','크기'],['outlineWidth','두께'],['shadowWidth','두께']]){
    const input=$(id),label=input.closest('label'),title=label.querySelector('span');
    input.setAttribute('aria-label',title.textContent);title.dataset.desktopCaption=title.textContent;title.dataset.mobileCaption=caption;
  }
  for(const id of ['fillColor','strokeColor','shadowColor']){
    const label=$(id).closest('label');
    for(const node of Array.from(label.childNodes))if(node.nodeType===Node.TEXT_NODE&&node.textContent.trim()){
      const title=document.createElement('span');title.className='color-field-title';node.replaceWith(title);title.append(node);
    }
  }
  const photoIcon=paths=>`<svg class="mobile-photo-icon" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
  const photoActions=[
    [document.querySelector('.photo-input-tools>.file-button'),'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/>','변경'],
    [$('adjustPhoto'),'<path d="M7 3v14h14M3 7h14v14M3 3l18 18"/>','조정'],
    [$('removePhoto'),'<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>','삭제']
  ];
  for(const [control,paths,caption] of photoActions){
    for(const node of Array.from(control.childNodes))if(node.nodeType===Node.TEXT_NODE&&node.textContent.trim()){
      const original=document.createElement('span');original.className='photo-desktop-caption';node.replaceWith(original);original.append(node);
    }
    control.insertAdjacentHTML('afterbegin',photoIcon(paths)+`<span class="mobile-photo-caption">${caption}</span>`);
  }
  $('adjustPhoto').setAttribute('aria-label','사진 조정');
  const addPhoto=document.querySelector('.photo-input-tools>.file-button');
  addPhoto.insertAdjacentHTML('afterbegin','<span class="mobile-photo-empty"><svg class="photo-add-plus" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg> 이미지 추가</span>');
  for(const button of $('ratioControls').querySelectorAll('button')){
    const [w,h]=button.dataset.ratio.split(':').map(Number);
    button.insertAdjacentHTML('afterbegin',`<svg class="mobile-photo-icon mobile-ratio-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="${12-9*w/h}" y="3" width="${18*w/h}" height="18" rx="1.5"/></svg>`);
  }
  for(const [id,caption,path] of [
    ['breakHearts','다음 줄','M19 5v9H5m5-5-5 5 5 5'],
    ['removeHeart','하나 삭제','m9 5-7 7 7 7h12V5ZM12 9l6 6m0-6-6 6']
  ]){
    const button=$(id),original=button.textContent;
    button.innerHTML=`<span class="mark-key-desktop">${original}</span><span class="mark-key-mobile"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg><span>${caption}</span></span>`;
    button.classList.add('mark-edit-key');button.setAttribute('aria-label',caption);button.title=caption;
  }
  const linked=$('markOutlineLinked'),linkOptions=document.createElement('div');
  linkOptions.className='mark-link-switch-row';
  linked.closest('label').classList.add('mark-link-checkbox');
  const linkCaption=document.createElement('span');linkCaption.id='mark-link-caption';linkCaption.textContent='글자와 연결';
  const linkSwitch=document.createElement('button');linkSwitch.type='button';linkSwitch.className='mark-link-switch';linkSwitch.setAttribute('role','switch');linkSwitch.setAttribute('aria-labelledby',linkCaption.id);linkSwitch.setAttribute('aria-controls','markOutlineCustom');
  linkSwitch.addEventListener('click',()=>{linked.checked=!linked.checked;linked.dispatchEvent(new Event('change'));});
  linkOptions.append(linkCaption,linkSwitch);linked.closest('label').after(linkOptions);
  function syncMarkLink(){linkSwitch.setAttribute('aria-checked',String(linked.checked));}
  linked.addEventListener('change',syncMarkLink);window.addEventListener('editorreset',syncMarkLink);syncMarkLink();
  const moves=[];
  function move(node,parent){const anchor=document.createComment('desktop position');node.before(anchor);moves.push({node,anchor});parent.append(node);}
  const done=document.createElement('button');done.type='button';done.className='mobile-edit-done';done.setAttribute('aria-label','편집 완료');
  done.textContent='완료';
  const panelHeading=shell.querySelector('.mobile-panel-heading');
  function closeTool(restoreFocus=true){
    tools.hidden=true;bar.hidden=false;shell.classList.remove('editing-tool','tools-expanded');
    cancelAnimationFrame(mobileWorkspace.panelAnimation);mobileWorkspace.panelInset=0;
    tabs.forEach(tab=>tab.setAttribute('aria-expanded','false'));
    fitMobilePreview();if(restoreFocus)tabs[selected].focus();
  }
  done.addEventListener('click',()=>closeTool());
  function selectTab(index){
    selected=index;shell.classList.add('editing-tool');bar.hidden=true;
    panelHeading.hidden=index===0||index===2;
    (index===0?textTabs:index===2?imageTabs:panelHeading).append(done);syncImage();
    panels.forEach((panel,i)=>{panel.hidden=i!==index;});
    $('mobile-panel-title').textContent=['텍스트','완등 표시','이미지'][index];
    tools.hidden=false;tools.scrollTop=0;
    tabs.forEach((tab,i)=>tab.setAttribute('aria-expanded',String(i===selected)));
    fitMobilePreview();
  }
  window.addEventListener('editorreset',()=>{if(mobileWorkspace.active){closeTool();}});
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>{scrollingUp=false;expandTools();selectTab(index);});
    tab.addEventListener('keydown',event=>{
      const menuIndex=menuTabs.indexOf(tab);let next;
      if(event.key==='ArrowRight')next=(menuIndex+1)%menuTabs.length;
      if(event.key==='ArrowLeft')next=(menuIndex+menuTabs.length-1)%menuTabs.length;
      if(event.key==='Home')next=0;if(event.key==='End')next=menuTabs.length-1;
      if(next!==undefined){event.preventDefault();menuTabs[next].focus();}
    });
  });
  function viewport(){
    if(!mobileWorkspace.active)return;
    const v=window.visualViewport;
    shell.style.setProperty('--mobile-height',(v?.height||window.innerHeight)+'px');
    shell.style.setProperty('--mobile-top',(v?.offsetTop||0)+'px');
    fitMobilePreview();
  }
  const query=window.WONINE_MOBILE_FORCE?{matches:true,addEventListener(){}}:window.matchMedia('(width < 1080px)');
  function apply(){
    if(query.matches===mobileWorkspace.active)return;
    mobileWorkspace.active=query.matches;
    document.querySelectorAll('[data-mobile-caption]').forEach(title=>{title.textContent=query.matches?title.dataset.mobileCaption:title.dataset.desktopCaption;});
    editorViewport.logical=query.matches;
    document.body.classList.toggle('mobile-editing',query.matches);shell.hidden=!query.matches;
    if(query.matches){
      move(document.querySelector('.editor-actions'),header);move(frame,canvas);
      move(text,textGroups[0]);move(document.querySelector('main .gym-picker'),textGroups[0]);
      move(document.querySelector('main .position-controls .font-field'),textGroups[1]);
      move(document.querySelector('main label[for=size]'),textGroups[0]);
      move(document.querySelector('main label[for=fillColor]'),textGroups[0]);
      move(document.querySelector('main .align-control'),textGroups[2]);
      for(const id of ['letterSpace','lineSpace'])move(document.querySelector('main label[for='+id+']'),textGroups[2]);
      for(const id of ['outline','strokeColor','outlineWidth'])move(document.querySelector('main label[for='+id+']'),textGroups[3]);
      for(const id of ['shadow','shadowColor','shadowWidth','shadowOpacity','shadowDistance','shadowAngle'])move(document.querySelector('main label[for='+id+']'),textGroups[4]);
      move(document.querySelector('main .success-controls'),panels[1]);
      const marksControls=panels[1].querySelector('.success-controls');
      const palette=marksControls.querySelector('.heart-palette'),marksHeading=marksControls.querySelector('.heart-heading-row');
      move(marksHeading,marksControls);move(palette,marksControls);
      marksControls.prepend(marksHeading,palette);
      move($('breakHearts'),palette);move($('removeHeart'),palette);
      move(document.querySelector('main .photo-tools'),panels[2]);panels[2].append(...imageGroups);panels[2].querySelector('.photo-input-tools').append(imageReset);syncImage();
      move($('fontStatus'),feedback);move($('status'),feedback);
      closeTool(false);viewport();
    }else{
      for(const {node,anchor} of moves.reverse()){anchor.replaceWith(node);}moves.length=0;
      preview.textContent=text.value.normalize('NFC');updateHearts();
      frame.style.width='';frame.style.height='';stage.style.transform='';stage.style.width='';
      layer.style.width='';layer.style.maxWidth='';layer.style.transform='';layer.style.transformOrigin='';mobileWorkspace.bounds=null;editorViewport.bounds=null;
    }
    schedulePosition();
  }
  query.addEventListener('change',apply);
  window.addEventListener('resize',viewport);window.visualViewport?.addEventListener('resize',viewport);window.visualViewport?.addEventListener('scroll',viewport);
  new ResizeObserver(()=>{shell.style.setProperty('--mobile-header-height',header.offsetHeight+'px');fitMobilePreview();}).observe(header);
  const chromeObserver=new ResizeObserver(fitMobilePreview);chromeObserver.observe(bar);chromeObserver.observe(feedback);
  new ResizeObserver(fitMobilePreview).observe(canvas);
  apply();
}
editorViewport.render=renderMobileCanvas;
editorViewport.afterRender=fitMobilePreview;
setupMobileWorkspace();
