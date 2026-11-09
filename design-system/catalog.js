const componentGroups={
 Input:['텍스트 입력','단위 입력','날짜 입력','메모 입력','셀렉트박스','암장 검색'],
 Slider:['크기 슬라이더','각도 슬라이더'],
 Stepper:['색상별 개수 조절'],
 'Color Picker':['색상 선택'],
 'Image Upload':['프로필 사진 편집'],
 Calendar:['날짜 선택 달력'],
 Switch:['방문 상태 스위치','글자 연결 스위치'],
 'Segmented Control':['분할 선택','글자 정렬'],
 Card:['로고 정보 항목','암장 카드','방문 기록 카드','선택한 암장','회원권 요약 카드','프로필 카드','템플릿 카드','폰트 카드','통계 요약','완등 통계'],
 Navigation:['상단 내비게이션 바','캘린더 툴바','하단 플로팅 메뉴'],
 Tabs:['스타일 탭','텍스트 탭'],
 Button:['저장 · 삭제 버튼'],
 Tool:['사진 구도 도구','텍스트 도구','전체 작업 기록'],
 Overlay:['연·월 선택 패널','날짜 내역 바텀 시트'],
 Feedback:['빈 상태']
};
// Documentation shell: top-level menu → sidebar category → page outline.
const catalogLayouts=[];
function refreshCatalogOutline(layout){
 const {host,panels,outline}=layout, panel=panels.get(host.dataset.category);
 if(!panel)return;
 const sections=[...panel.children].filter(node=>node.tagName==='SECTION');
 sections.push(...[...panel.querySelectorAll('[data-color-section]')].filter(node=>!node.closest('[hidden]')));
 outline.replaceChildren();layout.observer?.disconnect();
 const links=new Map();
 for(const [index,section] of sections.entries()){
  if(!section.id)section.id=host.id+'-'+host.dataset.category.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+index;
  const heading=section.querySelector('h2');if(!heading)continue;
  const link=document.createElement('button');link.type='button';link.textContent=heading.textContent;
  link.onclick=()=>{section.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});};
  outline.append(link);links.set(section,link);
 }
 const activate=section=>{for(const [node,link] of links){if(node===section)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}};
 if(sections[0])activate(sections[0]);
 layout.observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)activate(entry.target);},{rootMargin:'-100px 0px -65% 0px',threshold:0});
 sections.forEach(section=>layout.observer.observe(section));
}
function categoryNavigation(host,names,prefix,label,initial=names[0]){
 const tabs=document.createElement('nav'),panels=new Map(),article=document.createElement('div'),title=document.createElement('h1'),toc=document.createElement('aside'),outline=document.createElement('nav');
 tabs.className='ds-sidebar';tabs.setAttribute('aria-label',label);
 article.className='ds-article';title.className='ds-page-title';article.append(title);
 toc.className='ds-toc';toc.innerHTML='<h2>On this page</h2>';outline.setAttribute('aria-label',label+' page outline');toc.append(outline);
 const layout={host,panels,outline};catalogLayouts.push(layout);
 function select(name,focus=false){
  host.dataset.category=name;title.textContent=name==='Color'?'Colors':name;
  for(const tab of tabs.children){const active=tab.dataset.category===name;if(active)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');panels.get(tab.dataset.category).hidden=!active;if(active&&focus)tab.focus();}
  refreshCatalogOutline(layout);
 }
 for(const name of names){
  const key=name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),tab=document.createElement('button'),panel=document.createElement('div');
  tab.type='button';tab.id=prefix+'-tab-'+key;tab.dataset.category=name;tab.textContent=name==='Color'?'Colors':name;tab.setAttribute('aria-controls',prefix+'-group-'+key);
  panel.id=tab.getAttribute('aria-controls');panel.role='region';panel.className='grid';panel.setAttribute('aria-labelledby',tab.id);panels.set(name,panel);tabs.append(tab);article.append(panel);
  tab.onclick=()=>{select(name);window.scrollTo({top:0,behavior:'instant'});};
  tab.onkeydown=event=>{const items=[...tabs.children],index=items.indexOf(tab);let next;if(event.key==='ArrowDown')next=(index+1)%items.length;else if(event.key==='ArrowUp')next=(index+items.length-1)%items.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=items.length-1;else return;event.preventDefault();select(items[next].dataset.category,true);};
 }
 host.classList.remove('grid');host.classList.add('ds-doc-layout');host.append(tabs,article,toc);select(initial);return {tabs,panels};
}
window.addEventListener('ds-colors-ready',()=>catalogLayouts.forEach(refreshCatalogOutline));
const componentCatalog=document.querySelector('#component-catalog');
if(new URLSearchParams(location.search).has('capture')){componentCatalog.replaceChildren();document.querySelector('#utility-catalog').replaceChildren();}
const {panels:groupPanels}=categoryNavigation(componentCatalog,Object.keys(componentGroups),'component','Component categories');
const foundationGroups={Color:[],Typography:['타이포그래피'],Spacing:['간격'],'Size & Radius':['크기 · 모서리'],Motion:['모션'],Effects:['표면 효과']};
const {panels:foundationPanels}=categoryNavigation(document.querySelector('#foundation-catalog'),Object.keys(foundationGroups),'foundation','Foundation categories');
foundationPanels.get('Color').className='color-sections';
foundationPanels.get('Color').append(document.querySelector('#color-catalog'));

