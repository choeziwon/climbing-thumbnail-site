// Move the existing controls into a mobile workspace, retaining their listeners
// and state. Comment anchors restore the desktop DOM when the breakpoint changes.
var mobileWorkspace;
function fitMobilePreview(){
  if(!mobileWorkspace?.active)return;
  const {canvas,frame,shell,header,bar,feedback,collapsed}=mobileWorkspace;
  // Keep the image full-width; the workspace scrolls instead of shrinking
  // portrait images to reserve space for every editing control.
  const availableHeight=Math.max(1,shell.clientHeight-header.offsetHeight-bar.offsetHeight-feedback.offsetHeight);
  const scale=Math.min(canvas.clientWidth/stage.offsetWidth,collapsed?availableHeight/stage.offsetHeight:Infinity,1);
  stage.style.transform=`scale(${scale})`;
  frame.style.width=(stage.offsetWidth*scale)+'px';
  frame.style.height=(stage.offsetHeight*scale)+'px';
  canvas.style.height=(collapsed?availableHeight:stage.offsetHeight*scale)+'px';
}
function renderMobileCanvas(){
  if(!mobileWorkspace?.active)return false;
  // Wrap within the same logical canvas used by export, before preview scaling.
  const canvasWidth=1032; // Match the desktop editor content width.
  const measure=mobileWorkspace.measure;
  measure.font=getComputedStyle(preview).font;
  const layout=explicitExportLayout(measure,text.value,arrangedMarks(state.hearts,state.problemOrder),Number(size.value),0,state.alignment,canvasWidth-40);
  const wrappedText=layout.lines.join('\n');
  if(preview.textContent!==wrappedText)preview.textContent=wrappedText;
  updateHearts(layout.marks);
  const [rw,rh]=state.ratio.split(':').map(Number);
  const frame=exportFrame({width:canvasWidth,height:canvasWidth*rh/rw},layout,Boolean(state.photoURL));
  mobileWorkspace.bounds=frame.bounds;editorViewport.bounds=frame.bounds;
  stage.style.width=frame.width+'px';stage.style.height=frame.height+'px';
  layer.style.width=layout.width+'px';layer.style.maxWidth='none';
  layer.style.transform=`scale(${frame.fit})`;layer.style.transformOrigin='top left';

  return true;
}
function setupMobileWorkspace(){
  const shell=document.createElement('div');shell.className='mobile-editor';shell.hidden=true;
  shell.innerHTML=`<header class="mobile-header"><h1>완등 한 컷</h1></header>
    <div class="mobile-feedback"></div>
    <div class="mobile-canvas" aria-label="썸네일 미리보기"></div>
    <div class="mobile-panel-bar"><nav class="mobile-tabs" role="tablist" aria-label="썸네일 편집 도구">
      <button type="button" id="mobile-text-tab" role="tab" aria-controls="mobile-text-panel" aria-selected="true">텍스트</button>
      <button type="button" id="mobile-marks-tab" role="tab" aria-controls="mobile-marks-panel" aria-selected="false" tabindex="-1">성공 문제</button>
      <button type="button" id="mobile-image-tab" role="tab" aria-controls="mobile-image-panel" aria-selected="false" tabindex="-1">이미지</button>
    </nav><button type="button" id="mobile-panel-toggle" aria-label="편집 패널 접기" aria-expanded="true" aria-controls="mobile-tools">접기</button></div><div class="mobile-tools" id="mobile-tools">
      <section id="mobile-text-panel" class="mobile-panel text-section" role="tabpanel" aria-labelledby="mobile-text-tab"></section>
      <section id="mobile-marks-panel" class="mobile-panel text-section" role="tabpanel" aria-labelledby="mobile-marks-tab" hidden></section>
      <section id="mobile-image-panel" class="mobile-panel" role="tabpanel" aria-labelledby="mobile-image-tab" hidden></section>
    </div>`;
  document.body.append(shell);
  const header=shell.querySelector('.mobile-header'),canvas=shell.querySelector('.mobile-canvas'),tools=shell.querySelector('.mobile-tools');
  const bar=shell.querySelector('.mobile-panel-bar'),feedback=shell.querySelector('.mobile-feedback'),toggle=$('mobile-panel-toggle');
  const panels=['text','marks','image'].map(name=>$(`mobile-${name}-panel`));
  const tabs=Array.from(shell.querySelectorAll('[role=tab]'));
  const styleControls=document.createElement('div');styleControls.className='mobile-style';
  const frame=document.querySelector('.preview-frame');
  mobileWorkspace={shell,canvas,frame,header,bar,feedback,collapsed:false,measure:document.createElement('canvas').getContext('2d'),active:false};
  const moves=[];
  function move(node,parent){const anchor=document.createComment('desktop position');node.before(anchor);moves.push({node,anchor});parent.append(node);}
  function collapsePanel(collapsed){
    mobileWorkspace.collapsed=collapsed;
    shell.classList.toggle('panel-collapsed',collapsed);tools.hidden=collapsed;
    toggle.setAttribute('aria-expanded',String(!collapsed));
    toggle.setAttribute('aria-label',collapsed?'편집 패널 펼치기':'편집 패널 접기');
    toggle.textContent=collapsed?'펼치기':'접기';
    shell.scrollTop=0;
    fitMobilePreview();
  }
  toggle.addEventListener('click',()=>collapsePanel(!mobileWorkspace.collapsed));
  function selectTab(index){
    tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;});
    if(mobileWorkspace.collapsed)collapsePanel(false);
  }
  window.addEventListener('editorreset',()=>{if(mobileWorkspace.active){selectTab(0);shell.scrollTop=0;}});
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>selectTab(index));
    tab.addEventListener('keydown',event=>{
      let next;
      if(event.key==='ArrowRight')next=(index+1)%tabs.length;
      if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
      if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;
      if(next!==undefined){event.preventDefault();selectTab(next);tabs[next].focus();}
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
    editorViewport.logical=query.matches;
    document.body.classList.toggle('mobile-editing',query.matches);shell.hidden=!query.matches;
    if(query.matches){
      move(document.querySelector('.editor-actions'),header);move(frame,canvas);
      move(text,panels[0]);move(document.querySelector('main .gym-picker'),panels[0]);move(document.querySelector('main .position-controls'),panels[0]);
      panels[0].append(styleControls);move(document.querySelector('main .color-controls'),styleControls);
      move(document.querySelector('main .success-controls'),panels[1]);
      move(document.querySelector('main .photo-tools'),panels[2]);
      move($('fontStatus'),feedback);move($('status'),feedback);
      selectTab(0);viewport();
    }else{
      for(const {node,anchor} of moves.reverse()){anchor.replaceWith(node);}moves.length=0;
      styleControls.remove();preview.textContent=text.value.normalize('NFC');updateHearts();
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
