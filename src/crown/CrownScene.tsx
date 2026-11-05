import {useEffect,useRef} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export type StudioView='front'|'quarter'|'crown';
type Props={view:StudioView;inspection:boolean;onStatus:(s:'loading'|'ready'|'fallback')=>void};
declare global {interface Window {__NOCT_CROWN__?:{status:string;renderer:string;triangles:number;calls:number;frames:number;view:string;modelLoads:number}}}

function environment(){
 const room=new THREE.Scene();room.background=new THREE.Color('#a8aba9');
 const cards:[number,number,number,number,number,string,number][]=[[-4,1.5,2,1.4,8,'#ffffff',3.5],[4,2,3,.8,7,'#ffffff',4],[0,6,0,6,2,'#ffffff',2.5],[0,1,6,4,5,'#f8f8f6',1.2],[-.3,1,5,1.3,7,'#414746',1],[0,0,-4,4,6,'#c3c7c8',1]];
 for(const [x,y,z,w,h,color,power] of cards){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(power),side:THREE.DoubleSide}));mesh.position.set(x,y,z);mesh.lookAt(0,0,0);room.add(mesh)}
 return room;
}

export default function CrownScene({view,inspection,onStatus}:Props){
 const host=useRef<HTMLDivElement>(null),latest=useRef({view,inspection,onStatus}),invalidate=useRef(()=>{});latest.current={view,inspection,onStatus};
 useEffect(()=>invalidate.current(),[view,inspection]);
 useEffect(()=>{
  const container=host.current!;let disposed=false,contextLost=false,renderer:THREE.WebGLRenderer;
  const metrics={status:'loading',renderer:'',triangles:0,calls:0,frames:0,view:latest.current.view,modelLoads:0};window.__NOCT_CROWN__=metrics;
  try{if(new URLSearchParams(location.search).has('static'))throw Error('Static');renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{metrics.status='fallback';latest.current.onStatus('fallback');return}
  container.append(renderer.domElement);renderer.setClearColor('#d3d4d1',1);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<800?1.35:1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.VSMShadowMap;
  const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');metrics.renderer=debug?String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)):String(gl.getParameter(gl.RENDERER));
  const scene=new THREE.Scene();scene.background=new THREE.Color('#d3d4d1');scene.fog=new THREE.Fog('#d3d4d1',16,32);
  const camera=new THREE.PerspectiveCamera(34,1,.1,60);camera.position.set(0,.5,11.5);camera.lookAt(0,0,0);
  const room=environment(),pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(room,.025);scene.environment=env.texture;scene.environmentIntensity=.9;room.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(o.material as THREE.Material).dispose()}});pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#ffffff','#969b9e',.65));
  const key=new THREE.DirectionalLight('#fffdfa',3.0);key.position.set(-3.5,10,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.radius=5;key.shadow.blurSamples=8;Object.assign(key.shadow.camera,{left:-5,right:5,top:6,bottom:-5,near:.5,far:20});key.shadow.bias=-.00015;key.shadow.normalBias=.012;scene.add(key);
  const rim=new THREE.DirectionalLight('#ffffff',2);rim.position.set(4,3,-4);scene.add(rim);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#c7c9c6',roughness:1,metalness:0}));floor.rotation.x=-Math.PI/2;floor.position.y=-2.285;floor.receiveShadow=true;scene.add(floor);
  const lacquer=new THREE.MeshPhysicalMaterial({color:'#030405',metalness:0,roughness:.16,clearcoat:1,clearcoatRoughness:.075,ior:1.52,envMapIntensity:1.35});
  const gold=new THREE.MeshPhysicalMaterial({color:'#c8aa69',metalness:1,roughness:.22,clearcoat:.12,clearcoatRoughness:.2,envMapIntensity:1.4});
  const satin=new THREE.MeshStandardMaterial({color:'#b69b62',metalness:1,roughness:.3,envMapIntensity:1.2});
  const foil=new THREE.MeshStandardMaterial({color:'#c8aa69',metalness:.7,roughness:.35,envMapIntensity:1.3});
  const black=new THREE.MeshStandardMaterial({color:'#080a0a',roughness:.36,metalness:.1});
  const root=new THREE.Group();scene.add(root);let model:THREE.Group|null=null,raf=0;
  function render(){raf=0;if(disposed||contextLost||document.hidden)return;const p=latest.current;metrics.view=p.view;root.rotation.y=p.view==='quarter'?.38:0;root.position.set(p.inspection?0:innerWidth<800?0:.7,!p.inspection&&innerWidth<800?-1.25:0,0);
   floor.position.y=-2.285+root.position.y;
   if(p.view==='crown'){root.rotation.y=.22;camera.position.set(0,2.1,5.7);camera.lookAt(0,1.45,0);floor.visible=false}else{camera.position.set(0,.4,innerWidth<800?(p.inspection?13:16):11.5);camera.lookAt(0,-.03,0);floor.visible=true}
   renderer.render(scene,camera);metrics.frames++;metrics.triangles=renderer.info.render.triangles;metrics.calls=renderer.info.render.calls;
  }
  function request(){if(!raf&&!disposed&&!contextLost)raf=requestAnimationFrame(render)}invalidate.current=request;
  function resize(){const r=container.getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();request()}
  const loader=new GLTFLoader();loader.load(`${import.meta.env.BASE_URL}models/noct-crown.glb`,async result=>{if(disposed)return;model=result.scene;model.traverse(o=>{if(!(o instanceof THREE.Mesh))return;o.castShadow=true;o.receiveShadow=false;const name=o.name.toLowerCase();o.material=name.includes('body')||name.includes('inner')?lacquer:name.includes('nozzle')?black:name.includes('engraving')||name.includes('foil')?foil:name.includes('head')||name.includes('stem')?satin:gold;});root.add(model);try{await renderer.compileAsync(scene,camera)}catch{}if(disposed)return;metrics.modelLoads++;metrics.status='ready';latest.current.onStatus('ready');request()},undefined,()=>{if(!disposed){metrics.status='fallback';latest.current.onStatus('fallback')}});
  const loss=(e:Event)=>{e.preventDefault();contextLost=true;metrics.status='fallback';latest.current.onStatus('fallback')};renderer.domElement.addEventListener('webglcontextlost',loss);const visible=()=>{if(!document.hidden)request()};window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visible);resize();
  return()=>{disposed=true;if(raf)cancelAnimationFrame(raf);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visible);renderer.domElement.removeEventListener('webglcontextlost',loss);root.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose()});for(const m of [lacquer,gold,satin,foil,black,floor.material])m.dispose();floor.geometry.dispose();env.dispose();renderer.dispose();renderer.domElement.remove();invalidate.current=()=>{}};
 },[]);
 return <div className="crown-canvas" ref={host} aria-hidden="true"/>;
}
