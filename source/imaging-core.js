/* Calibrated 2D image measurements and decoded-byte intensity summaries.
 * No DOM, Canvas, network, segmentation or image mutation.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.AtlasImageCore=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function dimension(value,name){if(!Number.isSafeInteger(value)||value<=0)throw Error(name+' dimension must be a positive safe integer');return value;}
  function finite(value,name){if(typeof value!=='number'||!Number.isFinite(value))throw Error(name+' must be finite');return value;}
  function validateCalibration(value){
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Expected image calibration');
    const width=dimension(value.width,'Width'),height=dimension(value.height,'Height'),pixelSizeNm=finite(value.pixelSizeNm,'Pixel size'),originXUm=finite(value.originXUm,'Source X origin'),originYUm=finite(value.originYUm,'Source Y origin'),zUm=finite(value.zUm,'Source Z coordinate');
    if(pixelSizeNm<=0||pixelSizeNm/1000===0)throw Error('Pixel size must be positive and representable in micrometres');
    return {width,height,pixelSizeNm,originXUm,originYUm,zUm};
  }
  function point(value,calibration){
    if(!value||typeof value!=='object')throw Error('A measurement point must contain finite x and y coordinates');
    if(Array.isArray(value)&&value.length!==2)throw Error('Point arrays require exactly x and y');
    const x=finite(Array.isArray(value)?value[0]:value.x,'Point X'),y=finite(Array.isArray(value)?value[1]:value.y,'Point Y');
    if(x<0||x>calibration.width||y<0||y>calibration.height)throw Error('Measurement point lies outside continuous image bounds');
    return {x,y};
  }
  function measure(p1,p2,calibration){
    const c=validateCalibration(calibration),a=point(p1,c),b=point(p2,c),unit=c.pixelSizeNm/1000;
    const deltaUm={x:(b.x-a.x)*unit,y:(b.y-a.y)*unit};
    const distanceUm=Math.hypot(deltaUm.x,deltaUm.y),nativePoints=[a,b].map(p=>({xUm:c.originXUm+p.x*unit,yUm:c.originYUm+p.y*unit,zUm:c.zUm}));
    if(!Number.isFinite(distanceUm)||nativePoints.some(p=>![p.xUm,p.yUm,p.zUm].every(Number.isFinite)))throw Error('Calibration produces nonfinite physical coordinates');
    return {distanceUm,deltaUm,pixelPoints:[a,b],nativePoints,calibration:c,definition:'Euclidean in-plane distance using continuous pixel-boundary coordinates. X and Y range from 0 through width and height inclusive. Native coordinates derive only from the supplied source calibration. Z is fixed to this source section; no 3D registration, neurite identity or synaptic relation is inferred.'};
  }
  function statistics(rgba,width,height,roi=null){
    dimension(width,'Width');dimension(height,'Height');
    if(!(rgba instanceof Uint8Array)&&!(rgba instanceof Uint8ClampedArray))throw Error('RGBA must be an 8-bit byte typed array');
    const pixels=width*height,expected=pixels*4;
    if(!Number.isSafeInteger(expected)||rgba.length!==expected)throw Error('RGBA byte length must equal width × height × 4');
    let left=0,top=0,right=width,bottom=height;
    if(roi!==null){
      if(!roi||typeof roi!=='object'||Array.isArray(roi))throw Error('ROI must contain x0, y0, x1 and y1');
      const x0=finite(roi.x0,'ROI x0'),y0=finite(roi.y0,'ROI y0'),x1=finite(roi.x1,'ROI x1'),y1=finite(roi.y1,'ROI y1');
      if(x0===x1||y0===y1)throw Error('ROI is empty');
      left=Math.max(0,Math.min(width,Math.floor(Math.min(x0,x1))));right=Math.max(0,Math.min(width,Math.ceil(Math.max(x0,x1))));
      top=Math.max(0,Math.min(height,Math.floor(Math.min(y0,y1))));bottom=Math.max(0,Math.min(height,Math.ceil(Math.max(y0,y1))));
      if(right<=left||bottom<=top)throw Error('ROI has no pixels within image bounds');
    }
    const histogram=Array(256).fill(0);let pixelCount=0,mean=0,m2=0,min=255,max=0;
    for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
      const i=(y*width+x)*4,luma=Math.round(.299*rgba[i]+.587*rgba[i+1]+.114*rgba[i+2]);
      histogram[luma]++;pixelCount++;const delta=luma-mean;mean+=delta/pixelCount;m2+=delta*(luma-mean);min=Math.min(min,luma);max=Math.max(max,luma);
    }
    return {roi:{x:left,y:top,width:right-left,height:bottom-top},pixelCount,mean,sd:Math.sqrt(Math.max(0,m2/pixelCount)),min,max,histogram,saturatedFraction:(histogram[0]+histogram[255])/pixelCount,definition:'Rounded 8-bit luma = round(0.299R + 0.587G + 0.114B) from decoded RGBA bytes; alpha is ignored. SD is the population standard deviation. Saturated fraction counts luma 0 or 255. ROI is the clamped floor(min)/ceil(max) pixel rectangle, with right/bottom exclusive. These are decoded image-intensity summaries, not calibrated electron counts, segmentation or synapse density.'};
  }
  return Object.freeze({measure,statistics});
});
