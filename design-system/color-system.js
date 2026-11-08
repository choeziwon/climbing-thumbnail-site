// The catalog reads the same atomic and semantic stylesheets as the service.
(() => {
  const tabs=[...document.querySelectorAll('[data-ds-tab]')];
  function selectTab(name,updateHash=true){
    const active=tabs.find(tab=>tab.dataset.dsTab===name)||tabs[0];
    for(const tab of tabs){
      const selected=tab===active;
      tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden=!selected;
    }
    if(updateHash)history.replaceState(null,'','#'+active.dataset.dsTab);
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>selectTab(tab.dataset.dsTab));
    tab.addEventListener('keydown',event=>{
      let next=index;
      if(event.key==='ArrowRight')next=(index+1)%tabs.length;
      else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=tabs.length-1;
      else return;
      event.preventDefault();selectTab(tabs[next].dataset.dsTab);tabs[next].focus();
    });
  });
  window.addEventListener('hashchange',()=>selectTab(location.hash.slice(1),false));
  selectTab(location.hash.slice(1),false);

  const rootStyle=getComputedStyle(document.documentElement);
  const catalog=document.getElementById('color-catalog');
  function group(title,description,entries){
    const section=document.createElement('section'),heading=document.createElement('h2'),intro=document.createElement('p'),swatches=document.createElement('div');
    heading.textContent=title;intro.className='source';intro.textContent=description;swatches.className='color-swatches';
    for(const [label,token,note=''] of entries){
      const value=rootStyle.getPropertyValue(token).trim();
      if(!value)throw new Error('컬러 토큰 누락: '+token);
      const item=document.createElement('div'),swatch=document.createElement('div'),fill=document.createElement('span'),name=document.createElement('strong'),code=document.createElement('code'),output=document.createElement('span');
      item.className='color-token';swatch.className='swatch';fill.style.background='var('+token+')';swatch.append(fill);
      name.textContent=label;code.textContent=token;output.className='color-value';output.textContent=value;
      item.append(swatch,name,output,code);
      if(note){const origin=document.createElement('span');origin.className='color-origin';origin.textContent=note;item.append(origin);}
      swatches.append(item);
    }
    section.append(heading,intro,swatches);catalog.append(section);
  }
  group('기본 색상 · Common & Brand','브랜드는 기존 블랙을 유지합니다. 단계 숫자가 높을수록 밝아집니다.',[
    ['Black','--atomic-common-0'],['White','--atomic-common-100'],['완등 한 컷 Black','--atomic-brand-10','기존 브랜드 색상 유지']
  ]);
  const adjusted=new Set([10,20,50,60,70,80,97,98,99]);
  group('회색 단계 · Neutral','Montage Cool Neutral의 단계 체계를 바탕으로 푸른 기와 밝기를 일부 조정했습니다.',
    [5,7,10,15,17,20,22,23,25,30,40,50,60,70,80,90,95,96,97,98,99].map(level=>['Neutral '+level,'--atomic-neutral-'+level,adjusted.has(level)?'완등 한 컷 조정':'Montage 기반']));
  group('상태 색상 · Red','삭제·오류를 알리는 경우에 사용합니다. 회원권의 남은 기간은 기존 회색을 유지합니다.',
    [10,20,30,40,50,60,70,80,90,95,99].map(level=>['Red '+level,'--atomic-red-'+level,[30,40,50].includes(level)?'완등 한 컷 조정':'Montage 기반']));
  group('용도별 색상 · Background','화면·카드·컨트롤·선택 영역에 적용되는 실제 서비스 토큰입니다.',[
    ['화면 / 카드','--frame-background'],['정보 배경 / 컨트롤','--frame-soft-background'],['옅은 표면','--frame-subtle-background'],['호버','--frame-hover-background'],['선택 배경','--frame-selected-background']
  ]);
  group('용도별 색상 · Text & Line','글자의 위계와 구분선 역할을 색상 이름 대신 의미로 지정합니다.',[
    ['기본 글자','--frame-text'],['보조 글자','--frame-secondary-text'],['안내 글자','--frame-muted'],['비활성 메뉴','--frame-nav-muted'],['Placeholder','--frame-placeholder'],['입력 테두리','--frame-control-border'],['버튼 테두리','--frame-button-border'],['옅은 구분선','--frame-nav-border']
  ]);
  group('용도별 색상 · Action & Status','주요 행동은 블랙으로, 삭제와 오류는 필요한 위치에서만 빨간색으로 표시합니다.',[
    ['주요 버튼','--frame-primary'],['주요 버튼 호버','--frame-primary-hover'],['행동 텍스트','--frame-action-text'],['오류','--frame-danger'],['삭제','--frame-destructive']
  ]);
  group('반투명 표면 · Floating Menu','기존 하단 메뉴의 유리 표면입니다. 체크 배경으로 투명도를 확인할 수 있습니다.',[
    ['메뉴 표면 · 78%','--frame-menu-surface'],['메뉴 테두리 · 85%','--frame-menu-border'],['선택 표면 · 64%','--frame-menu-selection-surface']
  ]);
})();
