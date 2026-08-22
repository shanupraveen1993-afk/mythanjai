"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Environment, ContactShadows, Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { PiShoppingBagBold } from "react-icons/pi";
import { ArrowRight, Loader2, Phone, CheckCircle, Megaphone, Wrench, Store, Search, MapPin, Sparkles, ChevronDown, User, Building2, MessageSquare, CheckCircle2, Download } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/context/ToastContext";
import { TANJORE_LOCALITIES, TanjoreLocality } from "@/lib/constants";
import StaticApkCard from "./StaticApkCard";

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
  const s = Math.min(1.4, viewport.width / 2.8) * scale * (isMobile ? 1.15 : 0.75);
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
  const shadowRef = useRef<THREE.Mesh>(null);

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
    moveSpeed: 1.0,
    bodyRotSpeed: 10.0,
    headRotSpeed: 20.0,
    bodyTiltX: 0.1,
    bodyTiltY: 0.95,
    headLookX: 0.4,
    headLookY: 1.8,
  };

  useFrame((state, delta) => {
    if (!bodyRef.current || !headRef.current) return;

    const dt = Math.min(delta, 0.1);

    const tx = state.pointer.x;
    const ty = state.pointer.y;

    const isMobile = state.viewport.width < 3.2;

    // Floating bobbing motion
    const floatY = Math.sin(state.clock.getElapsedTime() * 2.2) * 0.05;

    // Centered subtle position sway with floating Y (Mobile stays tight & centered)
    const targetPosX = isMobile ? 0 : tx * 0.15;
    bodyRef.current.position.x = THREE.MathUtils.lerp(
      bodyRef.current.position.x,
      targetPosX,
      config.moveSpeed * dt,
    );
    bodyRef.current.position.y = THREE.MathUtils.lerp(
      bodyRef.current.position.y,
      -0.3 + floatY,
      dt * 5.0,
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
  onSignInClick?: () => void;
  onCategoryClick?: (tab: string) => void;
  color?: string;
  scale?: number;
  pantallaColor?: string;
  pantallaBrillo?: number;
  blinkCycle?: number;
  metalness?: number;
  alerts?: string[];
  activeAlertIdx?: number;
  showExtraFolds?: boolean;
}

function AntennaNavbar({
  ctaText,
  onCtaClick,
}: {
  ctaText: string;
  onCtaClick?: () => void;
}) {
  const router = useRouter();
  const { scrollY } = useScroll();
  const lineOpacity = useTransform(scrollY, [0, 50], [1, 0]);

  return (
    <nav className="sticky top-0 z-50 w-full pt-8 px-8 pointer-events-none">
      <div className="w-full max-w-[1400px] mx-auto flex flex-col relative pointer-events-auto">
        <div className="flex items-center justify-between relative">
          {/* Logo on Left side */}
          <div 
            onClick={() => router.push("/")}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <img src="/namma_thanjai_logo.png" alt="namma thanjai app logo" className="w-8.5 h-8.5 object-contain shrink-0 mix-blend-multiply" />
            <div className="flex items-center gap-0.5">
              <span className="font-sans font-black tracking-tight text-slate-900 text-sm">
                namma thanjai
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            </div>
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
  onSignInClick,
  onCategoryClick,
  color = "#c4c4c4",
  scale = 1,
  pantallaColor = "#00ffc6",
  pantallaBrillo = 1.2,
  blinkCycle = 3.0,
  metalness = 0.0,
  alerts = [],
  activeAlertIdx = 0,
  showExtraFolds = false,
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

  const { toast } = useToast();
  const { profile, updatePhone } = useAuth();
  const [mobileNumber, setMobileNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber || mobileNumber.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    setIsVerifying(true);
    try {
      const result = await updatePhone(mobileNumber);
      if (result?.success) {
        toast.success("Mobile number verified successfully!");
        const confetti = (await import("canvas-confetti")).default;
        confetti({ particleCount: 80, spread: 60 });
        setTimeout(() => {
          router.push("/");
        }, 500);
      } else {
        toast.error("Verification login failed.");
      }
    } catch (err: any) {
      toast.error("Verification login error: " + (err.message || "Failed"));
    } finally {
      setIsVerifying(false);
    }
  };

  const [wordIndex, setWordIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const fastSpinRef = useRef<NodeJS.Timeout | null>(null);
  const rotationItems = [
    { label: "SELL CMDA PLOTS", category: "Marketplace" },
    { label: "BUY USED PHONES", category: "Electronics" },
    { label: "EXPLORE STORE DEALS", category: "Local Offers" },
    { label: "HIRE EXPERT PLUMBERS", category: "Trades" },
    { label: "RENT 2 BHK HOUSES", category: "Rentals" },
    { label: "BOOK TAXI & AUTOS", category: "Transport" },
    { label: "SKILLED CARPENTERS", category: "Trades" },
    { label: "LOCAL ELECTRICIANS", category: "Trades" },
  ];

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotationItems.length);
    }, 1000); // 1-second constant rotation rhythm
    return () => clearInterval(interval);
  }, [rotationItems.length]);

  const handleRobotTap = () => {
    setWordIndex((prev) => (prev + 1) % rotationItems.length);
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
      className="relative w-full min-h-screen flex flex-col items-center bg-white text-slate-800 overflow-x-hidden hero-grain"
    >
      {/* ── Premium Warm Background Layer ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Radial warm gold glow — upper center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] h-[70vh] bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.12)_0%,transparent_65%)]" />
        {/* Subtle cream tint at very top */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50/40 via-white to-white" />
        {/* Fine mesh grid accent */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(15,23,42,1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,1) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════
           FIRST FOLD — Full-screen hero (fits 100% inside mobile viewport)
         ══════════════════════════════════════════════════════ */}
      <div
        className="relative z-10 w-full h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] flex flex-col items-center justify-between pt-2 pb-3 px-3 sm:px-6 select-none overflow-hidden"
      >

        {/* ── Header: Extra Large Logo with Top Margin + Black Title + Subtitle + High Impact Rotating Action Button ── */}
        <div className="flex flex-col items-center gap-1.5 w-full max-w-3xl mx-auto text-center shrink-0">

          {/* Clean Brand Logo Badge (No effects/animations) */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 shrink-0 mt-3 sm:mt-4 md:mt-5 select-none">
            <div className="relative w-full h-full rounded-xl overflow-hidden bg-white shadow-[0_8px_32px_rgba(245,158,11,0.22)] border border-amber-100 flex items-center justify-center p-1.5">
              <img
                src="/namma_thanjai_logo.png"
                alt="namma thanjai logo"
                className="w-[94%] h-[94%] object-contain mix-blend-multiply"
              />
            </div>
          </div>

          {/* Headline — Black text with static yellow dot + high-impact one-time entrance animation */}
          <motion.h1
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="font-heading font-black text-[clamp(2.2rem,8vw,5.5rem)] tracking-[-0.04em] leading-none uppercase w-full text-center select-none whitespace-nowrap text-slate-950 flex items-center justify-center"
          >
            <span>namma thanjai</span>
            <span className="text-amber-500 ml-0.5 font-extrabold inline-block">.</span>
          </motion.h1>

          {/* Clean, Elegant Subtitle */}
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 text-center select-none">
            Thanjavur's Direct Network <span className="text-amber-500 font-black">•</span> Zero Brokerage Fees
          </p>

          {/* ── 10-Item Infinite Horizontal Marquee Roller (Compact & Rich Content) ── */}
          <div className="mt-2 w-full max-w-xl mx-auto overflow-hidden relative select-none py-1">
            {/* Left & Right gradient edge fades */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            <motion.div
              className="flex items-center gap-2 w-max"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                duration: 20,
                ease: "linear",
                repeat: Infinity,
              }}
            >
              {[
                { icon: <PiShoppingBagBold className="w-3.5 h-3.5 text-amber-600 shrink-0" />, label: "Buy & Sell Plots" },
                { icon: <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />, label: "Used Mobiles" },
                { icon: <Store className="w-3.5 h-3.5 text-amber-600 shrink-0" />, label: "Cars & Bikes" },
                { icon: <Megaphone className="w-3.5 h-3.5 text-amber-600 shrink-0" />, label: "Post Buyer Need" },
                { icon: <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />, label: "Expert Plumbers" },
                { icon: <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />, label: "Electricians" },
                { icon: <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />, label: "Wood Carpenters" },
                { icon: <Store className="w-3.5 h-3.5 text-amber-600 shrink-0" />, label: "Rental Houses" },
                { icon: <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />, label: "Taxi & Autos" },
                { icon: <Store className="w-3.5 h-3.5 text-amber-600 shrink-0" />, label: "Store Offers" },
                { icon: <PiShoppingBagBold className="w-3.5 h-3.5 text-amber-600 shrink-0" />, label: "Buy & Sell Plots" },
                { icon: <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />, label: "Used Mobiles" },
                { icon: <Store className="w-3.5 h-3.5 text-amber-600 shrink-0" />, label: "Cars & Bikes" },
                { icon: <Megaphone className="w-3.5 h-3.5 text-amber-600 shrink-0" />, label: "Post Buyer Need" },
                { icon: <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />, label: "Expert Plumbers" },
                { icon: <Store className="w-3.5 h-3.5 text-amber-600 shrink-0" />, label: "Rental Houses" },
                { icon: <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />, label: "Taxi & Autos" },
                { icon: <Store className="w-3.5 h-3.5 text-amber-600 shrink-0" />, label: "Store Offers" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 bg-amber-400/20 text-slate-950 border border-amber-400/50 px-3.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-2xs whitespace-nowrap shrink-0 cursor-default select-none pointer-events-none"
                >
                  {item.icon}
                  <span className="text-slate-950 font-black">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ── 3D Mascot Robot Canvas ── */}
        <div
          onClick={handleRobotTap}
          className="relative flex-1 w-full max-w-[200px] sm:max-w-[280px] md:max-w-[360px] min-h-[80px] max-h-[120px] sm:max-h-[200px] md:max-h-[260px] flex items-center justify-center cursor-pointer my-1 select-none shrink"
          style={{ touchAction: "none" }}
        >
          {/* Warm radial glow behind robot */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.14)_0%,transparent_70%)] pointer-events-none" />
          <Canvas
            camera={{ position: [0, 0.1, 4.4], fov: 42 }}
            className="overflow-visible bg-transparent"
          >
            <ambientLight intensity={entorno.luzAmbiente} color="#fff8f0" />
            <directionalLight
              position={[0, 6, 3]}
              intensity={entorno.luzPrincipal}
              color={entorno.luzPrincipalColor}
            />
            <Environment preset="studio" blur={0.4} />
            <ResponsiveGroup scale={scale * (isDesktop ? 1.35 : 1.15)}>
              <RobotPrototype
                neckParams={{
                  baseR: 0.215, baseH: -0.05, midR: 0.28, midH: 0.02,
                  lipBottomR: 0.295, lipBottomH: 0.045,
                  lipTopR: 0.27, lipTopH: 0.055,
                  innerR: 0.1, innerDropH: 0.0,
                }}
                bodyParams={{ bodyBevelR: 0.235, bodyBevelY: 0.34, bodyBevelT: 0.025 }}
                color={color}
                pantallaColor={pantallaColor}
                pantallaBrillo={pantallaBrillo}
                blinkCycle={blinkCycle}
                metalness={metalness}
              />
            </ResponsiveGroup>
          </Canvas>
        </div>

        {/* ── Action Footer: Buttons + Spacing + LIVE Ticker below ── */}
        <div className="w-full max-w-xs sm:max-w-sm shrink-0 flex flex-col gap-2 px-1 pb-1 my-1">

          {profile?.isVerified ? (
            /* Verified state — show member badge + explore button */
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-2.5 rounded-2xl flex items-center justify-between gap-2 shadow-sm my-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="text-left">
                  <span className="font-heading font-black text-xs block text-slate-900">Verified Member</span>
                  <span className="text-[10px] font-bold text-slate-500">+{profile?.phone || mobileNumber}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onCtaClick}
                className="btn-shimmer bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl border border-amber-400 cursor-pointer shadow-md active:scale-95 shrink-0 transition-colors"
              >
                Explore →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              {/* CTA Buttons with proper margin */}
              {!showExtraFolds ? (
                /* WEB APP / APK ONBOARDING MODE — Install APK Primary Button */
                <div className="grid grid-cols-2 gap-2.5 w-full my-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSignInClick) {
                        onSignInClick();
                      } else {
                        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
                      }
                    }}
                    className="bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-black text-xs sm:text-sm px-4 py-3.5 rounded-2xl border-2 border-amber-400 shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer select-none"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950 shrink-0 stroke-[2.5]" />
                    <span>Register to Post Ad</span>
                  </button>

                  <Link
                    href="/home"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        localStorage.setItem("namma_thanjai_guest_mode", "true");
                      }
                      if (onCtaClick) onCtaClick();
                    }}
                    className="bg-white text-slate-950 font-heading font-black text-xs sm:text-sm px-4 py-3.5 rounded-2xl border-2 border-slate-950 shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer uppercase tracking-wider"
                  >
                    <span>Explore App</span>
                    <ArrowRight className="w-4 h-4 text-amber-600 shrink-0 stroke-[3]" />
                  </Link>
                </div>
              ) : (
                /* MAIN WEBSITE LANDING MODE — Register & Explore Buttons */
                <div className="grid grid-cols-2 gap-3 w-full my-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        sessionStorage.removeItem("namma_thanjai_target_post_route");
                        localStorage.removeItem("namma_thanjai_target_post_route");
                        sessionStorage.setItem("namma_thanjai_header_login_active", "true");
                        window.dispatchEvent(new Event("namma_thanjai_open_signin"));
                      }
                      if (onSignInClick) onSignInClick();
                    }}
                    className="w-full py-3.5 sm:py-4 btn-primary text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#0F172A] shrink-0" />
                    <span>Register to Post Ad</span>
                  </button>

                  <Link
                    href="/home"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        localStorage.setItem("namma_thanjai_guest_mode", "true");
                      }
                      if (onCtaClick) onCtaClick();
                    }}
                    className="w-full py-3.5 sm:py-4 btn-secondary text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Explore</span>
                    <ArrowRight className="w-4 h-4 text-[#0F172A] shrink-0 stroke-[2.5]" />
                  </Link>
                </div>
              )}


            </div>
          )}

        </div>

      </div>
      {/* ── END FIRST FOLD ── */}

      {/* ── LOWER FOLDS (v2.0 Universal City-Platform Specification - Desktop Website Only) ── */}
      {showExtraFolds && (
        <div className="w-full bg-[#F8FAFC] text-[#0F172A] pt-16 pb-20 px-4 sm:px-8 space-y-20 border-t border-slate-200 select-none z-10 hidden md:block">
          
          {/* ── FOLD 2: Core Platform Categories (Anti-Overload Cards with 48px Slate Icon Boxes) ── */}
          <div className="max-w-5xl mx-auto text-center space-y-10">
            <div className="space-y-3">
              <span className="text-[#0F172A] font-heading font-bold text-xs uppercase tracking-wider bg-white px-4 py-1.5 rounded-full border border-slate-300 shadow-xs inline-block">
                CORE PLATFORM SEGMENTS
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black tracking-tight text-[#0F172A] uppercase">
                Explore Platform Segments
              </h2>
              <p className="text-[#64748B] text-xs sm:text-sm max-w-xl mx-auto font-normal leading-relaxed">
                Everything you need in Thanjavur organized into 4 direct, commission-free categories.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 text-left">
              {/* Segment 1: Buy & Sell Marketplace */}
              <Link
                href="/classifieds"
                className="v2-card p-6 space-y-4 cursor-pointer block group"
              >
                {/* 48x48px Slate Icon Enclosure Box with Brand Yellow Icon */}
                <div className="icon-box-dark group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6 stroke-[2]" />
                </div>
                <h3 className="font-heading font-bold text-base sm:text-lg text-[#0F172A] group-hover:text-amber-600 transition-colors">
                  Buy &amp; Sell Marketplace
                </h3>
                <p className="text-xs text-[#64748B] font-normal leading-relaxed">
                  CMDA plots, houses for sale, used mobiles, bikes, cars &amp; local household items.
                </p>
              </Link>

              {/* Segment 2: Buyer Need Requests */}
              <Link
                href="/need"
                className="v2-card p-6 space-y-4 cursor-pointer block group"
              >
                <div className="icon-box-dark group-hover:scale-105 transition-transform">
                  <Megaphone className="w-6 h-6 stroke-[2]" />
                </div>
                <h3 className="font-heading font-bold text-base sm:text-lg text-[#0F172A] group-hover:text-amber-600 transition-colors">
                  Buyer Need Requests
                </h3>
                <p className="text-xs text-[#64748B] font-normal leading-relaxed">
                  Post what you are looking for (rentals, used items, specific services) and get direct offers.
                </p>
              </Link>

              {/* Segment 3: Local Trade Services */}
              <Link
                href="/services"
                className="v2-card p-6 space-y-4 cursor-pointer block group"
              >
                <div className="icon-box-dark group-hover:scale-105 transition-transform">
                  <Wrench className="w-6 h-6 stroke-[2]" />
                </div>
                <h3 className="font-heading font-bold text-base sm:text-lg text-[#0F172A] group-hover:text-amber-600 transition-colors">
                  Local Trade Services
                </h3>
                <p className="text-xs text-[#64748B] font-normal leading-relaxed">
                  Plumbers, electricians, carpenters, AC repair, painters, taxi &amp; auto drivers.
                </p>
              </Link>

              {/* Segment 4: Store Offers & Deals */}
              <Link
                href="/shops"
                className="v2-card p-6 space-y-4 cursor-pointer block group"
              >
                <div className="icon-box-dark group-hover:scale-105 transition-transform">
                  <Store className="w-6 h-6 stroke-[2]" />
                </div>
                <h3 className="font-heading font-bold text-base sm:text-lg text-[#0F172A] group-hover:text-amber-600 transition-colors">
                  Store Offers &amp; Deals
                </h3>
                <p className="text-xs text-[#64748B] font-normal leading-relaxed">
                  Exclusive discount deals, grand opening sales &amp; special offers from local Tanjore shops.
                </p>
              </Link>
            </div>
          </div>

          {/* ── FOLD 3: How Namma Thanjai Works (Sleek Slate Step Indicators) ── */}
          <div className="max-w-5xl mx-auto text-center space-y-10 bg-white border border-slate-200 p-8 sm:p-12 rounded-[16px] shadow-sm">
            <div className="space-y-2">
              <span className="text-[#0F172A] font-heading font-bold text-xs uppercase tracking-wider bg-slate-100 px-4 py-1 rounded-full border border-slate-300 inline-block">
                DIRECT &amp; TRANSPARENT
              </span>
              <h2 className="text-2xl sm:text-4xl font-heading font-black text-[#0F172A] uppercase">How Namma Thanjai Works</h2>
              <p className="text-xs sm:text-sm text-[#64748B] font-normal max-w-lg mx-auto">
                Connect directly with Tanjore residents &amp; local experts without third-party fees.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {/* Step 1 */}
              <div className="v2-card p-6 space-y-3.5">
                {/* Slate Circle with Yellow Number */}
                <div className="step-circle-dark">1</div>
                <h3 className="font-heading font-bold text-base sm:text-lg text-[#0F172A]">Browse or Post</h3>
                <p className="text-xs text-[#64748B] font-normal leading-relaxed">
                  Search CMDA plots, rentals, mobile offers or post your custom requirement.
                </p>
              </div>

              {/* Step 2 */}
              <div className="v2-card p-6 space-y-3.5">
                <div className="step-circle-dark">2</div>
                <h3 className="font-heading font-bold text-base sm:text-lg text-[#0F172A]">Connect Directly</h3>
                <p className="text-xs text-[#64748B] font-normal leading-relaxed">
                  Tap to WhatsApp or call verified local owners and trade service experts directly.
                </p>
              </div>

              {/* Step 3 */}
              <div className="v2-card p-6 space-y-3.5">
                <div className="step-circle-dark">3</div>
                <h3 className="font-heading font-bold text-base sm:text-lg text-[#0F172A]">Close Fast Deal</h3>
                <p className="text-xs text-[#64748B] font-normal leading-relaxed">
                  Finalize terms directly with zero brokerage commission or third-party fees.
                </p>
              </div>
            </div>
          </div>

          {/* ── FOLD 3.5: Official APK Card Section ── */}
          <div className="max-w-5xl mx-auto">
            <StaticApkCard variant="light" />
          </div>

          {/* ── FOLD 4: Call To Action Banner & Footer ── */}
          <div className="max-w-4xl mx-auto text-center space-y-8 pt-4">
            <div className="bg-[#0F172A] text-white border-2 border-slate-800 p-8 sm:p-12 rounded-[16px] space-y-5 shadow-xl">
              <h3 className="text-2xl sm:text-3xl font-heading font-black text-white uppercase tracking-tight">
                Ready to Buy, Sell, or Hire in Thanjavur?
              </h3>
              <p className="text-xs sm:text-base text-slate-300 font-normal max-w-xl mx-auto">
                Join thousands of authentic Tanjore residents already connecting directly.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  href="/home"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.setItem("namma_thanjai_guest_mode", "true");
                    }
                    if (onCtaClick) onCtaClick();
                  }}
                  className="btn-primary text-xs sm:text-sm px-8 py-4 uppercase tracking-wider flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <span>Explore Platform</span>
                  <ArrowRight className="w-4 h-4 text-[#0F172A] shrink-0 stroke-[2.5]" />
                </Link>
              </div>
            </div>

            {/* Footer Credits */}
            <p className="text-xs font-semibold text-[#64748B] tracking-wider uppercase">
              © {new Date().getFullYear()} Namma Thanjai • Thanjavur's Direct City Network
            </p>
          </div>

        </div>
      )}
    </section>
  );
}

export default RobotHero;
