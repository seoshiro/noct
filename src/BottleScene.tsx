import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { type ScentId, catalog } from "./catalog";
export type BottleHandle = {
  turn: (radians: number) => void;
  reset: () => void;
  pointerDown: (e: ReactPointerEvent) => void;
  pointerMove: (e: ReactPointerEvent) => void;
  pointerUp: (e: ReactPointerEvent) => void;
  cancel: () => void;
};
type Props = {
  scent: ScentId;
  capOpen: boolean;
  spraySerial: number;
  reduce: boolean;
  paused: boolean;
  onCap: () => void;
  onSpray: () => void;
  onStatus: (s: "loading" | "ready" | "fallback") => void;
};
type Metrics = {
  status: string;
  renderer: string;
  frames: number;
  frameTimes: number[];
  renderTimes: number[];
  drawCalls: number;
  triangles: number;
  yaw: number;
  pitch: number;
  cap: number;
  mistParticles: number;
  active: boolean;
  modelLoaded: boolean;
  instanceId: string;
  assetLoads: number;
  capScreen: { x: number; y: number };
  headScreen: { x: number; y: number };
  ui: { x: number; y: number; bodyBottom: number };
};
declare global {
  interface Window {
    __NOCT_3D__?: Metrics;
  }
}
const clamp = THREE.MathUtils.clamp,
  damp = THREE.MathUtils.damp;
function stoneTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const x = c.getContext("2d")!;
  x.fillStyle = "#171219";
  x.fillRect(0, 0, 512, 512);
  let r = 114;
  const rand = () => {
    r = (r * 16807) % 2147483647;
    return (r - 1) / 2147483646;
  };
  for (let i = 0; i < 90; i++) {
    x.strokeStyle = `rgba(170,137,110,${0.015 + rand() * 0.06})`;
    x.lineWidth = 0.3 + rand() * 0.8;
    x.beginPath();
    let px = rand() * 512,
      py = rand() * 512;
    x.moveTo(px, py);
    for (let j = 0; j < 8; j++) {
      px += (rand() - 0.4) * 70;
      py += (rand() - 0.3) * 70;
      x.lineTo(px, py);
    }
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!,
    g = x.createRadialGradient(64, 64, 2, 64, 64, 64);
  g.addColorStop(0, "rgba(196,124,63,.4)");
  g.addColorStop(0.5, "rgba(79,37,34,.15)");
  g.addColorStop(1, "rgba(20,14,22,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
function softboxTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const x = c.getContext("2d")!,
    g = x.createLinearGradient(0, 0, 256, 512);
  g.addColorStop(0, "#21151c");
  g.addColorStop(0.35, "#735141");
  g.addColorStop(0.6, "#3c2630");
  g.addColorStop(1, "#140e16");
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function studioEnvironment() {
  const s = new THREE.Scene();
  s.background = new THREE.Color("#171019");
  for (const [x, y, z, w, h, c, power] of [
    [-4, 1, 2, 0.7, 6, "#ffe4bd", 3],
    [4, 0.5, 1, 0.6, 5, "#fff8e8", 4],
    [0, 5, 1, 4, 0.7, "#fff1dc", 2],
    [0, 0, -5, 2, 4, "#b56932", 1],
  ] as [number, number, number, number, number, string, number][]) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(c).multiplyScalar(power),
        side: THREE.DoubleSide,
      }),
    );
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    s.add(m);
  }
  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 7),
    new THREE.MeshBasicMaterial({
      map: softboxTexture(),
      color: new THREE.Color("#ffffff").multiplyScalar(1.8),
      side: THREE.DoubleSide,
    }),
  );
  front.position.set(0, 0.7, 5);
  front.lookAt(0, 0, 0);
  s.add(front);
  return s;
}
export const BottleScene = forwardRef<BottleHandle, Props>(
  function BottleScene(props, ref) {
    const host = useRef<HTMLDivElement>(null),
      latest = useRef(props),
      actions = useRef<BottleHandle>({
        turn: () => {},
        reset: () => {},
        pointerDown: () => {},
        pointerMove: () => {},
        pointerUp: () => {},
        cancel: () => {},
      }),
      invalidate = useRef<() => void>(() => {});
    latest.current = props;
    useImperativeHandle(
      ref,
      () => ({
        turn: (r) => actions.current.turn(r),
        reset: () => actions.current.reset(),
        pointerDown: (e) => actions.current.pointerDown(e),
        pointerMove: (e) => actions.current.pointerMove(e),
        pointerUp: (e) => actions.current.pointerUp(e),
        cancel: () => actions.current.cancel(),
      }),
      [],
    );
    useEffect(() => {
      invalidate.current();
    }, [
      props.scent,
      props.capOpen,
      props.spraySerial,
      props.reduce,
      props.paused,
    ]);
    useEffect(() => {
      const container = host.current!;
      let disposed = false,
        contextLost = false,
        renderer: THREE.WebGLRenderer;
      const metrics: Metrics = {
        status: "loading",
        renderer: "",
        frames: 0,
        frameTimes: [],
        renderTimes: [],
        drawCalls: 0,
        triangles: 0,
        yaw: 0,
        pitch: 0,
        cap: 0,
        mistParticles: 0,
        active: false,
        modelLoaded: false,
        instanceId: THREE.MathUtils.generateUUID(),
        assetLoads: 0,
        capScreen: { x: 0, y: 0 },
        headScreen: { x: 0, y: 0 },
        ui: { x: 0, y: 0, bodyBottom: 0 },
      };
      window.__NOCT_3D__ = metrics;
      try {
        if (new URLSearchParams(location.search).has("static"))
          throw new Error("Static view selected");
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        });
      } catch {
        metrics.status = "fallback";
        latest.current.onStatus("fallback");
        return;
      }
      renderer.setClearColor("#140e16", 1);
      renderer.setPixelRatio(
        Math.min(
          devicePixelRatio,
          matchMedia("(max-width:900px)").matches ? 1.25 : 1.6,
        ),
      );
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      container.appendChild(renderer.domElement);
      const gl = renderer.getContext(),
        info = gl.getExtension("WEBGL_debug_renderer_info");
      metrics.renderer = info
        ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
        : String(gl.getParameter(gl.RENDERER));
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-5, 5, 4, -4, 0.1, 50);
      camera.position.set(0, 0.1, 12);
      camera.lookAt(0, 0, 0);
      const pmrem = new THREE.PMREMGenerator(renderer),
        room = studioEnvironment();
      const env = pmrem.fromScene(room, 0.055);
      scene.environment = env.texture;
      scene.environmentIntensity = 0.8;
      room.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material as THREE.MeshBasicMaterial;
          m.map?.dispose();
          m.dispose();
        }
      });
      pmrem.dispose();
      const key = new THREE.DirectionalLight("#ffe3bd", 1.5);
      key.position.set(-4, 4, 6);
      scene.add(key);
      const fill = new THREE.DirectionalLight("#fff5e8", 0.8);
      fill.position.set(4, 2, 3);
      scene.add(fill);
      const rim = new THREE.DirectionalLight("#d98b43", 2.1);
      rim.position.set(1, -1, -4);
      scene.add(rim);
      const pose = new THREE.Group(),
        rotation = new THREE.Group();
      pose.add(rotation);
      scene.add(pose);
      const glowMap = glowTexture(),
        glow = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: glowMap,
            transparent: true,
            depthWrite: false,
            opacity: 0.55,
          }),
        );
      glow.scale.set(7, 6, 1);
      glow.position.set(0, -0.4, -2.5);
      pose.add(glow);
      const stoneMap = stoneTexture();
      const glass = new THREE.MeshPhysicalMaterial({
        color: "#fff2dc",
        metalness: 0,
        roughness: 0.04,
        transmission: 0,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        thickness: 0.1,
        ior: 1.47,
        attenuationColor: new THREE.Color("#a78f82"),
        attenuationDistance: 5,
        envMapIntensity: 2.2,
      });
      glass.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <opaque_fragment>",
          "float noctFresnel=pow(1.0-abs(dot(normal,normalize(vViewPosition))),3.0);\ndiffuseColor.a=mix(.065,.68,noctFresnel);\n#include <opaque_fragment>",
        );
      };
      const liquid = new THREE.MeshPhysicalMaterial({
        color: "#a75912",
        roughness: 0.13,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.1,
      });
      liquid.onBeforeCompile = (shader) => {
        shader.vertexShader =
          "varying float noctLiquidY;\n" + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nnoctLiquidY=position.y;",
        );
        shader.fragmentShader =
          "varying float noctLiquidY;\n" + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <color_fragment>",
          "#include <color_fragment>\ndiffuseColor.rgb *= mix(vec3(.18,.12,.06),vec3(2.1,1.7,.95),clamp(.5-noctLiquidY*.65,0.0,1.0));",
        );
      };
      const stone = new THREE.MeshStandardMaterial({
        color: "#c0b3a5",
        map: stoneMap,
        metalness: 0.12,
        roughness: 0.23,
        envMapIntensity: 1.2,
      });
      const copper = new THREE.MeshStandardMaterial({
        color: "#b77542",
        metalness: 0.9,
        roughness: 0.24,
      });
      const gold = new THREE.MeshStandardMaterial({
        color: "#d4b482",
        metalness: 0.85,
        roughness: 0.2,
      });
      const nozzleMat = new THREE.MeshStandardMaterial({
        color: "#140e16",
        metalness: 0.1,
        roughness: 0.5,
      });
      const picking: THREE.Object3D[] = [];
      let cap: THREE.Object3D | null = null,
        head: THREE.Object3D | null = null,
        nozzle: THREE.Object3D | null = null,
        capBase = new THREE.Vector3(),
        headBase = new THREE.Vector3(),
        nozzleBase = new THREE.Vector3(),
        ready = false;
      const particleCount = 48,
        particlePositions = new Float32Array(particleCount * 3),
        particleSeeds = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleSeeds.length; i++)
        particleSeeds[i] = Math.sin(i * 73.17) * 0.5 + 0.5;
      const pg = new THREE.BufferGeometry();
      pg.setAttribute(
        "position",
        new THREE.BufferAttribute(particlePositions, 3),
      );
      const mistMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { opacity: { value: 0 } },
        vertexShader:
          "void main(){vec4 p=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*p;gl_PointSize=27.0;}",
        fragmentShader:
          "uniform float opacity;void main(){float d=length(gl_PointCoord-.5)*2.0;float a=smoothstep(1.0,.0,d)*opacity;gl_FragColor=vec4(.94,.84,.72,a);}",
      });
      const mist = new THREE.Points(pg, mistMat);
      mist.frustumCulled = false;
      mist.visible = false;
      rotation.add(mist);
      const accentPalette = {
          ember: new THREE.Color(catalog.ember.color),
          rain: new THREE.Color(catalog.rain.color),
          veil: new THREE.Color(catalog.veil.color),
        },
        liquidPalette = {
          ember: new THREE.Color("#ac671d"),
          rain: new THREE.Color("#99702a"),
          veil: new THREE.Color("#ad7735"),
        };
      let width = innerWidth,
        height = innerHeight,
        anchorData: { x: number; y: number; h: number; el: HTMLElement }[] = [],
        activeAnchor: HTMLElement | null = null,
        controlsAllowed = true,
        modelRoot: THREE.Object3D | null = null,
        targetX = 0,
        targetY = 0,
        targetScale = 1,
        yaw = 0,
        targetYaw = 0,
        pitch = 0,
        targetPitch = 0,
        velocity = 0,
        capValue = 0,
        spraySeen = latest.current.spraySerial,
        sprayStart = -100,
        frameId = 0,
        lastTime = 0,
        lastFrame = 0,
        drag: {
          id: number;
          x: number;
          y: number;
          lastX: number;
          lastY: number;
          lastTime: number;
          dx: number;
          dy: number;
          mode: "pending" | "rotate" | "scroll";
          target: HTMLElement;
        } | null = null;
      const raycaster = new THREE.Raycaster(),
        pointer = new THREE.Vector2(),
        position = new THREE.Vector3(),
        modelBounds = new THREE.Box3(),
        partBounds = new THREE.Box3();
      const pageRoot = container.closest<HTMLElement>(".scene-page")!;
      let controlsOwner: HTMLElement | null | undefined;
      function activeControls(active: HTMLElement | null) {
        if (controlsOwner === active) return;
        controlsOwner = active;
        for (const a of anchorData) {
          const selected = a.el === active;
          a.el.toggleAttribute("data-bottle-active", selected);
          const touch = a.el.querySelector<HTMLElement>(".bottle-touch");
          const toolbar = a.el.querySelector<HTMLElement>(".bottle-toolbar");
          if (touch) touch.tabIndex = selected ? 0 : -1;
          if (toolbar) toolbar.inert = !selected;
        }
      }
      function restoreControls() {
        controlsOwner = undefined;
        for (const a of anchorData) {
          a.el.removeAttribute("data-bottle-active");
          a.el
            .querySelector<HTMLElement>(".bottle-touch")
            ?.setAttribute("tabindex", "0");
          const toolbar = a.el.querySelector<HTMLElement>(".bottle-toolbar");
          if (toolbar) toolbar.inert = false;
        }
      }
      function anchors() {
        anchorData = Array.from(
          document.querySelectorAll<HTMLElement>("[data-bottle-anchor]"),
        ).map((el) => {
          const r = el.getBoundingClientRect();
          return {
            el,
            x: r.left + r.width / 2,
            y: r.top + r.height / 2 + scrollY - 35,
            h: Math.max(230, r.height - 100),
          };
        });
        updateTarget();
      }
      function updateTarget() {
        if (!anchorData.length) return;
        const focus = scrollY + height * 0.5;
        const nearest = anchorData.reduce(
          (best, v) =>
            Math.abs(focus - v.y) < Math.abs(focus - best.y) ? v : best,
          anchorData[0],
        );
        activeAnchor = nearest.el;
        controlsAllowed = true;
        let a = anchorData[0],
          b = a,
          t = 0;
        for (let i = 0; i < anchorData.length - 1; i++) {
          if (focus >= anchorData[i].y) {
            a = anchorData[i];
            b = anchorData[i + 1];
            t = clamp((focus - a.y) / (b.y - a.y), 0, 1);
          }
        }
        if (focus >= anchorData.at(-1)!.y) {
          a = b = anchorData.at(-1)!;
          t = 0;
        }
        const x = THREE.MathUtils.lerp(a.x, b.x, t),
          y = THREE.MathUtils.lerp(a.y, b.y, t) - scrollY,
          h = THREE.MathUtils.lerp(a.h, b.h, t);
        targetX = ((x / width - 0.5) * 8 * width) / height;
        targetY = -(y / height - 0.5) * 8;
        targetScale = ((h / height) * 8) / 3.8;
        if (width <= 900) {
          const distance = Math.abs(focus - nearest.y),
            retreat = clamp((distance - height * 0.28) / (height * 0.18), 0, 1);
          controlsAllowed = retreat < 0.2;
          targetX =
            ((nearest.x / width - 0.5) * 8 * width) / height +
            ((retreat * 8 * width) / height) * 0.78;
          targetY = -((nearest.y - scrollY) / height - 0.5) * 8;
          targetScale =
            (((nearest.h / height) * 8) / 3.8) * (1 - retreat * 0.6);
        }
        pose.visible =
          focus < anchorData.at(-1)!.y + height * 0.7 &&
          scrollY < document.documentElement.scrollHeight - height * 0.3;
        request();
      }
      function resize() {
        width = innerWidth;
        height = innerHeight;
        renderer.setSize(width, height);
        camera.left = (-4 * width) / height;
        camera.right = (4 * width) / height;
        camera.top = 4;
        camera.bottom = -4;
        camera.updateProjectionMatrix();
        anchors();
        request();
      }
      function request() {
        if (!disposed && !contextLost && !frameId && !document.hidden)
          frameId = requestAnimationFrame(frame);
      }
      invalidate.current = request;
      function frame(now: number) {
        frameId = 0;
        if (disposed || contextLost) return;
        const p = latest.current,
          dt = Math.min(0.04, lastTime ? (now - lastTime) / 1000 : 0.016);
        lastTime = now;
        const reduce = p.reduce;
        const scaleTarget =
          targetScale * (p.capOpen ? (width <= 900 ? 0.9 : 0.94) : 1);
        let movement = false;
        if (!p.paused) {
          if (!drag && Math.abs(velocity) > 0.001 && !reduce) {
            targetYaw += velocity * dt;
            velocity *= Math.exp(-7 * dt);
          } else if (reduce) velocity = 0;
          yaw = reduce ? targetYaw : damp(yaw, targetYaw, 13, dt);
          pitch = reduce ? targetPitch : damp(pitch, targetPitch, 11, dt);
          capValue = reduce
            ? Number(p.capOpen)
            : damp(capValue, Number(p.capOpen), 10, dt);
          pose.position.x = reduce
            ? targetX
            : damp(pose.position.x, targetX, 11, dt);
          pose.position.y = reduce
            ? targetY
            : damp(pose.position.y, targetY, 11, dt);
          const scale = reduce
            ? scaleTarget
            : damp(pose.scale.x, scaleTarget, 11, dt);
          pose.scale.setScalar(scale);
          rotation.rotation.set(pitch, yaw, 0);
          if (cap) {
            cap.position.copy(capBase);
            cap.position.y += capValue * (width <= 900 ? 0.4 : 0.65);
            cap.position.x += capValue * (width <= 900 ? 0.65 : 0.75);
            cap.rotation.z = -capValue * 0.14;
          }
          if (spraySeen !== p.spraySerial) {
            spraySeen = p.spraySerial;
            sprayStart = now;
          }
        }
        const sprayAge = (now - sprayStart) / 1000,
          press =
            sprayAge >= 0 && sprayAge < 0.35
              ? Math.sin((sprayAge / 0.35) * Math.PI) * 0.09
              : 0;
        if (head) {
          head.position.copy(headBase);
          head.position.y -= press;
        }
        if (nozzle) {
          nozzle.position.copy(nozzleBase);
          nozzle.position.y -= press;
        }
        mist.visible = !reduce && !p.paused && sprayAge >= 0 && sprayAge < 0.85;
        if (mist.visible) {
          for (let i = 0; i < particleCount; i++) {
            const t = sprayAge;
            particlePositions[i * 3] = (particleSeeds[i * 3] - 0.5) * t * 0.85;
            particlePositions[i * 3 + 1] =
              1.3 + (particleSeeds[i * 3 + 1] - 0.3) * t * 0.55;
            particlePositions[i * 3 + 2] =
              0.27 + t * (0.6 + particleSeeds[i * 3 + 2] * 1.3);
          }
          pg.attributes.position.needsUpdate = true;
          mistMat.uniforms.opacity.value =
            Math.sin((sprayAge / 0.85) * Math.PI) * 0.12;
        }
        const accent = accentPalette[p.scent];
        rim.color.lerp(accent, 0.12);
        liquid.color.lerp(liquidPalette[p.scent], 0.12);
        const colorMoving =
          Math.abs(rim.color.r - accent.r) +
            Math.abs(rim.color.g - accent.g) +
            Math.abs(rim.color.b - accent.b) >
          0.003;
        metrics.yaw = yaw;
        metrics.pitch = pitch;
        metrics.cap = capValue;
        metrics.mistParticles = mist.visible ? particleCount : 0;
        metrics.active = pose.visible && !p.paused;
        if (pose.visible) {
          const renderStart = performance.now();
          renderer.render(scene, camera);
          if (metrics.renderTimes.length < 2400)
            metrics.renderTimes.push(performance.now() - renderStart);
          metrics.frames++;
          if (cap) {
            partBounds.setFromObject(cap).getCenter(position).project(camera);
            metrics.capScreen.x = ((position.x + 1) * width) / 2;
            metrics.capScreen.y = ((-position.y + 1) * height) / 2;
          }
          if (head) {
            partBounds.setFromObject(head).getCenter(position).project(camera);
            metrics.headScreen.x = ((position.x + 1) * width) / 2;
            metrics.headScreen.y = ((-position.y + 1) * height) / 2;
          }
          if (modelRoot) {
            modelBounds.setFromObject(modelRoot);
            let left = Infinity,
              top = Infinity,
              right = -Infinity,
              bottom = -Infinity;
            for (const x of [modelBounds.min.x, modelBounds.max.x])
              for (const y of [modelBounds.min.y, modelBounds.max.y])
                for (const z of [modelBounds.min.z, modelBounds.max.z]) {
                  position.set(x, y, z).project(camera);
                  const sx = ((position.x + 1) * width) / 2,
                    sy = ((-position.y + 1) * height) / 2;
                  left = Math.min(left, sx);
                  right = Math.max(right, sx);
                  top = Math.min(top, sy);
                  bottom = Math.max(bottom, sy);
                }
            rotation.localToWorld(position.set(0, -1.88, 0)).project(camera);
            const uiX = ((position.x + 1) * width) / 2,
              bodyBottom = bottom,
              uiY = bodyBottom + 14;
            metrics.ui = { x: uiX, y: uiY, bodyBottom };
            pageRoot.style.setProperty("--bottle-ui-x", `${uiX}px`);
            pageRoot.style.setProperty("--bottle-ui-y", `${uiY}px`);
            pageRoot.style.setProperty("--bottle-hit-x", `${left - 12}px`);
            pageRoot.style.setProperty("--bottle-hit-y", `${top - 12}px`);
            pageRoot.style.setProperty(
              "--bottle-hit-w",
              `${right - left + 24}px`,
            );
            pageRoot.style.setProperty(
              "--bottle-hit-h",
              `${bottom - top + 24}px`,
            );
            activeControls(
              controlsAllowed &&
                right > 0 &&
                left < width &&
                bottom > 0 &&
                top < height
                ? activeAnchor
                : null,
            );
          }
          metrics.drawCalls = renderer.info.render.calls;
          metrics.triangles = renderer.info.render.triangles;
          if (lastFrame && metrics.frameTimes.length < 2400)
            metrics.frameTimes.push(now - lastFrame);
          lastFrame = now;
        } else {
          renderer.clear();
          activeControls(null);
        }
        movement =
          Math.abs(yaw - targetYaw) +
            Math.abs(pitch - targetPitch) +
            Math.abs(capValue - Number(p.capOpen)) +
            Math.abs(pose.position.x - targetX) +
            Math.abs(pose.position.y - targetY) +
            Math.abs(pose.scale.x - scaleTarget) +
            Math.abs(velocity) >
          0.001;
        if (
          !p.paused &&
          pose.visible &&
          (movement || colorMoving || mist.visible || press > 0 || drag)
        )
          request();
        else {
          lastTime = 0;
          lastFrame = 0;
        }
      }
      actions.current = {
        turn: (r) => {
          targetYaw += r;
          velocity = 0;
          request();
        },
        reset: () => {
          targetYaw = Math.round(yaw / (Math.PI * 2)) * Math.PI * 2;
          targetPitch = 0;
          velocity = 0;
          request();
        },
        pointerDown: (e) => {
          if (
            latest.current.paused ||
            !ready ||
            drag ||
            e.button !== 0 ||
            !e.isPrimary
          )
            return;
          drag = {
            id: e.pointerId,
            x: e.clientX,
            y: e.clientY,
            lastX: e.clientX,
            lastY: e.clientY,
            lastTime: performance.now(),
            dx: 0,
            dy: 0,
            mode: "pending",
            target: e.currentTarget as HTMLElement,
          };
          velocity = 0;
          request();
        },
        pointerMove: (e) => {
          if (!drag || drag.id !== e.pointerId) return;
          const now = performance.now(),
            dx = e.clientX - drag.x,
            dy = e.clientY - drag.y;
          if (drag.mode === "pending" && Math.hypot(dx, dy) > 7) {
            drag.mode =
              e.pointerType === "touch" && Math.abs(dy) > Math.abs(dx) * 1.15
                ? "scroll"
                : "rotate";
            if (drag.mode === "rotate")
              drag.target.setPointerCapture(e.pointerId);
          }
          if (drag.mode === "rotate") {
            const step = e.clientX - drag.lastX;
            targetYaw += step * 0.009;
            targetPitch = clamp(
              targetPitch + (e.clientY - drag.lastY) * 0.003,
              -0.2,
              0.2,
            );
            velocity = clamp(
              (step / Math.max(8, now - drag.lastTime)) * 9,
              -4,
              4,
            );
            e.preventDefault();
          }
          drag.dx = dx;
          drag.dy = dy;
          drag.lastX = e.clientX;
          drag.lastY = e.clientY;
          drag.lastTime = now;
          request();
        },
        pointerUp: (e) => {
          if (!drag || drag.id !== e.pointerId) return;
          const d = drag;
          drag = null;
          targetPitch = 0;
          if (d.target.hasPointerCapture(e.pointerId))
            d.target.releasePointerCapture(e.pointerId);
          if (d.mode === "pending" && Math.hypot(d.dx, d.dy) < 7) {
            pointer.set(
              (e.clientX / width) * 2 - 1,
              -((e.clientY / height) * 2 - 1),
            );
            raycaster.setFromCamera(pointer, camera);
            const candidates = latest.current.capOpen
              ? picking
              : picking.filter((o) => o === cap);
            const hit = raycaster.intersectObjects(candidates, false)[0];
            if (hit?.object === cap) latest.current.onCap();
            else if (hit && (hit.object === head || hit.object === nozzle))
              latest.current.onSpray();
          }
          request();
        },
        cancel: () => {
          drag = null;
          targetPitch = 0;
          velocity = 0;
          request();
        },
      };
      const loader = new GLTFLoader();
      loader.load(
        `${import.meta.env.BASE_URL}models/noct-bottle.glb`,
        async (gltf) => {
          if (disposed) {
            gltf.scene.traverse((o) => {
              if (o instanceof THREE.Mesh) o.geometry.dispose();
            });
            return;
          }
          gltf.scene.traverse((o) => {
            if (!(o instanceof THREE.Mesh)) return;
            const name = o.name;
            if (name.includes("Body_Glass") || name.includes("Dip_Tube"))
              o.material = glass;
            else if (name.includes("Amber_Liquid")) o.material = liquid;
            else if (name.includes("Stone_Cap")) {
              o.material = stone;
              cap = o;
              capBase = o.position.clone();
              picking.push(o);
            } else if (name.includes("Nozzle_Hole")) {
              o.material = nozzleMat;
              nozzle = o;
              nozzleBase = o.position.clone();
              picking.push(o);
            } else if (name.includes("Atomizer_Head")) {
              o.material = gold;
              head = o;
              headBase = o.position.clone();
              picking.push(o);
            } else o.material = name.includes("Copper") ? copper : gold;
          });
          rotation.add(gltf.scene);
          modelRoot = gltf.scene;
          anchors();
          pose.position.set(targetX, targetY, 0);
          pose.scale.setScalar(targetScale);
          try {
            await renderer.compileAsync(scene, camera);
          } catch {}
          if (disposed || contextLost) return;
          ready = true;
          metrics.assetLoads++;
          metrics.modelLoaded = true;
          metrics.status = "ready";
          latest.current.onStatus("ready");
          request();
        },
        undefined,
        () => {
          if (!disposed) {
            metrics.status = "fallback";
            restoreControls();
            latest.current.onStatus("fallback");
          }
        },
      );
      const globalUp = () => {
          if (drag) {
            drag = null;
            targetPitch = 0;
            request();
          }
        },
        lost = (e: Event) => {
          e.preventDefault();
          contextLost = true;
          metrics.status = "fallback";
          metrics.active = false;
          restoreControls();
          latest.current.onStatus("fallback");
          if (frameId) cancelAnimationFrame(frameId);
          frameId = 0;
        };
      renderer.domElement.addEventListener("webglcontextlost", lost);
      window.addEventListener("pointerup", globalUp);
      window.addEventListener("pointercancel", globalUp);
      const onScroll = () => updateTarget(),
        onVisibility = () => {
          if (!document.hidden) {
            lastTime = 0;
            request();
          } else {
            if (frameId) cancelAnimationFrame(frameId);
            frameId = 0;
          }
        };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", resize);
      document.addEventListener("visibilitychange", onVisibility);
      const ro = new ResizeObserver(() => anchors());
      const main = document.querySelector("main");
      if (main) ro.observe(main);
      document.fonts.ready.then(() => {
        if (!disposed) anchors();
      });
      resize();
      return () => {
        disposed = true;
        restoreControls();
        if (frameId) cancelAnimationFrame(frameId);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", resize);
        document.removeEventListener("visibilitychange", onVisibility);
        ro.disconnect();
        window.removeEventListener("pointerup", globalUp);
        window.removeEventListener("pointercancel", globalUp);
        renderer.domElement.removeEventListener("webglcontextlost", lost);
        rotation.traverse((o) => {
          if (o instanceof THREE.Mesh) o.geometry.dispose();
        });
        pg.dispose();
        for (const m of [
          glass,
          liquid,
          stone,
          copper,
          gold,
          nozzleMat,
          mistMat,
          glow.material,
        ])
          m.dispose();
        stoneMap.dispose();
        glowMap.dispose();
        env.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        invalidate.current = () => {};
      };
    }, []);
    return <div className="bottle-canvas" ref={host} aria-hidden="true" />;
  },
);
