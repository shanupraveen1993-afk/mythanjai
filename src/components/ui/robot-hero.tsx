"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Environment, ContactShadows, Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { PiShoppingBagBold } from "react-icons/pi";
import { ArrowRight, Loader2, Phone, CheckCircle, Megaphone, Wrench, Store, Search, MapPin, Sparkles, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/context/ToastContext";
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
}: RobotHeroProps = {}) {
  const defaultAlerts = [
    "New 2400 Sqft CMDA Plot listed in Vallam — 2400 Sqft CMDA approved",
    "Senthil Electrician: 4.9★ rating, available in Tanjore Town",
    "GLEN Gallery: Up to 60% OFF — Grand Opening Sale",
    "2 BHK House for Rent near Medical College — ₹10,000/mo",
    "Rajesh Expert Plumber: 30-min rapid arrival in Medical College Rd",
  ];
  const displayAlerts = alerts && alerts.length > 0 ? alerts : defaultAlerts;

  const [tickerIdx, setTickerIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIdx((prev) => (prev + 1) % displayAlerts.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [displayAlerts.length]);
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
  const words = ["SELL PLOT", "BUY HOUSE", "PLUMBER", "CARPENTER", "HIRE TAXI", "RENT ROOM", "BEST OFFERS", "LOCAL SHOPS"];

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2500); // Standardized 2.5s steady rhythm for smooth rotation
    return () => clearInterval(interval);
  }, [words.length]);

  const handleRobotTap = () => {
    // Smoothly advance to next word on tap without flickering 90ms canvas re-renders
    setWordIndex((prev) => (prev + 1) % words.length);
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
        className="relative z-10 w-full h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] flex flex-col items-center justify-center gap-2 sm:gap-4 pt-1 sm:pt-4 md:pt-4 px-3 sm:px-6 select-none overflow-hidden"
        style={{ paddingBottom: "12px" }}
      >

        {/* ── Header: Logo + Headline + Subtitle ── */}
        <div className="flex flex-col items-center gap-1 w-full max-w-3xl mx-auto text-center shrink-0">

          {/* Logo with warm glow ring */}
          <div className="relative w-11 h-11 sm:w-14 sm:h-14 md:w-18 md:h-18 shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-amber-400/20 blur-md scale-125 animate-float-dot" />
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white shadow-[0_4px_24px_rgba(245,158,11,0.18)] border border-amber-100/80 flex items-center justify-center">
              <img
                src="/namma_thanjai_logo.png"
                alt="namma thanjai logo"
                className="w-[90%] h-[90%] object-contain mix-blend-multiply"
              />
            </div>
          </div>

          {/* Headline */}
          <h1 className="font-heading font-black text-[clamp(2.6rem,10vw,6.5rem)] tracking-[-0.04em] leading-[0.9] uppercase w-full text-center select-none">
            <span
              style={{
                background: "linear-gradient(165deg, #0f172a 0%, #1e293b 40%, #334155 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              namma thanjai
            </span>
            <span className="text-amber-500 animate-float-dot inline-block ml-0.5">.</span>
          </h1>

          {/* Subtitle with track-in animation */}
          <p className="animate-track-in text-[9px] sm:text-[10px] md:text-xs font-black text-amber-600 uppercase mt-1 opacity-0 [animation-delay:200ms] [animation-fill-mode:forwards] tracking-wider">
            LOCAL MATCHMAKER FOR THANJAVUR BUYERS, SELLERS & TRADES
          </p>

          {/* Rotating Category Badge — shown on ALL screens */}
          <div className="mt-1.5 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={wordIndex}
                initial={{ opacity: 0, scale: 0.85, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.08, y: 8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="animate-glow-pulse bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-heading font-black text-[10px] sm:text-xs px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-2 shadow-[0_2px_12px_rgba(245,158,11,0.4)] select-none"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950/70 animate-ping shrink-0" />
                <span>{words[wordIndex]}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── 3D Mascot Robot Canvas ── */}
        <div
          onClick={handleRobotTap}
          className="relative flex-1 w-full max-w-[200px] sm:max-w-[280px] md:max-w-[360px] min-h-[80px] max-h-[120px] sm:max-h-[200px] md:max-h-[280px] flex items-center justify-center cursor-pointer my-0.5 select-none shrink"
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

        {/* ── Action Footer: Buttons + LIVE Ticker below (mt-12px) ── */}
        <div className="w-full max-w-xs sm:max-w-sm shrink-0 flex flex-col gap-0 px-1 pb-1">

          {profile?.isVerified ? (
            /* Verified state — show member badge + explore button */
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-2.5 rounded-2xl flex items-center justify-between gap-2 shadow-sm">
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
              {/* CTA Buttons */}
              <div className="grid grid-cols-2 gap-2 w-full">
                {/* REGISTER — Primary (amber) */}
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
                  className="btn-shimmer group relative bg-gradient-to-br from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-heading font-black text-xs sm:text-sm px-4 py-3.5 rounded-2xl border border-amber-400/60 shadow-[0_4px_16px_rgba(245,158,11,0.35)] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950/70 text-slate-950/70 shrink-0" />
                  <span>Register</span>
                </button>

                {/* EXPLORE — Secondary (dark slate) */}
                <button
                  type="button"
                  onClick={() => {
                    if (onCtaClick) {
                      onCtaClick();
                    } else {
                      localStorage.setItem("namma_thanjai_guest_mode", "true");
                      router.push("/home");
                    }
                  }}
                  className="btn-shimmer group relative bg-slate-950 hover:bg-slate-900 text-white font-heading font-extrabold text-xs sm:text-sm px-4 py-3.5 rounded-2xl border border-slate-800 shadow-[0_4px_16px_rgba(15,23,42,0.22)] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
                </button>
              </div>

              {/* Expandable WhatsApp OTP Form */}
              {showRegisterForm && (
                <form onSubmit={handleMobileSubmit} className="flex flex-col gap-2 pt-2 border-t border-slate-200 animate-fade-in mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Enter WhatsApp Number
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">10-Digit Mobile</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-amber-600">+91</span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="Enter WhatsApp No"
                        disabled={isVerifying}
                        className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-10 pr-2 py-2 text-xs font-extrabold focus:outline-none focus:border-amber-400 shadow-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="btn-shimmer bg-amber-500 hover:bg-amber-400 text-slate-950 font-heading font-black text-xs px-4 py-2 rounded-xl border border-amber-400 shadow-md flex items-center gap-1 transition-all active:scale-95 shrink-0 cursor-pointer"
                    >
                      {isVerifying ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      ) : (
                        <>
                          <span>Verify</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>

      </div>
      {/* ── END FIRST FOLD ── */}

      {/* ══════════════════════════════════════════════════════
           SECOND FOLD — Platform Pillars + How It Works
         ══════════════════════════════════════════════════════ */}
      <div className="relative z-10 w-full bg-white border-t border-slate-100 py-16 md:py-24 px-4 sm:px-6 max-md:hidden">
        <div className="max-w-6xl mx-auto flex flex-col gap-16">

          {/* Section Header */}
          <div className="text-center flex flex-col items-center gap-3 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-400/30 text-amber-700 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Why Namma Thanjai?
            </span>
            <h2 className="font-heading font-black text-[clamp(1.6rem,5vw,3rem)] text-slate-950 tracking-tight uppercase leading-[1.1]">
              Everything You Need in Thanjavur{" "}
              <span className="relative inline-block">
                <span>Under One Roof</span>
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" />
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
              Zero Brokerage Fees&nbsp;•&nbsp;Direct WhatsApp & Phone&nbsp;•&nbsp;Verified Local Residents
            </p>
          </div>

          {/* 4 Pillar Cards — Glassmorphism */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Pillar 1: Sell */}
            <div
              onClick={onCtaClick}
              className="group relative bg-white/70 backdrop-blur-sm border border-amber-100/80 hover:border-amber-300 p-6 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(245,158,11,0.14)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-4 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(245,158,11,0.35)] group-hover:scale-110 transition-transform">
                <PiShoppingBagBold size={22} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Zero Broker Fees</span>
                <h3 className="font-heading font-black text-base text-slate-950">Sell Marketplace</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Buy & sell CMDA plots, houses, cars, bikes & electronics directly from owners.
                </p>
              </div>
              <div className="mt-auto flex items-center gap-1.5 text-xs font-black text-amber-600 group-hover:translate-x-1 transition-transform">
                <span>Browse Listings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 2: Need */}
            <div
              onClick={onCtaClick}
              className="group relative bg-white/70 backdrop-blur-sm border border-amber-100/80 hover:border-amber-300 p-6 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(245,158,11,0.14)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-4 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(245,158,11,0.35)] group-hover:scale-110 transition-transform">
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Post Requirements</span>
                <h3 className="font-heading font-black text-base text-slate-950">Find What You Need</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Need a house or land? Post your budget and get direct offers from local sellers.
                </p>
              </div>
              <div className="mt-auto flex items-center gap-1.5 text-xs font-black text-amber-600 group-hover:translate-x-1 transition-transform">
                <span>Post Requirement</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 3: Services */}
            <div
              onClick={onCtaClick}
              className="group relative bg-white/70 backdrop-blur-sm border border-amber-100/80 hover:border-amber-300 p-6 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(245,158,11,0.14)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-4 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(245,158,11,0.35)] group-hover:scale-110 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">4.9★ Rated Pros</span>
                <h3 className="font-heading font-black text-base text-slate-950">Local Services</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Electricians, plumbers, carpenters & mechanics with 30-min doorstep arrival.
                </p>
              </div>
              <div className="mt-auto flex items-center gap-1.5 text-xs font-black text-amber-600 group-hover:translate-x-1 transition-transform">
                <span>Hire Tradesperson</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 4: Offers */}
            <div
              onClick={onCtaClick}
              className="group relative bg-white/70 backdrop-blur-sm border border-amber-100/80 hover:border-amber-300 p-6 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(245,158,11,0.14)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-4 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(245,158,11,0.35)] group-hover:scale-110 transition-transform">
                <Store className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Exclusive Deals</span>
                <h3 className="font-heading font-black text-base text-slate-950">Store Offers</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Top discounts from Thanjavur silk handlooms, electronics galleries & cafes.
                </p>
              </div>
              <div className="mt-auto flex items-center gap-1.5 text-xs font-black text-amber-600 group-hover:translate-x-1 transition-transform">
                <span>Explore Deals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>

          {/* ── How It Works (3-Step) ── */}
          <div className="flex flex-col gap-8 border-t border-slate-100 pt-10">
            <div className="text-center flex flex-col items-center gap-2 max-w-lg mx-auto">
              <span className="inline-flex items-center gap-1.5 bg-slate-950/5 border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                30 Seconds to Connect
              </span>
              <h3 className="font-heading font-black text-[clamp(1.4rem,4vw,2.2rem)] text-slate-950 uppercase tracking-tight">
                How Namma Thanjai Works
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Direct connection between local buyers, sellers & service experts
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {[
                { icon: <Megaphone className="w-5 h-5" />, step: "01", title: "Post Your Requirement", desc: "Post items for sale, buyer requirements, or local service details in under 30 seconds." },
                { icon: <Phone className="w-5 h-5" />, step: "02", title: "Direct Connect", desc: "Connect directly via WhatsApp or phone call with zero brokers or middleman delays." },
                { icon: <CheckCircle className="w-5 h-5" />, step: "03", title: "Deal Completed", desc: "Finalize deals directly with local Thanjavur residents — 100% zero commission fees." },
              ].map(({ icon, step, title, desc }) => (
                <div
                  key={step}
                  className="group relative bg-white/70 backdrop-blur-sm border border-slate-100 hover:border-amber-300 p-7 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(245,158,11,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-4 overflow-hidden"
                >
                  {/* Giant frosted step number watermark */}
                  <span className="absolute top-4 right-5 font-heading font-black text-5xl text-slate-100 group-hover:text-amber-400/30 transition-colors duration-300 select-none leading-none pointer-events-none">
                    {step}
                  </span>
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform">
                    {icon}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="font-heading font-black text-base text-slate-950">{title}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}

            </div>
          </div>

        </div>
      </div>
      {/* ── END SECOND FOLD ── */}

      {/* ══════════════════════════════════════════════════════
           THIRD FOLD — Ready to Buy, Sell or Hire Banner
         ══════════════════════════════════════════════════════ */}
      <div className="relative z-10 w-full py-14 md:py-20 px-4 sm:px-6 bg-white border-t border-slate-100 max-md:hidden">
        <div className="max-w-5xl mx-auto">
          <div
            className="relative overflow-hidden rounded-[2rem] p-8 md:p-12 flex flex-col sm:flex-row items-center justify-between gap-8 text-center sm:text-left shadow-[0_24px_64px_rgba(180,100,0,0.2)]"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 40%, #b45309 100%)",
            }}
          >
            {/* Subtle pattern overlay */}
            <div
              className="absolute inset-0 opacity-[0.08] pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.6) 1px, transparent 1px)`,
                backgroundSize: "18px 18px",
              }}
            />
            {/* Decorative glow blobs */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-300/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-orange-400/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex flex-col gap-2 max-w-xl">
              <h3 className="font-heading font-black text-[clamp(1.4rem,4vw,2.2rem)] text-white uppercase tracking-tight leading-tight drop-shadow-md">
                Ready to Buy, Sell or Hire in Thanjavur?
              </h3>
              <p className="text-xs sm:text-sm font-bold text-white/85">
                Join thousands of verified Thanjavur residents today — zero broker fees.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onCtaClick) {
                  onCtaClick();
                } else {
                  router.push("/home");
                }
              }}
              className="btn-shimmer relative shrink-0 bg-slate-950 hover:bg-slate-900 text-white font-heading font-black text-sm px-8 py-4 rounded-2xl shadow-xl transition-all cursor-pointer active:scale-95 flex items-center gap-2.5 border border-slate-800 uppercase tracking-wider"
            >
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
            </button>
          </div>
        </div>
      </div>
      {/* ── END THIRD FOLD ── */}

    </section>
  );
}

export default RobotHero;