function sortComponentCatalog(){
 for(const card of componentCatalog.querySelectorAll('section[data-component-example]')){
  const name=card.dataset.componentExample,group=Object.keys(componentGroups).find(key=>componentGroups[key].includes(name));if(!group)throw new Error('컴포넌트 분류 누락: '+name);groupPanels.get(group).append(card);
 }
 for(const [group,panel] of groupPanels){const order=componentGroups[group];[...panel.children].sort((a,b)=>order.indexOf(a.dataset.componentExample)-order.indexOf(b.dataset.componentExample)).forEach(card=>panel.append(card));}
}
// Catalog examples come from the current service, with storage isolated per preview.
function serviceDocument(kind){
 const base=new URL(kind==='v1'?'preview/static/mobile/':'preview/work/mobile/',location.href);
 const storage='<script>(()=>{const data=new Map();Object.defineProperty(window,"localStorage",{value:{getItem:k=>data.get(String(k))??null,setItem:(k,v)=>data.set(String(k),String(v)),removeItem:k=>data.delete(String(k)),clear:()=>data.clear(),key:i=>[...data.keys()][i]??null,get length(){return data.size}}});})();<\/script>';
 return window.designSystemSources[kind].replace(/<base[^>]*>/gi,'').replace(/<head([^>]*)>/i,'<head$1><base href="'+base.href+'">'+storage);
}
(()=>{
 const styles=getComputedStyle(document.documentElement),value=t=>styles.getPropertyValue(t).trim();
 function foundation(title,rows){const group=Object.keys(foundationGroups).find(key=>foundationGroups[key].includes(title));if(!group)throw new Error('파운데이션 분류 누락: '+title);const section=document.createElement('section');section.dataset.foundationExample=title;section.innerHTML='<h2>'+title+'</h2>';for(const row of rows)section.insertAdjacentHTML('beforeend',row);foundationPanels.get(group).append(section);}
 const types=[['페이지 제목','title',600],['카드 제목','card-title',600],['로고 정보 제목','logo-info-title',500],['Title UI','ui-title',500],['본문','main',400],['설명','description',400],['캡션','caption',400]];
 foundation('타이포그래피',types.map(([label,key,weight])=>'<div class="foundation-row"><div style="font-size:var(--frame-'+key+'-size);line-height:var(--frame-'+key+'-line);font-weight:'+weight+'">'+label+' · 완등 한 컷</div><span>'+value('--frame-'+key+'-size')+' / '+value('--frame-'+key+'-line')+' / '+weight+'</span><code>--frame-'+key+'-size · --frame-'+key+'-line</code></div>'));
 foundation('간격', ['page-x','card-padding','field-gap','label-gap','action-gap','menu-content-gap','logo-info-gap','logo-info-copy-gap'].map(key=>'<div class="foundation-row"><code>--frame-'+key+'</code><span>'+value('--frame-'+key)+'</span><div class="token-size" style="width:var(--frame-'+key+')"></div></div>'));
 foundation('크기 · 모서리',['control-height','control-radius','button-radius','navigation-height','menu-height','menu-item-height','logo-info-logo-size','logo-info-content-height'].map(key=>'<div class="foundation-row"><code>--frame-'+key+'</code><span>'+value('--frame-'+key)+'</span></div>'));
 const utility=document.createElement('section');utility.innerHTML='<h2>스크롤</h2><div class="utility-scroll" tabindex="0" aria-label="가로 스크롤 예시">'+[1,2,3,4,5,6].map(i=>'<div>'+i+'</div>').join('')+'</div><code class="utility-token">static/shared/scrollbars.css</code>';document.querySelector('#utility-catalog').append(utility);
 foundation('모션',['menu-motion','menu-selection-motion','menu-compact-scale'].map(key=>'<div class="foundation-row"><code>--frame-'+key+'</code><span>'+value('--frame-'+key)+'</span></div>'));
 foundation('표면 효과',['menu-backdrop','menu-shadow'].map(key=>'<div class="foundation-row"><code>--frame-'+key+'</code><span>'+value('--frame-'+key)+'</span></div>'));
})();
const utilityHost=document.querySelector('#utility-catalog');
const utilitySections=[...utilityHost.children];
const {panels:utilityPanels}=categoryNavigation(utilityHost,['Utilities'],'utility','Utility categories');
utilityPanels.get('Utilities').append(...utilitySections);
catalogLayouts.forEach(refreshCatalogOutline);
(async()=>{
 if(document.documentElement.hasAttribute('data-catalog-static')){sortComponentCatalog();catalogLayouts.forEach(refreshCatalogOutline);document.querySelectorAll('.ds-sample').forEach(host=>hydrateCatalogSample(host,host.dataset.sampleKind));document.documentElement.dataset.catalogReady='true';return;}
 const source=document.createElement('iframe');source.className='catalog-source';source.title='서비스 컴포넌트 원본';source.tabIndex=-1;source.setAttribute('aria-hidden','true');
 source.onload=async()=>{
  const doc=source.contentDocument,win=source.contentWindow;
  const click=selector=>{const node=doc.querySelector(selector);if(!node)throw new Error('카탈로그 원본 누락: '+selector);node.click();};
  const settle=()=>new Promise(resolve=>win.requestAnimationFrame(()=>win.requestAnimationFrame(resolve)));
  await doc.fonts.ready;await settle();
  const serviceStyles=[...doc.querySelectorAll('link[rel=stylesheet],style')].map(node=>node.tagName==='LINK'?'<link rel="stylesheet" href="'+node.href+'">':node.outerHTML).join('');
  function sample(name,selector,context='plain',prepare){
   const original=doc.querySelector(selector);if(!original)throw new Error('카탈로그 원본 누락: '+name+' '+selector);
   const clone=original.cloneNode(true);if(prepare)prepare(clone);clone.hidden=false;
   const card=document.createElement('section'),heading=document.createElement('h2'),frame=document.createElement('iframe');card.dataset.componentExample=name;heading.textContent=name;frame.className='sample';frame.title=name;frame.dataset.selector=selector;card.append(heading,frame);document.querySelector('#component-catalog').append(card);sortComponentCatalog();
   const symbols=doc.querySelector('#wandeung-calendar>svg')?.outerHTML||'';
   let content=clone.outerHTML;
   if(name==='프로필 사진 편집')content='<section class="wc-info-section wc-profile-section">'+content+'</section>';
   if(context==='info'){const overview=['프로필 카드','회원권 요약 카드'].includes(name)?' wc-info-overview':'';content='<div class="wc-info-panel'+overview+'">'+content+'</div>';}
   if(context==='form')content='<div class="wc-form-scroll">'+content+'</div>';
   if(context==='thumbnail')content='<div class="wc-thumbnail-home">'+content+'</div>';
   const sampleBody=clone.matches('.wc-nav,.wc-header')?content:'<main id="wc-main"><div class="wc-pad">'+content+'</div></main>';
   frame.onload=()=>{
    const d=mountCatalogSample(frame);d.dataset.sampleKind='v2';
    hydrateCatalogSample(d,'v2');
   };
   frame.srcdoc='<!doctype html><html lang="ko"><head><meta charset="utf-8"><base href="'+new URL('preview/work/mobile/',location.href).href+'">'+serviceStyles+'<style>body{margin:0;padding:16px;background:var(--frame-background);overflow:hidden}#wandeung-calendar{display:block;padding:0;min-height:0;width:100%}#wandeung-calendar .ds-shell{display:block!important;width:100%!important;max-width:none!important;height:auto!important;min-height:0!important;border:0!important;border-radius:0;box-shadow:none!important;overflow:visible!important;transform:none!important;background:transparent}#sample-content{display:flow-root}#wandeung-calendar .ds-shell #wc-main{display:block!important;height:auto!important;min-height:0!important;padding:0!important;overflow:visible!important}#wandeung-calendar .ds-shell .wc-pad{display:block!important;height:auto!important;min-height:0!important;padding:0!important}#wandeung-calendar .wc-info-panel{padding:0;min-height:0}#wandeung-calendar .wc-form-scroll{padding:0;overflow:visible}#wandeung-calendar .wc-header{display:flex!important}#wandeung-calendar .wc-nav{position:relative!important;inset:auto!important;transform:none!important;margin:0!important;width:100%!important}#wandeung-calendar .wc-day-sheet{position:relative!important;inset:auto!important;transform:none!important;width:100%;max-height:none}#wandeung-calendar .wc-profile-section{margin:0}#wandeung-calendar .wc-template-preview{width:100%;max-width:280px;margin:0 auto}#wandeung-calendar .wc-record-date-panel{position:relative}</style></head><body><div id="wandeung-calendar">'+symbols+'<div class="wc-phone ds-shell '+doc.querySelector('.wc-phone').className.replace('wc-phone','')+'" id="sample-content">'+sampleBody+'</div></div></body></html>';
  }
  try{
   sample('캘린더 툴바','.wc-pad>.wc-row');
   sample('하단 플로팅 메뉴','.wc-nav');
   sample('통계 요약','.wc-calendar-summary');
   click('[data-action="calendar-year"]');await settle();
   sample('연·월 선택 패널','.wc-month-picker');
   click('[data-action="close-month-picker"]');await settle();
   const emptyDay=[...doc.querySelectorAll('.wc-date[data-date]')].find(button=>!button.querySelector('.wc-day-status')&&!button.classList.contains('wc-outside'));
   if(emptyDay){emptyDay.click();await settle();sample('빈 상태','.wc-day-sheet-content');click('[data-action="close-day"]');await settle();}
   const day=doc.querySelector('.wc-day-status')?.closest('[data-date]')||doc.querySelector('[data-date]');day.click();await settle();
   sample('날짜 내역 바텀 시트','.wc-day-sheet');
   sample('방문 기록 카드','.wc-day-sheet-content .wc-entry');
   click('[data-open]');await settle();
   sample('상단 내비게이션 바','.wc-header');
   sample('암장 카드','.wc-record-gym-card');
   sample('완등 통계','.wc-record-completions');
   click('[data-action="modify"]');await settle();
   sample('날짜 입력','.wc-form-scroll>.wc-field','form');
   sample('방문 상태 스위치','.wc-visit-toggle-row','form');
   sample('선택한 암장','.wc-gym-picker','form');
   sample('색상별 개수 조절','#wc-level-counts','form');
   sample('메모 입력','.wc-record-memo','form');
   sample('저장 · 삭제 버튼','.wc-record-actions','form');
   click('[data-action="record-date-toggle"]');await settle();
   sample('날짜 선택 달력','#wc-record-date-panel','form');
   click('[data-action="clear-gym"]');await settle();
   sample('암장 검색','.wc-gym-picker','form');
   click('[data-action="close-form"]');click('[data-menu="info"]');await settle();
   sample('프로필 카드','.wc-profile-section','info');
   sample('회원권 요약 카드','.wc-membership-summary','info');
   sample('로고 정보 항목','.wc-membership-summary .wc-logo-info-row','info');
   click('[data-profile-action="edit"]');await settle();
   sample('프로필 사진 편집','.wc-profile-photo-row','info');
   sample('텍스트 입력','.wc-profile-edit-fields>.wc-info-field','info');
   sample('단위 입력','.wc-body-fields','info');
   click('#wc-back');click('[data-menu="thumbnail"]');await settle();
   sample('템플릿 카드','.wc-template-preview','thumbnail');
   source.remove();catalogLayouts.forEach(refreshCatalogOutline);document.documentElement.dataset.catalogReady='true';
  }catch(error){document.documentElement.dataset.catalogError=error.message;console.error(error);}
 };
 source.srcdoc=serviceDocument('v2');document.body.append(source);
})();
