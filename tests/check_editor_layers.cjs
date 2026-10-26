const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../shared/editor.js'),'utf8');
const extract=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const photo={naturalWidth:4000,naturalHeight:5333},state={photoURL:'test',photoView:{brightness:42}};
const context={clamp,photo,state,stage:{getBoundingClientRect:()=>({width:360})},document:{createElement:()=>({getContext(){return {drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(0)}),putImageData(){}}}})}};
vm.createContext(context);vm.runInContext('let correctedPhotoCache=null;'+extract('function correctedPhoto(', 'function photoFilterKey('),context);
const preview=vm.runInContext('correctedPhoto(state.photoView,true)',context),full=vm.runInContext('correctedPhoto(state.photoView)',context);
assert.ok(Math.max(preview.width,preview.height)<=720);assert.equal(full.width,4000);assert.equal(full.height,5333);assert.notEqual(preview,full);
vm.runInContext(extract('function photoOverlayRect(', 'function selectPhotoOverlay('),context);
for(const [x,y] of [[0,0],[100,100],[0,100],[100,0]]){context.item={x,y,width:36,image:{naturalWidth:900,naturalHeight:1200}};const r=vm.runInContext('photoOverlayRect(item,1000,1333)',context);assert.ok(r.x<0||r.y<0||r.x+r.width>1000||r.y+r.height>1333);}
Object.assign(context,{photoOverlays:[{id:1,name:'photo'}],photoOverlayNodes:new Map(),layer:{style:{}},text:{value:'caption'},marksLinked:()=>true,extraTexts:[{id:2,text:'extra'}],extraTextNodes:new Map(),objectTools:{style:{}},window:{dispatchEvent(){}},Event:class{}});
vm.runInContext(extract('function editorLayerEntries(', 'let exporting=false;'),context);
assert.equal(vm.runInContext('editorLayerEntries().map(x=>x.key).join(",")',context),'image:1,text:primary,text:2');
vm.runInContext('moveEditorLayer("image:1",1)',context);assert.equal(state.layerOrder.join(','),'text:primary,image:1,text:2');
vm.runInContext('moveEditorLayer("image:1",1)',context);assert.equal(state.layerOrder.join(','),'text:primary,text:2,image:1');
const saved=structuredClone(state);context.photoOverlays.length=0;assert.equal(vm.runInContext('editorLayerEntries().map(x=>x.key).join(",")',context),'text:primary,text:2');Object.assign(state,saved);context.photoOverlays.push({id:1});assert.equal(vm.runInContext('editorLayerEntries().at(-1).key',context),'image:1');
console.log('PASS: preview/export resolution, out-of-bounds placement, mixed layer order and restoration');
// Execute the real export handler with recording canvases to check mixed compositing.
(async()=>{
 const calls=[],controls={};let saveHandler,serial=0;
 const canvasFactory=()=>{const canvas={id:++serial,width:0,height:0};const ctx={canvas,save(){},restore(){},scale(){},translate(){},rotate(){},strokeText(){},fillText(){},drawImage(image){if(canvas.id===2)calls.push(image.id||image.kind)}};canvas.getContext=()=>ctx;return canvas};
 for(const id of ['saveResult','resetEditor','photoName'])controls[id]={textContent:id==='photoName'?'test.png':'',addEventListener(_,fn){saveHandler=fn}};
 const scene={state:{photoURL:'photo',fontLoading:false,loadVersion:1,fontVersion:1,textRotation:0},photo:{naturalWidth:900,naturalHeight:1200},document:{createElement(tag){if(tag==='canvas')return canvasFactory();return {click(){calls.push('download')},remove(){}}},body:{append(){}}},$:(id)=>controls[id],photoDimensions:()=>({width:900,height:1200}),editorViewport:{logical:true},stage:{clientWidth:900,clientHeight:1200},getComputedStyle:()=>({font:'112px test',fontSize:'112'}),preview:{},text:{value:'test'},marksLinked:()=>true,explicitExportLayout:()=>({width:10,height:10,glyphs:[],hearts:[]}),size:{value:112},letterGap:()=>0,exportFrame:()=>({width:900,height:1200,bounds:{},fit:1}),offsetFromPosition:()=>({left:0,top:0}),exportCrop:()=>({width:900,height:1200,sx:0,sy:0,sw:900,sh:1200}),photoSource:()=>({kind:'background'}),fillColor:{value:'#fff'},outline:{checked:false},shadow:{checked:false},drawPhotoOverlays:()=>calls.push('image'),drawExtraTexts:()=>calls.push('extra'),editorLayerEntries:()=>[{key:'image:1',kind:'image',item:{}},{key:'text:2',kind:'text',item:{}},{key:'text:primary',kind:'text'}],canvasBlob:async()=>({}),URL:{createObjectURL:()=>'',revokeObjectURL(){}},setTimeout(){},releasePhotoURL(){},showStatus(message){assert.equal(message,'')},Promise};
 Object.assign(scene,{fontPending:Promise.resolve(),extraTexts:[],renderPosition(){},arrangedMarks:()=>[]});scene.document.fonts={load:async()=>[],ready:Promise.resolve()};
 vm.createContext(scene);vm.runInContext(extract('let exporting=false;','// Rotate the source once').replace('}catch(error){','}catch(error){throw error;'),scene);await saveHandler();
 // Canvas 1 measures text; 2 is the final image; 3 contains primary text.
 assert.deepEqual(calls,['background','image','extra',3,'download']);console.log('PASS: real PNG export handler composites mixed layers back-to-front');
})().catch(e=>{console.error(e);process.exitCode=1});
