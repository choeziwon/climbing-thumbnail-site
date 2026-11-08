// Move the existing controls into a mobile workspace, retaining their listeners
// and state. Comment anchors restore the desktop DOM when the breakpoint changes.
var mobileWorkspace;
function fitMobilePreview(){
  if(!mobileWorkspace?.active)return;
  const {canvas,frame,shell}=mobileWorkspace;
  const overview=shell.classList.contains('menu-overview-open')||shell.classList.contains('template-browser-open');
  const previewHeight=Math.max(100,overview?shell.querySelector('.mobile-content').clientHeight-shell.querySelector('.mobile-feedback').offsetHeight-shell.querySelector('.mobile-tools').offsetHeight:shell.classList.contains('editing-tool')?shell.clientHeight*.7-(mobileWorkspace.panelInset||0):shell.querySelector('.mobile-content').clientHeight-shell.querySelector('.mobile-feedback').offsetHeight);
  const scale=Math.min(canvas.clientWidth/stage.offsetWidth,previewHeight/stage.offsetHeight,1);
  stage.style.transform=`scale(${scale})`;
  frame.style.width=(stage.offsetWidth*scale)+'px';
  frame.style.height=(stage.offsetHeight*scale)+'px';
  canvas.style.height=previewHeight+'px';
  if(typeof positionObjectTools==='function')positionObjectTools();sizePhotoOverlayHandles();
  const reset=document.getElementById('resetImageSettings');if(reset){const r=stage.getBoundingClientRect(),c=canvas.getBoundingClientRect();reset.style.right=Math.max(12,c.right-r.right+12)+'px';reset.style.bottom=Math.max(12,c.bottom-r.bottom+12)+'px';}
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
  layer.style.transform=`scale(${frame.fit}) translate(${layout.width/2}px,${layout.height/2}px) rotate(${state.textRotation||0}deg) scaleX(${state.textFlip?-1:1}) translate(${-layout.width/2}px,${-layout.height/2}px)`;layer.style.transformOrigin='top left';

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
      <section id="mobile-template-panel" class="mobile-panel" role="region" aria-labelledby="mobile-template-tab" hidden></section>
    </div></div>
    <nav class="mobile-panel-bar mobile-menu" aria-label="썸네일 편집 메뉴">
      <button type="button" id="mobile-image-tab" aria-controls="mobile-image-panel" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/></svg><span>이미지</span></button>
      <button type="button" id="mobile-text-tab" aria-controls="mobile-text-panel" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6V4h14v2M12 4v16M8 20h8"/></svg><span>텍스트</span></button>
      <button type="button" id="mobile-marks-tab" aria-controls="mobile-marks-panel" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3c2-1 8 1 11 3s2 7 0 12-7 3-12 2-5-4-4-8 3-8 5-9Z"/><circle cx="12" cy="11" r="2"/></svg><span>완등 표시</span></button>
      <button type="button" id="mobile-template-tab" aria-controls="mobile-template-panel" aria-expanded="false"><span>템플릿</span></button>
    </nav>`;
  document.body.append(shell);
  const header=shell.querySelector('.mobile-header'),canvas=shell.querySelector('.mobile-canvas'),tools=shell.querySelector('.mobile-tools');
  const bar=shell.querySelector('.mobile-panel-bar'),feedback=shell.querySelector('.mobile-feedback');
  const panels=['text','marks','image','template'].map(name=>$(`mobile-${name}-panel`));
  const tabs=['text','marks','image','template'].map(name=>$(`mobile-${name}-tab`));
  const menuTabs=Array.from(bar.querySelectorAll('button'));
  const content=shell.querySelector('.mobile-content');let selected=0;
  const textTabs=document.createElement('div');textTabs.className='mobile-text-tabs text-editor-tabs';textTabs.setAttribute('role','tablist');textTabs.setAttribute('aria-label','텍스트 편집 항목');
  const textGroups=['글자','폰트','정렬','테두리','그림자','색상·크기'].map((name,i)=>{
    const panel=document.createElement('div');panel.id='mobile-text-group-'+i;panel.className='mobile-text-group';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','mobile-text-option-'+i);
    const button=document.createElement('button');button.type='button';button.id='mobile-text-option-'+i;button.textContent=name;button.setAttribute('role','tab');button.setAttribute('aria-controls',panel.id);
    button.addEventListener('click',()=>{scrollingUp=false;expandTools();selectTextGroup(i);});button.addEventListener('keydown',e=>{if(!['ArrowRight','ArrowLeft'].includes(e.key))return;const visible=Array.from(textTabs.querySelectorAll('[role=tab]')).filter(tab=>!tab.hidden),at=visible.indexOf(button),next=visible[(at+(e.key==='ArrowRight'?1:visible.length-1))%visible.length];e.preventDefault();next.click();next.focus();});
    textTabs.append(button);return panel;
  });
  textTabs.insertBefore(textTabs.children[5],textTabs.children[1]);
  panels[0].append(textTabs,...textGroups);
  let selectedText=null,textDetail=false;
  const textOverview=document.createElement('div');textOverview.className='text-overview';
  const textActions=document.createElement('div');textActions.className='image-tool-strip text-action-strip';textActions.setAttribute('role','group');textActions.setAttribute('aria-label','텍스트 도구');
  const addBadge='<circle cx="18" cy="18" r="5" fill="#111111" stroke="#ffffff" stroke-width="1.2"/><path d="M18 15.5v5M15.5 18h5" stroke="#ffffff" stroke-width="1.5"/>';
  const actionIcons={add:'<path d="M3 6V3h15v3M10.5 3v17M7 20h7"/>'+addBadge,edit:'<path d="m4 16 12-12 4 4L8 20H4Zm10-10 4 4M12 20h9"/>',style:'<path d="M12 3a9 9 0 1 0 0 18h1.4a2.2 2.2 0 0 0 1.6-3.7 1.5 1.5 0 0 1 1.1-2.5H18a3 3 0 0 0 3-3C21 6.9 17 3 12 3Z"/><circle cx="7.3" cy="10.3" r="1" fill="currentColor" stroke="none"/><circle cx="10.3" cy="6.8" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="7.2" r="1" fill="currentColor" stroke="none"/><circle cx="17.5" cy="10.8" r="1" fill="currentColor" stroke="none"/>',copy:'<path d="M17 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"/><rect x="7" y="7" width="14" height="14" rx="2"/>',remove:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>'};
  const actionButtons={};
  for(const [key,label] of [['add','텍스트 추가'],['edit','내용 편집'],['style','스타일'],['copy','복제'],['remove','삭제']]){const button=toolButton(label,actionIcons[key]);button.dataset.textAction=key;textActions.append(button);actionButtons[key]=button;}
  textOverview.append(textActions);
  const extraDetail=document.createElement('div');extraDetail.className='text-object-detail';extraDetail.hidden=true;
  const extraDetailHeading=document.createElement('div');extraDetailHeading.className='text-detail-heading';
  const extraDetailTitle=document.createElement('span');const extraDone=document.createElement('button');extraDone.type='button';extraDone.textContent='완료';extraDone.onclick=()=>showTextOverview();extraDetailHeading.append(extraDetailTitle,extraDone);
  const extraDetailBody=document.createElement('div');extraDetailBody.className='text-object-fields';extraDetail.append(extraDetailHeading,extraDetailBody);panels[0].prepend(textOverview);panels[0].append(extraDetail);
  function currentExtra(){return extraTexts.find(item=>item.id===selectedText);}
  function textCount(){return (text.value.trim()?1:0)+extraTexts.length;}
  function syncTextSelection(){
    if(selectedText==='primary'&&!text.value.trim())selectedText=null;
    if(typeof selectedText==='number'&&!currentExtra())selectedText=null;
    preview.classList.toggle('selected-text-object',selected===0&&selectedText==='primary');
    for(const [id,node] of extraTextNodes)node.classList.toggle('selected-text-object',selected===0&&id===selectedText);
    actionButtons.add.disabled=false;for(const key of ['edit','style','remove'])actionButtons[key].disabled=selectedText===null;actionButtons.copy.disabled=selectedText===null;
  }
  function selectTextObject(id){setEditorSelection('text',id,{origin:'canvas'});}
  layer.addEventListener('focus',()=>{if(text.value.trim()&&editorSelection.kind!=='text')selectTextObject('primary');});
  layer.addEventListener('pointerdown',()=>{if(text.value.trim())selectTextObject('primary');},true);
  window.addEventListener('selectextratext',e=>{selectTextObject(e.detail);});
  stage.addEventListener('pointerdown',e=>{if(e.target===stage)setEditorSelection('background',null,{origin:'canvas',showTools:false});});
  function showTextOverview(){
    textDetail=false;menuDetail=false;shell.classList.add('menu-overview-open');shell.classList.remove('tools-expanded');bar.hidden=false;panelHeading.hidden=true;textTabs.hidden=true;done.hidden=true;extraDetail.hidden=true;textGroups.forEach(group=>group.hidden=true);textOverview.hidden=false;tools.scrollTop=0;
    syncTextSelection();fitMobilePreview();
  }
  function openTextDetail(kind){
    if(selectedText===null)return;textDetail=true;shell.classList.remove('menu-overview-open');bar.hidden=true;panelHeading.hidden=true;textOverview.hidden=true;done.hidden=false;
    if(selectedText==='primary'){
      extraDetail.hidden=true;textTabs.hidden=false;textTabs.append(done);
      for(let i=0;i<textGroups.length;i++)$('mobile-text-option-'+i).hidden=kind==='edit'?i!==0:i===0;
      selectTextGroup(kind==='edit'?0:5);
      if(kind==='edit'){textTabs.hidden=true;panelHeading.hidden=false;$('mobile-panel-title').textContent='글자';panelHeading.append(done);}
      if(kind==='edit')text.focus({preventScroll:true});
    }else{
      textTabs.hidden=true;textGroups.forEach(group=>group.hidden=true);extraDetail.hidden=false;
      const item=currentExtra();if(!item)return showTextOverview();buildExtraDetail(item,kind);

    }
    tools.scrollTop=0;fitMobilePreview();
  }
  function buildExtraDetail(item,kind){
    extraDetailHeading.hidden=true;extraDetailBody.replaceChildren();extraDetailBody.className='extra-text-editor';
    const tabsCopy=document.createElement('div');tabsCopy.className='mobile-text-tabs text-editor-tabs';tabsCopy.setAttribute('role','tablist');tabsCopy.setAttribute('aria-label','텍스트 편집 항목');
    const fields={size:'size',fillColor:'color',strokeColor:'strokeColor',outline:'outline',outlineWidth:'outlineWidth',letterSpace:'letterSpace',lineSpace:'lineSpace',shadow:'shadow',shadowColor:'shadowColor',shadowWidth:'shadowWidth',shadowOpacity:'shadowOpacity',shadowDistance:'shadowDistance',shadowAngle:'shadowAngle'};
    const defaults={strokeColor:'#111111',outlineWidth:1,letterSpace:0,lineSpace:16,shadowColor:'#111111',shadowWidth:3,shadowOpacity:50,shadowDistance:3,shadowAngle:0,alignment:'center',writingMode:'horizontal',verticalAlign:'top'};
    for(const [key,value] of Object.entries(defaults))if(item[key]===undefined)item[key]=value;
    const copies=textGroups.map((source,i)=>{const copy=source.cloneNode(true);copy.hidden=true;copy.id='extra-text-group-'+i;copy.setAttribute('aria-labelledby','extra-text-tab-'+i);
      for(const el of copy.querySelectorAll('[id]')){el.dataset.sourceId=el.id;el.id='extra-'+el.id;}
      for(const el of copy.querySelectorAll('[for]'))el.htmlFor='extra-'+el.htmlFor;
      for(const el of copy.querySelectorAll('[aria-labelledby]'))el.setAttribute('aria-labelledby',el.getAttribute('aria-labelledby').split(' ').map(id=>'extra-'+id).join(' '));
      for(const el of copy.querySelectorAll('[aria-controls]'))el.setAttribute('aria-controls','extra-'+el.getAttribute('aria-controls'));
      for(const el of copy.querySelectorAll('[data-align]')){el.dataset.extraAlign=el.dataset.align;delete el.dataset.align;}
      for(const el of copy.querySelectorAll('[data-valign]')){el.dataset.extraValign=el.dataset.valign;delete el.dataset.valign;}
      for(const el of copy.querySelectorAll('[data-font-card]')){el.dataset.extraFont=el.dataset.fontCard;delete el.dataset.fontCard;}
      const button=document.createElement('button');button.type='button';button.id='extra-text-tab-'+i;button.textContent=['글자','폰트','정렬','테두리','그림자','색상·크기'][i];button.setAttribute('role','tab');button.setAttribute('aria-controls',copy.id);button.hidden=kind==='edit'?i!==0:i===0;button.onclick=()=>{copies.forEach((group,j)=>group.hidden=i!==j);for(const tab of tabsCopy.querySelectorAll('[role=tab]')){const active=tab===button;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;}tools.scrollTop=0;};button.onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const visible=Array.from(tabsCopy.querySelectorAll('[role=tab]')).filter(tab=>!tab.hidden),at=visible.indexOf(button),next=visible[(at+(e.key==='ArrowRight'?1:visible.length-1))%visible.length];next.click();next.focus();};tabsCopy.append(button);return copy;});
    tabsCopy.insertBefore(tabsCopy.children[5],tabsCopy.children[1]);tabsCopy.append(done);extraDetailBody.append(tabsCopy,...copies);if(kind==='edit'){tabsCopy.hidden=true;panelHeading.hidden=false;$('mobile-panel-title').textContent='글자';panelHeading.append(done);}
    function commit(){state.loadVersion++;renderExtraTexts();update();sync();}
    function sync(){for(const copy of copies){for(const el of copy.querySelectorAll('input[data-source-id]')){const key=fields[el.dataset.sourceId];if(!key)continue;if(el.type==='checkbox')el.checked=Boolean(item[key]);else el.value=item[key];const out=el.closest('label')?.querySelector('output');if(out)out.value=item[key]+(key==='size'?'px':key==='shadowAngle'?'°':'%');}
      for(const button of copy.querySelectorAll('[data-extra-font]'))button.setAttribute('aria-pressed',String(button.dataset.extraFont===item.font));
      for(const button of copy.querySelectorAll('[data-extra-align]'))button.setAttribute('aria-pressed',String(item.writingMode!=='vertical'&&button.dataset.extraAlign===item.alignment));
      for(const button of copy.querySelectorAll('[data-extra-valign]'))button.setAttribute('aria-pressed',String(item.writingMode==='vertical'&&button.dataset.extraValign===item.verticalAlign));
      for(const row of copy.querySelectorAll('.color-picker-row')){const input=row.previousElementSibling,key=fields[input?.dataset.sourceId],effect=key==='strokeColor'?'outline':key==='shadowColor'?'shadow':null;for(const button of row.querySelectorAll('[data-color]'))button.setAttribute('aria-pressed',String((!effect||item[effect])&&button.dataset.color===item[key]));row.querySelector('.color-none')?.setAttribute('aria-pressed',String(!item[effect]));row.querySelector('.color-custom')?.style.setProperty('--chosen',item[key]);}
    }}
    for(const copy of copies){
      for(const input of copy.querySelectorAll('input[data-source-id]')){const key=fields[input.dataset.sourceId];if(!key)continue;input.disabled=false;if(key==='size')input.dataset.selectedExtraSize=item.id;input.oninput=()=>{item[key]=input.type==='checkbox'?input.checked:input.type==='range'?Number(input.value):input.value;if(key==='strokeColor')item.outline=true;if(key==='shadowColor')item.shadow=true;commit();};input.onchange=input.oninput;}
      for(const button of copy.querySelectorAll('[data-extra-font]'))button.onclick=async()=>{const requested=button.dataset.extraFont;item.fontRequest=requested;try{await document.fonts.load('400 '+item.size+'px "'+requested+'"',item.text||'한글');if(!extraTexts.includes(item)||item.fontRequest!==requested)return;item.font=requested;commit();}catch{showStatus('폰트를 불러오지 못했어요.');}};
      for(const button of copy.querySelectorAll('[data-extra-align]'))button.onclick=()=>{item.writingMode='horizontal';item.alignment=button.dataset.extraAlign;item.x={left:0,center:50,right:100}[item.alignment];commit();};
      for(const button of copy.querySelectorAll('[data-extra-valign]'))button.onclick=()=>{item.writingMode='vertical';item.verticalAlign=button.dataset.extraValign;commit();};
      for(const row of copy.querySelectorAll('.color-picker-row')){const input=row.previousElementSibling,key=fields[input.dataset.sourceId],effect=key==='strokeColor'?'outline':key==='shadowColor'?'shadow':null;for(const button of row.querySelectorAll('[data-color]'))button.onclick=()=>{input.value=button.dataset.color;input.dispatchEvent(new Event('input',{bubbles:true}));};const none=row.querySelector('.color-none');if(none)none.onclick=()=>{item[effect]=false;commit();};row.querySelector('.color-custom').onclick=()=>window.dispatchEvent(new CustomEvent('edittextcolor',{detail:{input}}));row.querySelector('.color-drop').onclick=()=>window.dispatchEvent(new CustomEvent('edittextcolor',{detail:{input,eyedrop:true}}));}
    }
    const content=copies[0].querySelector('textarea');content.value=item.text;content.oninput=()=>{item.text=content.value;state.loadVersion++;renderExtraTexts();};
    const branchField=copies[0].querySelector('[data-source-id=branchField]');if(branchField)branchField.hidden=true;
    const picker=copies[0].querySelector('.gym-search-picker');if(picker){const trigger=picker.querySelector('button'),panel=picker.querySelector('.gym-search-panel'),search=picker.querySelector('input'),results=picker.querySelector('.gym-results');panel.hidden=true;trigger.setAttribute('aria-expanded','false');const more=picker.querySelector('[data-source-id=gymSearchMore]');if(more)more.hidden=true;function matches(){results.replaceChildren();for(const {gym} of findGymMatches(gymSearchKey(search.value))){const option=document.createElement('div');option.className='gym-option';option.role='option';option.tabIndex=0;option.textContent=gym.name;const choose=()=>{const branchField=copies[0].querySelector('[data-source-id=branchField]'),branchList=copies[0].querySelector('[data-source-id=branchList]'),branchTrigger=copies[0].querySelector('[data-source-id=branchTrigger]');branchField.hidden=!gym.branches.length;branchList.hidden=true;branchTrigger.textContent='지점 선택';branchTrigger.setAttribute('aria-expanded','false');branchTrigger.onclick=()=>{branchList.hidden=!branchList.hidden;branchTrigger.setAttribute('aria-expanded',String(!branchList.hidden));};branchList.replaceChildren();for(const branch of gym.branches){const choice=document.createElement('div');choice.className='simple-option';choice.role='option';choice.tabIndex=0;choice.textContent=branch.label;choice.onclick=()=>{item.text=gym.name+' '+branch.label;content.value=item.text;branchTrigger.textContent=branch.label;branchList.hidden=true;branchTrigger.setAttribute('aria-expanded','false');commit();};choice.onkeydown=e=>{if(e.key==='Enter')choice.click();};branchList.append(choice);}item.text=gym.name;content.value=item.text;panel.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.textContent=gym.name;commit();};option.onclick=choose;option.onkeydown=e=>{if(e.key==='Enter')choose();};results.append(option);}}trigger.onclick=()=>{panel.hidden=!panel.hidden;trigger.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden){matches();search.focus();}};search.oninput=matches;}
    sync();tabsCopy.querySelectorAll('[role=tab]')[kind==='edit'?0:1].click();if(kind==='edit')content.focus({preventScroll:true});
  }
  function primaryTextSnapshot(){return {text:text.value,size:Number(size.value),font:state.fontFamily,color:fillColor.value,rotation:state.textRotation||0,flip:!!state.textFlip,x:state.x,y:state.y,outline:outline.checked,shadow:shadow.checked,alignment:state.alignment,writingMode:state.writingMode,verticalAlign:state.verticalAlign,...Object.fromEntries(['strokeColor','outlineWidth','letterSpace','lineSpace','shadowColor','shadowWidth','shadowOpacity','shadowDistance','shadowAngle'].map(id=>[id,$(id).type==='range'?Number($(id).value):$(id).value]))};}
  function createTextObject(source){
    if(!text.value.trim()&&!source){text.value='새 텍스트';state.loadVersion++;update();setEditorSelection('text','primary',{origin:'create',showTools:false});showTextOverview();openTextDetail('edit');return;}
    const item=source?{...source,id:++extraTextSerial,x:clamp(source.x+5,0,90),y:clamp(source.y+8,0,90)}:{...primaryTextSnapshot(),alignment:'center',id:++extraTextSerial,text:'새 텍스트',x:50,y:65};
    extraTexts.push(item);state.loadVersion++;renderExtraTexts();setEditorSelection('text',item.id,{origin:'create',showTools:false});showTextOverview();if(!source)openTextDetail('edit');
  }
  actionButtons.add.onclick=()=>createTextObject();actionButtons.edit.onclick=()=>openTextDetail('edit');actionButtons.style.onclick=()=>openTextDetail('style');
  actionButtons.copy.onclick=()=>{const source=selectedText==='primary'?primaryTextSnapshot():currentExtra();if(source)createTextObject(source);};
  actionButtons.remove.onclick=()=>{if(selectedText==='primary'){text.value='';update();}else{const index=extraTexts.findIndex(item=>item.id===selectedText);if(index>=0)extraTexts.splice(index,1);renderExtraTexts();}state.loadVersion++;setEditorSelection('none',null,{origin:'delete',showTools:false});showTextOverview();};
  window.addEventListener('editorreset',()=>{selectedText=null;textDetail=false;syncTextSelection();});
  window.addEventListener('extratextsize',()=>{const slider=extraDetail.querySelector('[data-selected-extra-size]'),item=currentExtra();if(slider&&item){slider.value=item.size;slider.nextElementSibling.value=item.size+'px';}});
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
  const rotateImage=toolButton('회전','<rect x="3" y="10" width="11" height="11" rx="1.5"/><path d="M7 3h5a8 8 0 0 1 8 8M16 7l4 4 3-4"/>');rotateImage.setAttribute('aria-label','회전');rotateImage.title='90° 회전';rotateImage.onclick=()=>{if(!state.photoURL)return;const view=state.photoView,cx=view.cx;view.cx=1-view.cy;view.cy=cx;view.rotation=((view.rotation||0)+90)%360;if(view.ratioMode==='original'){const d=photoDimensions();state.ratio=d.width+':'+d.height;}commitImage();};
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
    const button=toolButton(name,icon);button.setAttribute('aria-pressed',String(id===selectedCorrection));button.onclick=()=>{
      if(id===selectedCorrection&&state.photoURL&&state.photoView[id]){
        state.photoView[id]=0;commitImage();
        showStatus('');
      }else {selectCorrection(id);syncImage();}
    };correctionTools.append(button);
    imageRange(imageGroups[1],id,name,id==='sharpness'?0:-100,100,1,0,'');
    const row=imageGroups[1].lastElementChild;correctionRows.push({key:id,row,button});
  }
  selectCorrection(selectedCorrection);

  const imageReset=document.createElement('button');imageReset.type='button';imageReset.id='resetImageSettings';imageReset.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2.5 8M3 4v6h6"/></svg><span>초기화</span>';imageReset.onclick=()=>{if(!state.photoURL)return;if(selectedImageGroup===1){for(const key of ['brightness','contrast','saturation','warmth','shadows','highlights','sharpness'])state.photoView[key]=0;}else{Object.assign(state.photoView,{zoom:1,cx:.5,cy:.5,rotation:0,tilt:0,flip:false,ratioMode:'3:4'});state.ratio='3:4';}commitImage();};
  function syncImage(){for(const {key,button} of correctionRows){const changed=Boolean(state.photoView[key]);button.classList.toggle('is-adjusted',changed);button.setAttribute('aria-label',corrections.find(c=>c[0]===key)[1]+(changed?' · 조절됨'+(key===selectedCorrection?' · 다시 누르면 초기화':''):''));button.title=changed&&key===selectedCorrection?'다시 누르면 이 보정만 초기화':'선택하여 조절';button.disabled=!state.photoURL;}imageReset.hidden=!state.photoURL||selected!==2||!menuDetail;imageReset.setAttribute('aria-label',selectedImageGroup===0?'구도 재설정':'보정 재설정');imageReset.title=selectedImageGroup===0?'구도 재설정':'보정 재설정';for(const input of panels[2].querySelectorAll('[data-image-setting]')){const key=input.dataset.imageSetting,value=state.photoView[key]??(key==='zoom'?1:0);input.value=value;input.closest('label').querySelector('output').value=(key==='zoom'?Math.round(value*100):value)+input.closest('label').dataset.unit;input.disabled=!state.photoURL;}const ratioMode=state.photoView.ratioMode||state.ratio;freeCrop.hidden=ratioMode!=='free'||!state.photoURL;placeCrop();flipImage.setAttribute('aria-pressed',String(!!state.photoView.flip));for(const b of imageRatios.children)b.setAttribute('aria-pressed',String(b.dataset.imageRatio===ratioMode));imageGroups.forEach(g=>g.classList.toggle('image-empty',!state.photoURL));}
  new MutationObserver(syncImage).observe($('photoDetails'),{attributes:true,attributeFilter:['hidden']});window.addEventListener('editorreset',syncImage);
  const overlayTouches=new Map();let overlayPinch=null,overlayTarget=size;
  canvas.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='touch'||(selected===2&&!tools.hidden))return;
    const independent=!marksLinked()&&(e.target===markLayer||markLayer.contains(e.target));
    if(!overlayTouches.size&&!layer.contains(e.target)&&!independent)return;
    if(!overlayTouches.size)overlayTarget=independent?markSize:size;
    overlayTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(overlayTouches.size===2){
      const [a,b]=[...overlayTouches.values()];const target=overlayTarget;
      overlayPinch={distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),value:Number(target.value),target};
      drag=null;markDrag=null;e.preventDefault();e.stopImmediatePropagation();canvas.setPointerCapture(e.pointerId);
    }
  },true);
  canvas.addEventListener('pointermove',e=>{
    if(!overlayTouches.has(e.pointerId))return;overlayTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(!overlayPinch||overlayTouches.size!==2)return;
    e.preventDefault();e.stopImmediatePropagation();const [a,b]=[...overlayTouches.values()],p=overlayPinch;
    p.target.value=Math.round(clamp(p.value*Math.hypot(a.x-b.x,a.y-b.y)/p.distance,Number(p.target.min),Number(p.target.max)));
    p.target.dispatchEvent(new Event('input',{bubbles:true}));
  },true);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(overlayTouches.delete(e.pointerId)){overlayPinch=null;drag=null;markDrag=null;}},true);
  let imageDrag=null,imagePinch=null;const imageTouches=new Map();
  canvas.addEventListener('pointerdown',e=>{if(e.target.closest('[data-crop-edge],.photo-overlay,.extra-text-layer,#textLayer,#markLayer,.object-touch-tools,[data-editor-history],#resetImageSettings'))return;setEditorSelection('background',null,{origin:'canvas',showTools:false});if(selected!==2||!state.photoURL||tools.hidden||e.button!==0)return;const r=stage.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;e.preventDefault();e.stopImmediatePropagation();canvas.setPointerCapture(e.pointerId);imageTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(imageTouches.size===2){const [a,b]=[...imageTouches.values()];imagePinch={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom:state.photoView.zoom};return;}imageDrag={x:e.clientX,y:e.clientY,cx:state.photoView.cx,cy:state.photoView.cy,rect:r,crop:photoCrop(photoDimensions().width,photoDimensions().height,state.ratio,state.photoView)};},true);
  canvas.addEventListener('pointermove',e=>{if(!imageDrag)return;e.preventDefault();e.stopImmediatePropagation();if(imageTouches.has(e.pointerId))imageTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(imagePinch&&imageTouches.size===2){const [a,b]=[...imageTouches.values()];state.photoView.zoom=clamp(imagePinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,imagePinch.distance),1,4);commitImage();return;}const d=imageDrag,dims=photoDimensions();state.photoView.cx=clamp(d.cx-(e.clientX-d.x)/d.rect.width*d.crop.sw/dims.width,d.crop.sw/2/dims.width,1-d.crop.sw/2/dims.width);state.photoView.cy=clamp(d.cy-(e.clientY-d.y)/d.rect.height*d.crop.sh/dims.height,d.crop.sh/2/dims.height,1-d.crop.sh/2/dims.height);commitImage();},true);
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{imageTouches.delete(e.pointerId);imageDrag=null;imagePinch=null;});
  function selectTextGroup(index){textGroups.forEach((panel,i)=>{panel.hidden=i!==index;$('mobile-text-option-'+i).setAttribute('aria-selected',String(i===index));$('mobile-text-option-'+i).tabIndex=i===index?0:-1;});tools.scrollTop=0;}
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
  const displayField=document.createElement('div');displayField.className='success-order mark-display-control';
  displayField.setAttribute('role','group');displayField.setAttribute('aria-label','표시 내용');
  displayField.innerHTML='<span>표시 내용</span><div class="order-options"><button type="button" data-mark-display="shapes" aria-pressed="true">도형</button><button type="button" data-mark-display="count" aria-pressed="false">도형+숫자</button></div>';
  function syncDisplayMode(){for(const button of displayField.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.markDisplay===state.markDisplay));}
  for(const button of displayField.querySelectorAll('button'))button.onclick=()=>{state.markDisplay=button.dataset.markDisplay;syncDisplayMode();update();};
  window.addEventListener('editorreset',syncDisplayMode);
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
  const linkTarget=document.createElement('select');linkTarget.className='mark-link-target';linkTarget.setAttribute('aria-label','연결할 글자');
  let linkOptionsSignature='';
  function syncLinkTargets(){const current=state.markTextTarget||'primary',items=[['primary',text.value||'기본 글자'],...extraTexts.map(item=>[String(item.id),item.text||'빈 글자'])],signature=JSON.stringify([items,current,linked.checked]);if(signature===linkOptionsSignature)return;linkOptionsSignature=signature;linkTarget.replaceChildren();for(const [id,label] of items){const option=document.createElement('option');option.value=id;option.textContent=label;linkTarget.append(option);}linkTarget.value=current;linkTarget.disabled=!linked.checked;linkPickerUI.sync();}
  linkTarget.onchange=()=>{state.markTextTarget=linkTarget.value;linked.dispatchEvent(new Event('change'));setEditorSelection('marks',null,{origin:'link',showTools:false});};
  new MutationObserver(syncLinkTargets).observe(stage,{childList:true,subtree:true,characterData:true});linked.addEventListener('change',syncLinkTargets);
  linkOptions.append(linkCaption,linkSwitch);linked.closest('label').after(linkOptions);
  let selectedMarkStyleTab='style';
  const markStyleTabs=document.createElement('div');markStyleTabs.className='mobile-text-tabs text-editor-tabs mark-style-tabs';markStyleTabs.setAttribute('role','tablist');markStyleTabs.setAttribute('aria-label','완등 표시 스타일 항목');
  const markAlignmentPanel=document.createElement('div');markAlignmentPanel.className='mark-alignment-panel';markAlignmentPanel.id='mobile-mark-alignment';markAlignmentPanel.setAttribute('role','tabpanel');
  const markCustom=$('markOutlineCustom');markCustom.setAttribute('role','tabpanel');
  const markLinkPanel=document.createElement('div');markLinkPanel.id='mobile-mark-link';markLinkPanel.className='mark-link-panel';markLinkPanel.setAttribute('role','tabpanel');
  markLinkPanel.innerHTML='<span id="markLinkLabel" class="heart-field-label">연결할 글자</span><div id="markLinkPicker" class="simple-picker"><button type="button" id="markLinkTrigger" class="gym-trigger" aria-labelledby="markLinkLabel markLinkTrigger" aria-haspopup="listbox" aria-expanded="false" aria-controls="markLinkList"></button><div id="markLinkList" class="simple-list" role="listbox" aria-labelledby="markLinkLabel" tabindex="-1" hidden></div></div>';
  linkTarget.hidden=true;markLinkPanel.querySelector('.simple-picker').append(linkTarget);
  for(const [key,name,target] of [['style','스타일',markCustom],['alignment','정렬',markAlignmentPanel],['link','연결',markLinkPanel]]){
    const button=document.createElement('button');button.type='button';button.id='mobile-mark-style-'+key;button.textContent=name;button.setAttribute('role','tab');button.setAttribute('aria-controls',target.id);target.setAttribute('aria-labelledby',button.id);button.onclick=()=>{selectedMarkStyleTab=key;syncMarkLink();};button.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const tabs=Array.from(markStyleTabs.children),index=tabs.indexOf(button),other=tabs[(index+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length];other.click();other.focus();}};markStyleTabs.append(button);
  }
  markCustom.before(markStyleTabs);markCustom.after(markAlignmentPanel,markLinkPanel);
  const linkPickerUI=createSelectPicker('markLink',linkTarget);syncLinkTargets();
  const markAlignControls=document.querySelector('main .align-control').cloneNode(true);markAlignControls.setAttribute('aria-label','완등 표시 정렬');
  for(const button of markAlignControls.querySelectorAll('button')){
    const horizontal=button.dataset.align,vertical=button.dataset.valign;button.removeAttribute('data-align');button.removeAttribute('data-valign');if(horizontal)button.dataset.markAlign=horizontal;else button.dataset.markVAlign=vertical;
    button.onclick=()=>{if(marksLinked())return;if(horizontal){state.markAlignment=horizontal;markPosition.x={left:0,center:50,right:100}[horizontal];}else markPosition.y={top:0,middle:50,bottom:100}[vertical];state.loadVersion++;update();syncMarkAlignment();};
  }
  markAlignmentPanel.append(markAlignControls);
  for(const [key,name,min,max,initial] of [['markColumnGap','자간',-10,30,0],['markRowGap','행간',0,100,16]]){
    const label=document.createElement('label');label.className='image-range';label.innerHTML='<span>'+name+'</span><input type="range" min="'+min+'" max="'+max+'" step="1" value="'+initial+'" aria-label="완등 표시 '+name+'"><output>'+initial+'%</output>';label.querySelector('input').dataset.markSpacing=key;label.querySelector('input').oninput=e=>{if(marksLinked())return;state[key]=Number(e.target.value);e.target.nextElementSibling.value=e.target.value+'%';state.loadVersion++;update();};markAlignmentPanel.append(label);
  }
  function syncMarkAlignment(){
    for(const button of markAlignControls.querySelectorAll('[data-mark-align]'))button.setAttribute('aria-pressed',String(button.dataset.markAlign===(marksLinked()?state.alignment:state.markAlignment)));
    for(const button of markAlignControls.querySelectorAll('[data-mark-v-align]'))button.setAttribute('aria-pressed',String(markPosition.y==={top:0,middle:50,bottom:100}[button.dataset.markVAlign]));
    for(const input of markAlignmentPanel.querySelectorAll('[data-mark-spacing]')){input.value=state[input.dataset.markSpacing]??(input.dataset.markSpacing==='markRowGap'?16:0);input.nextElementSibling.value=input.value+'%';}
  }
  function syncMarkLink(){
    linkSwitch.setAttribute('aria-checked',String(linked.checked));
    const custom=$('markOutlineCustom');custom.hidden=selectedMarkStyleTab!=='style';markAlignmentPanel.hidden=selectedMarkStyleTab!=='alignment';markLinkPanel.hidden=selectedMarkStyleTab!=='link';
    for(const button of markStyleTabs.children){const active=button.id==='mobile-mark-style-'+selectedMarkStyleTab;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;}
    markAlignmentPanel.classList.toggle('is-linked-disabled',linked.checked);markAlignmentPanel.setAttribute('aria-disabled',String(linked.checked));for(const control of markAlignmentPanel.querySelectorAll('input,button'))control.disabled=linked.checked;syncMarkAlignment();custom.classList.toggle('is-linked-disabled',linked.checked);custom.setAttribute('aria-disabled',String(linked.checked));custom.removeAttribute('inert');
    for(const control of custom.querySelectorAll('input,button,select'))control.disabled=linked.checked;
  }
  linked.addEventListener('change',syncMarkLink);window.addEventListener('editorreset',()=>{selectedMarkStyleTab='style';syncMarkLink();});syncMarkLink();
  const moves=[];
  function move(node,parent){const anchor=document.createComment('desktop position');node.before(anchor);moves.push({node,anchor});parent.append(node);}
  const done=document.createElement('button');done.type='button';done.className='mobile-edit-done';done.setAttribute('aria-label','편집 완료');
  done.textContent='완료';
  const panelHeading=shell.querySelector('.mobile-panel-heading');
  let menuDetail=false;
  function makeMenuOverview(panel,label,actions){
    const overview=document.createElement('div');overview.className='menu-overview';
    const strip=document.createElement('div');strip.className='image-tool-strip text-action-strip';strip.setAttribute('role','group');strip.setAttribute('aria-label',label+' 도구');
    for(const [name,icon,run] of actions){const button=toolButton(name,icon);button.onclick=run;strip.append(button);}
    overview.append(strip);panel.prepend(overview);return {overview,buttons:Array.from(strip.children)};
  }
  const overviewPhotoIcon='<rect x="2" y="2" width="18" height="18" rx="3"/><circle cx="7" cy="7" r="1.5"/><path d="m2 16 5-5 4 4 4-6 5 7"/>'+addBadge;
  const overviewCropIcon='<path d="M7 3v14h14M3 7h14v14"/>';
  const overviewAdjustIcon='<path d="M3 6h18M3 12h18M3 18h18"/><circle cx="8" cy="6" r="2" fill="white"/><circle cx="16" cy="12" r="2" fill="white"/><circle cx="9" cy="18" r="2" fill="white"/>';
  const overviewMarkIcon='<path d="M8 3c2-1 8 1 11 3s2 7 0 12-7 3-12 2-5-4-4-8 3-8 5-9Z"/><circle cx="12" cy="11" r="2"/>';
  let backgroundBusy=false;
  const imageMenu=makeMenuOverview(panels[2],'이미지',[
    ['이미지 추가',overviewPhotoIcon,()=>$('photoInput').click()],
    ['구도',overviewCropIcon,()=>openMenuDetail(2,0,'구도')],
    ['보정',overviewAdjustIcon,()=>openMenuDetail(2,1,'보정')],
    ['배경 제거','<path d="M3 17V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v11" stroke-dasharray="2 2"/><path d="M3 17v1a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-1"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/>',async()=>{
      if(backgroundBusy)return;backgroundBusy=true;showStatus('');syncMenuActions();
      try{await removePhotoBackground();}catch(error){showStatus(error.message==='no-person'?'인물을 찾지 못했어요. 사람이 더 크게 나온 사진으로 시도해 주세요.':'배경 제거를 준비하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.');}
      finally{backgroundBusy=false;syncMenuActions();}
    }],
    ['삭제',actionIcons.remove,()=>{if(!deletePhotoOverlay())$('removePhoto').click();syncMenuActions();}]
  ]);
  const menuHeart=markSVG('🤍');
  const menuHeartIcon='<svg x="0" y="0" width="24" height="24" viewBox="'+menuHeart.getAttribute('viewBox')+'"><path d="'+menuHeart.querySelector('path').getAttribute('d')+'" transform="'+(menuHeart.querySelector('path').getAttribute('transform')||'')+'" fill="none" stroke="currentColor" stroke-width="14"/></svg>';
  const marksMenu=makeMenuOverview(panels[1],'완등 표시',[
    ['완등 수',overviewMarkIcon+addBadge,()=>openMenuDetail(1,'add','완등 수')],
    ['모양',menuHeartIcon,()=>openMenuDetail(1,'shape','모양')],
    ['표시 방식','<circle cx="6" cy="6" r="3"/><path d="m3 19 3-6 3 6ZM13 4h8M13 8h5M13 16a1.5 1.5 0 0 1 3 0c0 1-3 2-3 4h3M19 15v5"/>',()=>openMenuDetail(1,'display','표시 방식')],
    ['스타일',actionIcons.style,()=>openMenuDetail(1,'style','완등 표시 스타일')]
  ]);
  function syncMenuActions(){
    imageMenu.buttons[0].querySelector('span').textContent='이미지 추가';
    imageMenu.buttons[1].disabled=!state.photoURL&&!selectedPhotoOverlay;imageMenu.buttons[2].disabled=!state.photoURL;imageMenu.buttons[4].disabled=backgroundBusy||(!state.photoURL&&!selectedPhotoOverlay);
    const layer=photoOverlays.find(item=>item.id===selectedPhotoOverlay),removeButton=imageMenu.buttons[3];removeButton.disabled=backgroundBusy||(!state.photoURL&&!layer);removeButton.setAttribute('aria-busy',String(backgroundBusy));removeButton.querySelector('span').textContent=backgroundBusy?'처리 중…':layer?.originalImage||layer?.cutoutFromBackground||(!layer&&backgroundOriginal)?'원본 복원':'배경 제거';
    const selectedTextObject=editorSelection.kind==='text'||editorSelection.kind==='marks';
    if(selectedPhotoOverlay)imageMenu.buttons[2].disabled=true;
    if(selectedTextObject)for(const i of [1,2,3,4])imageMenu.buttons[i].disabled=true;
    if(backgroundBusy){imageMenu.buttons[0].disabled=true;imageMenu.buttons[1].disabled=true;imageMenu.buttons[2].disabled=true;}else imageMenu.buttons[0].disabled=false;
  }
  window.addEventListener('photooverlaychange',syncMenuActions);
  window.addEventListener('editorselectionchange',e=>{
    const {kind,id,origin}=e.detail;
    selectedText=kind==='text'?id:null;
    if(origin==='canvas'||origin==='create'){
      const next=kind==='text'?0:kind==='marks'?1:2;
      if(selected!==next||tools.hidden)selectTab(next,true);
      else if(next===0)showTextOverview();
      else if(next===2){if(menuDetail&&selectedImageGroup===0)openMenuDetail(2,0,'구도');else showMenuOverview(2);}
      else showMenuOverview(1);
    }
    syncTextSelection();syncMenuActions();
  });
  stage.addEventListener('pointerdown',syncMenuActions,true);
  stage.addEventListener('pointerdown',e=>{if(!e.target.closest('.photo-overlay,.extra-text-layer,#textLayer,#markLayer,.object-touch-tools,[data-editor-history]')&&selected===2)selectPhotoOverlay(null);});
  new MutationObserver(syncMenuActions).observe($('photoDetails'),{attributes:true,attributeFilter:['hidden']});
  function markSections(){const controls=panels[1].querySelector('.success-controls');return {controls,add:controls.querySelector('.heart-palette'),display:displayField,shape:controls.querySelector('.shape-field'),order:controls.querySelector('.success-order:not(.mark-display-control)'),style:controls.querySelector('.heart-field')};}
  function showMenuOverview(index){
    menuDetail=false;textDetail=false;shell.classList.add('menu-overview-open');shell.classList.remove('tools-expanded');tools.hidden=false;bar.hidden=false;panelHeading.hidden=true;done.hidden=true;
    imageMenu.overview.hidden=index!==2;marksMenu.overview.hidden=index!==1;
    imageReset.hidden=true;
    if(index===2){overlayGeometry.hidden=true;imageDetailActions.hidden=true;imageTabs.hidden=true;panels[2].querySelector('.photo-tools').hidden=true;imageGroups.forEach(group=>group.hidden=true);syncMenuActions();}
    else markSections().controls.hidden=true;
    tools.scrollTop=0;syncTextSelection();fitMobilePreview();
  }
  const overlayGeometry=document.createElement('div');overlayGeometry.className='text-object-fields';overlayGeometry.hidden=true;panels[2].append(overlayGeometry);
  const imageDetailActions=document.createElement('div');imageDetailActions.className='image-detail-actions';imageDetailActions.hidden=true;panels[2].append(imageDetailActions);
  window.addEventListener('photooverlaysize',()=>{const range=overlayGeometry.querySelector('input'),item=photoOverlays.find(item=>item.id===selectedPhotoOverlay);if(range&&item){range.value=item.width;range.nextElementSibling.value=Math.round(item.width)+'%';const angle=overlayGeometry.querySelector('input[aria-label="추가 이미지 각도"]');if(angle){angle.value=item.rotation||0;angle.nextElementSibling.value=Number(angle.value).toFixed(1)+'°';}}});
  function openMenuDetail(index,kind,title){
    menuDetail=true;shell.classList.remove('menu-overview-open');bar.hidden=true;done.hidden=false;
    if(index===2){
      imageMenu.overview.hidden=true;imageTabs.hidden=true;panelHeading.hidden=false;panelHeading.append(done);panels[2].querySelector('.photo-tools').hidden=true;selectImageGroup(kind);syncImage();
      const item=photoOverlays.find(item=>item.id===selectedPhotoOverlay);
      if(kind===0&&item){
        $('mobile-panel-title').textContent='구도';imageGroups.forEach(group=>group.hidden=true);overlayGeometry.hidden=false;imageReset.hidden=true;imageDetailActions.hidden=true;overlayGeometry.replaceChildren();
        const range=document.createElement('label');range.className='image-range';range.innerHTML='<span>확대</span><input type="range" min="5" max="95" step="1" aria-label="추가 이미지 크기"><output></output>';const input=range.querySelector('input'),out=range.querySelector('output');input.value=item.width;out.value=Math.round(item.width)+'%';input.oninput=()=>{item.width=Number(input.value);out.value=input.value+'%';state.loadVersion++;renderPhotoOverlays();};overlayGeometry.append(range);
        const rotation=document.createElement('label');rotation.className='image-range';rotation.innerHTML='<span>각도</span><input type="range" min="-180" max="180" step="0.1" aria-label="추가 이미지 각도"><output></output>';const angle=rotation.querySelector('input'),angleOut=rotation.querySelector('output');angle.value=item.rotation||0;angleOut.value=Number(angle.value).toFixed(1)+'°';angle.oninput=()=>{item.rotation=Number(angle.value);angleOut.value=Number(angle.value).toFixed(1)+'°';state.loadVersion++;renderPhotoOverlays();};
        const strip=imageActions.cloneNode(true);strip.className='image-tool-strip';const buttons=strip.querySelectorAll('button');
        buttons[0].onclick=()=>{item.rotation=normalizeOverlayAngle((item.rotation||0)+90);angle.value=item.rotation;angleOut.value=item.rotation.toFixed(1)+'°';state.loadVersion++;renderPhotoOverlays();};
        buttons[1].onclick=()=>{item.flip=!item.flip;state.loadVersion++;renderPhotoOverlays();};
        for(const b of strip.querySelectorAll('[data-image-ratio]')){b.setAttribute('aria-pressed',String((item.ratioMode||'original')===b.dataset.imageRatio));b.onclick=()=>{item.ratioMode=b.dataset.imageRatio;item.cropRatio=item.ratioMode.includes(':')?item.ratioMode:null;state.loadVersion++;renderPhotoOverlays();for(const other of strip.querySelectorAll('[data-image-ratio]'))other.setAttribute('aria-pressed',String(other===b));};}
        overlayGeometry.prepend(strip);overlayGeometry.append(rotation);

      }else{
        selectPhotoOverlay(null);overlayGeometry.hidden=true;$('mobile-panel-title').textContent=title;imageDetailActions.hidden=true;canvas.append(imageReset);syncImage();
      }
    }
    else{
      marksMenu.overview.hidden=true;panelHeading.hidden=false;$('mobile-panel-title').textContent=title;panelHeading.append(done);
      const sections=markSections();sections.controls.hidden=false;sections.controls.classList.add('mark-detail-controls');
      for(const key of ['add','display','shape','order','style'])sections[key].hidden=kind==='display'?!['display','order'].includes(key):key!==kind;if(kind==='style')syncMarkLink();
    }
    tools.scrollTop=0;fitMobilePreview();
  }
  const templateStorageKey='wonine.templates.v1';let personalTemplates=[],activeTemplate=null,templateRequest=0,templateDetail=false,templateCategory='all';
  const templateInputKeys=['size','fillColor','strokeColor','letterSpace','lineSpace','outlineWidth','shadowColor','shadowWidth','shadowOpacity','shadowDistance','shadowAngle','markSize','markStrokeColor','markOutlineWidth'];
  function captureTemplate(){return {caption:text.value,font:state.fontFamily,markTextTarget:state.markTextTarget,textRotation:state.textRotation,textFlip:state.textFlip,markRotation:state.markRotation,markFlip:state.markFlip,x:state.x,y:state.y,alignment:state.alignment,markAlignment:state.markAlignment,markColumnGap:state.markColumnGap,markRowGap:state.markRowGap,writingMode:state.writingMode,verticalAlign:state.verticalAlign,shape:state.shape,markDisplay:state.markDisplay,problemOrder:state.problemOrder,linked:marksLinked(),markPosition:{...markPosition},inputs:Object.fromEntries(templateInputKeys.map(id=>[id,$(id).value])),checks:Object.fromEntries(['outline','shadow','markOutlineEnabled'].map(id=>[id,$(id).checked])),extras:extraTexts.map(item=>({...item,fontRequest:undefined}))};}
  const defaultTemplate={caption:'오늘도 완등!',font:'Wave',x:50,y:50,alignment:'center',writingMode:'horizontal',verticalAlign:'top',shape:'hold',markDisplay:'shapes',problemOrder:'color',linked:true,markPosition:{x:50,y:65},inputs:{size:'112',fillColor:'#ffffff',strokeColor:'#111111',letterSpace:'0',lineSpace:'16',outlineWidth:'1',shadowWidth:'0',shadowColor:'#111111',shadowOpacity:'50',shadowDistance:'3',shadowAngle:'0',markSize:'84',markStrokeColor:'#111111',markOutlineWidth:'1'},checks:{outline:true,shadow:false,markOutlineEnabled:true},extras:[]};
  const builtInTemplates=[
    {id:'basic',name:'기본',snapshot:defaultTemplate},
    {id:'bottom',name:'하단 기록',snapshot:{...defaultTemplate,y:82,inputs:{...defaultTemplate.inputs,size:'92'},shape:'hold'}},
    {id:'count',name:'숫자 기록',snapshot:{...defaultTemplate,y:76,shape:'hold',markDisplay:'count',inputs:{...defaultTemplate.inputs,size:'96'}}}
  ];
  try{const saved=JSON.parse(localStorage.getItem(templateStorageKey)||'[]');if(Array.isArray(saved))personalTemplates=saved.filter(item=>item&&typeof item.id==='string'&&typeof item.name==='string'&&item.snapshot&&typeof item.snapshot.inputs==='object').slice(0,30);}catch{}
  const templateHeader=document.createElement('div');templateHeader.className='template-header';
  const templateName=document.createElement('input');templateName.type='text';templateName.maxLength=24;templateName.placeholder='내 템플릿 이름';templateName.setAttribute('aria-label','저장할 템플릿 이름');
  const saveTemplate=document.createElement('button');saveTemplate.type='button';saveTemplate.textContent='현재 템플릿 저장';templateHeader.append(templateName,saveTemplate);
  const templateList=document.createElement('div');templateList.className='template-list';templateList.setAttribute('role','group');templateList.setAttribute('aria-label','썸네일 템플릿');panels[3].append(templateHeader,templateList);
  const templateFilters=document.createElement('div');templateFilters.className='mobile-text-tabs text-editor-tabs template-filters';templateFilters.setAttribute('role','tablist');templateFilters.setAttribute('aria-label','템플릿 분류');
  for(const [category,label] of [['all','전체'],['basic','기본 템플릿'],['mine','내 템플릿']]){const button=document.createElement('button');button.type='button';button.dataset.category=category;button.textContent=label;button.setAttribute('role','tab');button.onclick=()=>{templateCategory=category;renderTemplates();};templateFilters.append(button);}
  templateList.before(templateFilters);
  function storeTemplates(next){try{localStorage.setItem(templateStorageKey,JSON.stringify(next));personalTemplates=next;return true;}catch{showStatus('템플릿을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.');return false;}}
  function renderTemplates(){
    templateList.replaceChildren();
    for(const button of templateFilters.children)button.setAttribute('aria-selected',String(button.dataset.category===templateCategory));
    const items=templateCategory==='mine'?personalTemplates:templateCategory==='basic'?builtInTemplates:[...builtInTemplates,...personalTemplates];
    if(!items.length){const empty=document.createElement('p');empty.className='template-empty';empty.textContent='아직 저장한 템플릿이 없어요.';templateList.append(empty);}
    for(const item of items){
      const wrapper=document.createElement('div');wrapper.className='template-card';const button=document.createElement('button');button.type='button';button.className='template-choice';button.setAttribute('aria-pressed',String(item.id===activeTemplate));button.setAttribute('aria-label',item.name+' 템플릿 적용');
      const mini=document.createElement('span');mini.className='template-mini';mini.setAttribute('aria-hidden','true');const caption=document.createElement('span');caption.className='template-mini-caption';caption.textContent='오늘도 완등!';caption.style.top=Math.min(72,Math.max(12,item.snapshot.y||50))+'%';caption.style.fontFamily=item.snapshot.font||'Wave';
      const marks=document.createElement('span');marks.className='template-mini-marks';marks.textContent=item.snapshot.markDisplay==='count'?'● 3  ● 2':'● ● ● ●';caption.append(marks);mini.append(caption);
      const name=document.createElement('span');name.className='template-name';name.textContent=item.name;button.append(mini,name);button.onclick=()=>applyTemplate(item);wrapper.append(button);
      if(!builtInTemplates.includes(item)){const remove=document.createElement('button');remove.type='button';remove.className='template-delete';remove.textContent='×';remove.setAttribute('aria-label',item.name+' 템플릿 삭제');remove.onclick=()=>{if(storeTemplates(personalTemplates.filter(t=>t.id!==item.id))){if(activeTemplate===item.id)activeTemplate=null;renderTemplates();}};wrapper.append(remove);}
      templateList.append(wrapper);
    }
  }
  saveTemplate.onclick=()=>{const name=templateName.value.trim()||'내 템플릿 '+(personalTemplates.length+1);const item={id:crypto.randomUUID(),name,snapshot:captureTemplate()};if(storeTemplates([...personalTemplates,item])){activeTemplate=item.id;templateName.value='';showTemplateDetail('mine');showStatus('');}};
  async function applyTemplate(item){
    const request=++templateRequest,version=state.loadVersion,snapshot=item.snapshot;const allowedFonts=Array.from(fontSelect.options).map(option=>option.value),font=allowedFonts.includes(snapshot.font)?snapshot.font:'Wave';
    try{
      await document.fonts.load('400 112px "'+font+'"','한글0123456789');
      if(request!==templateRequest||version!==state.loadVersion)return;
      for(const id of templateInputKeys)if(snapshot.inputs[id]!==undefined)$(id).value=String(snapshot.inputs[id]);
      for(const id of ['outline','shadow','markOutlineEnabled'])if(typeof snapshot.checks?.[id]==='boolean')$(id).checked=snapshot.checks[id];
      if(!text.value.trim())text.value=typeof snapshot.caption==='string'&&snapshot.caption.trim()?snapshot.caption:'오늘도 완등!';
      state.fontVersion++;state.fontLoading=false;$('saveResult').disabled=exporting;fontStatus('');state.fontFamily=font;fontSelect.value=font;syncFontPicker();
      state.alignment=['left','center','right'].includes(snapshot.alignment)?snapshot.alignment:'center';state.markAlignment=['left','center','right'].includes(snapshot.markAlignment)?snapshot.markAlignment:'left';state.markColumnGap=clamp(Number(snapshot.markColumnGap)||0,-10,30);state.markRowGap=clamp(Number(snapshot.markRowGap??16),0,100);state.writingMode=snapshot.writingMode==='vertical'?'vertical':'horizontal';state.verticalAlign=snapshot.verticalAlign||'top';
      state.shape=markShapes[snapshot.shape]?snapshot.shape:'hold';shapeSelect.value=state.shape;shapeSelect.dispatchEvent(new Event('change'));shapePickerUI.sync();syncShapeOptions();
      state.markDisplay=snapshot.markDisplay==='count'?'count':'shapes';syncDisplayMode();state.problemOrder=snapshot.problemOrder==='added'?'added':'color';
      $('markOutlineLinked').checked=snapshot.linked!==false;$('markOutlineLinked').dispatchEvent(new Event('change'));syncMarkLink();if(snapshot.markPosition)markPosition={x:clamp(Number(snapshot.markPosition.x)||50,0,100),y:clamp(Number(snapshot.markPosition.y)||65,0,100)};
      if(Array.isArray(snapshot.extras))snapshot.extras.forEach((saved,index)=>{const old=extraTexts[index];const data={...saved,id:old?.id||++extraTextSerial,text:old?.text??saved.text??'',font:allowedFonts.includes(saved.font)?saved.font:font,size:clamp(Number(saved.size)||112,30,500),color:/^#[0-9a-f]{6}$/i.test(saved.color)?saved.color:'#ffffff',x:clamp(Number(saved.x)||50,0,100),y:clamp(Number(saved.y)||65,0,100)};if(old)Object.assign(old,data);else extraTexts.push(data);});
      state.captionPresent=true;state.x=clamp(Number(snapshot.x)||50,0,100);state.y=clamp(Number(snapshot.y)||50,0,100);state.loadVersion++;activeTemplate=item.id;update();renderExtraTexts();renderTemplates();showStatus('');
    }catch{showStatus('템플릿을 적용하지 못했어요. 다시 시도해 주세요.');}
  }
  window.addEventListener('editorreset',()=>{templateRequest++;activeTemplate=null;});
  const templateMenu=makeMenuOverview(panels[3],'템플릿',[
    ['전체 템플릿','<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="14" y="3" width="7" height="8" rx="1"/><rect x="3" y="14" width="8" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',()=>showTemplateDetail('all')],
    ['템플릿 저장','<path d="M4 3h13l4 4v14H3V3ZM7 3v6h10V3M7 21v-8h10v8"/>',()=>showTemplateDetail('save')]
  ]);
  function showTemplateDetail(kind){
    templateDetail=true;menuDetail=false;shell.classList.remove('menu-overview-open','template-browser-open');bar.hidden=true;panelHeading.hidden=false;panelHeading.append(done);done.hidden=false;templateMenu.overview.hidden=true;
    $('mobile-panel-title').textContent=kind==='save'?'템플릿 저장':'전체 템플릿';templateHeader.hidden=kind!=='save';templateList.hidden=kind==='save';templateFilters.hidden=kind==='save';
    if(kind!=='save'){templateCategory=kind;renderTemplates();}else templateName.focus({preventScroll:true});
    tools.scrollTop=0;fitMobilePreview();
  }
  function showTemplates(){
    templateDetail=false;menuDetail=false;textDetail=false;shell.classList.remove('template-browser-open','tools-expanded');shell.classList.add('menu-overview-open');panelHeading.hidden=true;done.hidden=true;bar.hidden=false;imageReset.hidden=true;templateHeader.hidden=true;templateList.hidden=true;templateFilters.hidden=true;templateMenu.overview.hidden=false;tools.scrollTop=0;syncTextSelection();fitMobilePreview();
  }
  function closeTool(restoreFocus=true){
    setEditorSelection(editorSelection.kind,editorSelection.id,{origin:'menu',showTools:false});imageReset.hidden=true;tools.hidden=true;bar.hidden=false;shell.classList.remove('editing-tool','tools-expanded','menu-overview-open','template-browser-open');preview.classList.remove('selected-text-object');for(const node of extraTextNodes.values())node.classList.remove('selected-text-object');
    cancelAnimationFrame(mobileWorkspace.panelAnimation);mobileWorkspace.panelInset=0;
    tabs.forEach(tab=>tab.setAttribute('aria-expanded','false'));
    fitMobilePreview();if(restoreFocus)tabs[selected].focus();
  }
  done.addEventListener('click',()=>{setEditorSelection(editorSelection.kind,editorSelection.id,{origin:'menu',showTools:false});if(selected===0&&textDetail)showTextOverview();else if(selected===3&&templateDetail)showTemplates();else if(selected!==0&&menuDetail)showMenuOverview(selected);else closeTool();});
  function selectTab(index,preserveSelection=false){
    if(!preserveSelection){
      if(index===0){const id=editorSelection.kind==='text'?editorSelection.id:text.value.trim()?'primary':extraTexts[0]?.id;setEditorSelection(id===undefined?'none':'text',id??null,{origin:'menu',showTools:false});}
      else if(index===2)setEditorSelection(editorSelection.kind==='image'?'image':'background',editorSelection.kind==='image'?editorSelection.id:null,{origin:'menu',showTools:false});
      else setEditorSelection(index===1?'marks':'none',null,{origin:'menu',showTools:false});
    }
    imageReset.hidden=true;
    selected=index;shell.classList.remove('menu-overview-open','template-browser-open');shell.classList.add('editing-tool');bar.hidden=true;done.hidden=false;
    panelHeading.hidden=index===0||index===2;
    (index===0?textTabs:index===2?imageTabs:panelHeading).append(done);syncImage();
    panels.forEach((panel,i)=>{panel.hidden=i!==index;});
    $('mobile-panel-title').textContent=['텍스트','완등 표시','이미지','템플릿'][index];
    tools.hidden=false;tools.scrollTop=0;
    tabs.forEach((tab,i)=>tab.setAttribute('aria-expanded',String(i===selected)));
    if(index===0)showTextOverview();else if(index===3)showTemplates();else showMenuOverview(index);
  }
  window.addEventListener('editorreset',()=>{if(mobileWorkspace.active){closeTool();}});
  window.addEventListener('editorhistoryrestore',()=>{syncImage();syncMarkLink();syncLinkTargets();syncDisplayMode();syncTextSelection();closeTool(false);});
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
      move(document.querySelector('main label[for=fillColor]'),textGroups[5]);
      move(document.querySelector('main label[for=size]'),textGroups[5]);
      move(document.querySelector('main .align-control'),textGroups[2]);
      for(const id of ['letterSpace','lineSpace'])move(document.querySelector('main label[for='+id+']'),textGroups[2]);
      for(const id of ['outline','strokeColor','outlineWidth'])move(document.querySelector('main label[for='+id+']'),textGroups[3]);
      for(const id of ['shadow','shadowColor','shadowWidth','shadowOpacity','shadowDistance','shadowAngle'])move(document.querySelector('main label[for='+id+']'),textGroups[4]);
      move(document.querySelector('main .success-controls'),panels[1]);
      const marksControls=panels[1].querySelector('.success-controls');
      const palette=marksControls.querySelector('.heart-palette'),marksHeading=marksControls.querySelector('.heart-heading-row');
      move(marksHeading,marksControls);move(palette,marksControls);
      marksControls.prepend(marksHeading,displayField,palette);
      move($('breakHearts'),palette);move($('removeHeart'),palette);
      move(document.querySelector('main .photo-tools'),panels[2]);panels[2].append(...imageGroups);canvas.append(imageReset);syncImage();
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
