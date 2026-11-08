const componentOrder=['상단 내비게이션 바','캘린더 툴바','하단 플로팅 메뉴','저장 · 삭제 버튼','텍스트 입력','단위 입력','날짜 입력','메모 입력','셀렉트박스','방문 상태 스위치','글자 연결 스위치','분할 선택','스타일 탭','텍스트 탭','색상 선택','크기 슬라이더','각도 슬라이더','글자 정렬','색상별 개수 조절','사진 구도 도구','텍스트 도구','폰트 카드','통계 요약','프로필 카드','프로필 사진 편집','암장 카드','선택한 암장','암장 검색','방문 기록 항목','완등 통계','회원권 요약 카드','템플릿 카드','날짜 선택 달력','연·월 선택 패널','날짜 내역 바텀 시트','빈 상태'];
function sortComponentCatalog(){const catalog=document.querySelector('#component-catalog');[...catalog.children].sort((a,b)=>componentOrder.indexOf(a.querySelector('h2').textContent)-componentOrder.indexOf(b.querySelector('h2').textContent)).forEach(section=>catalog.append(section));}
// Catalog examples come from the current service, with storage isolated per preview.
function serviceDocument(kind){
 const base=new URL(kind==='v1'?'preview/static/mobile/':'preview/work/mobile/',location.href);
 const storage='<script>(()=>{const data=new Map();Object.defineProperty(window,"localStorage",{value:{getItem:k=>data.get(String(k))??null,setItem:(k,v)=>data.set(String(k),String(v)),removeItem:k=>data.delete(String(k)),clear:()=>data.clear(),key:i=>[...data.keys()][i]??null,get length(){return data.size}}});})();<\/script>';
 return window.designSystemSources[kind].replace(/<head([^>]*)>/i,'<head$1><base href="'+base.href+'">'+storage);
}
(()=>{
 const styles=getComputedStyle(document.documentElement),value=t=>styles.getPropertyValue(t).trim();
 function foundation(title,rows){const section=document.createElement('section');section.innerHTML='<h2>'+title+'</h2>';for(const row of rows)section.insertAdjacentHTML('beforeend',row);document.querySelector('#foundation-catalog').append(section);}
 const types=[['페이지 제목','title',600],['카드 제목','card-title',600],['Title UI','ui-title',500],['본문','main',400],['설명','description',400],['캡션','caption',400]];
 foundation('타이포그래피',types.map(([label,key,weight])=>'<div class="foundation-row"><div style="font-size:var(--frame-'+key+'-size);line-height:var(--frame-'+key+'-line);font-weight:'+weight+'">'+label+' · 완등 한 컷</div><span>'+value('--frame-'+key+'-size')+' / '+value('--frame-'+key+'-line')+' / '+weight+'</span><code>--frame-'+key+'-size · --frame-'+key+'-line</code></div>'));
 foundation('간격', ['page-x','card-padding','field-gap','label-gap','action-gap','menu-content-gap'].map(key=>'<div class="foundation-row"><code>--frame-'+key+'</code><span>'+value('--frame-'+key)+'</span><div class="token-size" style="width:var(--frame-'+key+')"></div></div>'));
 foundation('크기 · 모서리',['control-height','control-radius','button-radius','navigation-height','menu-height','menu-item-height'].map(key=>'<div class="foundation-row"><code>--frame-'+key+'</code><span>'+value('--frame-'+key)+'</span></div>'));
 const utility=document.createElement('section');utility.innerHTML='<h2>스크롤</h2><div class="utility-scroll" tabindex="0" aria-label="가로 스크롤 예시">'+[1,2,3,4,5,6].map(i=>'<div>'+i+'</div>').join('')+'</div><code class="utility-token">static/shared/scrollbars.css</code>';document.querySelector('#utility-catalog').append(utility);
 const motion=document.createElement('section');motion.innerHTML='<h2>모션</h2>'+['menu-motion','menu-selection-motion','menu-compact-scale','menu-backdrop'].map(key=>'<div class="foundation-row"><code>--frame-'+key+'</code><span>'+value('--frame-'+key)+'</span></div>').join('');document.querySelector('#utility-catalog').append(motion);
})();
(async()=>{
 const source=document.createElement('iframe');source.className='catalog-source';source.title='서비스 컴포넌트 원본';source.tabIndex=-1;source.setAttribute('aria-hidden','true');
 source.onload=async()=>{
  const doc=source.contentDocument,win=source.contentWindow;
  const click=selector=>{const node=doc.querySelector(selector);if(!node)throw new Error('카탈로그 원본 누락: '+selector);node.click();};
  const settle=()=>new Promise(resolve=>win.requestAnimationFrame(()=>win.requestAnimationFrame(resolve)));
  await doc.fonts.ready;await settle();
  const serviceStyles=[...doc.querySelectorAll('link[rel=stylesheet]')].map(x=>'<link rel="stylesheet" href="'+x.href+'">').join('')+[...doc.querySelectorAll('style')].map(x=>x.outerHTML).join('');
  function sample(name,selector,context='plain',prepare){
   const original=doc.querySelector(selector);if(!original)throw new Error('카탈로그 원본 누락: '+name+' '+selector);
   const clone=original.cloneNode(true);if(prepare)prepare(clone);clone.hidden=false;
   const card=document.createElement('section'),heading=document.createElement('h2'),frame=document.createElement('iframe');heading.textContent=name;frame.className='sample';frame.title=name;frame.dataset.selector=selector;card.append(heading,frame);document.querySelector('#component-catalog').append(card);sortComponentCatalog();
   const symbols=doc.querySelector('#wandeung-calendar>svg')?.outerHTML||'';
   let content=clone.outerHTML;
   if(context==='info')content='<div class="wc-info-panel">'+content+'</div>';
   if(context==='form')content='<div class="wc-form-scroll">'+content+'</div>';
   if(context==='thumbnail')content='<div class="wc-thumbnail-home">'+content+'</div>';
   const sampleBody=clone.matches('.wc-nav,.wc-header')?content:'<main id="wc-main"><div class="wc-pad">'+content+'</div></main>';
   frame.onload=()=>{
    const d=frame.contentDocument,w=frame.contentWindow;
    const resize=()=>{if(frame.getBoundingClientRect().width>0)frame.style.height=Math.ceil(d.querySelector('#sample-content').getBoundingClientRect().height+32)+'px';};
    new w.ResizeObserver(resize).observe(d.querySelector('#sample-content'));new ResizeObserver(resize).observe(frame);d.fonts.ready.then(resize);resize();
    d.querySelectorAll('.wc-nav [data-menu]').forEach(button=>button.onclick=()=>{const nav=button.closest('.wc-nav');nav.dataset.selected=button.dataset.menu;nav.querySelectorAll('[data-menu]').forEach(b=>b.setAttribute('aria-current',b===button?'page':'false'));});
    d.querySelectorAll('[role=switch]').forEach(button=>button.onclick=()=>button.setAttribute('aria-checked',String(button.getAttribute('aria-checked')!=='true')));
    d.querySelectorAll('[role=group] button[aria-pressed]').forEach(button=>button.onclick=()=>button.parentElement.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button))));
    d.querySelectorAll('[data-count]').forEach(button=>button.onclick=()=>{const step=button.closest('.wc-level-stepper'),out=step.querySelector('output');let n=Math.max(0,Math.min(99,Number(out.value||out.textContent)+Number(button.dataset.delta)));out.value=n;step.querySelectorAll('button').forEach(b=>b.disabled=Number(b.dataset.delta)<0?n===0:n===99);});
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
   sample('방문 기록 항목','.wc-day-sheet-content .wc-entry');
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
   click('[data-profile-action="edit"]');await settle();
   sample('프로필 사진 편집','.wc-profile-photo-row','info');
   sample('텍스트 입력','.wc-profile-edit-fields>.wc-info-field','info');
   sample('단위 입력','.wc-body-fields','info');
   click('#wc-back');click('[data-menu="thumbnail"]');await settle();
   sample('템플릿 카드','.wc-template-preview','thumbnail');
   source.remove();document.documentElement.dataset.catalogReady='true';
  }catch(error){document.documentElement.dataset.catalogError=error.message;console.error(error);}
 };
 source.srcdoc=serviceDocument('v2');document.body.append(source);
})();
