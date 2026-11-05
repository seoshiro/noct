import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { timeline, seededCloud } from "./timeline";

export type StudioView = "front" | "quarter" | "reverse-quarter" | "crown";
type ScreenBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};
export type CrownFrame = {
  progress: number;
  notes: number[];
  hero: number;
  ending: number;
  anchors: { x: number; y: number }[];
  active: boolean;
};
export type CrownHandle = { seek: (progress: number) => void };
type Props = {
  view: StudioView;
  inspection: boolean;
  onStatus: (s: "loading" | "ready" | "fallback") => void;
  onFrame?: (frame: CrownFrame) => void;
  paused?: boolean;
  visible?: boolean;
};
declare global {
  interface Window {
    __NOCT_CROWN__?: {
      status: string;
      renderer: string;
      triangles: number;
      calls: number;
      frames: number;
      view: string;
      modelLoads: number;
      progress: number;
      cloudCount: number;
      capOpen: number;
      headPress: number;
      active: boolean;
      frameTimes: number[];
      renderTimes: number[];
      anchors: { x: number; y: number }[];
      bounds: { body: ScreenBounds | null; crown: ScreenBounds | null };
    };
  }
}

function environment() {
  const room = new THREE.Scene();
  room.background = new THREE.Color("#a8aba9");
  const cards: [number, number, number, number, number, string, number][] = [
    [-4, 1.5, 2, 1.4, 8, "#ffffff", 3.5],
    [4, 2, 3, 0.8, 7, "#ffffff", 4],
    [0, 6, 0, 6, 2, "#ffffff", 2.5],
    [0, 1, 6, 4, 5, "#f8f8f6", 1.2],
    [-0.3, 1, 5, 1.3, 7, "#414746", 1],
    [0, 0, -4, 4, 6, "#c3c7c8", 1],
  ];
  for (const [x, y, z, w, h, color, power] of cards) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(power),
        side: THREE.DoubleSide,
      }),
    );
    mesh.position.set(x, y, z);
    mesh.lookAt(0, 0, 0);
    room.add(mesh);
  }
  return room;
}

