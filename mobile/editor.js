// Move the existing controls into a mobile workspace, retaining their listeners
// and state. Comment anchors restore the desktop DOM when the breakpoint changes.
var mobileWorkspace;
function fitMobilePreview(){
  if(!mobileWorkspace?.active)return;
  const {canvas,frame}=mobileWorkspace;
  const maxHeight=Math.max(100,Math.min(320,(window.visualViewport?.height||window.innerHeight)*.34));
  const availableWidth=canvas.clientWidth,availableHeight=maxHeight;
  const scale=Math.min(availableWidth/stage.offsetWidth,availableHeight/stage.offsetHeight,1);
  stage.style.transform=`scale(${scale})`;
  frame.style.width=(stage.offsetWidth*scale)+'px';
  frame.style.height=(stage.offsetHeight*scale)+'px';
  canvas.style.height=(stage.offsetHeight*scale)+'px';
}
function renderMobileCanvas(){
  if(!mobileWorkspace?.active)return false;
  // Use the export layout as the mobile canvas: viewport zoom must never
  // introduce extra line breaks or change the composition being saved.
  const measure=mobileWorkspace.measure;
  measure.font=getComputedStyle(preview).font;
  const layout=explicitExportLayout(measure,text.value,arrangedMarks(state.hearts,state.problemOrder),Number(size.value),state.fontFamily==='Wave'?0:-2,state.alignment);
  const [rw,rh]=state.ratio.split(':').map(Number);
  const frame=exportFrame({width:1000,height:1000*rh/rw},layout,Boolean(state.photoURL));
  mobileWorkspace.bounds=frame.bounds;editorViewport.bounds=frame.bounds;
  stage.style.width=frame.width+'px';stage.style.height=frame.height+'px';
  layer.style.width=layout.width+'px';layer.style.maxWidth='none';
  layer.style.transform=`scale(${frame.fit})`;layer.style.transformOrigin='top left';

  return true;
}
function setupMobileWorkspace(){
  const shell=document.createElement('div');shell.className='mobile-editor';shell.hidden=true;
  shell.innerHTML=`<header class="mobile-header"><h1>클라이밍 썸네일 만들기</h1></header>
    <div class="mobile-canvas" aria-label="썸네일 미리보기"></div>
    <nav class="mobile-tabs" role="tablist" aria-label="썸네일 편집 도구">
      <button type="button" id="mobile-text-tab" role="tab" aria-controls="mobile-text-panel" aria-selected="true">텍스트</button>
      <button type="button" id="mobile-marks-tab" role="tab" aria-controls="mobile-marks-panel" aria-selected="false" tabindex="-1">성공 문제</button>
      <button type="button" id="mobile-image-tab" role="tab" aria-controls="mobile-image-panel" aria-selected="false" tabindex="-1">이미지</button>
    </nav><div class="mobile-tools">
      <section id="mobile-text-panel" class="mobile-panel text-section" role="tabpanel" aria-labelledby="mobile-text-tab"></section>
      <section id="mobile-marks-panel" class="mobile-panel text-section" role="tabpanel" aria-labelledby="mobile-marks-tab" hidden></section>
      <section id="mobile-image-panel" class="mobile-panel" role="tabpanel" aria-labelledby="mobile-image-tab" hidden></section>
    </div>`;
  document.body.append(shell);
  const header=shell.querySelector('.mobile-header'),canvas=shell.querySelector('.mobile-canvas'),tools=shell.querySelector('.mobile-tools');
  const panels=['text','marks','image'].map(name=>$(`mobile-${name}-panel`));
  const tabs=Array.from(shell.querySelectorAll('[role=tab]'));
  const styleControls=document.createElement('div');styleControls.className='mobile-style';
  const imageNote=document.createElement('p');imageNote.className='mobile-image-note';imageNote.textContent='이미지는 선택한 비율에 맞춰 가운데를 기준으로 잘립니다.';
  const frame=document.querySelector('.preview-frame');
  mobileWorkspace={shell,canvas,frame,measure:document.createElement('canvas').getContext('2d'),active:false};
  const moves=[];
  function move(node,parent){const anchor=document.createComment('desktop position');node.before(anchor);moves.push({node,anchor});parent.append(node);}
  function selectTab(index){
    tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;});
    tools.scrollTop=0;
  }
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
      move($('saveResult'),header);move(frame,canvas);canvas.after(imageNote);
      move(text,panels[0]);move(document.querySelector('main .gym-picker'),panels[0]);move(document.querySelector('main .position-controls'),panels[0]);
      panels[0].append(styleControls);move(document.querySelector('main .color-controls'),styleControls);
      move(document.querySelector('main .success-controls'),panels[1]);
      move(document.querySelector('main .photo-tools'),panels[2]);
      move($('fontStatus'),tools);move($('status'),tools);tools.prepend($('fontStatus'),$('status'));
      selectTab(0);viewport();
    }else{
      for(const {node,anchor} of moves.reverse()){anchor.replaceWith(node);}moves.length=0;
      styleControls.remove();imageNote.remove();
      frame.style.width='';frame.style.height='';stage.style.transform='';stage.style.width='';
      layer.style.width='';layer.style.maxWidth='';layer.style.transform='';layer.style.transformOrigin='';mobileWorkspace.bounds=null;editorViewport.bounds=null;
    }
    schedulePosition();
  }
  query.addEventListener('change',apply);
  window.addEventListener('resize',viewport);window.visualViewport?.addEventListener('resize',viewport);window.visualViewport?.addEventListener('scroll',viewport);
  new ResizeObserver(fitMobilePreview).observe(canvas);
  apply();
}
editorViewport.render=renderMobileCanvas;
editorViewport.afterRender=fitMobilePreview;
setupMobileWorkspace();
