"use client";

import { useMemo, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { attachContextLossHandlers } from "@/lib/webgl-recovery";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// ── Internal sub-components (Three.js) ──────────────────────────────────────

function Atom({
  position,
  color,
  radius,
  isMobile,
}: {
  position: [number, number, number];
  color: string;
  radius: number;
  isMobile?: boolean;
}) {
  const segments = isMobile ? 16 : 32;
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, segments, segments]} />
      <meshStandardMaterial
        color={color}
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  );
}

function Bond({
  start,
  end,
}: {
  start: [number, number, number];
  end: [number, number, number];
}) {
  const { position, rotation, length } = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const mid = s.clone().add(e).multiplyScalar(0.5);
    const dir = e.clone().sub(s);
    const len = dir.length();
    const orientation = new THREE.Quaternion();
    orientation.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.normalize()
    );
    const euler = new THREE.Euler().setFromQuaternion(orientation);
    return {
      position: [mid.x, mid.y, mid.z] as [number, number, number],
      rotation: [euler.x, euler.y, euler.z] as [number, number, number],
      length: len,
    };
  }, [start, end]);

  return (
    <mesh position={position} rotation={rotation}>
      <cylinderGeometry args={[0.05, 0.05, length, 8]} />
      <meshStandardMaterial color="#94a3b8" metalness={0.2} roughness={0.6} />
    </mesh>
  );
}

// ── Scene props (serialisable – passed across dynamic import boundary) ──────

function CellEdge({
  start,
  end,
}: {
  start: [number, number, number];
  end: [number, number, number];
}) {
  const { position, rotation, length } = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const mid = s.clone().add(e).multiplyScalar(0.5);
    const dir = e.clone().sub(s);
    const len = dir.length();
    const orientation = new THREE.Quaternion();
    orientation.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.normalize()
    );
    const euler = new THREE.Euler().setFromQuaternion(orientation);
    return {
      position: [mid.x, mid.y, mid.z] as [number, number, number],
      rotation: [euler.x, euler.y, euler.z] as [number, number, number],
      length: len,
    };
  }, [start, end]);

  return (
    <mesh position={position} rotation={rotation}>
      <cylinderGeometry args={[0.02, 0.02, length, 4]} />
      <meshStandardMaterial color="#4b5563" metalness={0.1} roughness={0.8} transparent opacity={0.6} />
    </mesh>
  );
}

interface SceneProps {
  positions: [number, number, number][];
  colors: string[];
  radii: number[];
  bonds: [number, number][];
  cellEdges?: [number, number, number, number, number, number][];
}

export default function MaterialStructureScene({
  positions,
  colors,
  radii,
  bonds,
  cellEdges = [],
}: SceneProps) {
  const isMobile = useIsMobile();

  if (positions.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
        No atoms to display.
      </div>
    );
  }

  // On mobile with many atoms, limit rendering for performance
  const maxAtoms = isMobile ? 200 : 1000;
  const displayPositions = positions.slice(0, maxAtoms);
  const displayColors = colors.slice(0, maxAtoms);
  const displayRadii = radii.slice(0, maxAtoms);
  const displayBonds = bonds.filter(([a, b]) => a < maxAtoms && b < maxAtoms);

  // Scale down atom/bond sizes on mobile for better visibility
  const radiusScale = isMobile ? 0.8 : 1.0;

  // Compute reasonable camera distance
  const maxR = displayPositions.reduce(
    (m, p) => Math.max(m, Math.sqrt(p[0] ** 2 + p[1] ** 2 + p[2] ** 2)),
    1
  );
  const camDist = Math.max(maxR * 2.5, 5);

  return (
    <Canvas
      camera={{ position: [camDist * 0.7, camDist * 0.5, camDist * 0.7], fov: 45 }}
      style={{ background: "#111827" }}
      dpr={isMobile ? [1, 1.5] : [1, 2]}
      performance={{ min: 0.5 }}
      onCreated={attachContextLossHandlers}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      {!isMobile && <directionalLight position={[-5, -5, -8]} intensity={0.3} />}

      <group>
        {/* Unit cell wireframe */}
        {cellEdges.map((e, i) => (
          <CellEdge
            key={`cell-${i}`}
            start={[e[0], e[1], e[2]]}
            end={[e[3], e[4], e[5]]}
          />
        ))}

        {/* Atoms */}
        {displayPositions.map((pos, i) => (
          <Atom
            key={`a-${i}`}
            position={pos}
            color={displayColors[i]}
            radius={displayRadii[i] * radiusScale}
            isMobile={isMobile}
          />
        ))}

        {/* Bonds */}
        {displayBonds.map(([a, b], i) => (
          <Bond key={`b-${i}`} start={displayPositions[a]} end={displayPositions[b]} />
        ))}
      </group>

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        autoRotate={true}
        autoRotateSpeed={isMobile ? 1.5 : 2}
        maxDistance={camDist * 3}
        minDistance={1}
        // Mobile touch optimizations
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
        enableDamping={true}
        dampingFactor={0.1}
        rotateSpeed={isMobile ? 0.8 : 1}
        zoomSpeed={isMobile ? 0.8 : 1}
      />
    </Canvas>
  );
}