export default forwardRef<CrownHandle, Props>(function CrownScene(
  {
    view,
    inspection,
    onStatus,
    onFrame,
    paused = false,
    visible = true,
  }: Props,
  ref,
) {
  const host = useRef<HTMLDivElement>(null),
    latest = useRef({ view, inspection, onStatus, onFrame, paused, visible }),
    seek = useRef<(p: number) => void>(() => {}),
    invalidate = useRef(() => {});
  latest.current = { view, inspection, onStatus, onFrame, paused, visible };
  useImperativeHandle(ref, () => ({ seek: (p) => seek.current(p) }), []);
  useEffect(() => invalidate.current(), [view, inspection, paused, visible]);
  useEffect(() => {
    const container = host.current!;
    let disposed = false,
      contextLost = false,
      renderer: THREE.WebGLRenderer;
    const metrics = {
      status: "loading",
      renderer: "",
      triangles: 0,
      calls: 0,
      frames: 0,
      view: latest.current.view,
      modelLoads: 0,
      progress: 0,
      cloudCount: 0,
      capOpen: 0,
      headPress: 0,
      active: false,
      frameTimes: [] as number[],
      renderTimes: [] as number[],
      anchors: [] as { x: number; y: number }[],
      bounds: {
        body: null as ScreenBounds | null,
        crown: null as ScreenBounds | null,
      },
    };
    window.__NOCT_CROWN__ = metrics;
    try {
      if (new URLSearchParams(location.search).has("static"))
        throw Error("Static");
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: new URLSearchParams(location.search).has("cutout"),
        preserveDrawingBuffer: new URLSearchParams(location.search).has(
          "cutout",
        ),
        powerPreference: "high-performance",
      });
    } catch {
      metrics.status = "fallback";
      latest.current.onStatus("fallback");
      return;
    }
    container.append(renderer.domElement);
    const cutout = new URLSearchParams(location.search).has("cutout");
    renderer.setClearColor("#d3d4d1", cutout ? 0 : 1);
    renderer.setPixelRatio(
      Math.min(devicePixelRatio, innerWidth < 800 ? 1.35 : 1.75),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.shadowMap.autoUpdate = false;
    const gl = renderer.getContext(),
      debug = gl.getExtension("WEBGL_debug_renderer_info");
    metrics.renderer = debug
      ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER));
    const scene = new THREE.Scene();
    scene.background = cutout ? null : new THREE.Color("#d3d4d1");
    scene.fog = new THREE.Fog("#d3d4d1", 16, 32);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    camera.position.set(0, 0.5, 11.5);
    camera.lookAt(0, 0, 0);
    const room = environment(),
      pmrem = new THREE.PMREMGenerator(renderer),
      env = pmrem.fromScene(room, 0.025);
    scene.environment = env.texture;
    scene.environmentIntensity = 0.9;
    room.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight("#ffffff", "#969b9e", 0.65));
    const key = new THREE.DirectionalLight("#fffdfa", 3.0);
    key.position.set(-3.5, 10, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 5;
    key.shadow.blurSamples = 8;
    Object.assign(key.shadow.camera, {
      left: -5,
      right: 5,
      top: 6,
      bottom: -5,
      near: 0.5,
      far: 20,
    });
    key.shadow.bias = -0.00015;
    key.shadow.normalBias = 0.012;
    scene.add(key);
    const rim = new THREE.DirectionalLight("#ffffff", 2);
    rim.position.set(4, 3, -4);
    scene.add(rim);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({
        color: "#c7c9c6",
        roughness: 1,
        metalness: 0,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.285;
    floor.receiveShadow = true;
    scene.add(floor);
    const lacquer = new THREE.MeshPhysicalMaterial({
      color: "#030405",
      metalness: 0,
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.075,
      ior: 1.52,
      envMapIntensity: 1.35,
    });
    const gold = new THREE.MeshPhysicalMaterial({
      color: "#c8aa69",
      metalness: 1,
      roughness: 0.22,
      clearcoat: 0.12,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.4,
    });
    const satin = new THREE.MeshStandardMaterial({
      color: "#b69b62",
      metalness: 1,
      roughness: 0.3,
      envMapIntensity: 1.2,
    });
    const foil = new THREE.MeshStandardMaterial({
      color: "#c8aa69",
      metalness: 0.7,
      roughness: 0.35,
      envMapIntensity: 1.3,
    });
    const black = new THREE.MeshStandardMaterial({
      color: "#080a0a",
      roughness: 0.36,
      metalness: 0.1,
    });
    const root = new THREE.Group();
    scene.add(root);
    let model: THREE.Group | null = null,
      bodyMesh: THREE.Object3D | null = null,
      cap: THREE.Object3D | null = null,
      head: THREE.Object3D | null = null,
      raf = 0,
      current = 0,
      target = 0,
      lastTime = 0,
      lastFrame = 0,
      poseStamp = "";
    const capBase = new THREE.Vector3(),
      headBase = new THREE.Vector3(),
      emitter = new THREE.Vector3(0.194, 1.045, 0.114),
      direction = new THREE.Vector3(0.86, 0, 0.51),
      point = new THREE.Vector3(),
      side = new THREE.Vector3(),
      up = new THREE.Vector3(0, 1, 0),
      inverse = new THREE.Quaternion();
    let drawCount = innerWidth < 800 ? 650 : 1100;
    const seeds = seededCloud(1100),
      positions = new Float32Array(seeds.length * 3),
      sizes = new Float32Array(seeds.map((s) => s.size)),
      shades = new Float32Array(seeds.map((s) => s.shade));
    const cloudGeometry = new THREE.BufferGeometry();
    cloudGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    cloudGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    cloudGeometry.setAttribute("aShade", new THREE.BufferAttribute(shades, 1));
    const cloudMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uOpacity: { value: 0 },
        uDpr: { value: renderer.getPixelRatio() },
      },
      vertexShader:
        "attribute float aSize;attribute float aShade;uniform float uDpr;varying float shade;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*130./-mv.z,.65,3.4)*uDpr;shade=aShade;}",
      fragmentShader:
        "uniform float uOpacity;varying float shade;void main(){vec2 q=gl_PointCoord-.5;float a=exp(-dot(q,q)*18.)*.25*uOpacity;vec3 color=mix(vec3(.32,.38,.39),vec3(.98,.99,.96),shade);gl_FragColor=vec4(color,a);}",
    });
    const cloud = new THREE.Points(cloudGeometry, cloudMaterial);
    cloud.frustumCulled = false;
    root.add(cloud);
    const projectedBox = new THREE.Box3();
    function boundsFor(object: THREE.Object3D): ScreenBounds {
      projectedBox.setFromObject(object);
      let left = Infinity,
        top = Infinity,
        right = -Infinity,
        bottom = -Infinity;
      for (const x of [projectedBox.min.x, projectedBox.max.x])
        for (const y of [projectedBox.min.y, projectedBox.max.y])
          for (const z of [projectedBox.min.z, projectedBox.max.z]) {
            point.set(x, y, z).project(camera);
            const px = ((point.x + 1) * innerWidth) / 2,
              py = ((1 - point.y) * innerHeight) / 2;
            left = Math.min(left, px);
            right = Math.max(right, px);
            top = Math.min(top, py);
            bottom = Math.max(bottom, py);
          }
      return { left, top, right, bottom };
    }
    const dropGeometry = new THREE.SphereGeometry(1, 12, 8),
      dropMaterial = new THREE.MeshPhysicalMaterial({
        color: "#dbe1dd",
        metalness: 0.15,
        roughness: 0.07,
        clearcoat: 1,
        transparent: true,
        opacity: 0.85,
        envMapIntensity: 1.8,
      });
    const drops = Array.from({ length: 3 }, () => {
      const d = new THREE.Mesh(dropGeometry, dropMaterial);
      d.scale.set(0.026, 0.04, 0.026);
      root.add(d);
      return d;
    });
    seek.current = (p) => {
      target = THREE.MathUtils.clamp(p, 0, 1);
      request();
    };
    function render(now: number) {
      raf = 0;
      if (disposed || contextLost || document.hidden) return;
      const p = latest.current;
      metrics.active = p.visible && !p.paused;
      if (p.paused || !p.visible) {
        lastTime = 0;
        lastFrame = 0;
        return;
      }
      const dt = Math.min(0.04, lastTime ? (now - lastTime) / 1000 : 0.016);
      lastTime = now;
      current = p.inspection
        ? 0
        : THREE.MathUtils.damp(current, target, 14, dt);
      const state = timeline(current),
        mobile = innerWidth < 800,
        short = THREE.MathUtils.clamp((844 - innerHeight) / 177, 0, 1),
        mobileZ = 16 + Math.max(0, 390 - innerWidth) * 0.045 + 2.3 * short,
        mobileY = -1.25 - 0.7 * short;
      metrics.view = p.view;
      root.rotation.y = p.inspection
        ? p.view === "quarter"
          ? 0.38
          : p.view === "reverse-quarter"
            ? -0.28
            : 0
        : state.yaw;
      root.position.set(
        p.inspection
          ? 0
          : mobile
            ? -0.95 * state.stageShift
            : 0.7 - 1.7 * state.stageShift,
        !p.inspection && mobile
          ? mobileY + (-0.8 - mobileY) * state.stageShift
          : 0,
        !p.inspection && mobile ? -0.8 * state.stageShift : 0,
      );
      if (cap) {
        cap.position.copy(capBase);
        cap.position.x += state.travel * (mobile ? 0.25 : -1.1);
        cap.position.y += state.open * 0.7 - state.travel * (mobile ? 0 : 0.32);
        cap.position.z -= state.travel * 1.4;
        cap.rotation.z = -state.travel * 0.13;
      }
      if (head) {
        head.position.copy(headBase);
        head.position.y -= state.press;
      }
      floor.position.y = -2.285 + root.position.y;
      if (p.view === "crown") {
        root.rotation.y = 0.22;
        camera.position.set(0, 2.1, 5.7);
        camera.lookAt(0, 1.45, 0);
        floor.visible = false;
      } else {
        camera.position.set(
          0,
          0.4,
          mobile
            ? p.inspection
              ? 13
              : mobileZ + 0.9 * state.open - 0.4 * state.approach
            : 11.5 + 0.9 * state.open - 0.8 * state.approach,
        );
        camera.lookAt(
          mobile ? 0 : state.approach * 0.3,
          -0.03 + state.open * 0.13 + state.approach * 0.12,
          0,
        );
        floor.visible = !cutout;
      }
      camera.updateMatrixWorld(true);
      const stamp = [
        root.position.x,
        root.position.y,
        root.position.z,
        root.rotation.y,
        state.open,
        state.travel,
        state.press,
      ]
        .map((x) => x.toFixed(4))
        .join("/");
      if (stamp !== poseStamp) {
        renderer.shadowMap.needsUpdate = true;
        poseStamp = stamp;
      }
      cloud.visible = !p.inspection && state.cloud > 0.001;
      cloudMaterial.uniforms.uOpacity.value = state.cloud;
      side.crossVectors(direction, up).normalize();
      if (cloud.visible) {
        for (let i = 0; i < drawCount; i++) {
          const s = seeds[i],
            t = Math.max(0, state.cloudTime - s.delay);
          point
            .copy(emitter)
            .addScaledVector(direction, s.distance * t)
            .addScaledVector(up, s.spreadY * t + 0.16 * t * t)
            .addScaledVector(side, s.spreadZ * t);
          positions[i * 3] = point.x;
          positions[i * 3 + 1] = point.y;
          positions[i * 3 + 2] = point.z;
        }
        cloudGeometry.attributes.position.needsUpdate = true;
      }
      const anchorParams = [
          [2.25, 0.4, 0.04],
          [2.55, 0.5, -0.06],
          [2.35, 0.34, 0.09],
        ],
        screenAnchors = [];
      root.updateMatrixWorld(true);
      for (let i = 0; i < 3; i++) {
        const d = drops[i],
          [distance, y, z] = anchorParams[i],
          t = state.cloudTime;
        d.position
          .copy(emitter)
          .addScaledVector(direction, distance * t)
          .addScaledVector(up, y * t)
          .addScaledVector(side, z * t);
        d.visible = cloud.visible;
        d.scale.setScalar(0.018 + state.notes[i] * 0.014);
        d.scale.y *= 1.4;
        point.copy(d.position);
        root.localToWorld(point).project(camera);
        screenAnchors.push({
          x: ((point.x + 1) * innerWidth) / 2,
          y: ((1 - point.y) * innerHeight) / 2,
        });
      }
      metrics.progress = current;
      metrics.capOpen = state.open;
      metrics.headPress = state.press;
      metrics.cloudCount = cloud.visible ? drawCount : 0;
      metrics.anchors = screenAnchors;
      if (bodyMesh) metrics.bounds.body = boundsFor(bodyMesh);
      if (cap) metrics.bounds.crown = boundsFor(cap);
      const started = performance.now();
      renderer.render(scene, camera);
      if (metrics.renderTimes.length < 3600)
        metrics.renderTimes.push(performance.now() - started);
      metrics.frames++;
      metrics.triangles = renderer.info.render.triangles;
      metrics.calls = renderer.info.render.calls;
      if (lastFrame && metrics.frameTimes.length < 3600)
        metrics.frameTimes.push(now - lastFrame);
      lastFrame = now;
      p.onFrame?.({
        progress: current,
        notes: state.notes,
        hero: state.hero,
        ending: state.ending,
        anchors: screenAnchors,
        active: true,
      });
      if (!p.inspection && Math.abs(target - current) > 0.00004) request();
      else {
        lastTime = 0;
        lastFrame = 0;
      }
    }
    function request() {
      if (!raf && !disposed && !contextLost)
        raf = requestAnimationFrame(render);
    }
    invalidate.current = request;
    function resize() {
      const r = container.getBoundingClientRect();
      renderer.setPixelRatio(
        Math.min(devicePixelRatio, innerWidth < 800 ? 1.25 : 1.6),
      );
      cloudMaterial.uniforms.uDpr.value = renderer.getPixelRatio();
      drawCount = innerWidth < 800 ? 650 : 1100;
      cloudGeometry.setDrawRange(0, drawCount);
      renderer.setSize(r.width, r.height);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
      request();
    }
    const loader = new GLTFLoader();
    loader.load(
      `${import.meta.env.BASE_URL}models/noct-crown.glb`,
      async (result) => {
        if (disposed) return;
        model = result.scene;
        model.traverse((o) => {
          if (!(o instanceof THREE.Mesh)) return;
          o.castShadow = true;
          o.receiveShadow = false;
          const name = o.name.toLowerCase();
          o.material =
            name.includes("body") || name.includes("inner")
              ? lacquer
              : name.includes("nozzle")
                ? black
                : name.includes("engraving") || name.includes("foil")
                  ? foil
                  : name.includes("head") || name.includes("stem")
                    ? satin
                    : gold;
        });
        root.add(model);
        bodyMesh = model.getObjectByName("Body_Lacquer") || null;
        model.updateMatrixWorld(true);
        cap = model.getObjectByName("Crown_Cap") || null;
        head = model.getObjectByName("Atomizer_Head") || null;
        if (cap) capBase.copy(cap.position);
        if (head) headBase.copy(head.position);
        const spray = model.getObjectByName("Spray_Origin"),
          nozzle = model.getObjectByName("Nozzle_Hole") as
            THREE.Mesh | undefined;
        root.updateMatrixWorld(true);
        if (spray) {
          spray.getWorldPosition(emitter);
          root.worldToLocal(emitter);
          emitter.y -= 0.07;
        }
        if (nozzle) {
          nozzle.geometry.computeBoundingBox();
          const size = new THREE.Vector3();
          nozzle.geometry.boundingBox!.getSize(size);
          const axis =
            size.x < size.y && size.x < size.z
              ? new THREE.Vector3(1, 0, 0)
              : size.y < size.z
                ? new THREE.Vector3(0, 1, 0)
                : new THREE.Vector3(0, 0, 1);
          nozzle.getWorldQuaternion(inverse);
          direction.copy(axis).applyQuaternion(inverse);
          root.getWorldQuaternion(inverse).invert();
          direction.applyQuaternion(inverse).normalize();
          if (direction.x < 0) direction.negate();
        }
        renderer.shadowMap.needsUpdate = true;
        try {
          await renderer.compileAsync(scene, camera);
        } catch {}
        if (disposed) return;
        metrics.modelLoads++;
        metrics.status = "ready";
        latest.current.onStatus("ready");
        request();
      },
      undefined,
      () => {
        if (!disposed) {
          metrics.status = "fallback";
          latest.current.onStatus("fallback");
        }
      },
    );
    const loss = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      metrics.status = "fallback";
      latest.current.onStatus("fallback");
    };
    renderer.domElement.addEventListener("webglcontextlost", loss);
    const visible = () => {
      if (!document.hidden) request();
    };
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", visible);
    resize();
    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visible);
      renderer.domElement.removeEventListener("webglcontextlost", loss);
      root.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      for (const m of [lacquer, gold, satin, foil, black, floor.material])
        m.dispose();
      cloudGeometry.dispose();
      cloudMaterial.dispose();
      dropGeometry.dispose();
      dropMaterial.dispose();
      seek.current = () => {};
      floor.geometry.dispose();
      env.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      invalidate.current = () => {};
    };
  }, []);
  return <div className="crown-canvas" ref={host} aria-hidden="true" />;
});
