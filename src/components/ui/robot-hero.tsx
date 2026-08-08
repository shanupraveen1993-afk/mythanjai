"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Environment, ContactShadows, Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { PiShoppingBagBold } from "react-icons/pi";
import { ArrowRight, Loader2, Phone, CheckCircle, Megaphone, Wrench, Store, Search, MapPin, Sparkles, ChevronDown } from "lucide-react";
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
  const s = Math.min(1.4, viewport.width / 2.8) * scale * (isMobile ? 1.25 : 0.72);
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

    // Floating bobbing motion
    const floatY = Math.sin(state.clock.getElapsedTime() * 2.2) * 0.05;

    // Centered subtle position sway with floating Y
    const targetPosX = tx * 0.15;
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

    // Dynamic ground shadow pulsing with float height
    if (shadowRef.current) {
      const shadowFactor = 1.0 - (floatY + 0.05) * 3.0;
      const shadowScale = 1.0 + floatY * 1.2;
      shadowRef.current.scale.set(shadowScale, shadowScale, 1.0);
      if (shadowRef.current.material) {
        (shadowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.22 * shadowFactor;
      }
    }

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
      {/* Dynamic Floating Ground Shadow Disk */}
      <mesh
        ref={shadowRef}
        position={[0, -0.44, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.7, 0.7]} />
        <meshBasicMaterial
          color="#000000"
          transparent={true}
          opacity={0.22}
        />
      </mesh>
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
  const words = ["SELL PLOT", "BUY HOUSE", "PLUMBER", "CARPENTER", "HIRE TAXI", "RENT ROOM", "BEST OFFERS", "LOCAL SHOPS"];

  useEffect(() => {
    if (isSpinning) return;
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 1500); // 1.5s fast rotation so 3-4 topics rotate within 5-6 seconds
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
      className="relative w-full min-h-[calc(100vh-70px)] flex flex-col justify-center items-center bg-white text-slate-800 py-2 sm:py-4 px-4 overflow-hidden select-none"
    >
      {/* Light radial glow centered behind hero */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_45%,rgba(250,204,21,0.06)_0%,transparent_60%)] pointer-events-none" />

      {/* Centered Foreground Hero Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center gap-2 sm:gap-3 my-auto pointer-events-auto">
        
        {/* 1. Logo Badge + Header Title */}
        <div className="flex flex-col items-center gap-1 w-full">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/90 shadow-xs p-1 flex items-center justify-center shrink-0 border-0 mb-0.5">
            <img 
              src="/namma_thanjai_logo.png" 
              alt="namma thanjai app logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-5xl md:text-6xl text-slate-900 tracking-tight leading-none uppercase max-w-4xl">
            namma thanjavur<span className="text-yellow-500">.</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 font-black uppercase tracking-widest mt-0.5">
            thanjavur verified noticeboard & local helper trades
          </p>
        </div>

        {/* 2. Dynamic Rotational Topic */}
        <div className="h-6 sm:h-8 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.h2
              key={wordIndex}
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 0.25, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 1.05 }}
              transition={{ duration: 0.25 }}
              className="font-sans font-black text-lg sm:text-2xl md:text-3xl text-slate-400 uppercase tracking-widest text-center select-none"
            >
              {words[wordIndex]}
            </motion.h2>
          </AnimatePresence>
        </div>

        {/* 3. 4 Standalone Clickable Channel Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full max-w-xl px-2 my-0.5">
          <button
            type="button"
            onClick={() => onCategoryClick?.("sell")}
            className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 shadow-2xs hover:border-slate-300 transition-all text-center flex items-center justify-center cursor-pointer font-extrabold text-[11px] sm:text-xs uppercase tracking-wider active:scale-[0.97]"
          >
            <span>Sell</span>
          </button>
          <button
            type="button"
            onClick={() => onCategoryClick?.("need")}
            className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 shadow-2xs hover:border-slate-300 transition-all text-center flex items-center justify-center cursor-pointer font-extrabold text-[11px] sm:text-xs uppercase tracking-wider active:scale-[0.97]"
          >
            <span>Need</span>
          </button>
          <button
            type="button"
            onClick={() => onCategoryClick?.("services")}
            className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 shadow-2xs hover:border-slate-300 transition-all text-center flex items-center justify-center cursor-pointer font-extrabold text-[11px] sm:text-xs uppercase tracking-wider active:scale-[0.97]"
          >
            <span>Service</span>
          </button>
          <button
            type="button"
            onClick={() => onCategoryClick?.("shops")}
            className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 shadow-2xs hover:border-slate-300 transition-all text-center flex items-center justify-center cursor-pointer font-extrabold text-[11px] sm:text-xs uppercase tracking-wider active:scale-[0.97]"
          >
            <span>Offer</span>
          </button>
        </div>

        {/* 4. Centered 3D Mascot Robot Canvas in Original Spot with UNBOUNDED OVERFLOW (No Border Clipping) */}
        <div 
          onClick={handleRobotTap} 
          className="w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] h-[190px] sm:h-[220px] md:h-[240px] relative flex items-center justify-center cursor-pointer my-0.5 overflow-visible"
        >
          <Canvas camera={{ position: [0, 0.12, 3.6], fov: 38 }} className="overflow-visible">
            <ambientLight intensity={entorno.luzAmbiente} color="#ffffff" />
            <directionalLight position={[0, 6, 3]} intensity={entorno.luzPrincipal} color={entorno.luzPrincipalColor} shadow-bias={-0.0005} />
            <Environment preset="studio" blur={0.5} />
            <ResponsiveGroup scale={scale * 1.35}>
              <RobotPrototype neckParams={{ baseR: 0.215, baseH: -0.05, midR: 0.28, midH: 0.02, lipBottomR: 0.295, lipBottomH: 0.045, lipTopR: 0.27, lipTopH: 0.055, innerR: 0.1, innerDropH: 0.0 }} bodyParams={{ bodyBevelR: 0.235, bodyBevelY: 0.34, bodyBevelT: 0.025 }} color={color} pantallaColor={pantallaColor} pantallaBrillo={pantallaBrillo} blinkCycle={blinkCycle} metalness={metalness} />
            </ResponsiveGroup>
            <ContactShadows position={[0, -0.75, 0]} opacity={0.4} scale={2.8} blur={2.0} far={1.8} color="#000000" />
          </Canvas>
        </div>

        {/* 5. LIVE Ticker Alert Banner */}
        {alerts.length > 0 && (
          <div className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl py-2 px-4 shadow-sm flex items-center justify-between text-[11px] sm:text-xs font-black select-none max-w-md mx-auto tracking-wide my-1">
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
                    className="absolute left-0 text-slate-100 truncate w-full font-bold text-left text-[11px] sm:text-xs"
                  >
                    {alerts[activeAlertIdx]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* 6. Primary Action Button: REGISTER TO POST */}
        <div className="w-full max-w-sm my-1">
          <button
            type="button"
            onClick={onCtaClick}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-955 font-black text-xs sm:text-sm uppercase tracking-wider transition-all hover:scale-[1.01] active:scale-[0.98] shadow-md shadow-yellow-500/20 border-0 text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{ctaText === "Verified" ? "Verified Profile" : "Register to Post"}</span>
            <ArrowRight className="w-4 h-4 text-slate-955" />
          </button>
        </div>

      </div>
    </section>
  );
}

export default RobotHero;
