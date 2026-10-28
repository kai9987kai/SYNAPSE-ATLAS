const test=require('node:test');
const assert=require('node:assert/strict');
const ImageCore=require('./imaging-core.js');
const near=(a,b,t=1e-12)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const cal={width:512,height:512,pixelSizeNm:3.8,originXUm:10,originYUm:-20,zUm:4};
const gray=values=>new Uint8ClampedArray(values.flatMap(v=>[v,v,v,255]));
test('calibrated endpoints use pixel boundaries and source origin',()=>{
  const r=ImageCore.measure({x:0,y:0},{x:512,y:0},cal);
  near(r.distanceUm,1.9456);near(r.deltaUm.x,1.9456);assert.equal(r.deltaUm.y,0);
  assert.deepEqual(r.nativePoints[0],{xUm:10,yUm:-20,zUm:4});
  near(r.nativePoints[1].xUm,11.9456);assert.equal(r.nativePoints[1].zUm,4);
});
test('in-plane diagonal distance and reversed points preserve signed deltas',()=>{
  const c={width:10,height:10,pixelSizeNm:1000,originXUm:0,originYUm:0,zUm:0};
  const r=ImageCore.measure([4,5],[1,1],c);assert.equal(r.distanceUm,5);
  assert.deepEqual(r.deltaUm,{x:-3,y:-4});assert.deepEqual(r.pixelPoints,[{x:4,y:5},{x:1,y:1}]);
  assert.equal(ImageCore.measure([0,0],[0,0],c).distanceUm,0);
});
test('measurement rejects invalid dimensions, calibration and outside points',()=>{
  for(const c of [{...cal,width:0},{...cal,height:2.5},{...cal,pixelSizeNm:0},{...cal,pixelSizeNm:-1},{...cal,originXUm:NaN},{...cal,zUm:undefined}])assert.throws(()=>ImageCore.measure([0,0],[1,1],c));
  for(const p of [[-1,0],[513,0],[0,513],[Infinity,0],[1]])assert.throws(()=>ImageCore.measure(p,[1,1],cal));
});
test('known 2x2 pixels give exact histogram and population moments',()=>{
  const r=ImageCore.statistics(gray([0,100,200,255]),2,2);
  assert.deepEqual(r.roi,{x:0,y:0,width:2,height:2});assert.equal(r.pixelCount,4);
  assert.equal(r.mean,138.75);near(r.sd,Math.sqrt(9504.6875));assert.equal(r.min,0);assert.equal(r.max,255);
  assert.equal(r.histogram.length,256);assert.equal(r.histogram[100],1);assert.equal(r.histogram.reduce((a,b)=>a+b,0),4);assert.equal(r.saturatedFraction,.5);
});
test('luma rounding uses RGB weights and alpha is explicitly ignored',()=>{
  const rgba=new Uint8Array([255,0,0,0,0,255,0,128,0,0,255,255]);
  const r=ImageCore.statistics(rgba,3,1);assert.equal(r.histogram[76],1);assert.equal(r.histogram[150],1);assert.equal(r.histogram[29],1);
  assert.equal(r.saturatedFraction,0);assert.match(r.definition,/alpha.*ignored/i);
});
test('ROI reversal and floor-ceil pixel inclusion have explicit bounds',()=>{
  const rgba=gray([10,20,30,40,50,60]);
  const r=ImageCore.statistics(rgba,3,2,{x0:2.8,y0:1.8,x1:1.2,y1:.2});
  assert.deepEqual(r.roi,{x:1,y:0,width:2,height:2});assert.equal(r.mean,40);assert.equal(r.pixelCount,4);
  const clip=ImageCore.statistics(rgba,3,2,{x0:-5,y0:-2,x1:1.2,y1:.4});
  assert.deepEqual(clip.roi,{x:0,y:0,width:2,height:1});assert.equal(clip.mean,15);
});
test('constant ROI has zero deviation and original input is preserved',()=>{
  const rgba=gray([42,42,42,42]),before=rgba.slice(),roi={x0:0,y0:0,x1:2,y1:2},c={...cal},p={x:1,y:1};
  const r=ImageCore.statistics(rgba,2,2,roi);assert.equal(r.sd,0);assert.equal(r.min,42);assert.equal(r.max,42);
  ImageCore.measure(p,{x:2,y:2},c);assert.deepEqual(rgba,before);assert.deepEqual(c,cal);assert.deepEqual(p,{x:1,y:1});assert.deepEqual(roi,{x0:0,y0:0,x1:2,y1:2});
});
test('statistics reject wrong buffers, dimensions, malformed and empty ROIs',()=>{
  const rgba=gray([0,1,2,3]);
  assert.throws(()=>ImageCore.statistics([0,0,0,255],1,1),/byte|array/i);
  assert.throws(()=>ImageCore.statistics(new Uint16Array(4),1,1),/byte|array/i);
  assert.throws(()=>ImageCore.statistics(rgba,3,2),/length|size/i);
  assert.throws(()=>ImageCore.statistics(rgba,0,2),/dimension|width/i);
  for(const roi of [{x0:0,y0:0,x1:0,y1:1},{x0:-4,y0:0,x1:-1,y1:2},{x0:0,y0:0,x1:2,y1:Infinity},{x0:0,x1:2}])assert.throws(()=>ImageCore.statistics(rgba,2,2,roi));
});
