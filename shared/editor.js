function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
// Build the border from the same rendered glyph mask as its fill. Separate
// text-stroke rasterization can leave dark spikes along small curved glyphs.
const textOutlineOffsets=Array.from({length:8},(_,i)=>{
  const angle=i*Math.PI/4;
  return [Math.round(Math.cos(angle)*.5*1e6)/1e6,Math.round(Math.sin(angle)*.5*1e6)/1e6];
});
// Eight masks overlap; lower each opacity to retain the original thin border.
const textOutlineOpacity=89/255;
function textOutlineShadow(color){return textOutlineOffsets.map(([x,y])=>`${x}px ${y}px 0 ${color}59`).join(',');}
function positionBounds(stageWidth,stageHeight,layerWidth,layerHeight){
  const padX=Math.min(20,Math.max(0,(stageWidth-layerWidth)/2));
  const padY=Math.min(20,Math.max(0,(stageHeight-layerHeight)/2));
  return {left:padX,top:padY,travelX:Math.max(0,stageWidth-layerWidth-2*padX),travelY:Math.max(0,stageHeight-layerHeight-2*padY)};
}
function offsetFromPosition(bounds,x,y){return {left:bounds.left+bounds.travelX*clamp(x,0,100)/100,top:bounds.top+bounds.travelY*clamp(y,0,100)/100};}
function positionFromOffset(bounds,left,top){return {x:bounds.travelX?clamp((left-bounds.left)/bounds.travelX*100,0,100):0,y:bounds.travelY?clamp((top-bounds.top)/bounds.travelY*100,0,100):0};}
// UI
const editorViewport={render:null,bounds:null,syncCounts:null,logical:false};
const $=id=>document.getElementById(id);
const text=$('text'),preview=$('preview'),stage=$('previewStage'),layer=$('textLayer');
const fontSelect=$('fontSelect');
const fontChoices=[{"id": "notosanskr", "family": "Noto Sans KR", "label": "노토 산스 KR", "group": "고딕", "popularity": 38, "source": "https://github.com/google/fonts/tree/main/ofl/notosanskr", "filename": "NotoSansKR[wght].ttf", "coverage": 11172, "file": "추가폰트/notosanskr.woff", "license": "SIL Open Font License 1.1"}, {"id": "nanumgothic", "family": "Nanum Gothic", "label": "나눔고딕", "group": "고딕", "popularity": 106, "source": "https://github.com/google/fonts/tree/main/ofl/nanumgothic", "filename": "NanumGothic-Regular.ttf", "coverage": 11172, "file": "추가폰트/nanumgothic.woff", "license": "SIL Open Font License 1.1"}, {"id": "gothica1", "family": "Gothic A1", "label": "고딕 A1", "group": "고딕", "popularity": 221, "source": "https://github.com/google/fonts/tree/main/ofl/gothica1", "filename": "GothicA1-Regular.ttf", "coverage": 11172, "file": "추가폰트/gothica1.woff", "license": "SIL Open Font License 1.1"}, {"id": "blackhansans", "family": "Black Han Sans", "label": "검은고딕", "group": "고딕", "popularity": 269, "source": "https://github.com/google/fonts/tree/main/ofl/blackhansans", "filename": "BlackHanSans-Regular.ttf", "coverage": 2581, "file": "추가폰트/blackhansans.woff", "license": "SIL Open Font License 1.1"}, {"id": "jua", "family": "Jua", "label": "주아", "group": "고딕", "popularity": 340, "source": "https://github.com/google/fonts/tree/main/ofl/jua", "filename": "Jua-Regular.ttf", "coverage": 2367, "file": "추가폰트/jua.woff", "license": "SIL Open Font License 1.1"}, {"id": "nanummyeongjo", "family": "Nanum Myeongjo", "label": "나눔명조", "group": "명조", "popularity": 163, "source": "https://github.com/google/fonts/tree/main/ofl/nanummyeongjo", "filename": "NanumMyeongjo-Regular.ttf", "coverage": 11172, "file": "추가폰트/nanummyeongjo.woff", "license": "SIL Open Font License 1.1"}, {"id": "notoserifkr", "family": "Noto Serif KR", "label": "노토 세리프 KR", "group": "명조", "popularity": 166, "source": "https://github.com/google/fonts/tree/main/ofl/notoserifkr", "filename": "NotoSerifKR[wght].ttf", "coverage": 11172, "file": "추가폰트/notoserifkr.woff", "license": "SIL Open Font License 1.1"}, {"id": "hahmlet", "family": "Hahmlet", "label": "함렛", "group": "명조", "popularity": 567, "source": "https://github.com/google/fonts/tree/main/ofl/hahmlet", "filename": "Hahmlet[wght].ttf", "coverage": 2788, "file": "추가폰트/hahmlet.woff", "license": "SIL Open Font License 1.1"}, {"id": "gowunbatang", "family": "Gowun Batang", "label": "고운바탕", "group": "명조", "popularity": 603, "source": "https://github.com/google/fonts/tree/main/ofl/gowunbatang", "filename": "GowunBatang-Regular.ttf", "coverage": 11172, "file": "추가폰트/gowunbatang.woff", "license": "SIL Open Font License 1.1"}, {"id": "songmyung", "family": "Song Myung", "label": "송명", "group": "명조", "popularity": 819, "source": "https://github.com/google/fonts/tree/main/ofl/songmyung", "filename": "SongMyung-Regular.ttf", "coverage": 2350, "file": "추가폰트/songmyung.woff", "license": "SIL Open Font License 1.1"}];
const size=$('size'),shadow=$('shadow'),outline=$('outline'),fillColor=$('fillColor'),strokeColor=$('strokeColor');
const heartPreview=$('heartPreview'),clearHearts=$('clearHearts'),breakHearts=$('breakHearts'),removeHeart=$('removeHeart');
const photo=$('photo'),photoInput=$('photoInput'),removePhoto=$('removePhoto');
const gymSelect=$('gymSelect'),branchSelect=$('branchSelect'),branchField=$('branchField'),regionSelect=$('regionSelect');
const gymCatalog={"checkedAt": "2026-10-16", "scope": "서울·경기 공개 암장 목록. 공식 안내와 공개 장소 목록의 표기 기준이며, 전체 업소의 사업자등록 원장을 대조한 목록은 아닙니다. 신규·누락·폐점 정보가 있을 수 있습니다. 암장명 자체가 점으로 끝나는 개별 지점 항목은 요청에 따라 제외했습니다.", "sources": {"seoul": "https://holday.rocks/gyms/서울", "gyeonggi": "https://holday.rocks/gyms/경기", "theclimb": "https://linktr.ee/theclimb_life", "theclimb_name": "https://polle.com/place/3wT7QE/더클라임%20클라이밍%20짐앤샵", "ssw": "https://www.sswclimbing.co.kr/", "forest": "https://climbmap.life/places/kr/brands/seoul-forest", "allez": "https://climbmap.life/places/kr/brands/allez", "park": "https://www.daangn.com/kr/local-profile/클라이밍파크-종로-b6542dq5ui8p/", "peakers": "https://cgv.co.kr/csc/frequentlyAskedQuestion", "mongkids": "https://mongkids.co.kr/지점안내/", "plastik": "https://climbing-library.com/magazine/spotlight-10002/", "boulders": "https://www.indpmusic.co.kr/magazine/with-customer-review-1", "koala": "https://www.localgymsandfitness.com/KR/Seoul/266520410139982/코알라클라이밍짐", "together": "https://www.climbtogether.co.kr/climb-together/home-ct"}, "gyms": [{"id": "theclimb", "name": "더클라임", "branches": [{"label": "강남", "region": "서울", "listedName": "더클라임 클라이밍 짐앤샵 강남점"}, {"label": "논현", "region": "서울", "listedName": "더클라임 클라이밍 짐앤샵 논현점"}, {"label": "마곡", "region": "서울", "listedName": "더클라임 클라이밍 짐앤샵 마곡점"}, {"label": "문래", "region": "서울", "listedName": "더클라임 클라이밍 짐앤샵 문래점"}, {"label": "사당", "region": "서울", "listedName": "더클라임 클라이밍 짐앤샵 사당점"}, {"label": "성수", "region": "서울", "listedName": "더클라임 클라이밍 짐앤샵 성수점"}, {"label": "신림", "region": "서울", "listedName": "더클라임 클라이밍 짐앤샵 신림점"}, {"label": "양재", "region": "서울", "listedName": "더클라임 클라이밍 짐앤샵 양재점"}, {"label": "연남", "region": "서울", "listedName": "더클라임 클라이밍 짐앤샵 연남점"}, {"label": "이수", "region": "서울", "listedName": "더클라임 클라이밍 짐앤샵 이수점"}, {"label": "일산", "region": "경기", "listedName": "더클라임 클라이밍 짐앤샵 일산점"}], "sources": ["theclimb", "theclimb_name"]}, {"id": "forest", "name": "서울숲클라이밍", "branches": [{"label": "구로", "region": "서울", "listedName": "서울숲클라이밍 구로점"}, {"label": "영등포", "region": "서울", "listedName": "서울숲클라이밍 영등포점"}, {"label": "잠실", "region": "서울", "listedName": "서울숲클라이밍 잠실점"}, {"label": "종로", "region": "서울", "listedName": "서울숲클라이밍 종로점"}], "sources": ["forest"]}, {"id": "ssw", "name": "손상원 클라이밍", "branches": [{"label": "강남", "region": "서울", "listedName": "손상원 클라이밍짐 강남점"}, {"label": "을지로", "region": "서울", "listedName": "손상원 클라이밍짐 을지로점"}, {"label": "판교", "region": "경기", "listedName": "손상원 클라이밍짐 판교점"}], "sources": ["ssw"]}, {"id": "allez", "name": "알레클라임", "branches": [{"label": "강동", "region": "서울", "listedName": "알레클라임 강동점"}, {"label": "영등포", "region": "서울", "listedName": "알레클라임 영등포점"}, {"label": "혜화", "region": "서울", "listedName": "알레클라임 혜화점"}], "sources": ["allez"]}, {"id": "park", "name": "클라이밍파크", "branches": [{"label": "강남", "region": "서울", "listedName": "클라이밍파크 강남점"}, {"label": "성수", "region": "서울", "listedName": "클라이밍파크 성수점"}, {"label": "신논현", "region": "서울", "listedName": "클라이밍파크 신논현점"}, {"label": "종로", "region": "서울", "listedName": "클라이밍파크 종로점"}, {"label": "한티", "region": "서울", "listedName": "클라이밍파크 한티점"}], "sources": ["park"]}, {"id": "peakers", "name": "피커스", "branches": [{"label": "구로", "region": "서울", "listedName": "피커스 구로점"}, {"label": "신촌", "region": "서울", "listedName": "피커스 신촌점"}, {"label": "종로", "region": "서울", "listedName": "피커스 종로점"}], "sources": ["peakers"]}, {"id": "boulders", "name": "서울볼더스 클라이밍", "branches": [{"label": "목동", "region": "서울", "listedName": "서울볼더스 클라이밍 목동점"}, {"label": "선유", "region": "서울", "listedName": "서울볼더스 클라이밍 선유점"}], "sources": ["boulders"]}, {"id": "koala", "name": "코알라클라이밍", "branches": [{"label": "상암", "region": "서울", "listedName": "코알라클라이밍짐 상암점"}, {"label": "킨텍스", "region": "경기", "listedName": "코알라클라이밍짐 킨텍스점"}], "sources": ["koala"]}, {"id": "plastik", "name": "더플라스틱 클라이밍", "branches": [{"label": "문래", "region": "서울", "listedName": "더플라스틱 클라이밍 문래점"}, {"label": "염창", "region": "서울", "listedName": "더플라스틱 클라이밍 염창점"}], "sources": ["plastik"]}, {"id": "damjang", "name": "담장", "branches": [{"label": "신촌", "region": "서울", "listedName": "담장 신촌점"}, {"label": "을지로", "region": "서울", "listedName": "담장 을지로점"}], "sources": ["seoul"]}, {"id": "bouldermate", "name": "볼더메이트 클라이밍", "branches": [{"label": "기흥", "region": "경기", "listedName": "볼더메이트 클라이밍 기흥점"}, {"label": "수지", "region": "경기", "listedName": "볼더메이트 클라이밍 수지점"}], "sources": ["gyeonggi"]}, {"id": "climbus", "name": "클라임어스", "branches": [{"label": "모란", "region": "경기", "listedName": "클라임어스 모란점"}, {"label": "미사", "region": "경기", "listedName": "클라임어스 미사점"}], "sources": ["gyeonggi"]}, {"id": "mongkids", "name": "몽키즈클라이밍", "branches": [{"label": "강서마곡", "region": "서울", "listedName": "몽키즈클라이밍 강서마곡점"}, {"label": "답십리", "region": "서울", "listedName": "몽키즈클라이밍 답십리점"}, {"label": "목동", "region": "서울", "listedName": "몽키즈클라이밍 목동점"}, {"label": "북가좌", "region": "서울", "listedName": "몽키즈클라이밍 북가좌점"}, {"label": "신내", "region": "서울", "listedName": "몽키즈클라이밍 신내점"}, {"label": "영등포", "region": "서울", "listedName": "몽키즈클라이밍 영등포점"}, {"label": "중계", "region": "서울", "listedName": "몽키즈클라이밍 중계점"}, {"label": "고양화정", "region": "경기", "listedName": "몽키즈클라이밍 고양화정점"}, {"label": "광명철산", "region": "경기", "listedName": "몽키즈클라이밍 광명철산점"}, {"label": "경기광주태전", "region": "경기", "listedName": "몽키즈클라이밍 경기광주태전점"}, {"label": "김포운양", "region": "경기", "listedName": "몽키즈클라이밍 김포운양점"}, {"label": "동탄반송", "region": "경기", "listedName": "몽키즈클라이밍 동탄반송점"}, {"label": "부천중동", "region": "경기", "listedName": "몽키즈클라이밍 부천중동점"}, {"label": "수원호매실", "region": "경기", "listedName": "몽키즈클라이밍 수원호매실점"}, {"label": "수지성복", "region": "경기", "listedName": "몽키즈클라이밍 수지성복점"}, {"label": "시흥배곧", "region": "경기", "listedName": "몽키즈클라이밍 시흥배곧점"}, {"label": "안양평촌", "region": "경기", "listedName": "몽키즈클라이밍 안양평촌점"}, {"label": "양주옥정", "region": "경기", "listedName": "몽키즈클라이밍 양주옥정점"}, {"label": "용인역북", "region": "경기", "listedName": "몽키즈클라이밍 용인역북점"}, {"label": "위례", "region": "경기", "listedName": "몽키즈클라이밍 위례점"}, {"label": "일산마두", "region": "경기", "listedName": "몽키즈클라이밍 일산마두점"}, {"label": "파주운정", "region": "경기", "listedName": "몽키즈클라이밍 파주운정점"}, {"label": "하남미사", "region": "경기", "listedName": "몽키즈클라이밍 하남미사점"}], "sources": ["mongkids", "seoul", "gyeonggi"]}, {"id": "gym-014", "name": "강남스포츠클라이밍센터", "branches": [{"label": "", "region": "서울", "city": "강남구", "listedName": "강남스포츠클라이밍센터"}], "sources": ["seoul"]}, {"id": "gym-015", "name": "역삼클라이밍랩", "branches": [{"label": "", "region": "서울", "city": "강남구", "listedName": "역삼클라이밍랩"}], "sources": ["seoul"]}, {"id": "gym-016", "name": "온세대클라이밍", "branches": [{"label": "", "region": "서울", "city": "강동구", "listedName": "온세대클라이밍"}], "sources": ["seoul"]}, {"id": "gym-018", "name": "쿠키즈클라이밍", "branches": [{"label": "", "region": "서울", "city": "강동구", "listedName": "쿠키즈클라이밍"}], "sources": ["seoul"]}, {"id": "gym-019", "name": "맥클라이밍", "branches": [{"label": "", "region": "서울", "city": "강북구", "listedName": "맥클라이밍"}], "sources": ["seoul"]}, {"id": "gym-020", "name": "북한산국제클라이밍센터", "branches": [{"label": "", "region": "서울", "city": "강북구", "listedName": "북한산국제클라이밍센터"}], "sources": ["seoul"]}, {"id": "gym-021", "name": "블랙야크 야크돔", "branches": [{"label": "", "region": "서울", "city": "강북구", "listedName": "블랙야크 야크돔"}], "sources": ["seoul"]}, {"id": "gym-022", "name": "강서클라이밍센터", "branches": [{"label": "", "region": "서울", "city": "강서구", "listedName": "강서클라이밍센터"}], "sources": ["seoul"]}, {"id": "gym-023", "name": "어거스트클라이밍", "branches": [{"label": "", "region": "서울", "city": "강서구", "listedName": "어거스트클라이밍"}], "sources": ["seoul"]}, {"id": "gym-024", "name": "클라이밍88", "branches": [{"label": "", "region": "서울", "city": "강서구", "listedName": "클라이밍88"}], "sources": ["seoul"]}, {"id": "gym-025", "name": "투이얼즈 클라임 하우스", "branches": [{"label": "", "region": "서울", "city": "강서구", "listedName": "투이얼즈 클라임 하우스"}], "sources": ["seoul"]}, {"id": "gym-026", "name": "보람애스포츠클라이밍", "branches": [{"label": "", "region": "서울", "city": "관악구", "listedName": "보람애스포츠클라이밍"}], "sources": ["seoul"]}, {"id": "gym-028", "name": "인클라이밍센터", "branches": [{"label": "", "region": "서울", "city": "관악구", "listedName": "인클라이밍센터"}], "sources": ["seoul"]}, {"id": "gym-029", "name": "레드포인트클라이밍", "branches": [{"label": "", "region": "서울", "city": "광진구", "listedName": "레드포인트클라이밍"}], "sources": ["seoul"]}, {"id": "gym-030", "name": "버티고클라이밍", "branches": [{"label": "", "region": "서울", "city": "광진구", "listedName": "버티고클라이밍짐"}], "sources": ["seoul"]}, {"id": "gym-032", "name": "썬클라이밍", "branches": [{"label": "", "region": "서울", "city": "구로구", "listedName": "썬클라이밍짐"}], "sources": ["seoul"]}, {"id": "gym-033", "name": "에이스클라이밍센터", "branches": [{"label": "", "region": "서울", "city": "구로구", "listedName": "에이스클라이밍센터"}], "sources": ["seoul"]}, {"id": "gym-034", "name": "위클리클라이밍", "branches": [{"label": "", "region": "서울", "city": "구로구", "listedName": "위클리클라이밍"}], "sources": ["seoul"]}, {"id": "gym-035", "name": "바위하는사람들 암장", "branches": [{"label": "", "region": "서울", "city": "금천구", "listedName": "바위하는사람들 암장"}], "sources": ["seoul"]}, {"id": "gym-036", "name": "유즈업", "branches": [{"label": "", "region": "서울", "city": "금천구", "listedName": "유즈업"}], "sources": ["seoul"]}, {"id": "gym-037", "name": "드림캐처클라이밍", "branches": [{"label": "", "region": "서울", "city": "노원구", "listedName": "드림캐처클라이밍짐"}], "sources": ["seoul"]}, {"id": "gym-038", "name": "볼더클라이밍", "branches": [{"label": "", "region": "서울", "city": "노원구", "listedName": "볼더클라이밍짐"}], "sources": ["seoul"]}, {"id": "gym-039", "name": "비숍클라이밍", "branches": [{"label": "", "region": "서울", "city": "노원구", "listedName": "비숍클라이밍"}], "sources": ["seoul"]}, {"id": "gym-040", "name": "스파이더스 클라이밍센터", "branches": [{"label": "", "region": "서울", "city": "노원구", "listedName": "스파이더스 클라이밍센터"}], "sources": ["seoul"]}, {"id": "gym-041", "name": "오름클라이밍", "branches": [{"label": "", "region": "서울", "city": "노원구", "listedName": "오름클라이밍"}], "sources": ["seoul"]}, {"id": "gym-042", "name": "활바위등반타운암장", "branches": [{"label": "", "region": "서울", "city": "노원구", "listedName": "활바위등반타운암장"}], "sources": ["seoul"]}, {"id": "gym-043", "name": "도봉파워클라이밍센터", "branches": [{"label": "", "region": "서울", "city": "도봉구", "listedName": "도봉파워클라이밍센터"}], "sources": ["seoul"]}, {"id": "gym-044", "name": "산타클라이밍", "branches": [{"label": "", "region": "서울", "city": "동대문구", "listedName": "산타클라이밍짐"}], "sources": ["seoul"]}, {"id": "gym-045", "name": "서울클라이밍센터", "branches": [{"label": "", "region": "서울", "city": "동대문구", "listedName": "서울클라이밍센터"}], "sources": ["seoul"]}, {"id": "gym-046", "name": "웨어하우스 볼더링", "branches": [{"label": "", "region": "서울", "city": "동대문구", "listedName": "웨어하우스 볼더링"}], "sources": ["seoul"]}, {"id": "gym-048", "name": "망원클라이밍피트니스", "branches": [{"label": "", "region": "서울", "city": "마포구", "listedName": "망원클라이밍피트니스"}], "sources": ["seoul"]}, {"id": "gym-049", "name": "서울시산악문화체험센터", "branches": [{"label": "", "region": "서울", "city": "마포구", "listedName": "서울시산악문화체험센터"}], "sources": ["seoul"]}, {"id": "gym-050", "name": "써미트클라이밍센터", "branches": [{"label": "", "region": "서울", "city": "마포구", "listedName": "써미트클라이밍센터"}], "sources": ["seoul"]}, {"id": "gym-051", "name": "홍대클라이밍", "branches": [{"label": "", "region": "서울", "city": "마포구", "listedName": "홍대클라이밍"}], "sources": ["seoul"]}, {"id": "gym-052", "name": "더클라이밍", "branches": [{"label": "", "region": "서울", "city": "서초구", "listedName": "더클라이밍짐"}], "sources": ["seoul"]}, {"id": "gym-053", "name": "볼더랜드", "branches": [{"label": "", "region": "서울", "city": "서초구", "listedName": "볼더랜드"}], "sources": ["seoul"]}, {"id": "gym-055", "name": "손정준 스포츠클라이밍연구소", "branches": [{"label": "", "region": "서울", "city": "성동구", "listedName": "손정준 스포츠클라이밍연구소"}], "sources": ["seoul"]}, {"id": "gym-059", "name": "루트클라이밍", "branches": [{"label": "", "region": "서울", "city": "송파구", "listedName": "루트클라이밍"}], "sources": ["seoul"]}, {"id": "gym-060", "name": "브릭스클라이밍", "branches": [{"label": "", "region": "서울", "city": "송파구", "listedName": "브릭스클라이밍짐"}], "sources": ["seoul"]}, {"id": "gym-061", "name": "클라이밍월", "branches": [{"label": "", "region": "서울", "city": "송파구", "listedName": "클라이밍월"}], "sources": ["seoul"]}, {"id": "gym-062", "name": "클라임투더문", "branches": [{"label": "", "region": "서울", "city": "송파구", "listedName": "클라임투더문"}], "sources": ["seoul"]}, {"id": "gym-063", "name": "목동클라이밍센터", "branches": [{"label": "", "region": "서울", "city": "양천구", "listedName": "목동클라이밍센터"}], "sources": ["seoul"]}, {"id": "gym-064", "name": "서종국클라이밍", "branches": [{"label": "", "region": "서울", "city": "영등포구", "listedName": "서종국클라이밍짐"}], "sources": ["seoul"]}, {"id": "gym-065", "name": "클라임러버", "branches": [{"label": "", "region": "서울", "city": "영등포구", "listedName": "클라임러버"}], "sources": ["seoul"]}, {"id": "gym-066", "name": "클라임웍스", "branches": [{"label": "", "region": "서울", "city": "영등포구", "listedName": "클라임웍스"}], "sources": ["seoul"]}, {"id": "gym-067", "name": "오프더월클라이밍", "branches": [{"label": "", "region": "서울", "city": "용산구", "listedName": "오프더월클라이밍"}], "sources": ["seoul"]}, {"id": "gym-068", "name": "써니사이드클라이밍", "branches": [{"label": "", "region": "서울", "city": "은평구", "listedName": "써니사이드클라이밍"}], "sources": ["seoul"]}, {"id": "gym-070", "name": "플래시볼더스 클라이밍", "branches": [{"label": "", "region": "서울", "city": "중구", "listedName": "플래시볼더스 클라이밍"}], "sources": ["seoul"]}, {"id": "gym-071", "name": "마스터클라이밍", "branches": [{"label": "", "region": "서울", "city": "중랑구", "listedName": "마스터클라이밍"}], "sources": ["seoul"]}, {"id": "gym-073", "name": "두루봉암장", "branches": [{"label": "", "region": "경기", "city": "고양시", "listedName": "두루봉암장"}], "sources": ["gyeonggi"]}, {"id": "gym-074", "name": "일산SK클라이밍", "branches": [{"label": "", "region": "경기", "city": "고양시", "listedName": "일산SK클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-075", "name": "일산클라이밍센터", "branches": [{"label": "", "region": "경기", "city": "고양시", "listedName": "일산클라이밍센터"}], "sources": ["gyeonggi"]}, {"id": "gym-077", "name": "클라이밍 하이프렉스", "branches": [{"label": "", "region": "경기", "city": "고양시", "listedName": "클라이밍 하이프렉스"}], "sources": ["gyeonggi"]}, {"id": "gym-078", "name": "페퍼 클라이밍", "branches": [{"label": "", "region": "경기", "city": "고양시", "listedName": "페퍼 클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-079", "name": "하이포인트 클라이밍", "branches": [{"label": "", "region": "경기", "city": "고양시", "listedName": "하이포인트 클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-080", "name": "마운틴스타 클라이밍", "branches": [{"label": "", "region": "경기", "city": "구리시", "listedName": "마운틴스타 클라이밍짐"}], "sources": ["gyeonggi"]}, {"id": "gym-081", "name": "경기클라이밍센터", "branches": [{"label": "", "region": "경기", "city": "군포시", "listedName": "경기클라이밍센터"}], "sources": ["gyeonggi"]}, {"id": "gym-082", "name": "락클라이밍산본", "branches": [{"label": "", "region": "경기", "city": "군포시", "listedName": "락클라이밍산본"}], "sources": ["gyeonggi"]}, {"id": "gym-083", "name": "산본클라이밍센터", "branches": [{"label": "", "region": "경기", "city": "군포시", "listedName": "산본클라이밍센터"}], "sources": ["gyeonggi"]}, {"id": "gym-084", "name": "스파이시 클라이밍", "branches": [{"label": "", "region": "경기", "city": "군포시", "listedName": "스파이시 클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-085", "name": "잼클라이밍", "branches": [{"label": "", "region": "경기", "city": "김포시", "listedName": "잼클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-087", "name": "테키클라이밍", "branches": [{"label": "", "region": "경기", "city": "김포시", "listedName": "테키클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-088", "name": "픽클라이밍", "branches": [{"label": "", "region": "경기", "city": "김포시", "listedName": "픽클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-089", "name": "다이노클라이밍", "branches": [{"label": "", "region": "경기", "city": "남양주시", "listedName": "다이노클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-090", "name": "무브온클라이밍", "branches": [{"label": "", "region": "경기", "city": "남양주시", "listedName": "무브온클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-091", "name": "엠투클라이밍", "branches": [{"label": "", "region": "경기", "city": "남양주시", "listedName": "엠투클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-092", "name": "퍼즐클라이밍", "branches": [{"label": "", "region": "경기", "city": "남양주시", "listedName": "퍼즐클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-093", "name": "두드림클라이밍센터", "branches": [{"label": "", "region": "경기", "city": "동두천시", "listedName": "두드림클라이밍센터"}], "sources": ["gyeonggi"]}, {"id": "gym-094", "name": "부천 클라이밍센터", "branches": [{"label": "", "region": "경기", "city": "부천시", "listedName": "부천 클라이밍센터"}], "sources": ["gyeonggi"]}, {"id": "gym-095", "name": "월드클라이밍", "branches": [{"label": "", "region": "경기", "city": "부천시", "listedName": "월드클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-096", "name": "캐치스톤클라이밍", "branches": [{"label": "", "region": "경기", "city": "부천시", "listedName": "캐치스톤클라이밍짐"}], "sources": ["gyeonggi"]}, {"id": "gym-097", "name": "팍스클라이밍센터", "branches": [{"label": "", "region": "경기", "city": "부천시", "listedName": "팍스클라이밍센터"}], "sources": ["gyeonggi"]}, {"id": "gym-098", "name": "그립픽클라이밍", "branches": [{"label": "", "region": "경기", "city": "성남시", "listedName": "그립픽클라이밍짐"}], "sources": ["gyeonggi"]}, {"id": "gym-099", "name": "더볼더", "branches": [{"label": "", "region": "경기", "city": "성남시", "listedName": "더볼더"}], "sources": ["gyeonggi"]}, {"id": "gym-100", "name": "락트리클라이밍 분당", "branches": [{"label": "", "region": "경기", "city": "성남시", "listedName": "락트리클라이밍 분당"}], "sources": ["gyeonggi"]}, {"id": "gym-101", "name": "락페이스클라이밍", "branches": [{"label": "", "region": "경기", "city": "성남시", "listedName": "락페이스클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-102", "name": "비클라이밍", "branches": [{"label": "", "region": "경기", "city": "성남시", "listedName": "비클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-103", "name": "성남스포츠클라이밍센터", "branches": [{"label": "", "region": "경기", "city": "성남시", "listedName": "성남스포츠클라이밍센터"}], "sources": ["gyeonggi"]}, {"id": "gym-104", "name": "스파이더실내암벽클라이밍", "branches": [{"label": "", "region": "경기", "city": "성남시", "listedName": "스파이더실내암벽클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-106", "name": "서수원클라이밍센터", "branches": [{"label": "", "region": "경기", "city": "수원시", "listedName": "서수원클라이밍센터"}], "sources": ["gyeonggi"]}, {"id": "gym-107", "name": "수원라온클라이밍", "branches": [{"label": "", "region": "경기", "city": "수원시", "listedName": "수원라온클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-108", "name": "수원크럭스존클라이밍", "branches": [{"label": "", "region": "경기", "city": "수원시", "listedName": "수원크럭스존클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-109", "name": "슈퍼비 클라이밍", "branches": [{"label": "", "region": "경기", "city": "수원시", "listedName": "슈퍼비 클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-113", "name": "킹콩클라이밍", "branches": [{"label": "", "region": "경기", "city": "수원시", "listedName": "킹콩클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-114", "name": "포에버클라이밍", "branches": [{"label": "", "region": "경기", "city": "수원시", "listedName": "포에버클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-115", "name": "피크닉클라이밍", "branches": [{"label": "", "region": "경기", "city": "수원시", "listedName": "피크닉클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-116", "name": "볼더가든", "branches": [{"label": "", "region": "경기", "city": "시흥시", "listedName": "볼더가든"}], "sources": ["gyeonggi"]}, {"id": "gym-117", "name": "시흥스포츠클라이밍센터", "branches": [{"label": "", "region": "경기", "city": "시흥시", "listedName": "시흥스포츠클라이밍센터"}], "sources": ["gyeonggi"]}, {"id": "gym-118", "name": "캐치클라이밍", "branches": [{"label": "", "region": "경기", "city": "시흥시", "listedName": "캐치클라이밍짐"}], "sources": ["gyeonggi"]}, {"id": "gym-120", "name": "안산베이스캠프 클라이밍", "branches": [{"label": "", "region": "경기", "city": "안산시", "listedName": "안산베이스캠프 클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-121", "name": "안산선부클라이밍", "branches": [{"label": "", "region": "경기", "city": "안산시", "listedName": "안산선부클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-122", "name": "클라이밍 트리클", "branches": [{"label": "", "region": "경기", "city": "안산시", "listedName": "클라이밍 트리클"}], "sources": ["gyeonggi"]}, {"id": "gym-123", "name": "클럽클라이밍", "branches": [{"label": "", "region": "경기", "city": "안산시", "listedName": "클럽클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-124", "name": "안성클라이밍센터", "branches": [{"label": "", "region": "경기", "city": "안성시", "listedName": "안성클라이밍센터"}], "sources": ["gyeonggi"]}, {"id": "gym-125", "name": "원더월클라이밍", "branches": [{"label": "", "region": "경기", "city": "안성시", "listedName": "원더월클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-126", "name": "클라이밍더하기", "branches": [{"label": "", "region": "경기", "city": "안성시", "listedName": "클라이밍더하기"}], "sources": ["gyeonggi"]}, {"id": "gym-127", "name": "김종헌클라이밍센터", "branches": [{"label": "", "region": "경기", "city": "안양시", "listedName": "김종헌클라이밍센터"}], "sources": ["gyeonggi"]}, {"id": "gym-128", "name": "더렛지 클라이밍", "branches": [{"label": "", "region": "경기", "city": "안양시", "listedName": "더렛지 클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-129", "name": "실내암벽클라임홀릭", "branches": [{"label": "", "region": "경기", "city": "안양시", "listedName": "실내암벽클라임홀릭"}], "sources": ["gyeonggi"]}, {"id": "gym-131", "name": "펀클라임", "branches": [{"label": "", "region": "경기", "city": "안양시", "listedName": "펀클라임짐"}], "sources": ["gyeonggi"]}, {"id": "gym-132", "name": "더바이브클라이밍", "branches": [{"label": "", "region": "경기", "city": "양주시", "listedName": "더바이브클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-133", "name": "여주클라이밍센터", "branches": [{"label": "", "region": "경기", "city": "여주시", "listedName": "여주클라이밍센터"}], "sources": ["gyeonggi"]}, {"id": "gym-134", "name": "경기레포츠클라이밍", "branches": [{"label": "", "region": "경기", "city": "용인시", "listedName": "경기레포츠클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-135", "name": "더그릿클라이밍", "branches": [{"label": "", "region": "경기", "city": "용인시", "listedName": "더그릿클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-136", "name": "에잇픽스클라이밍", "branches": [{"label": "", "region": "경기", "city": "의왕시", "listedName": "에잇픽스클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-137", "name": "산클암장", "branches": [{"label": "", "region": "경기", "city": "의정부시", "listedName": "산클암장"}], "sources": ["gyeonggi"]}, {"id": "gym-138", "name": "샤모니클라이밍", "branches": [{"label": "", "region": "경기", "city": "의정부시", "listedName": "샤모니클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-139", "name": "킹클라이밍", "branches": [{"label": "", "region": "경기", "city": "의정부시", "listedName": "킹클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-140", "name": "이천굿클라이밍", "branches": [{"label": "", "region": "경기", "city": "이천시", "listedName": "이천굿클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-142", "name": "클라임원", "branches": [{"label": "", "region": "경기", "city": "이천시", "listedName": "클라임원"}], "sources": ["gyeonggi"]}, {"id": "gym-143", "name": "타잔클라이밍", "branches": [{"label": "", "region": "경기", "city": "이천시", "listedName": "타잔클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-144", "name": "애스트로맨 클라이밍센터", "branches": [{"label": "", "region": "경기", "city": "파주시", "listedName": "애스트로맨 클라이밍센터"}], "sources": ["gyeonggi"]}, {"id": "gym-145", "name": "운정점핑클라이밍", "branches": [{"label": "", "region": "경기", "city": "파주시", "listedName": "운정점핑클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-146", "name": "정글 클라이밍센터", "branches": [{"label": "", "region": "경기", "city": "파주시", "listedName": "정글짐 클라이밍센터"}], "sources": ["gyeonggi"]}, {"id": "gym-147", "name": "파주클라이밍센터", "branches": [{"label": "", "region": "경기", "city": "파주시", "listedName": "파주클라이밍센터"}], "sources": ["gyeonggi"]}, {"id": "gym-148", "name": "트윈클라이밍", "branches": [{"label": "", "region": "경기", "city": "평택시", "listedName": "트윈클라이밍짐"}], "sources": ["gyeonggi"]}, {"id": "gym-151", "name": "힐앤토클라이밍", "branches": [{"label": "", "region": "경기", "city": "평택시", "listedName": "힐앤토클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-152", "name": "CL클라이밍", "branches": [{"label": "", "region": "경기", "city": "화성시", "listedName": "CL클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-154", "name": "볼더박스 클라임", "branches": [{"label": "", "region": "경기", "city": "화성시", "listedName": "볼더박스 클라임"}], "sources": ["gyeonggi"]}, {"id": "gym-155", "name": "아이언팜스 클라이밍센터", "branches": [{"label": "", "region": "경기", "city": "화성시", "listedName": "아이언팜스 클라이밍센터"}], "sources": ["gyeonggi"]}, {"id": "gym-156", "name": "엑스클라이밍", "branches": [{"label": "", "region": "경기", "city": "화성시", "listedName": "엑스클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-157", "name": "클라임어클락", "branches": [{"label": "", "region": "경기", "city": "화성시", "listedName": "클라임어클락"}], "sources": ["gyeonggi"]}, {"id": "gym-158", "name": "홀드앤락클라이밍", "branches": [{"label": "", "region": "경기", "city": "화성시", "listedName": "홀드앤락클라이밍"}], "sources": ["gyeonggi"]}, {"id": "gym-159", "name": "화성클라이밍클럽", "branches": [{"label": "", "region": "경기", "city": "화성시", "listedName": "화성클라이밍클럽"}], "sources": ["gyeonggi"]}]};
const gyms=gymCatalog.gyms.slice().sort((a,b)=>a.name.localeCompare(b.name,'ko'));
const palette=Array.from(document.querySelectorAll('[data-heart]'));
// Keep immutable color templates so later shape changes never rewrite placed marks.
const shapeSelect=$('shapeSelect');
const markShapes={
  heart:{label:'하트'},
  hold:{label:'홀드',fillRule:'evenodd',path:'M39 34 C22 52 20 83 32 108 C43 131 44 159 64 178 C86 199 113 201 137 187 C157 177 183 174 195 152 C208 128 195 107 190 85 C184 59 188 36 164 20 C137 1 113 12 89 9 C67 6 50 17 39 34 Z M129 108 C129 100 124 95 117 96 C110 96 105 102 106 109 C106 117 111 122 118 121 C125 121 130 115 129 108 Z'},
  hand:{label:'손',details:'M84 141 Q94 132 94 119 M122 152 Q132 140 131 126 M159 148 Q166 137 163 126',path:'M82 40 C62 44 48 57 35 72 L22 86 C14 94 18 106 30 108 C42 109 54 99 65 96 Q73 93 71 104 C67 117 57 128 46 135 C36 142 40 153 52 153 C66 154 76 147 84 141 C80 152 86 162 98 162 C108 163 116 158 122 152 C124 163 134 167 145 162 C153 159 157 153 159 148 C167 158 180 155 186 144 C197 124 190 87 174 65 C159 42 126 32 101 36 Q90 37 82 40 Z'},
  lightning:{label:'번개',path:'M113 193 Q118 201 130 199 L177 193 Q193 191 184 177 L140 117 Q137 112 145 112 L179 115 Q196 116 184 101 L87 8 Q74 -4 81 17 L100 76 Q102 82 94 81 L51 77 Q35 76 44 91 Z'},
  star:{label:'별',path:'M107 190 Q115 207 123 189 L144 145 Q147 136 157 136 L198 134 Q216 133 204 120 L174 87 Q168 81 171 71 L181 24 Q185 8 171 17 L128 43 Q120 48 112 43 L73 16 Q57 5 61 24 L68 72 Q70 81 62 87 L29 117 Q15 130 34 132 L78 137 Q87 138 91 149 Z'},
  flower:{label:'꽃',path:'M81 147 C65 184 88 205 112 201 C138 199 151 175 140 147 C169 169 197 159 204 136 C212 110 192 91 160 90 C189 67 182 36 160 24 C139 12 120 27 111 51 C103 23 77 9 55 23 C31 39 40 68 66 86 C34 85 16 107 24 131 C31 155 57 165 81 147 Z'},
  circle:{label:'원',path:'M110 198 C163 202 200 164 204 113 C210 61 177 8 124 0 C70 -8 26 25 22 79 C15 132 47 189 110 198 Z'},
  triangle:{label:'삼각형',path:'M95 184 C104 202 119 204 129 185 C153 145 176 96 200 49 C213 25 202 12 178 12 C132 8 82 7 43 14 C21 17 18 32 30 52 C54 96 73 142 95 184 Z'},
  square:{label:'네모',path:'M60 192 C100 199 149 195 176 188 Q198 183 199 156 C201 113 206 66 196 27 Q192 7 167 4 C125 -2 78 -4 48 5 Q27 10 26 35 C23 79 21 128 29 165 Q34 186 60 192 Z'},
  diamond:{label:'마름모',path:'M100 190 Q112 205 125 190 C148 165 172 140 195 115 Q210 101 196 86 C172 59 145 34 121 10 Q109 -3 97 11 C72 37 51 62 28 88 Q16 102 30 117 C54 142 77 167 100 190 Z'}
};
const markTemplates=new Map(palette.map(button=>[button.dataset.heart,{svg:button.querySelector('svg').cloneNode(true),label:button.title||button.dataset.heart}]));
function markKey(shape,color){return shape==='heart'?color:shape+':'+color;}
function markSVG(key){
  const [shape,color]=key.includes(':')?key.split(':'):['heart',key];
  const template=markTemplates.get(color),design=markShapes[shape]||markShapes.heart;
  const svg=template.svg.cloneNode(true);
  if(design.path)svg.querySelector('path').setAttribute('d',design.path);
  if(design.fillRule)svg.querySelector('path').setAttribute('fill-rule',design.fillRule);
  if(design.details){
    const lines=svg.querySelector('path').cloneNode(true);
    lines.setAttribute('d',design.details);
    lines.setAttribute('fill','none');
    lines.setAttribute('stroke',color==='🖤'?'#ffffff':'#111111');
    lines.setAttribute('stroke-width','3');
    lines.setAttribute('stroke-opacity','.65');
    lines.setAttribute('stroke-linecap','round');
    lines.setAttribute('stroke-linejoin','round');
    svg.append(lines);
  }
  svg.setAttribute('aria-label',template.label+' '+design.label);
  return svg;
}
function updateShapePalette(){
  palette.forEach(button=>{
    const key=markKey(state.shape,button.dataset.heart);
    button.replaceChildren(markSVG(key));
    button.setAttribute('aria-label',markTemplates.get(button.dataset.heart).label+' '+markShapes[state.shape].label+' 추가');
  });
  editorViewport.syncCounts?.();
}
const alignmentButtons=Array.from(document.querySelectorAll('[data-align]'));
const ratioButtons=Array.from(document.querySelectorAll('[data-ratio]'));
const problemOrderStorageKey='wonine.problemOrder';
function readProblemOrder(){
  try{return localStorage.getItem(problemOrderStorageKey)==='added'?'added':'color';}
  catch{return 'color';}
}
// Keep insertion history intact so switching modes restores the original order.
// Explicit line breaks bound each independent color group.
function arrangedMarks(marks,mode){
  if(mode==='added')return marks.slice();
  const result=[];let groups=new Map();
  function flush(){for(const group of groups.values())result.push(...group);groups=new Map();}
  for(const key of marks){
    if(key==='\n'){flush();result.push(key);continue;}
    const color=key.includes(':')?key.split(':')[1]:key;
    if(!groups.has(color))groups.set(color,[]);
    groups.get(color).push(key);
  }
  flush();return result;
}
const problemOrderButtons=[$('orderByColor'),$('orderByAdded')];
const state={problemOrder:readProblemOrder(),alignment:'left',x:0,y:0,hearts:[],shape:'heart',photoURL:null,loadVersion:0,ratio:'3:4',fontFamily:'Wave',fontVersion:0,fontLoading:false};
let queued=false,drag=null;
fontSelect.value='Wave';
let fontPending=Promise.resolve();
// Match the median visible Hangul height: Wave ~0.683 em, other faces ~0.896 em.
function fontDisplayScale(family){return family==='Wave'?1.3:1;}
function fontStatus(message){$('fontStatus').textContent=message;$('fontStatus').hidden=!message;}
fontSelect.addEventListener('change',()=>{
  const family=fontSelect.value;
  if(family!=='Wave'&&!fontChoices.some(font=>font.family===family))return;
  const version=++state.fontVersion,previous=state.fontFamily;
  state.fontLoading=true;$('saveResult').disabled=true;fontStatus('폰트를 불러오는 중…');
  fontPending=(async()=>{
    try{
      const faces=await document.fonts.load('400 '+size.value+'px "'+family+'"',text.value||'한글');
      if(!faces.length)throw new Error('font');
      if(version!==state.fontVersion)return;
      state.fontFamily=family;syncFontPicker();update();fontStatus('');
    }catch(error){
      if(version!==state.fontVersion)return;
      fontSelect.value=previous;syncFontPicker();fontStatus('폰트를 불러오지 못했어요. 이전 폰트를 유지했어요. 다시 선택해 주세요.');
    }finally{
      if(version===state.fontVersion){state.fontLoading=false;$('saveResult').disabled=exporting;schedulePosition();}
    }
  })();
});
const fontMenuChoices=[{family:'Wave',label:'원이네'},...fontChoices];
let activeFont=0;
function syncFontPicker(){
  $('fontTrigger').textContent=fontMenuChoices.find(font=>font.family===fontSelect.value)?.label||'원이네';
  Array.from($('fontList').children).forEach((item,i)=>item.setAttribute('aria-selected',String(fontMenuChoices[i].family===fontSelect.value)));
}
function activateFont(index){
  activeFont=index;
  Array.from($('fontList').children).forEach((item,i)=>item.className='font-option'+(index===i?' is-active':''));
  const item=$('fontList').children[index];
  if(item){$('fontList').setAttribute('aria-activedescendant',item.id);item.scrollIntoView({block:'nearest'});}
}
function closeFontPicker(restoreFocus=false){
  $('fontList').hidden=true;$('fontTrigger').setAttribute('aria-expanded','false');
  if(restoreFocus)$('fontTrigger').focus();
}
function chooseFont(index){
  fontSelect.value=fontMenuChoices[index].family;syncFontPicker();
  fontSelect.dispatchEvent(new Event('change'));closeFontPicker(true);
}
fontMenuChoices.forEach((font,index)=>{
  const item=document.createElement('div');item.id='font-option-'+index;item.className='font-option';item.setAttribute('role','option');
  item.style.fontFamily='"'+font.family+'", sans-serif';item.dataset.font=font.family;
  const name=document.createElement('span');name.className='font-option-name';name.textContent=font.label;
  const sample=document.createElement('span');sample.className='font-option-sample';sample.textContent='썸네일 만들기';
  item.append(name);item.append(sample);
  item.addEventListener('mousedown',event=>event.preventDefault());item.addEventListener('click',()=>chooseFont(index));
  $('fontList').append(item);
});
syncFontPicker();
function openFontPicker(){
  $('fontList').hidden=false;$('fontTrigger').setAttribute('aria-expanded','true');syncFontPicker();
  activateFont(Math.max(0,fontMenuChoices.findIndex(font=>font.family===fontSelect.value)));$('fontList').focus();
}
$('fontTrigger').addEventListener('click',()=>$('fontList').hidden?openFontPicker():closeFontPicker(true));
$('fontTrigger').addEventListener('keydown',event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();openFontPicker();}});
$('fontList').addEventListener('keydown',event=>{
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();activateFont(Math.max(0,Math.min(fontMenuChoices.length-1,activeFont+(event.key==='ArrowDown'?1:-1))));}
  else if(event.key==='Home'||event.key==='End'){event.preventDefault();activateFont(event.key==='Home'?0:fontMenuChoices.length-1);}
  else if(event.key==='Enter'||event.key===' '){event.preventDefault();chooseFont(activeFont);}
  else if(event.key==='Escape'){event.preventDefault();closeFontPicker(true);}
  else if(event.key==='Tab'){closeFontPicker();$('fontTrigger').focus();}
});
window.addEventListener('pointerdown',event=>{if(!$('fontPicker').contains(event.target))closeFontPicker();});
window.addEventListener('focusin',event=>{if(!$('fontPicker').contains(event.target))closeFontPicker();});
function option(value,label){const item=document.createElement('option');item.value=value;item.textContent=label;return item;}
// Use the same trigger and option styling for region, gym, and branch.
function createSelectPicker(prefix,select){
  const root=$(prefix+'Picker'),trigger=$(prefix+'Trigger'),list=$(prefix+'List');
  let active=0;
  const options=()=>Array.from(select.children);
  function close(restore=false){list.hidden=true;trigger.setAttribute('aria-expanded','false');list.removeAttribute('aria-activedescendant');if(restore)trigger.focus();}
  function sync(){
    const selected=options().find(item=>item.value===select.value);
    trigger.textContent=selected?.textContent||options()[0]?.textContent||'';
    trigger.disabled=select.disabled;
    close();
  }
  function activate(index){
    active=Math.max(0,Math.min(options().length-1,index));
    Array.from(list.children).forEach((item,i)=>item.className='gym-option'+(i===active?' is-active':''));
    const item=list.children[active];
    if(item){list.setAttribute('aria-activedescendant',item.id);item.scrollIntoView({block:'nearest'});}
  }
  function choose(index){
    const item=options()[index];if(!item)return;
    select.value=item.value;select.dispatchEvent(new Event('change'));sync();close(true);
  }
  function open(){
    if(select.disabled)return;
    list.replaceChildren();
    options().forEach((option,index)=>{
      const item=document.createElement('div');item.id=prefix+'-option-'+index;item.className='gym-option';item.textContent=option.textContent;
      item.setAttribute('role','option');item.setAttribute('aria-selected',String(option.value===select.value));
      item.addEventListener('mousedown',event=>event.preventDefault());item.addEventListener('click',()=>choose(index));list.append(item);
    });
    list.hidden=false;trigger.setAttribute('aria-expanded','true');list.focus();
    activate(Math.max(0,options().findIndex(item=>item.value===select.value)));
  }
  trigger.addEventListener('click',()=>list.hidden?open():close(true));
  trigger.addEventListener('keydown',event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();open();}});
  list.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();activate(active+(event.key==='ArrowDown'?1:-1));}
    else if(event.key==='Home'||event.key==='End'){event.preventDefault();activate(event.key==='Home'?0:options().length-1);}
    else if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(active);}
    else if(event.key==='Escape'){event.preventDefault();close(true);}
    else if(event.key==='Tab'){close();trigger.focus();}
  });
  window.addEventListener('pointerdown',event=>{if(!root.contains(event.target))close();});
  window.addEventListener('focusin',event=>{if(!root.contains(event.target))close();});
  select.addEventListener('change',sync);sync();return {sync};
}
Object.entries(markShapes).forEach(([value,design])=>shapeSelect.append(option(value,design.label)));
shapeSelect.value='heart';
shapeSelect.addEventListener('change',()=>{
  if(!markShapes[shapeSelect.value])return;
  state.shape=shapeSelect.value;updateShapePalette();
});
const shapePickerUI=createSelectPicker('shape',shapeSelect);
const regionPickerUI=createSelectPicker('region',regionSelect),branchPickerUI=createSelectPicker('branch',branchSelect);
function matchesRegion(branch){return !regionSelect.value||branch.region===regionSelect.value;}
function populateGyms(selected=''){
  const visible=gyms.filter(gym=>gym.branches.some(matchesRegion));
  gymSelect.replaceChildren(option('','직접 입력 / 암장 선택'));
  visible.forEach(gym=>gymSelect.append(option(gym.id,gym.name)));
  gymSelect.value=visible.some(gym=>gym.id===selected)?selected:'';
  syncGymTrigger();
}
function populateBranches(gym,selected=''){
  branchSelect.replaceChildren(option('','지점 선택'));
  branchField.hidden=!gym||gym.branches.length<2;
  branchSelect.disabled=branchField.hidden;
  if(gym)gym.branches.forEach((branch,index)=>{if(matchesRegion(branch))branchSelect.append(option(String(index),branch.label));});
  branchSelect.value=selected!==''&&gym&&gym.branches[Number(selected)]&&matchesRegion(gym.branches[Number(selected)])?selected:'';
  branchPickerUI.sync();
}
const gymTrigger=$('gymTrigger'),gymSearch=$('gymSearch'),gymSearchPanel=$('gymSearchPanel'),gymResults=$('gymResults');
let gymMatches=[],activeGym=-1;
function syncGymTrigger(){
  $('gymTrigger').textContent=gyms.find(gym=>gym.id===gymSelect.value)?.name||'직접 입력 / 암장 선택';
}
function gymSearchKey(value){return value.normalize('NFC').replace(/\s+/g,'').toLocaleLowerCase('ko');}
function activateGym(index){
  activeGym=index;
  Array.from(gymResults.children).forEach((item,i)=>item.className='gym-option'+(i===index?' is-active':''));
  const item=gymResults.children[index];
  if(item){gymSearch.setAttribute('aria-activedescendant',item.id);item.scrollIntoView({block:'nearest'});}
  else gymSearch.removeAttribute('aria-activedescendant');
}
function renderGymMatches(){
  const query=gymSearchKey(gymSearch.value);
  gymMatches=[{id:'',name:'직접 입력 / 암장 선택'},...gyms.filter(gym=>gym.branches.some(matchesRegion)&&gymSearchKey(gym.name).includes(query))];
  gymResults.replaceChildren();
  gymMatches.forEach((gym,index)=>{
    const item=document.createElement('div');item.id='gym-result-'+index;item.className='gym-option';item.textContent=gym.name;
    item.setAttribute('role','option');item.setAttribute('aria-selected',String(gym.id===gymSelect.value));
    item.addEventListener('mousedown',event=>event.preventDefault());
    item.addEventListener('click',()=>chooseGym(index));gymResults.append(item);
  });
  $('gymSearchEmpty').hidden=gymMatches.length>1;
  activateGym(query?(gymMatches.length>1?1:0):Math.max(0,gymMatches.findIndex(gym=>gym.id===gymSelect.value)));
}
function closeGymSearch(restoreFocus=false){
  gymSearchPanel.hidden=true;gymTrigger.setAttribute('aria-expanded','false');gymSearch.setAttribute('aria-expanded','false');
  gymSearch.removeAttribute('aria-activedescendant');if(restoreFocus)gymTrigger.focus();
}
function openGymSearch(){
  gymSearchPanel.hidden=false;gymTrigger.setAttribute('aria-expanded','true');gymSearch.setAttribute('aria-expanded','true');
  gymSearch.value='';renderGymMatches();gymSearch.focus();
}
function chooseGym(index){
  const gym=gymMatches[index];if(!gym)return;
  gymSelect.value=gym.id;gymSelect.dispatchEvent(new Event('change'));closeGymSearch(true);
}
gymTrigger.addEventListener('click',()=>gymSearchPanel.hidden?openGymSearch():closeGymSearch(true));
gymTrigger.addEventListener('keydown',event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();openGymSearch();}});
gymSearch.addEventListener('input',renderGymMatches);
gymSearch.addEventListener('keydown',event=>{
  if(event.isComposing)return;
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();activateGym(Math.max(0,Math.min(gymMatches.length-1,activeGym+(event.key==='ArrowDown'?1:-1))));}
  else if(event.key==='Enter'){event.preventDefault();chooseGym(activeGym);}
  else if(event.key==='Escape'){event.preventDefault();closeGymSearch(true);}
  else if(event.key==='Tab')closeGymSearch();
});
window.addEventListener('pointerdown',event=>{if(!$('gymSearchPicker').contains(event.target))closeGymSearch();});
window.addEventListener('focusin',event=>{if(!$('gymSearchPicker').contains(event.target))closeGymSearch();});
populateGyms();
regionSelect.addEventListener('change',()=>{
  closeGymSearch();
  const selectedGym=gymSelect.value,selectedBranch=branchSelect.value;
  populateGyms(selectedGym);
  populateBranches(gyms.find(gym=>gym.id===gymSelect.value),selectedBranch);
  // Filtering changes only the choices, never the user's caption.
});
gymSelect.addEventListener('change',()=>{
  const gym=gyms.find(item=>item.id===gymSelect.value);
  populateBranches(gym);
  if(gym){text.value=gym.name;update();}
  syncGymTrigger();
});
branchSelect.addEventListener('change',()=>{
  const gym=gyms.find(item=>item.id===gymSelect.value);if(!gym)return;
  const branch=branchSelect.value===''?null:gym.branches[Number(branchSelect.value)];
  text.value=branch?gym.name+' '+branch.label:gym.name;update();
});
// Manual wording stays editable; the selectors never overwrite typed text.
text.addEventListener('input',()=>{gymSelect.value='';populateBranches(null);syncGymTrigger();});
function syncGymSelection(){
  for(const gym of gyms){
    const index=gym.branches.findIndex(branch=>(branch.label?gym.name+' '+branch.label:gym.name)===text.value);
    if(index!==-1){gymSelect.value=gym.id;populateBranches(gym);if(gym.branches.length>1)branchSelect.value=String(index);branchPickerUI.sync();syncGymTrigger();return;}
  }
  gymSelect.value='';populateBranches(null);syncGymTrigger();
}
function updateRatio(){
  const visible=Boolean(state.photoURL);
  $('photoDetails').hidden=!visible;$('ratioControls').hidden=!visible;
  stage.style.aspectRatio=visible?state.ratio.replace(':',' / '):'auto';
  ratioButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.ratio===state.ratio)));
  schedulePosition();
}
ratioButtons.forEach(button=>button.addEventListener('click',()=>{state.ratio=button.dataset.ratio;updateRatio();}));
function currentBounds(){
  if(editorViewport.bounds)return editorViewport.bounds;
  return positionBounds(stage.clientWidth,stage.clientHeight,layer.offsetWidth,layer.offsetHeight);
}
function renderPosition(){
  if(!editorViewport.render?.()){
    if(!state.photoURL)stage.style.height=Math.max(260,layer.offsetHeight+60)+'px';
    else stage.style.height='auto';
  }
  const point=offsetFromPosition(currentBounds(),state.x,state.y);
  layer.style.left=point.left+'px';layer.style.top=point.top+'px';
  editorViewport.afterRender?.();
}
function schedulePosition(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;renderPosition();});}
function updateHearts(){
  problemOrderButtons.forEach((button,index)=>button.setAttribute('aria-pressed',String(state.problemOrder===(index===0?'color':'added'))));
  heartPreview.replaceChildren();
  function addRow(){
    const row=document.createElement('div');
    row.className='heart-row';
    row.style.justifyContent={left:'flex-start',center:'center',right:'flex-end'}[state.alignment];
    heartPreview.append(row);return row;
  }
  let row=state.hearts.length?addRow():null;
  arrangedMarks(state.hearts,state.problemOrder).forEach(key=>{
    if(key==='\n'){row=addRow();return;}
    const svg=markSVG(key);
    const path=svg.querySelector('path');
    path.setAttribute('stroke',strokeColor.value);
    path.setAttribute('stroke-width',outline.checked?'1':'0');
    path.setAttribute('vector-effect','non-scaling-stroke');
    row.append(svg);
  });
  heartPreview.hidden=state.hearts.length===0;
  removeHeart.disabled=!state.hearts.some(key=>key!=='\n');
  clearHearts.disabled=state.hearts.length===0;
  breakHearts.disabled=state.hearts.length===0;
  editorViewport.syncCounts?.();
}
// Use visible ink height, so font ascender/descender padding does not create
// a larger gap before the first heart row than between subsequent rows.
function lineSpacing(metrics,fontSize,gap=fontSize*.16){
  const ascent=metrics.actualBoundingBoxAscent,descent=metrics.actualBoundingBoxDescent;
  const height=ascent+descent;
  const leading=(height+gap-metrics.fontBoundingBoxAscent-metrics.fontBoundingBoxDescent)/2;
  return {gap,lineHeight:height+gap,top:leading+metrics.fontBoundingBoxAscent-ascent,bottom:leading+metrics.fontBoundingBoxDescent-descent};
}
function markColumnGap(baseSize){return baseSize/14;}
function updateLineSpacing(){
  const baseSize=Number(size.value),fontSize=baseSize*fontDisplayScale(state.fontFamily),gap=baseSize*.16;
  // SVG hearts have 12 units of transparent padding at both vertical ends.
  const heartInset=baseSize*.48*12/224;
  layer.style.setProperty('--heart-column-gap',markColumnGap(baseSize)+'px');
  layer.style.setProperty('--heart-row-gap',(gap-2*heartInset)+'px');
  layer.style.setProperty('--text-heart-gap',(gap-heartInset)+'px');
  preview.style.lineHeight=(fontSize+gap)+'px';
  preview.style.marginTop='0px';preview.style.marginBottom='0px';
  const context=document.createElement('canvas').getContext?.('2d');
  if(!context)return;
  context.font='400 '+fontSize+'px "'+state.fontFamily+'"';
  const metrics=context.measureText(preview.textContent.replace(/\n/g,'')||'한글');
  if(![metrics.actualBoundingBoxAscent,metrics.actualBoundingBoxDescent,metrics.fontBoundingBoxAscent,metrics.fontBoundingBoxDescent].every(Number.isFinite))return;
  const spacing=lineSpacing(metrics,fontSize,gap);
  if(spacing.lineHeight<=gap)return;
  preview.style.lineHeight=spacing.lineHeight+'px';
  preview.style.marginTop=-spacing.top+'px';preview.style.marginBottom=-spacing.bottom+'px';
}
function update(){
  preview.textContent=text.value.normalize('NFC');
  preview.style.fontFamily='"'+state.fontFamily+'", sans-serif';
  preview.style.fontSize=(Number(size.value)*fontDisplayScale(state.fontFamily))+'px';
  preview.style.letterSpacing=state.fontFamily==='Wave'?'0px':'-2px';
  layer.style.fontSize=size.value+'px';$('value').value=size.value+'px';
  preview.style.color=fillColor.value;
  preview.style.webkitTextStroke='0px transparent';
  preview.style.textShadow=outline.checked?textOutlineShadow(strokeColor.value):'none';
  layer.style.filter=shadow.checked?'drop-shadow(0 3px 4px rgba(0,0,0,0.32))':'none';
  layer.style.textAlign=state.alignment;
  alignmentButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.align===state.alignment)));
  updateLineSpacing();updateHearts();schedulePosition();
}
[text,size,fillColor,strokeColor].forEach(input=>input.addEventListener('input',update));
outline.addEventListener('change',update);
shadow.addEventListener('change',update);
alignmentButtons.forEach(button=>button.addEventListener('click',()=>{
  state.alignment=button.dataset.align;state.x={left:0,center:50,right:100}[state.alignment];update();
}));
problemOrderButtons.forEach((button,index)=>button.addEventListener('click',()=>{
  state.problemOrder=index===0?'color':'added';
  try{localStorage.setItem(problemOrderStorageKey,state.problemOrder);}catch{}
  updateHearts();schedulePosition();
}));
palette.forEach(button=>button.addEventListener('click',()=>{state.hearts.push(markKey(state.shape,button.dataset.heart));updateHearts();schedulePosition();}));
breakHearts.addEventListener('click',()=>{if(!state.hearts.length)return;state.hearts.push('\n');updateHearts();schedulePosition();});
removeHeart.addEventListener('click',()=>{
  // Remove the last heart, and discard trailing breaks that would leave empty rows.
  while(state.hearts.at(-1)==='\n')state.hearts.pop();
  state.hearts.pop();
  while(state.hearts.at(-1)==='\n')state.hearts.pop();
  updateHearts();schedulePosition();
});
clearHearts.addEventListener('click',()=>{state.hearts=[];updateHearts();schedulePosition();});
function showStatus(message){$('status').textContent=message;$('status').hidden=!message;}
photoInput.addEventListener('change',()=>{
  const file=photoInput.files[0];if(!file)return;
  const version=++state.loadVersion;
  if(file.type&&!file.type.startsWith('image/')){showStatus('이미지 파일을 선택해 주세요.');photoInput.value='';return;}
  const url=URL.createObjectURL(file),candidate=new Image();
  showStatus('이미지를 불러오는 중이에요.');
  candidate.onload=()=>{
    if(version!==state.loadVersion){URL.revokeObjectURL(url);return;}
    const previous=state.photoURL;state.photoURL=url;
    photo.src=url;photo.hidden=false;photo.alt=file.name;stage.classList.add('has-photo');
    stage.style.height='auto';removePhoto.disabled=false;$('saveResult').disabled=exporting||state.fontLoading;$('photoName').textContent=file.name;$('photoName').title=file.name;
    state.x={left:0,center:50,right:100}[state.alignment];state.y=8;
    if(previous)URL.revokeObjectURL(previous);
    showStatus('');photoInput.value='';updateRatio();
  };
  candidate.onerror=()=>{
    URL.revokeObjectURL(url);
    if(version===state.loadVersion){showStatus('이 이미지를 열 수 없어요. JPG, PNG 또는 WebP 파일로 다시 선택해 주세요.');photoInput.value='';}
  };
  candidate.src=url;
});
photo.addEventListener('load',schedulePosition);
removePhoto.addEventListener('click',()=>{
  state.loadVersion++;if(state.photoURL)URL.revokeObjectURL(state.photoURL);state.photoURL=null;
  photo.hidden=true;photo.removeAttribute('src');stage.classList.remove('has-photo');
  removePhoto.disabled=true;$('saveResult').disabled=exporting||state.fontLoading;photoInput.value='';$('photoName').textContent='';$('photoName').title='';showStatus('');state.y=0;updateRatio();photoInput.focus();
});
layer.addEventListener('pointerdown',event=>{
  if(event.button!==0||!event.isPrimary)return;
  event.preventDefault();layer.focus({preventScroll:true});
  const point=offsetFromPosition(currentBounds(),state.x,state.y);
  drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,left:point.left,top:point.top};
  layer.setPointerCapture(event.pointerId);
});
layer.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  const displayScale=stage.getBoundingClientRect().width/stage.clientWidth||1;
  const pos=positionFromOffset(currentBounds(),drag.left+(event.clientX-drag.startX)/displayScale,drag.top+(event.clientY-drag.startY)/displayScale);
  state.x=pos.x;state.y=pos.y;renderPosition();
});
function endDrag(event){if(drag&&drag.id===event.pointerId){drag=null;if(layer.hasPointerCapture(event.pointerId))layer.releasePointerCapture(event.pointerId);}}
layer.addEventListener('pointerup',endDrag);layer.addEventListener('pointercancel',endDrag);layer.addEventListener('lostpointercapture',()=>{drag=null;});
layer.addEventListener('keydown',event=>{
  const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];if(!direction)return;
  event.preventDefault();const bounds=currentBounds(),point=offsetFromPosition(bounds,state.x,state.y),step=event.shiftKey?20:4;
  const pos=positionFromOffset(bounds,point.left+direction[0]*step,point.top+direction[1]*step);state.x=pos.x;state.y=pos.y;renderPosition();
});
const resizeObserver=new ResizeObserver(schedulePosition);resizeObserver.observe(stage);resizeObserver.observe(layer);
document.fonts.ready.then(()=>{updateLineSpacing();schedulePosition();});window.addEventListener('resize',schedulePosition);
window.addEventListener('pagehide',event=>{if(!event.persisted&&state.photoURL)URL.revokeObjectURL(state.photoURL);});
syncGymSelection();updateRatio();update();

// Export only authored line breaks; responsive wrapping belongs to the preview.
function explicitExportLayout(ctx,caption,hearts,baseSize,letterSpacing,alignment){
  const lines=caption.normalize('NFC').replace(/\r\n?/g,'\n').split('\n');
  if(!caption)lines.length=0;
  const gap=baseSize*.16,heartSize=baseSize*.48,heartInset=heartSize*12/224,columnGap=markColumnGap(baseSize);
  const metrics=ctx.measureText(lines.join('')||'한글');
  const ascent=Math.max(0,metrics.actualBoundingBoxAscent??metrics.fontBoundingBoxAscent??baseSize*.85);
  const descent=Math.max(0,metrics.actualBoundingBoxDescent??metrics.fontBoundingBoxDescent??baseSize*.15);
  const inkHeight=ascent+descent||baseSize;
  const textRows=lines.map(line=>{
    const segments=Array.from(new Intl.Segmenter('ko',{granularity:'grapheme'}).segment(line));
    // Match CSS's default tab width without treating a tab as an explicit break.
    let prefix='';
    const glyphs=segments.map((item,index)=>{
      const glyph=item.segment==='\t'?'        ':item.segment;
      const x=ctx.measureText(prefix).width+index*letterSpacing;
      prefix+=glyph;return {text:glyph,x};
    });
    return {glyphs,width:Math.max(0,ctx.measureText(prefix).width+Math.max(0,segments.length-1)*letterSpacing)};
  });
  const heartRows=hearts.length?[[]]:[];
  hearts.forEach(key=>key==='\n'?heartRows.push([]):heartRows.at(-1).push(key));
  const heartWidths=heartRows.map(row=>row.length?row.length*heartSize+(row.length-1)*columnGap:0);
  const width=Math.max(1,...textRows.map(row=>row.width),...heartWidths);
  const align=alignment==='center'?.5:alignment==='right'?1:0;
  const glyphs=[];
  textRows.forEach((row,index)=>row.glyphs.forEach(g=>glyphs.push({...g,x:g.x+(width-row.width)*align,y:ascent+index*(inkHeight+gap)})));
  const textHeight=lines.length?inkHeight+(lines.length-1)*(inkHeight+gap):0;
  const heartTop=textHeight+(lines.length&&heartRows.length?gap:0);
  const heartHeight=heartSize-2*heartInset;
  const heartItems=[];
  heartRows.forEach((row,index)=>row.forEach((key,i)=>heartItems.push({key,x:(width-heartWidths[index])*align+i*(heartSize+columnGap),y:heartTop+index*(heartHeight+gap)-heartInset,width:heartSize,height:heartSize})));
  return {width,height:heartRows.length?heartTop+heartRows.length*heartHeight+(heartRows.length-1)*gap:textHeight,glyphs,hearts:heartItems};
}
function exportFrame(box,layout,hasPhoto){
  const width=hasPhoto?box.width:Math.max(box.width,layout.width+40);
  const height=hasPhoto?box.height:Math.max(260,layout.height+60);
  const fit=hasPhoto?Math.min(1,Math.max(1,width-40)/layout.width,Math.max(1,height-40)/Math.max(1,layout.height)):1;
  const bounds=positionBounds(width,height,layout.width*fit,layout.height*fit);
  return {width,height,fit,bounds};
}
function exportCrop(width,height,ratio){
  const [rw,rh]=ratio.split(':').map(Number),aspect=rw/rh;
  const sw=Math.min(width,height*aspect),sh=sw/aspect;
  const factor=Math.min(1,4096/Math.max(sw,sh));
  return {sx:(width-sw)/2,sy:(height-sh)/2,sw,sh,width:Math.max(1,Math.round(sw*factor)),height:Math.max(1,Math.round(sh*factor))};
}
function loadExportImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('image'));image.src=src;});}
function canvasBlob(canvas){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('encode')),'image/png'));}
function addTextMaskOutline(overlay,ink,color,scaleX,scaleY){
  const mask=document.createElement('canvas');mask.width=overlay.width;mask.height=overlay.height;
  const maskInk=mask.getContext('2d');if(!maskInk)throw new Error('canvas');
  maskInk.drawImage(overlay,0,0);
  maskInk.globalCompositeOperation='source-in';maskInk.fillStyle=color;
  maskInk.fillRect(0,0,mask.width,mask.height);
  ink.save();ink.setTransform(1,0,0,1,0,0);ink.globalCompositeOperation='destination-over';
  ink.globalAlpha=textOutlineOpacity;
  for(const [x,y] of textOutlineOffsets)ink.drawImage(mask,x*scaleX,y*scaleY);
  ink.restore();
  mask.width=mask.height=0;
}
let exporting=false;
$('saveResult').addEventListener('click',async()=>{
  if(exporting||state.fontLoading)return;
  exporting=true;$('saveResult').disabled=true;$('saveResult').textContent='저장 중…';
  const version=state.loadVersion,fontVersion=state.fontVersion,hasPhoto=Boolean(state.photoURL);
  try{
    await fontPending;
    await document.fonts.ready;
    if(hasPhoto&&photo.decode)await photo.decode();
    renderPosition();
    if(version!==state.loadVersion||fontVersion!==state.fontVersion)throw new Error('changed');
    // Export at logical canvas dimensions, independently of mobile preview zoom.
    const box=editorViewport.logical?{width:stage.clientWidth,height:stage.clientHeight}:stage.getBoundingClientRect();
    if(!box.width||!box.height)throw new Error('size');
    const style=getComputedStyle(preview);
    const measure=document.createElement('canvas').getContext('2d');if(!measure)throw new Error('canvas');
    measure.font=style.font;
    const layout=explicitExportLayout(measure,text.value,arrangedMarks(state.hearts,state.problemOrder),Number(size.value),state.fontFamily==='Wave'?0:-2,state.alignment);
    const frame=exportFrame(box,layout,hasPhoto);
    const origin=offsetFromPosition(frame.bounds,state.x,state.y);
    const factor=Math.min(2,4096/Math.max(frame.width,frame.height));
    const crop=hasPhoto?exportCrop(photo.naturalWidth,photo.naturalHeight,state.ratio):{width:Math.max(1,Math.round(frame.width*factor)),height:Math.max(1,Math.round(frame.height*factor))};
    const canvas=document.createElement('canvas');canvas.width=crop.width;canvas.height=crop.height;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('canvas');
    const scaleX=canvas.width/frame.width,scaleY=canvas.height/frame.height;
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    if(hasPhoto)ctx.drawImage(photo,crop.sx,crop.sy,crop.sw,crop.sh,0,0,canvas.width,canvas.height);
    const overlay=document.createElement('canvas');overlay.width=canvas.width;overlay.height=canvas.height;
    const ink=overlay.getContext('2d');if(!ink)throw new Error('canvas');
    ink.scale(scaleX,scaleY);ink.translate(origin.left,origin.top);ink.scale(frame.fit,frame.fit);
    ink.font=style.font;ink.textAlign='left';ink.textBaseline='alphabetic';
    ink.fillStyle=fillColor.value;
    for(const glyph of layout.glyphs){
      if(!glyph.text.trim())continue;
      ink.fillText(glyph.text,glyph.x,glyph.y);
    }
    if(outline.checked&&layout.glyphs.some(g=>g.text.trim()))addTextMaskOutline(overlay,ink,strokeColor.value,scaleX*frame.fit,scaleY*frame.fit);
    const heartJobs=layout.hearts.map(rect=>{
      const clone=markSVG(rect.key);
      clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
      clone.setAttribute('width',String(rect.width*scaleX*frame.fit));clone.setAttribute('height',String(rect.height*scaleY*frame.fit));
      const path=clone.querySelector('path');path.setAttribute('stroke',strokeColor.value);
      path.setAttribute('vector-effect','non-scaling-stroke');path.setAttribute('stroke-width',outline.checked?String(scaleX*frame.fit):'0');
      const src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(clone));
      return loadExportImage(src).then(image=>({image,rect}));
    });
    const withShadow=shadow.checked;
    for(const {image,rect} of await Promise.all(heartJobs))ink.drawImage(image,rect.x,rect.y,rect.width,rect.height);
    if(version!==state.loadVersion||fontVersion!==state.fontVersion)throw new Error('changed');
    if(withShadow){ctx.shadowColor='rgba(0,0,0,0.32)';ctx.shadowOffsetY=3*scaleY*frame.fit;ctx.shadowBlur=8*scaleX*frame.fit;}
    ctx.drawImage(overlay,0,0);
    const blob=await canvasBlob(canvas);
    if(version!==state.loadVersion||fontVersion!==state.fontVersion)throw new Error('changed');
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;
    link.download=($('photoName').textContent.replace(/\.[^.]+$/,'')||'클라이밍')+'-썸네일.png';
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    showStatus('PNG 저장을 시작했어요. 다운로드 폴더를 확인해 주세요.');
  }catch(error){
    showStatus(error.message==='changed'?'사진이나 폰트가 변경됐어요. 결과물 저장을 다시 눌러 주세요.':'저장하지 못했어요. 이미지를 다시 확인하고 결과물 저장을 눌러 주세요.');
  }finally{
    exporting=false;$('saveResult').textContent='결과물 저장';$('saveResult').disabled=state.fontLoading;
  }
});
