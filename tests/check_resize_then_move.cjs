const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');const src=fs.readFileSync(require('node:path').join(__dirname,'../shared/editor.js'),'utf8');
function node(){const events={};return {isConnected:true,events,addEventListener(type,fn,capture){(events[type]??=[]).push({fn,capture:!!capture})},setPointerCapture(){},hasPointerCapture(){return false},focus(){}};}
const layer=node(),markLayer=node(),docs={},windows={};let size=112,renders=0;
const c={layer,markLayer,stage:{contains:()=>true,clientWidth:1000,getBoundingClientRect:()=>({width:1000})},document:{addEventListener(type,fn){(docs[type]??=[]).push(fn)},hidden:false},window:{addEventListener(type,fn){(windows[type]??=[]).push(fn)}},state:{x:50,y:50,loadVersion:0},drag:null,markDrag:null,touchObject:null,objectAdapter:()=>({get size(){return size},resize(value){size=value},render(){}}),positionObjectTools(){},currentBounds:()=>({}),offsetFromPosition:()=>({left:0,top:0}),positionFromOffset:(_bounds,x,y)=>({x,y}),renderPosition(){renders++}};vm.createContext(c);
vm.runInContext(src.slice(src.indexOf('const editorPointerSessions='),src.indexOf('const photoOverlays=')),c);
vm.runInContext(src.slice(src.indexOf("layer.addEventListener('pointerdown',event=>{"),src.indexOf("layer.addEventListener('keydown',event=>{")),c);
vm.runInContext(src.slice(src.indexOf('const objectGesturePointers='),src.indexOf("stage.addEventListener('pointerdown',e=>{if(e.target.closest('.object-touch-tools,[data-editor-history]'))return;")),c);
vm.runInContext(src.slice(src.indexOf('// Primary captions and independent marks also support two-finger scaling.')),c);
function event(id,x,y,primary){return {pointerId:id,clientX:x,clientY:y,isPrimary:primary,pointerType:'touch',button:0,target:{closest:s=>s.includes('.photo-overlay')?layer:null},preventDefault(){},stopImmediatePropagation(){this.stopped=true}};}
function send(type,e,onNode=true){for(const fn of docs[type]||[])fn(e);if(onNode&&!e.stopped)for(const h of [...(layer.events[type]||[])].sort((a,b)=>b.capture-a.capture)){h.fn(e);if(e.stopped)break;}}
function pinch(base){send('pointerdown',event(base,100,100,true));send('pointerdown',event(base+1,200,100,false));send('pointermove',event(base+1,300,100,false));}
pinch(1);assert.equal(size,224);send('pointerup',event(1,100,100,true));send('pointerup',event(2,300,100,false),false);
let saved=size;send('pointerdown',event(3,100,100,true));send('pointermove',event(3,140,120,true));assert.equal(size,saved);assert.equal(c.state.x,40);assert.equal(c.state.y,20);assert.ok(renders);send('pointerup',event(3,140,120,true));
pinch(4);saved=size;for(const fn of windows.blur||[])fn();send('pointerdown',event(6,100,100,true));send('pointermove',event(6,150,125,true));assert.equal(size,saved);assert.equal(c.state.x,50);
// Lost end events also cannot carry a previous pinch into the next primary touch.
pinch(7);saved=size;send('pointerdown',event(9,100,100,true));send('pointermove',event(9,160,130,true));assert.equal(size,saved);assert.equal(c.state.x,60);
console.log('PASS: resize → lift → move, release outside element, blur, and missing end events preserve size during next drag');
