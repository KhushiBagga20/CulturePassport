"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CountryStatus } from "@/lib/types";
import {
  borderSegments,
  lonLatToVec,
  paintBaseTexture,
  paintHighlight,
  pickCountry,
  vecToLonLat,
  type World,
  type WorldFeature,
} from "./geo";

export interface Flight {
  id: number;
  lon: number;
  lat: number;
  /** distance from the globe centre, in globe radii */
  dist: number;
  duration: number;
}

export interface GlobeLabel {
  key: string;
  lon: number;
  lat: number;
}

interface Props {
  world: World;
  statusById: Map<string, CountryStatus>;
  hovered: WorldFeature | null;
  selected: WorldFeature | null;
  onHover: (f: WorldFeature | null, client: { x: number; y: number } | null) => void;
  onPointerLonLat: (ll: [number, number] | null) => void;
  onSelect: (f: WorldFeature, viaTouch: boolean) => void;
  flight: Flight | null;
  onFlightDone: (id: number) => void;
  autoRotate: boolean;
  reduceMotion: boolean;
  labels: GlobeLabel[];
  labelRefs: MutableRefObject<Map<string, HTMLElement>>;
  arcs: [number, number][][];
  onReady: () => void;
  onUserInteract: () => void;
  initial: [number, number];
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D baseMap;
  uniform sampler2D hiMap;
  uniform vec3 lightDir;
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vec3 base = texture2D(baseMap, vUv).rgb;
    vec4 hi = texture2D(hiMap, vUv);
    float pulse = 0.82 + 0.18 * sin(time * 2.2);
    vec3 col = mix(base, hi.rgb, hi.a * pulse);
    float ndl = dot(normalize(vNormalW), normalize(lightDir));
    col *= 0.74 + 0.26 * smoothstep(-0.55, 0.85, ndl);
    float rim = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewDir)), 0.0), 2.4);
    col = mix(col, vec3(0.93, 0.88, 0.80), rim * 0.6);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const HALO_FRAG = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec2 vUv;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vViewDir))), 3.0);
    gl_FragColor = vec4(0.72, 0.29, 0.19, f * 0.16);
    #include <colorspace_fragment>
  }
