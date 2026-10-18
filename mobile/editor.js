// Move the existing controls into a mobile workspace, retaining their listeners
// and state. Comment anchors restore the desktop DOM when the breakpoint changes.
var mobileWorkspace;
function markColor(key){return key.includes(':')?key.split(':')[1]:key;}
function syncMobileCounts(){
  if(!mobileWorkspace)return;
  const counts=new Map();
  for(const key of state.hearts)if(key!=='\n')counts.set(markColor(key),(counts.get(markColor(key))||0)+1);
  palette.forEach(button=>{
    const color=button.dataset.heart,count=counts.get(color)||0;
    button.setAttribute('aria-label',markTemplates.get(color).label+' '+markShapes[state.shape].label+' 추가'+(mobileWorkspace.active?`, 현재 ${count}개`:''));
  });
  const {counters,rows}=mobileWorkspace;
  let focusColor=null;
  for(const [color,row] of rows){
    if(counts.has(color))continue;
    if(row.contains(document.activeElement))focusColor=color;
    row.remove();rows.delete(color);
  }
  let index=0;
  for(const [color,count] of counts){
    let row=rows.get(color);
    if(!row){
      const label=markTemplates.get(color).label;
      row=document.createElement('div');row.className='mobile-counter';row.dataset.color=color;
      row.setAttribute('role','group');row.setAttribute('aria-label',label+' 문제 개수');
      const swatch=document.createElement('span');swatch.className='mobile-counter-swatch';swatch.setAttribute('aria-hidden','true');
      swatch.style.backgroundColor=markTemplates.get(color).svg.querySelector('path').getAttribute('fill');
      const name=document.createElement('span');name.className='mobile-counter-label';name.textContent=label;
      const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.setAttribute('aria-label',label+' 하나 빼기');
      const output=document.createElement('output');output.setAttribute('aria-label',label+' 문제 개수');output.setAttribute('aria-live','polite');
      const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.setAttribute('aria-label',label+' 하나 더하기');
      minus.addEventListener('click',()=>{
        // Preserve mixed shapes and other colors; remove the last mark of this color.
        const last=state.hearts.findLastIndex(key=>key!=='\n'&&markColor(key)===color);
        if(last<0)return;state.hearts.splice(last,1);
        while(state.hearts.at(-1)==='\n')state.hearts.pop();
        updateHearts();schedulePosition();
      });
      plus.addEventListener('click',()=>{state.hearts.push(markKey(state.shape,color));updateHearts();schedulePosition();});
      row.append(swatch,name,minus,output,plus);rows.set(color,row);
    }
    const output=row.querySelector('output');
    if(output.textContent!==String(count))output.textContent=count;
    // Keep existing row elements and focus stable during repeated taps.
    if(counters.children[index]!==row)counters.insertBefore(row,counters.children[index]||null);
    index++;
  }
  counters.hidden=counts.size===0;
  if(focusColor)palette.find(button=>button.dataset.heart===focusColor)?.focus({preventScroll:true});
}
function fitMobilePreview(){
  if(!mobileWorkspace?.active)return;
  const {canvas,frame}=mobileWorkspace;
  const maxHeight=Math.max(100,Math.min(320,(window.visualViewport?.height||window.innerHeight)*.34));
  const availableWidth=canvas.clientWidth-32,availableHeight=maxHeight-24;
  const scale=Math.min(availableWidth/stage.offsetWidth,availableHeight/stage.offsetHeight,1);
  stage.style.transform=`scale(${scale})`;
  frame.style.width=(stage.offsetWidth*scale)+'px';
  frame.style.height=(stage.offsetHeight*scale)+'px';
  canvas.style.height=Math.min(maxHeight,Math.max(100,stage.offsetHeight*scale+24))+'px';
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
    <p class="mobile-canvas-hint">글자와 도형을 끌어서 위치를 조절하세요</p>
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
  const counters=document.createElement('div');counters.className='mobile-counters';counters.setAttribute('role','group');counters.setAttribute('aria-label','추가한 색상별 개수');counters.hidden=true;
  const note=document.createElement('p');note.className='mobile-note';note.textContent='색을 누르면 하나씩 추가돼요.';
  const imageNote=document.createElement('p');imageNote.className='mobile-note';imageNote.textContent='이미지는 선택한 비율에 맞춰 가운데를 기준으로 잘립니다.';
  const frame=document.querySelector('.preview-frame');
  mobileWorkspace={shell,canvas,frame,measure:document.createElement('canvas').getContext('2d'),active:false,counters,rows:new Map()};
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
  const query=window.WONINE_MOBILE_FORCE?{matches:true,addEventListener(){}}:window.matchMedia('(max-width:600px)');
  function apply(){
    if(query.matches===mobileWorkspace.active)return;
    mobileWorkspace.active=query.matches;
    editorViewport.logical=query.matches;
    document.body.classList.toggle('mobile-editing',query.matches);shell.hidden=!query.matches;
    if(query.matches){
      move($('saveResult'),header);move(frame,canvas);
      move(text,panels[0]);move(document.querySelector('main .gym-picker'),panels[0]);move(document.querySelector('main .position-controls'),panels[0]);
      panels[0].append(styleControls);move(document.querySelector('main .color-controls'),styleControls);
      move(document.querySelector('main .success-controls'),panels[1]);
      panels[1].querySelector('.heart-palette').after(note);note.after(counters);
      move(document.querySelector('main .photo-tools'),panels[2]);panels[2].append(imageNote);
      move($('fontStatus'),tools);move($('status'),tools);tools.prepend($('fontStatus'),$('status'));
      selectTab(0);viewport();
    }else{
      for(const {node,anchor} of moves.reverse()){anchor.replaceWith(node);}moves.length=0;
      counters.remove();note.remove();styleControls.remove();imageNote.remove();
      frame.style.width='';frame.style.height='';stage.style.transform='';stage.style.width='';
      layer.style.width='';layer.style.maxWidth='';layer.style.transform='';layer.style.transformOrigin='';mobileWorkspace.bounds=null;editorViewport.bounds=null;
    }
    syncMobileCounts();schedulePosition();
  }
  query.addEventListener('change',apply);
  window.addEventListener('resize',viewport);window.visualViewport?.addEventListener('resize',viewport);window.visualViewport?.addEventListener('scroll',viewport);
  new ResizeObserver(fitMobilePreview).observe(canvas);
  apply();
}
editorViewport.render=renderMobileCanvas;
editorViewport.afterRender=fitMobilePreview;
editorViewport.syncCounts=syncMobileCounts;
setupMobileWorkspace();
