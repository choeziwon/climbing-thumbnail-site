// MediaPipe Tasks Vision 1.1.1 (Apache-2.0). Only runtime/model assets are fetched;
// the image bitmap is processed locally in this worker and is never uploaded.
let segmenterPromise;
async function segmenter(){
  if(!segmenterPromise)segmenterPromise=(async()=>{
    const {FilesetResolver,ImageSegmenter}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/vision_bundle.mjs');
    const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm');
    return ImageSegmenter.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite',delegate:'CPU'},runningMode:'IMAGE',outputConfidenceMasks:true,outputCategoryMask:false});
  })().catch(error=>{segmenterPromise=null;throw error;});
  return segmenterPromise;
}
self.onmessage=async({data})=>{
  const {id,bitmap}=data;
  try{
    const task=await segmenter();
    task.segment(bitmap,result=>{
      const mask=result.confidenceMasks?.[result.confidenceMasks.length>1?1:0];
      if(!mask)throw new Error('missing-mask');
      const values=new Float32Array(mask.getAsFloat32Array());
      self.postMessage({id,mask:values,width:mask.width,height:mask.height},[values.buffer]);
    });
  }catch(error){self.postMessage({id,error:String(error?.message||error)});}
  finally{bitmap?.close();}
};
