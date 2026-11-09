// The catalog reads the same atomic and semantic stylesheets as the service.
(() => {
  const menuLinks=[...document.querySelectorAll('[data-ds-page]')];
  function selectPage(name){
    name=name==='colors'?'foundations':name;
    const active=menuLinks.find(link=>link.dataset.dsPage===name)||menuLinks[0];
    for(const link of menuLinks){
      const selected=link===active;
      if(selected)link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
      document.getElementById(link.getAttribute('aria-controls')).hidden=!selected;
    }
    window.dispatchEvent(new Event('ds-colors-ready'));
  }
  // Native hash links keep every menu item keyboard-accessible and support Back/Forward.
  window.addEventListener('hashchange',()=>{selectPage(location.hash.slice(1));window.scrollTo({top:0,behavior:'instant'});});
  selectPage(location.hash.slice(1));

  const rootStyle=getComputedStyle(document.documentElement);
  const catalog=document.getElementById('color-catalog'),switcher=document.createElement('div'),colorPanels=new Map();
  switcher.className='ds-color-tabs';switcher.role='tablist';switcher.setAttribute('aria-label','Color system');catalog.append(switcher);
  function selectColors(name,focus=false){
    for(const tab of switcher.children){const active=tab.textContent===name;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;colorPanels.get(tab.textContent).hidden=!active;if(active&&focus)tab.focus();}
    window.dispatchEvent(new Event('ds-colors-ready'));
  }
  for(const name of ['Semantic','Atomic']){
    const tab=document.createElement('button'),panel=document.createElement('div');tab.type='button';tab.role='tab';tab.id='color-tab-'+name.toLowerCase();tab.textContent=name;tab.setAttribute('aria-controls','color-panel-'+name.toLowerCase());
    panel.id=tab.getAttribute('aria-controls');panel.role='tabpanel';panel.setAttribute('aria-labelledby',tab.id);panel.className='color-sections';colorPanels.set(name,panel);switcher.append(tab);catalog.append(panel);
    tab.onclick=()=>selectColors(name);
    tab.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();selectColors(event.key==='Home'?'Semantic':event.key==='End'?'Atomic':name==='Semantic'?'Atomic':'Semantic',true);};
  }
  function group(title,entries,opacity=false){
    const section=document.createElement('section'),heading=document.createElement('h2'),swatches=document.createElement('div');
    heading.textContent=title;swatches.className='color-swatches';swatches.style.setProperty('--swatch-count',entries.length);section.dataset.colorSection=title;section.id='color-'+(entries[0][1].startsWith('--atomic-')?'atomic':'semantic')+'-'+title.toLowerCase().replace(/[^a-z0-9]+/g,'-');
    for(const [label,token] of entries){
      const value=rootStyle.getPropertyValue(token).trim();
      if(!value)throw new Error('컬러 토큰 누락: '+token);
      const item=document.createElement('div'),swatch=document.createElement('div'),fill=document.createElement('span'),name=document.createElement('strong'),output=document.createElement('span');
      item.className='color-token';swatch.className='swatch';
      fill.style.background=opacity?'rgb(17 17 17 / '+Math.round(Number(value)*100)+'%)':'var('+token+')';swatch.append(fill);
      name.textContent=token.startsWith('--atomic-')&&/ \d+$/.test(label)?label.match(/\d+$/)[0]:label;output.className='color-value';output.textContent=opacity?Math.round(Number(value)*100)+'%':value;
      item.append(swatch,name,output);swatches.append(item);
    }
    section.append(heading,swatches);colorPanels.get(entries[0][1].startsWith('--atomic-')?'Atomic':'Semantic').append(section);
  }
  group('Common & Brand',[
    ['Black','--atomic-common-0'],['White','--atomic-common-100'],['완등 한 컷 Black','--atomic-brand-10']
  ]);
  group('Neutral',[5, 10, 15, 20, 22, 30, 40, 50, 60, 70, 80, 90, 95, 99].map(level=>['Neutral '+level,'--atomic-neutral-'+level]));
  group('Cool Neutral',[5, 7, 10, 15, 17, 20, 22, 23, 25, 30, 40, 50, 60, 70, 80, 90, 95, 96, 97, 98, 99].map(level=>['Cool Neutral '+level,'--atomic-cool-neutral-'+level]));
  group('Blue',[10, 20, 30, 40, 45, 50, 55, 60, 65, 70, 80, 90, 95, 99].map(level=>['Blue '+level,'--atomic-blue-'+level]));
  group('Red',[10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99].map(level=>['Red '+level,'--atomic-red-'+level]));
  group('Green',[10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99].map(level=>['Green '+level,'--atomic-green-'+level]));
  group('Orange',[10, 20, 30, 39, 40, 50, 60, 70, 80, 90, 95, 99].map(level=>['Orange '+level,'--atomic-orange-'+level]));
  group('Red Orange',[10, 20, 30, 40, 48, 50, 60, 70, 80, 90, 95, 99].map(level=>['Red Orange '+level,'--atomic-red-orange-'+level]));
  group('Lime',[10, 20, 30, 37, 40, 50, 60, 70, 80, 90, 95, 99].map(level=>['Lime '+level,'--atomic-lime-'+level]));
  group('Cyan',[10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99].map(level=>['Cyan '+level,'--atomic-cyan-'+level]));
  group('Light Blue',[10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99].map(level=>['Light Blue '+level,'--atomic-light-blue-'+level]));
  group('Violet',[10, 20, 30, 40, 45, 50, 60, 70, 80, 90, 95, 99].map(level=>['Violet '+level,'--atomic-violet-'+level]));
  group('Purple',[10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99].map(level=>['Purple '+level,'--atomic-purple-'+level]));
  group('Pink',[10, 20, 30, 40, 46, 50, 60, 70, 80, 90, 95, 99].map(level=>['Pink '+level,'--atomic-pink-'+level]));
  group('Opacity',[0,5,8,12,16,22,28,35,43,52,61,74,88,97,100].map(level=>['Opacity '+level,'--atomic-opacity-'+level]),true);
  group('Background',[["화면 / 카드", "--frame-background"], ["정보 배경 / 컨트롤", "--frame-soft-background"], ["옅은 표면", "--frame-subtle-background"], ["호버", "--frame-hover-background"], ["선택 배경", "--frame-selected-background"]]);
  group('Text & Line',[["기본 글자", "--frame-text"], ["보조 글자", "--frame-secondary-text"], ["안내 글자", "--frame-muted"], ["비활성 메뉴", "--frame-nav-muted"], ["Placeholder", "--frame-placeholder"], ["입력 테두리", "--frame-control-border"], ["버튼 테두리", "--frame-button-border"], ["옅은 구분선", "--frame-nav-border"]]);
  group('Action & Status',[["주요 버튼", "--frame-primary"], ["주요 버튼 호버", "--frame-primary-hover"], ["행동 텍스트", "--frame-action-text"], ["오류", "--frame-danger"], ["삭제", "--frame-destructive"]]);
  group('Floating Menu',[["메뉴 표면", "--frame-menu-surface"], ["메뉴 테두리", "--frame-menu-border"], ["선택 표면", "--frame-menu-selection-surface"]]);
  selectColors('Semantic');
})();
