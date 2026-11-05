export async function nativeScroll(page,cdp,target,mobile,speed=500){
 const {width,height}=page.viewportSize();
 if(!mobile){const y=await page.evaluate(()=>scrollY);await cdp.send('Input.synthesizeScrollGesture',{x:width*.5,y:height*.72,yDistance:y-target,speed,gestureSourceType:'mouse',preventFling:true});return}
 // Chrome's synthetic touch-scroll command is a no-op in this Windows build.
 // Dispatch an ordinary series of actual touch moves instead, verified by scrollY.
 for(let n=0;n<35;n++){
  const before=await page.evaluate(()=>scrollY),remaining=target-before;if(Math.abs(remaining)<3)return;
  const down=remaining>0,distance=Math.min(350,Math.abs(remaining)+16),x=width*.5,y=down?height*.76:height*.25,steps=25;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=steps;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+(down?-1:1)*distance*i/steps}]});await page.waitForTimeout(Math.max(12,Math.round(distance/speed*1000/steps)))}
  await page.waitForTimeout(120);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(80);
  const after=await page.evaluate(()=>scrollY);if(Math.abs(after-before)<1&&Math.abs(remaining)>10)throw Error('Native touch gesture did not scroll');
 }
 throw Error('Touch scroll did not reach its target');
}
