"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Environment, ContactShadows, Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { PiShoppingBagBold } from "react-icons/pi";
import { ArrowRight, Loader2, Phone, CheckCircle, Megaphone, Wrench, Store, Search, MapPin, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { TANJORE_LOCALITIES, TanjoreLocality } from "@/lib/constants";

class HeartCurve extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
  }
  getPoint(t: number, optionalTarget = new THREE.Vector3()) {
    t = t * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);

    return optionalTarget.set(x * 0.002, (y + 6) * 0.002, 0);
  }
}

const sharedHeartCurve = new HeartCurve();

interface ResponsiveGroupProps {
  children: React.ReactNode;
  scale?: number;
}

function ResponsiveGroup({
  children,
  scale = 1,
}: ResponsiveGroupProps) {
  const { viewport } = useThree();
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const s = Math.min(1.5, viewport.width / 2.7) * scale * (isMobile ? 0.75 : 1.3);
  return <group scale={s}>{children}</group>;
}

function GlassCapsule({
  color,
  power,
  intensity,
}: {
  color: string;
  power: number;
  intensity: number;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      color: { value: new THREE.Color("#ffffff") },
      power: { value: 2.5 },
      intensity: { value: 0.6 },
    }),
    [],
  );

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.color.value.set(color);
      materialRef.current.uniforms.power.value = power;
      materialRef.current.uniforms.intensity.value = intensity;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[0.3, 64, 64, 0, Math.PI * 2, 0, Math.PI]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          uniform vec3 color;
          uniform float power;
          uniform float intensity;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);
            float fresnel = 1.0 - max(dot(viewDir, normal), 0.0);
            fresnel = pow(fresnel, power);
            gl_FragColor = vec4(color, fresnel * intensity);
          }
        `}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

const earBaseMat = new THREE.MeshStandardMaterial({
  color: "#f0f0f0",
  roughness: 0.5,
});
const earRingMat = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.3,
});
const earCenterMat = new THREE.MeshStandardMaterial({
  color: "#cccccc",
  roughness: 0.8,
});
const antennaBaseMat = new THREE.MeshStandardMaterial({
  color: "#999999",
  roughness: 0.4,
  metalness: 0.5,
});
const antennaStickMat = new THREE.MeshStandardMaterial({
  color: "#d0d0d0",
  roughness: 0.4,
  metalness: 0.2,
});
const antennaTipMat = new THREE.MeshStandardMaterial({
  color: "#ff3366",
  roughness: 0.2,
  toneMapped: false,
});

function RobotEar({
  position,
  scale = 1,
  isLeft = false,
}: {
  position: [number, number, number];
  scale?: number;
  isLeft?: boolean;
}) {
  const dir = isLeft ? -1 : 1;

  return (
    <group position={position} scale={scale}>
      <mesh
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
        material={earBaseMat}
      >
        <cylinderGeometry args={[0.04, 0.04, 0.025, 32]} />
      </mesh>

      <mesh
        position={[dir * 0.012, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
        material={earRingMat}
      >
        <torusGeometry args={[0.032, 0.008, 16, 32]} />
      </mesh>

      <mesh
        position={[dir * 0.012, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
        material={earCenterMat}
      >
        <cylinderGeometry args={[0.03, 0.03, 0.005, 32]} />
      </mesh>

      <group position={[dir * 0.015, 0.035, 0]} rotation={[-0.4, 0, 0]}>
        <mesh
          position={[0, 0.01, 0]}
          castShadow
          receiveShadow
          material={antennaBaseMat}
        >
          <cylinderGeometry args={[0.006, 0.008, 0.02, 16]} />
        </mesh>
        <mesh
          position={[0, 0.06, 0]}
          castShadow
          receiveShadow
          material={antennaStickMat}
        >
          <cylinderGeometry args={[0.003, 0.003, 0.1, 8]} />
        </mesh>
        <mesh
          position={[0, 0.11, 0]}
          castShadow
          receiveShadow
          material={antennaTipMat}
        >
          <sphereGeometry args={[0.006, 16, 16]} />
        </mesh>
      </group>
    </group>
  );
}

const eyeMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color(2, 2, 2),
  toneMapped: false,
  transparent: true,
});
const heartMat = new THREE.MeshBasicMaterial({
  color: "#ff3366",
  toneMapped: false,
});

function RobotEye({
  position,
  rotation,
  scale = 1,
  blinkDuration = 0.15,
  blinkCycle = 3.0,
  isLovedRef,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
  blinkDuration?: number;
  blinkCycle?: number;
  isLovedRef: React.MutableRefObject<boolean>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const normalEyesRef = useRef<THREE.Group>(null);
  const heartEyeRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current || !normalEyesRef.current || !heartEyeRef.current)
      return;

    const isHeart = isLovedRef.current;

    normalEyesRef.current.visible = !isHeart;
    heartEyeRef.current.visible = isHeart;

    const cycle = clock.getElapsedTime() % blinkCycle;

    let targetScaleY = 1;

    if (cycle < blinkDuration && !isHeart) {
      const progress = cycle / blinkDuration;
      const blinkClose = Math.sin(progress * Math.PI);

      targetScaleY = Math.max(0.05, 1.0 - blinkClose);
    }

    groupRef.current.scale.set(scale, scale * targetScaleY, scale);
  });

  const { topPath, bottomPath } = useMemo(() => {
    const w = 0.025;
    const h = 0.035;
    const r = 0.02;
    const g = 0.005;

    const tPath = new THREE.CurvePath<THREE.Vector3>();
    tPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-w, g, 0),
        new THREE.Vector3(-w, h - r, 0),
      ),
    );
    tPath.add(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-w, h - r, 0),
        new THREE.Vector3(-w, h, 0),
        new THREE.Vector3(-w + r, h, 0),
      ),
    );
    tPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-w + r, h, 0),
        new THREE.Vector3(w - r, h, 0),
      ),
    );
    tPath.add(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(w - r, h, 0),
        new THREE.Vector3(w, h, 0),
        new THREE.Vector3(w, h - r, 0),
      ),
    );
    tPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(w, h - r, 0),
        new THREE.Vector3(w, g, 0),
      ),
    );

    const bPath = new THREE.CurvePath<THREE.Vector3>();
    bPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-w, -g, 0),
        new THREE.Vector3(-w, -(h - r), 0),
      ),
    );
    bPath.add(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-w, -(h - r), 0),
        new THREE.Vector3(-w, -h, 0),
        new THREE.Vector3(-w + r, -h, 0),
      ),
    );
    bPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-w + r, -h, 0),
        new THREE.Vector3(w - r, -h, 0),
      ),
    );
    bPath.add(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(w - r, -h, 0),
        new THREE.Vector3(w, -h, 0),
        new THREE.Vector3(w, -(h - r), 0),
      ),
    );
    bPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(w, -(h - r), 0),
        new THREE.Vector3(w, -g, 0),
      ),
    );

    return { topPath: tPath, bottomPath: bPath };
  }, []);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <mesh ref={heartEyeRef} visible={false} material={heartMat}>
        <tubeGeometry args={[sharedHeartCurve, 64, 0.0035, 8, true]} />
      </mesh>

      <group ref={normalEyesRef}>
        <mesh material={eyeMat}>
          <tubeGeometry args={[topPath, 20, 0.0035, 8, false]} />
        </mesh>
        <mesh material={eyeMat}>
          <tubeGeometry args={[bottomPath, 20, 0.0035, 8, false]} />
        </mesh>
      </group>
    </group>
  );
}

function generatePbrTexturesAsync(): Promise<{
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const size = 512;
      const canvasC = document.createElement("canvas");
      const canvasB = document.createElement("canvas");
      canvasC.width = canvasB.width = size;
      canvasC.height = canvasB.height = size;
      const ctxC = canvasC.getContext("2d");
      const ctxB = canvasB.getContext("2d");

      if (ctxC && ctxB) {
        ctxC.fillStyle = "#dcdcdc";
        ctxC.fillRect(0, 0, size, size);
        ctxB.fillStyle = "#808080";
        ctxB.fillRect(0, 0, size, size);

        for (let i = 0; i < 10000; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          const r = 0.5 + Math.random() * 1.5;
          const isDark = Math.random() > 0.15;

          ctxC.beginPath();
          ctxC.arc(x, y, r, 0, Math.PI * 2);
          ctxC.fillStyle = isDark ? "#222222" : "#dddddd";
          ctxC.fill();

          ctxB.beginPath();
          ctxB.arc(x, y, r, 0, Math.PI * 2);
          ctxB.fillStyle = isDark ? "#000000" : "#ffffff";
          ctxB.fill();
        }
      }

      const texC = new THREE.CanvasTexture(canvasC);
      const texB = new THREE.CanvasTexture(canvasB);
      texC.wrapS = texB.wrapS = THREE.RepeatWrapping;
      texC.wrapT = texB.wrapT = THREE.RepeatWrapping;

      texC.repeat.set(6, 3);
      texB.repeat.set(6, 3);
      texC.needsUpdate = true;
      texB.needsUpdate = true;

      resolve({ colorMap: texC, bumpMap: texB });
    }, 0);
  });
}

function RobotPrototype({
  neckParams = {
    baseR: 0.25,
    baseH: -0.01,
    midR: 0.23,
    midH: 0.02,
    lipBottomR: 0.27,
    lipBottomH: 0.025,
    lipTopR: 0.28,
    lipTopH: 0.05,
    innerR: 0.24,
    innerDropH: 0.03,
  },
  bodyParams = { bodyBevelR: 0.21, bodyBevelY: 0.38, bodyBevelT: 0.015 },
  color = "#c4c4c4",
  pantallaColor = "#00ffc6",
  pantallaBrillo = 1.2,
  blinkCycle = 3.0,
  metalness = 0.0,
}: {
  neckParams?: Record<string, number>;
  bodyParams?: Record<string, number>;
  color?: string;
  pantallaColor?: string;
  pantallaBrillo?: number;
  blinkCycle?: number;
  metalness?: number;
}) {
  const isLovedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  const [textures, setTextures] = useState<{
    colorMap: THREE.CanvasTexture | null;
    bumpMap: THREE.CanvasTexture | null;
  }>({ colorMap: null, bumpMap: null });

  const design = {
    pantallaColor: pantallaColor,
    pantallaGrosor: 3.8,
    pantallaBrillo: pantallaBrillo,
    separacionOjos: 0.07,
    tamañoOrejas: 1.3,
    escalaOjos: 1.1,
    parpadeoFrecuencia: blinkCycle,
    parpadeoDuracion: 0.45,
    colorChasis: color,
    alturaCabeza: 0.6,
  };

  const config = {
    moveSpeed: 0.35,
    bodyRotSpeed: 10.0,
    headRotSpeed: 20.0,
    bodyTiltX: 0.0,
    bodyTiltY: 0.95,
    headLookX: 0.3,
    headLookY: 1.8,
  };

  useFrame((state, delta) => {
    if (!bodyRef.current || !headRef.current) return;

    const dt = Math.min(delta, 0.1);

    const tx = state.pointer.x;
    const ty = state.pointer.y;

    const maxMoveX = state.viewport.width / 3.5;
    const targetPosX = tx * maxMoveX;
    bodyRef.current.position.x = THREE.MathUtils.lerp(
      bodyRef.current.position.x,
      targetPosX,
      config.moveSpeed * dt,
    );

    const relativeX = tx - bodyRef.current.position.x / 2.5;

    const bodyTargetRotY = -relativeX * config.bodyTiltY;

    const bodyTargetRotX = relativeX * relativeX * config.bodyTiltX - ty * 0.25;

    const bodyTargetRotZ = -relativeX * 0.15;

    bodyRef.current.rotation.y = THREE.MathUtils.lerp(
      bodyRef.current.rotation.y,
      bodyTargetRotY,
      config.bodyRotSpeed * dt,
    );
    bodyRef.current.rotation.x = THREE.MathUtils.lerp(
      bodyRef.current.rotation.x,
      bodyTargetRotX,
      config.bodyRotSpeed * dt,
    );
    bodyRef.current.rotation.z = THREE.MathUtils.lerp(
      bodyRef.current.rotation.z,
      bodyTargetRotZ,
      config.bodyRotSpeed * dt,
    );

    const headTargetRotY = relativeX * config.headLookY;
    const headTargetRotX = -ty * config.headLookX;

    headRef.current.rotation.y = THREE.MathUtils.lerp(
      headRef.current.rotation.y,
      headTargetRotY,
      config.headRotSpeed * dt,
    );
    headRef.current.rotation.x = THREE.MathUtils.lerp(
      headRef.current.rotation.x,
      headTargetRotX,
      config.headRotSpeed * dt,
    );
  });

  useEffect(() => {
    let mounted = true;
    let generatedMaps: {
      colorMap: THREE.CanvasTexture;
      bumpMap: THREE.CanvasTexture;
    } | null = null;

    generatePbrTexturesAsync().then((res) => {
      if (mounted) {
        generatedMaps = res;
        setTextures(res);
      } else {
        res.colorMap.dispose();
        res.bumpMap.dispose();
      }
    });

    return () => {
      mounted = false;

      if (generatedMaps) {
        generatedMaps.colorMap.dispose();
        generatedMaps.bumpMap.dispose();
      }
    };
  }, []);

  const handlePointerDown = (
    e: import("@react-three/fiber").ThreeEvent<PointerEvent>,
  ) => {
    e.stopPropagation();
    isLovedRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isLovedRef.current = false;
    }, 2000);
  };

  const neckProfile = useMemo(() => {
    const points = [];

    points.push(new THREE.Vector2(neckParams.innerR, neckParams.baseH));

    points.push(new THREE.Vector2(neckParams.baseR, neckParams.baseH));

    points.push(new THREE.Vector2(neckParams.midR, neckParams.midH));

    points.push(
      new THREE.Vector2(neckParams.lipBottomR, neckParams.lipBottomH),
    );

    points.push(new THREE.Vector2(neckParams.lipTopR, neckParams.lipTopH));

    points.push(new THREE.Vector2(neckParams.innerR, neckParams.lipTopH));

    points.push(
      new THREE.Vector2(
        neckParams.innerR,
        neckParams.lipTopH - neckParams.innerDropH,
      ),
    );
    return points;
  }, [neckParams]);

  const headMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#111111",
      roughness: 1.0,
      metalness: 0.0,
    });
  }, []);

  const logoTexture = useLoader(THREE.TextureLoader, "/namma_thanjai_logo.png");

  if (!textures.colorMap) return null;

  return (
    <group
      ref={bodyRef}
      position={[0, -0.3, 0]}
      onPointerDown={handlePointerDown}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <mesh castShadow receiveShadow>
        <sphereGeometry
          args={[0.43, 64, 64, 0, Math.PI * 2, Math.PI * 0.15, Math.PI * 0.85]}
        />
        <meshStandardMaterial
          color={design.colorChasis}
          map={textures.colorMap || undefined}
          bumpMap={textures.bumpMap || undefined}
          bumpScale={0.005}
          roughness={1.0}
          metalness={metalness}
          envMapIntensity={0.0}
        />
      </mesh>

      {/* Chest App Logo Decal Badge Background Container */}
      <mesh position={[0, 0.05, 0.44]} rotation={[0, 0, 0]}>
        <circleGeometry args={[0.13, 32]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>

      {/* Chest App Logo Decal Badge Emblem */}
      <mesh position={[0, 0.05, 0.441]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.20, 0.20]} />
        <meshBasicMaterial map={logoTexture} transparent={true} toneMapped={false} />
      </mesh>

      {bodyParams.bodyBevelT > 0 && (
        <mesh
          position={[0, bodyParams.bodyBevelY, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <torusGeometry
            args={[bodyParams.bodyBevelR, bodyParams.bodyBevelT, 32, 64]}
          />
          <meshStandardMaterial
            color={design.colorChasis}
            map={textures.colorMap || undefined}
            bumpMap={textures.bumpMap || undefined}
            bumpScale={0.005}
            roughness={1.0}
            metalness={metalness}
            envMapIntensity={0.0}
          />
        </mesh>
      )}

      <mesh position={[0, 0.38, 0]} receiveShadow castShadow>
        <latheGeometry args={[neckProfile, 64]} />
        <meshStandardMaterial
          color={design.colorChasis}
          map={textures.colorMap || undefined}
          bumpMap={textures.bumpMap || undefined}
          bumpScale={0.005}
          roughness={1.0}
          metalness={metalness}
          envMapIntensity={0.0}
        />
      </mesh>

      <group ref={headRef} position={[0, design.alturaCabeza, 0]}>
        <mesh material={headMat} castShadow receiveShadow>
          <sphereGeometry args={[0.28, 64, 64, 0, Math.PI * 2, 0, Math.PI]} />
        </mesh>

        <GlassCapsule
          color={design.pantallaColor}
          power={design.pantallaGrosor}
          intensity={design.pantallaBrillo}
        />

        <group position={[0, -0.02, 0.29]}>
          <RobotEye
            position={[-design.separacionOjos, 0, 0]}
            rotation={[0, -0.2, 0]}
            scale={design.escalaOjos}
            blinkDuration={design.parpadeoDuracion}
            blinkCycle={design.parpadeoFrecuencia}
            isLovedRef={isLovedRef}
          />
          <RobotEye
            position={[design.separacionOjos, 0, 0]}
            rotation={[0, 0.2, 0]}
            scale={design.escalaOjos}
            blinkDuration={design.parpadeoDuracion}
            blinkCycle={design.parpadeoFrecuencia}
            isLovedRef={isLovedRef}
          />
        </group>

        <RobotEar
          position={[-0.29, 0, 0]}
          isLeft={true}
          scale={design.tamañoOrejas}
        />
        <RobotEar
          position={[0.29, 0, 0]}
          isLeft={false}
          scale={design.tamañoOrejas}
        />
      </group>
    </group>
  );
}

export interface NavItem {
  label: string;
  href: string;
}

export interface RobotHeroProps {
  backgroundText?: string;
  navItemsLeft?: NavItem[];
  ctaText?: string;
  onCtaClick?: () => void;
  onCategoryClick?: (tab: string) => void;
  color?: string;
  scale?: number;
  pantallaColor?: string;
  pantallaBrillo?: number;
  blinkCycle?: number;
  metalness?: number;
  alerts?: string[];
  activeAlertIdx?: number;
}

function AntennaNavbar({
  ctaText,
  onCtaClick,
}: {
  ctaText: string;
  onCtaClick?: () => void;
}) {
  const { scrollY } = useScroll();
  const lineOpacity = useTransform(scrollY, [0, 50], [1, 0]);

  return (
    <nav className="sticky top-0 z-50 w-full pt-8 px-8 pointer-events-none">
      <div className="w-full max-w-[1400px] mx-auto flex flex-col relative pointer-events-auto">
        <div className="flex items-center justify-between relative">
          {/* Logo on Left side */}
          <div 
            onClick={() => window.location.href = "/"}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <img src="/namma_thanjai_logo.png" alt="namma thanjai app logo" className="w-8.5 h-8.5 object-contain shrink-0 rounded-lg shadow-xs" />
            <div className="flex items-center gap-0.5">
              <span className="font-sans font-black tracking-tight text-slate-900 text-sm">
                namma thanjai
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            </div>
          </div>

          {/* Simple sign in button on right side */}
          <div className="flex items-center gap-3">
            <button
              onClick={onCtaClick}
              className="px-6 py-2.5 rounded-full bg-yellow-500 text-slate-950 text-xs font-black hover:bg-yellow-600 transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.4)]"
            >
              {ctaText}
              <PiShoppingBagBold size={14} />
            </button>
          </div>
        </div>

        <motion.div
          style={{ opacity: lineOpacity }}
          className="w-full mt-6 border-b border-dashed border-slate-350"
        />
      </div>
    </nav>
  );
}

export function RobotHero({
  backgroundText = "UITHEFACTORY",
  navItemsLeft = [],
  ctaText = "Buy Now",
  onCtaClick,
  onCategoryClick,
  color = "#c4c4c4",
  scale = 1,
  pantallaColor = "#00ffc6",
  pantallaBrillo = 1.2,
  blinkCycle = 3.0,
  metalness = 0.0,
  alerts = [],
  activeAlertIdx = 0,
}: RobotHeroProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [searchTab, setSearchTab] = useState<"classifieds" | "services" | "shops">("classifieds");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocality, setSearchLocality] = useState<TanjoreLocality | "All Areas">("All Areas");

  const handleSearchSubmit = () => {
    const currentParams = new URLSearchParams();
    if (searchLocality !== "All Areas") {
      currentParams.set("area", searchLocality);
    }
    if (searchQuery.trim()) {
      currentParams.set("q", searchQuery.trim());
    }
    router.push(`/${searchTab}?${currentParams.toString()}`);
  };

  const { profile, updatePhone } = useAuth();
  const [mobileNumber, setMobileNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber || mobileNumber.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setIsVerifying(true);
    try {
      const result = await updatePhone(mobileNumber);
      if (result?.success) {
        const confetti = (await import("canvas-confetti")).default;
        confetti({ particleCount: 80, spread: 60 });
      } else {
        alert("Verification login failed.");
      }
    } catch (err: any) {
      alert("Verification login error: " + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const [wordIndex, setWordIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const words = ["NAMMA THANJAI", "SELL PLOT", "BUY HOUSE", "PLUMBER", "CARPENTER", "HIRE TAXI", "RENT ROOM", "BEST OFFERS", "LOCAL SHOPS"];

  useEffect(() => {
    if (isSpinning) return;
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isSpinning]);

  const handleRobotTap = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    let count = 0;
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
      count++;
      if (count > 16) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 75);
  };

  const entorno = {
    fondoArriba: "#f8fafc",
    fondoMedio: "#f1f5f9",
    fondoAbajo: "#e2e8f0",
    luzAmbiente: 0.95,
    luzPrincipal: 0.3,
    luzPrincipalColor: "#ffffff",
    luzRelleno: 0.1,
    luzRellenoColor: "#ffffff",
    sombraOpacidad: 0.12,
    sombraBlur: 1.5,
  };

  return (
    <section
      ref={containerRef}
      className="relative w-full h-full md:h-screen flex flex-col bg-white text-slate-800 py-4 md:py-8 justify-between overflow-hidden"
    >
      {/* Light radial glow centered behind the robot */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_60%,rgba(250,204,21,0.06)_0%,transparent_60%)] pointer-events-none" />

      {/* ==========================================
          1. MOBILE VIEWPORT PORTION (Sleek, Clean Layout)
          ========================================== */}
      <div className="flex md:hidden flex-col items-center justify-between z-10 px-5 w-full flex-1 text-center select-none pointer-events-auto pb-6 overflow-y-auto">
        
        {/* Top Header Branding: Logo + Namma Thanjavur + Taglines */}
        <div className="flex flex-col items-center gap-2 mt-2">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-md p-2 flex items-center justify-center shrink-0 border border-slate-150">
            <img 
              src="/namma_thanjai_logo.png" 
              alt="namma thanjai app logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div className="flex flex-col items-center mt-0.5">
            <h1 className="font-heading font-black text-2xl text-slate-900 tracking-tight leading-none uppercase">
              namma thanjavur<span className="text-yellow-500">.</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-1">
              verified local noticeboard & helper trades
            </p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/25 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-3xs mt-1">
            <span className="text-yellow-600 font-sans font-black text-xs leading-none">10+</span>
            <span className="text-[8px] text-slate-700 font-extrabold uppercase tracking-wider leading-none">Active Local Trade Channels</span>
          </div>
        </div>

        {/* Animated category tag headline directly ABOVE the robot */}
        <div className="w-full flex justify-center mt-3 mb-1 min-h-[28px] z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={wordIndex}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/15 border border-amber-500/30 text-amber-700 font-black text-[11px] uppercase tracking-widest shadow-3xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{words[wordIndex]}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Middle: Interactive 3D Mascot Robot Canvas */}
        <div className="w-full flex-1 min-h-[220px] max-h-[300px] relative flex items-center justify-center my-1">
          <div onClick={handleRobotTap} className="w-full h-full relative cursor-pointer z-10">
            <Canvas shadows camera={{ position: [0, 0.12, 3.6], fov: 38 }}>
              <ambientLight intensity={entorno.luzAmbiente} color="#ffffff" />
              <directionalLight position={[0, 6, 3]} intensity={entorno.luzPrincipal} color={entorno.luzPrincipalColor} castShadow shadow-mapSize={[512, 512]} shadow-bias={-0.0005} />
              <Environment preset="studio" blur={0.5} />
              <ResponsiveGroup scale={scale * 0.85}>
                <ContactShadows position={[0, -0.79, 0]} opacity={entorno.sombraOpacidad} scale={10} resolution={256} blur={entorno.sombraBlur} far={2.5} color="#000000" />
                <RobotPrototype neckParams={{ baseR: 0.215, baseH: -0.05, midR: 0.28, midH: 0.02, lipBottomR: 0.295, lipBottomH: 0.045, lipTopR: 0.27, lipTopH: 0.055, innerR: 0.1, innerDropH: 0.0 }} bodyParams={{ bodyBevelR: 0.235, bodyBevelY: 0.34, bodyBevelT: 0.025 }} color={color} pantallaColor={pantallaColor} pantallaBrillo={pantallaBrillo} blinkCycle={blinkCycle} metalness={metalness} />
              </ResponsiveGroup>
            </Canvas>
          </div>
        </div>

        {/* High-visibility Live Ticker Alert bar */}
        {alerts.length > 0 && (
          <div className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-2 px-3.5 shadow-md flex items-center justify-between text-[11px] font-black select-none max-w-[340px] mx-auto tracking-wide mb-3">
            <div className="flex items-center gap-2.5 overflow-hidden w-full text-left">
              <span className="bg-yellow-500 text-slate-950 font-black text-[8px] px-2 py-0.5 rounded-md uppercase shrink-0 animate-pulse">
                LIVE
              </span>
              <div className="relative h-4 flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeAlertIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="absolute left-0 text-slate-100 truncate w-full font-bold text-left text-xs"
                  >
                    {alerts[activeAlertIdx]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* Bottom: Single Primary Action Button */}
        <div className="w-full max-w-[340px]">
          <button
            type="button"
            onClick={onCtaClick}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-955 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-yellow-500/20 border-0 text-center flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span>{ctaText === "Verified" ? "Verified Profile" : "Register Helper / Post Ad"}</span>
            <ArrowRight className="w-4 h-4 text-slate-955" />
          </button>
        </div>
      </div>

      {/* ==========================================
          2. DESKTOP VIEWPORT PORTION (Clean Layout, Search Engine Card + 3D Mascot)
          ========================================== */}
      <div className="hidden md:flex flex-col justify-between w-full h-full max-w-7xl mx-auto px-8 z-10 select-none pointer-events-auto">
        
        {/* Split row content */}
        <div className="flex-1 flex flex-row items-center justify-between gap-12 py-4">
          {/* Left panel branding & Search Engine Card */}
          <div className="w-[45%] flex flex-col items-start gap-5">
            
            {/* Logo branding container */}
            <div className="flex items-center gap-4">
              <div className="w-18 h-18 rounded-2xl bg-white shadow-md p-2 flex items-center justify-center shrink-0 border border-slate-100">
                <img 
                  src="/namma_thanjai_logo.png" 
                  alt="namma thanjai logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="text-left">
                <h1 className="font-heading font-black text-3xl lg:text-4xl text-slate-900 tracking-tight leading-none uppercase">
                  namma thanjavur<span className="text-yellow-500">.</span>
                </h1>
                <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-1.5">
                  thanjavur verified noticeboard & services
                </p>
              </div>
            </div>

            {/* Indicator pill */}
            <div className="bg-yellow-500/10 border border-yellow-500/25 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-3xs">
              <span className="text-yellow-600 font-sans font-black text-xs leading-none">10+</span>
              <span className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wider leading-none">Verified active trades & listings channels</span>
            </div>

            <p className="text-xs lg:text-sm text-slate-500 max-w-sm leading-relaxed font-semibold text-left">
              Thanjavur's smart local noticeboard directory. Scan visiting cards with AI, explore plot offers, and search helper service trades.
            </p>

            {/* Single Clean Search Engine Card */}
            <div className="w-full max-w-md bg-white border border-slate-200/90 shadow-md rounded-3xl p-5 flex flex-col gap-4">
              
              {/* Category Segment Tabs */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setSearchTab("classifieds")}
                  className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center ${searchTab === "classifieds" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"}`}
                >
                  📢 Buy & Sell
                </button>
                <button
                  type="button"
                  onClick={() => setSearchTab("services")}
                  className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center ${searchTab === "services" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"}`}
                >
                  🛠️ Helpers
                </button>
                <button
                  type="button"
                  onClick={() => setSearchTab("shops")}
                  className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center ${searchTab === "shops" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"}`}
                >
                  🏪 Shops
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Locality Dropdown */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-left">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <select
                      value={searchLocality}
                      onChange={(e) => setSearchLocality(e.target.value as any)}
                      className="w-full bg-transparent text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="All Areas">All Thanjavur</option>
                      {TANJORE_LOCALITIES.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  {/* Text Query Input */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-left">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        searchTab === "classifieds" 
                          ? "e.g. plot, car..." 
                          : searchTab === "services" 
                          ? "e.g. plumber..." 
                          : "e.g. cafe..."
                      }
                      className="w-full bg-transparent text-[11px] font-bold text-slate-700 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Search Button */}
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-slate-955 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer border-0 active:scale-[0.98]"
                >
                  <Search className="w-4 h-4 text-slate-955" />
                  <span>Search Noticeboard</span>
                </button>
              </div>
            </div>

            {/* Single Primary Action CTA */}
            <div className="w-full max-w-md">
              <button
                type="button"
                onClick={onCtaClick}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-955 font-black text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/15 border-0 text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{ctaText === "Verified" ? "Verified Profile" : "Register Helper / Post Ad"}</span>
                <ArrowRight className="w-4 h-4 text-slate-955" />
              </button>
            </div>
          </div>

          {/* Right panel giant mascot with animated headline word tag */}
          <div className="w-[50%] h-full relative flex flex-col items-center justify-center">
            {/* Animated headline tag above robot on desktop */}
            <div className="w-full flex justify-center mb-2 z-20">
              <AnimatePresence mode="wait">
                <motion.div
                  key={wordIndex}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.35 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-500/30 text-amber-700 font-black text-xs uppercase tracking-widest shadow-2xs"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{words[wordIndex]}</span>
                </motion.div>
              </AnimatePresence>
            </div>

            <div onClick={handleRobotTap} className="w-full h-full min-h-[400px] relative cursor-pointer z-10">
              <Canvas shadows camera={{ position: [0, 0.12, 3.6], fov: 38 }}>
                <ambientLight intensity={entorno.luzAmbiente} color="#ffffff" />
                <directionalLight position={[0, 6, 3]} intensity={entorno.luzPrincipal} color={entorno.luzPrincipalColor} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005} />
                <directionalLight position={[-5, 2, -5]} intensity={entorno.luzRelleno} color={entorno.luzRellenoColor} />
                <Environment preset="studio" blur={0.5} />
                <ResponsiveGroup scale={scale}>
                  <ContactShadows position={[0, -0.79, 0]} opacity={entorno.sombraOpacidad} scale={15} resolution={512} blur={entorno.sombraBlur} far={2.5} color="#000000" />
                  <RobotPrototype neckParams={{ baseR: 0.215, baseH: -0.05, midR: 0.28, midH: 0.02, lipBottomR: 0.295, lipBottomH: 0.045, lipTopR: 0.27, lipTopH: 0.055, innerR: 0.1, innerDropH: 0.0 }} bodyParams={{ bodyBevelR: 0.235, bodyBevelY: 0.34, bodyBevelT: 0.025 }} color={color} pantallaColor={pantallaColor} pantallaBrillo={pantallaBrillo} blinkCycle={blinkCycle} metalness={metalness} />
                </ResponsiveGroup>
              </Canvas>
            </div>
          </div>
        </div>

        {/* High-visibility Bottom Live Ticker Alert */}
        {alerts.length > 0 && (
          <div className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl py-2 px-5 shadow-md flex items-center justify-between text-xs font-black select-none max-w-lg mx-auto tracking-wide mb-2">
            <div className="flex items-center gap-2.5 overflow-hidden w-full text-left">
              <span className="bg-yellow-500 text-slate-950 font-black text-[8px] px-2 py-0.5 rounded-md uppercase shrink-0 animate-pulse">
                LIVE
              </span>
              <div className="relative h-4 flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeAlertIdx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35 }}
                    className="absolute left-0 text-slate-100 truncate w-full font-bold text-left text-xs"
                  >
                    {alerts[activeAlertIdx]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default RobotHero;
