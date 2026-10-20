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
    <div class="mobile-content">
    <div class="mobile-feedback"></div>
    <div class="mobile-canvas" aria-label="썸네일 미리보기"></div>
    <div class="mobile-tools" id="mobile-tools">
      <div class="mobile-panel-heading"><h2 id="mobile-panel-title">텍스트</h2><button type="button" id="mobile-panel-toggle" aria-label="편집 패널 접기" aria-controls="mobile-tools">접기</button></div>
      <section id="mobile-text-panel" class="mobile-panel text-section" role="region" aria-labelledby="mobile-text-tab"></section>
      <section id="mobile-marks-panel" class="mobile-panel text-section" role="region" aria-labelledby="mobile-marks-tab" hidden></section>
      <section id="mobile-image-panel" class="mobile-panel" role="region" aria-labelledby="mobile-image-tab" hidden></section>
    </div></div>
    <nav class="mobile-panel-bar mobile-menu" aria-label="썸네일 편집 메뉴">
      <button type="button" id="mobile-text-tab" aria-controls="mobile-text-panel" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6V4h14v2M12 4v16M8 20h8"/></svg><span>텍스트</span></button>
      <button type="button" id="mobile-marks-tab" aria-controls="mobile-marks-panel" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3c2-1 8 1 11 3s2 7 0 12-7 3-12 2-5-4-4-8 3-8 5-9Z"/><circle cx="12" cy="11" r="2"/></svg><span>성공 문제</span></button>
      <button type="button" id="mobile-image-tab" aria-controls="mobile-image-panel" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/></svg><span>이미지</span></button>
    </nav>`;
  document.body.append(shell);
  const header=shell.querySelector('.mobile-header'),canvas=shell.querySelector('.mobile-canvas'),tools=shell.querySelector('.mobile-tools');
  const bar=shell.querySelector('.mobile-panel-bar'),feedback=shell.querySelector('.mobile-feedback'),toggle=$('mobile-panel-toggle');
  const panels=['text','marks','image'].map(name=>$(`mobile-${name}-panel`));
  const tabs=Array.from(bar.querySelectorAll('button'));
  const content=shell.querySelector('.mobile-content');let selected=0;
  const styleControls=document.createElement('div');styleControls.className='mobile-style';
  const frame=document.querySelector('.preview-frame');
  mobileWorkspace={shell,canvas,frame,header,bar,feedback,collapsed:false,measure:document.createElement('canvas').getContext('2d'),active:false};
  const moves=[];
  function move(node,parent){const anchor=document.createComment('desktop position');node.before(anchor);moves.push({node,anchor});parent.append(node);}
  function collapsePanel(collapsed){
    mobileWorkspace.collapsed=collapsed;
    shell.classList.toggle('panel-collapsed',collapsed);tools.hidden=collapsed;
    tabs.forEach((tab,i)=>tab.setAttribute('aria-expanded',String(!collapsed&&i===selected)));
    toggle.setAttribute('aria-expanded',String(!collapsed));
    content.scrollTop=0;
    if(collapsed&&tools.contains(document.activeElement))tabs[selected].focus({preventScroll:true});
    fitMobilePreview();
  }
  toggle.addEventListener('click',()=>collapsePanel(!mobileWorkspace.collapsed));
  function selectTab(index){
    selected=index;
    panels.forEach((panel,i)=>{panel.hidden=i!==index;});
    $('mobile-panel-title').textContent=['텍스트','성공 문제','이미지'][index];
    collapsePanel(false);
    content.scrollTop=tools.offsetTop;
  }
  window.addEventListener('editorreset',()=>{if(mobileWorkspace.active){selectTab(0);}});
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
      selectTab(0);collapsePanel(true);viewport();
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
