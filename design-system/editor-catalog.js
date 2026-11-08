if(!document.documentElement.hasAttribute('data-catalog-static')){
const base=new URL('preview/static/',location.href),source=document.createElement('iframe'),catalog=document.querySelector('#component-catalog');
const specs=[['스타일 탭','.mark-style-tabs','완등 표시 → 스타일·정렬·연결'],['분할 선택','.order-options:has(#orderByColor)','완등 표시 → 표시 방식 → 색상별·추가순'],['텍스트 탭','#mobile-text-panel>.mobile-text-tabs','텍스트 → 스타일 → 색상·크기·폰트·정렬·테두리·그림자'],['셀렉트박스','#mobile-mark-link','완등 표시 → 연결 → 연결할 글자'],['글자 연결 스위치','.mark-link-switch-row','완등 표시 → 스타일 → 글자와 연결'],['사진 구도 도구','#mobile-image-group-0>.image-tool-strip','이미지 → 구도'],['텍스트 도구','.text-action-strip','텍스트 → 추가·편집·스타일·복제·삭제'],['색상 선택','#mobile-text-group-5 .color-picker-row','텍스트 → 색상·크기'],['크기 슬라이더','#mobile-text-group-5 label[for=size]','텍스트 → 색상·크기'],['각도 슬라이더','#mobile-image-group-0 label:has([data-image-setting=tilt])','이미지 → 구도 → 각도'],['글자 정렬','#mobile-text-group-2 .align-control','텍스트 → 정렬'],['폰트 카드','.mobile-font-cards','텍스트 → 폰트'],['전체 작업 기록','.editor-history','이미지 영역 → 전체 작업 되돌리기·다시 실행'],['선택 표시 스타일','.text-layer','캔버스 → 선택한 글자의 점선 표시']];
const sheets=['shared/fonts.css','shared/scrollbars.css','shared/editor.css','mobile/editor.css'];
source.onload=async()=>{
 try{const doc=source.contentDocument;await doc.fonts.ready;const input=doc.querySelector('#text');input.value='완등 한 컷';input.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(resolve=>source.contentWindow.requestAnimationFrame(()=>source.contentWindow.requestAnimationFrame(resolve)));
 for(const [name,selector,where] of specs){const original=doc.querySelector(selector);if(!original){console.warn('구성 요소를 찾지 못했어요: '+name);continue;}const clone=original.cloneNode(true);clone.hidden=false;clone.style.fontSize=source.contentWindow.getComputedStyle(original).fontSize;
 if(selector.includes('mobile-text-panel')){for(const b of clone.querySelectorAll('button'))b.hidden=b.id==='mobile-text-option-0';clone.querySelector('.mobile-edit-done')?.remove();clone.querySelector('[role=tab][aria-selected=true]')?.setAttribute('aria-selected','false');clone.querySelector('#mobile-text-option-5')?.setAttribute('aria-selected','true');}
 if(selector==='.editor-history'){clone.style.position='relative';clone.style.left='auto';clone.style.bottom='auto';clone.style.width='fit-content';}
 if(selector==='.text-layer'){clone.classList.add('is-editor-selected');clone.style.position='relative';clone.style.left='auto';clone.style.top='auto';clone.style.transform='none';clone.style.width='fit-content';clone.style.fontSize='32px';clone.style.setProperty('--selection-line-width','1.25px');clone.style.setProperty('--selection-line-offset','3px');}
 if(selector==='.mobile-font-cards')for(const child of [...clone.children].slice(4))child.remove();
 const section=document.createElement('section'),heading=document.createElement('h2'),frame=document.createElement('iframe');section.dataset.componentExample=name;heading.textContent=name;frame.className='sample';frame.title=name+' 실제 서비스 UI';frame.dataset.selector=selector;
 section.append(heading,frame);if(selector==='.text-layer'){const token=document.createElement('code');token.className='utility-token';token.textContent='.is-editor-selected';section.append(token);} (selector==='.text-layer'?document.querySelector('#utility-catalog'):catalog).append(section);
 frame.onload=()=>{const d=mountCatalogSample(frame);d.dataset.sampleKind='v1';
 hydrateCatalogSample(d,'v1');
 };
 frame.srcdoc='<!doctype html><html lang="ko"><head><meta charset="utf-8">'+sheets.map(path=>'<link rel="stylesheet" href="'+new URL(path,base)+'?ds='+Date.now()+'">').join('')+'<style>body{margin:0;background:white!important;overflow:hidden}.mobile-editor{position:relative!important;inset:auto!important;height:auto!important;width:100%!important;margin:0!important;overflow:visible!important;z-index:auto!important}.mobile-tools{padding-top:16px!important;padding-bottom:16px!important}.mobile-panel{display:block!important}.mobile-panel[hidden]{display:none!important}</style></head><body class="mobile-editing"><div class="mobile-editor editing-tool"><div class="mobile-tools"><section class="mobile-panel text-section">'+clone.outerHTML+'</section></div></div></body></html>';
 }
 sortComponentCatalog();source.remove();
 }catch(e){console.error(e);}
};source.id='service-source';source.title='편집 컴포넌트 원본';source.tabIndex=-1;source.setAttribute('aria-hidden','true');source.srcdoc=serviceDocument('v1');document.body.append(source);

}