`;

function GlobeMesh(props: Props) {
  const { world, statusById, hovered, selected, onHover, onSelect, onPointerLonLat, onReady } = props;
  const { gl, size } = useThree();
  const material = useRef<THREE.ShaderMaterial>(null);
  const small = size.width < 700;

  const { baseTex, hiTex, hiCanvas } = useMemo(() => {
    const maxTex = gl.capabilities.maxTextureSize;
    const width = Math.min(small ? 2048 : 4096, maxTex);
    const base = paintBaseTexture(world, statusById, width);
    const baseTex = new THREE.CanvasTexture(base);
    baseTex.colorSpace = THREE.SRGBColorSpace;
    baseTex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    const hiCanvas = document.createElement("canvas");
    hiCanvas.width = small ? 1024 : 2048;
    hiCanvas.height = hiCanvas.width / 2;
    const hiTex = new THREE.CanvasTexture(hiCanvas);
    hiTex.colorSpace = THREE.SRGBColorSpace;
    return { baseTex, hiTex, hiCanvas };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, statusById, gl]);

  useEffect(() => () => {
    baseTex.dispose();
    hiTex.dispose();
  }, [baseTex, hiTex]);

  useEffect(() => {
    paintHighlight(hiCanvas, world, hovered, selected);
    // three.js textures are mutable GPU handles; flagging an upload is the intended API.
    // eslint-disable-next-line react-hooks/immutability
    hiTex.needsUpdate = true;
  }, [hovered, selected, hiCanvas, hiTex, world]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  const uniforms = useMemo(
    () => ({
      baseMap: { value: baseTex },
      hiMap: { value: hiTex },
      lightDir: { value: new THREE.Vector3(-0.6, 0.55, 1) },
      time: { value: 0 },
    }),
    [baseTex, hiTex],
  );

  const camera = useThree((s) => s.camera);
  useFrame((_, dt) => {
    if (material.current) material.current.uniforms.time.value += dt;
    // keep the key light roughly over the viewer's shoulder
    uniforms.lightDir.value.copy(camera.position).normalize().add(new THREE.Vector3(-0.35, 0.4, 0)).normalize();
  });

  const lastMove = useRef(0);
  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    const now = performance.now();
    if (now - lastMove.current < 24) return;
    lastMove.current = now;
    const [lon, lat] = vecToLonLat(e.point.x, e.point.y, e.point.z);
    onPointerLonLat([lon, lat]);
    if (e.pointerType === "touch") return;
    onHover(pickCountry(world, lon, lat), { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return; // a drag, not a click
    const [lon, lat] = vecToLonLat(e.point.x, e.point.y, e.point.z);
    const f = pickCountry(world, lon, lat);
    if (f) onSelect(f, (e.nativeEvent as PointerEvent).pointerType === "touch");
  };

  return (
    <group>
      <mesh
        onPointerMove={handleMove}
        onPointerOut={() => {
          onHover(null, null);
          onPointerLonLat(null);
        }}
        onClick={handleClick}
      >
        <sphereGeometry args={[1, 128, 96]} />
        <shaderMaterial ref={material} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} />
      </mesh>
      <Borders world={world} />
      <mesh scale={1.06}>
        <sphereGeometry args={[1, 64, 48]} />
        <shaderMaterial vertexShader={VERT} fragmentShader={HALO_FRAG} transparent depthWrite={false} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function Borders({ world }: { world: World }) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(borderSegments(world), 3));
    return g;
  }, [world]);
  useEffect(() => () => geom.dispose(), [geom]);
  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial color="#211C19" transparent opacity={0.42} depthWrite={false} />
    </lineSegments>
  );
}

function arcPoints(a: [number, number], b: [number, number]): THREE.Vector3[] {
  const va = new THREE.Vector3(...lonLatToVec(a[0], a[1]));
  const vb = new THREE.Vector3(...lonLatToVec(b[0], b[1]));
  const angle = va.angleTo(vb);
  const lift = Math.min(0.2, 0.03 + angle * 0.07);
  const pts: THREE.Vector3[] = [];
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const v = va.clone().lerp(vb, t).normalize();
    // spherical interpolation through slerp for long arcs
    const q = new THREE.Quaternion().setFromUnitVectors(va, vb);
    const qt = new THREE.Quaternion().slerp(q, t);
    v.copy(va).applyQuaternion(qt);
    pts.push(v.multiplyScalar(1.004 + lift * Math.sin(Math.PI * t)));
  }
  return pts;
}

function Arcs({ arcs, reduceMotion }: { arcs: [number, number][][]; reduceMotion: boolean }) {
  const refs = useRef<(THREE.Object3D | null)[]>([]);
  useFrame((_, dt) => {
    if (reduceMotion) return;
    for (const r of refs.current) {
      const mat = (r as unknown as { material?: { dashOffset: number } } | null)?.material;
      if (mat) mat.dashOffset -= dt * 0.12;
    }
  });
  return (
    <group>
      {arcs.map((pair, i) => (
        <Line
          key={i}
          ref={(el) => {
            refs.current[i] = el as unknown as THREE.Object3D;
          }}
          points={arcPoints(pair[0], pair[1])}
          color={i === 0 ? "#B84B30" : "#581D30"}
          lineWidth={1.6}
          dashed
          dashSize={0.025}
          gapSize={0.03}
          transparent
          opacity={0.9}
        />
      ))}
    </group>
  );
}

function OrbitRings({ reduceMotion }: { reduceMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const ring = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 180; i++) {
      const a = (i / 180) * Math.PI * 2;
      pts.push([Math.cos(a) * 1.32, 0, Math.sin(a) * 1.32]);
    }
    return pts;
  }, []);
  useFrame((_, dt) => {
    if (!reduceMotion && group.current) group.current.rotation.y += dt * 0.03;
  });
  return (
    <group ref={group}>
      <group rotation={[0.42, 0, 0.18]}>
        <Line points={ring} color="#581D30" lineWidth={0.8} dashed dashSize={0.012} gapSize={0.05} transparent opacity={0.45} />
      </group>
      <group rotation={[-0.28, 0.6, -0.3]} scale={1.06}>
        <Line points={ring} color="#4e2b4c" lineWidth={0.7} dashed dashSize={0.006} gapSize={0.04} transparent opacity={0.35} />
      </group>
    </group>
  );
}

function Rig({
  flight,
  onFlightDone,
  autoRotate,
  reduceMotion,
  labels,
  labelRefs,
  onUserInteract,
  initial,
}: Pick<Props, "flight" | "onFlightDone" | "autoRotate" | "reduceMotion" | "labels" | "labelRefs" | "onUserInteract" | "initial">) {
  const { camera, size } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const tween = useRef<{ id: number; from: THREE.Vector3; to: THREE.Vector3; fromD: number; toD: number; t: number; dur: number } | null>(null);

  // Fit the globe to the canvas, portrait or landscape.
  const fitDistance = useMemo(() => {
    const persp = camera as THREE.PerspectiveCamera;
    const tanHalf = Math.tan(((persp.fov ?? 35) * Math.PI) / 360);
    const aspect = size.width / Math.max(1, size.height);
    const byHeight = 1 / (0.84 * tanHalf);
    const byWidth = 1 / (0.86 * tanHalf * aspect);
    return Math.max(byHeight, byWidth, 2.4);
  }, [camera, size]);

  useEffect(() => {
    const [x, y, z] = lonLatToVec(initial[0], initial[1], fitDistance);
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitDistance]);

  useEffect(() => {
    if (!flight) return;
    const from = camera.position.clone().normalize();
    const to = new THREE.Vector3(...lonLatToVec(flight.lon, flight.lat)).normalize();
    tween.current = {
      id: flight.id,
      from,
      to,
      fromD: camera.position.length(),
      toD: flight.dist * (fitDistance / 3.4),
      t: 0,
      dur: reduceMotion ? 0.01 : flight.duration,
    };
  }, [flight, camera, fitDistance, reduceMotion]);

  const tmp = useMemo(() => new THREE.Vector3(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const tw = tween.current;
    const c = controls.current;
    if (c) {
      c.enabled = !tw;
      c.autoRotate = autoRotate && !reduceMotion && !tw;
    }
    if (tw) {
      tw.t = Math.min(1, tw.t + dt / tw.dur);
      const e = tw.t < 0.5 ? 4 * tw.t ** 3 : 1 - (-2 * tw.t + 2) ** 3 / 2;
      const q = new THREE.Quaternion().setFromUnitVectors(tw.from, tw.to);
      const dir = tw.from.clone().applyQuaternion(new THREE.Quaternion().slerp(q, e));
      camera.position.copy(dir.multiplyScalar(tw.fromD + (tw.toD - tw.fromD) * e));
      camera.lookAt(0, 0, 0);
      if (tw.t >= 1) {
        tween.current = null;
        controls.current?.update();
        onFlightDone(tw.id);
      }
    }
    // Project labels for curated countries; hide them on the far side.
    camDir.copy(camera.position).normalize();
    for (const l of labels) {
      const el = labelRefs.current.get(l.key);
      if (!el) continue;
      const [x, y, z] = lonLatToVec(l.lon, l.lat, 1.02);
      tmp.set(x, y, z);
      const facing = tmp.clone().normalize().dot(camDir);
      tmp.project(camera);
      const sx = (tmp.x * 0.5 + 0.5) * size.width;
      const sy = (-tmp.y * 0.5 + 0.5) * size.height;
      const visible = facing > 0.18;
      el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
      el.style.opacity = visible ? String(Math.min(1, (facing - 0.18) * 4)) : "0";
      el.style.pointerEvents = visible ? "auto" : "none";
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.45}
      zoomSpeed={0.6}
      minDistance={fitDistance * 0.42}
      maxDistance={fitDistance * 1.25}
      autoRotateSpeed={0.35}
      onStart={onUserInteract}
    />
  );
}

export default function GlobeCanvas(props: Props) {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      camera={{ fov: 35, near: 0.1, far: 50, position: [0, 0, 3.4] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden
      style={{ touchAction: "none" }}
    >
      <GlobeMesh {...props} />
      <Arcs arcs={props.arcs} reduceMotion={props.reduceMotion} />
      <OrbitRings reduceMotion={props.reduceMotion} />
      <Rig
        flight={props.flight}
        onFlightDone={props.onFlightDone}
        autoRotate={props.autoRotate}
        reduceMotion={props.reduceMotion}
        labels={props.labels}
        labelRefs={props.labelRefs}
        onUserInteract={props.onUserInteract}
        initial={props.initial}
      />
    </Canvas>
  );
}
