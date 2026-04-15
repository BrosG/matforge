"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { attachContextLossHandlers } from "@/lib/webgl-recovery";

interface AtomProps {
  position: [number, number, number];
  color: string;
  radius?: number;
}

function Atom3D({ position, color, radius = 0.35 }: AtomProps) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 32, 32]} />
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
  const ref = useRef<THREE.Mesh>(null);

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
    <mesh ref={ref} position={position} rotation={rotation}>
      <cylinderGeometry args={[0.06, 0.06, length, 8]} />
      <meshStandardMaterial color="#94a3b8" metalness={0.2} roughness={0.6} />
    </mesh>
  );
}

function RotatingStructure() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  // A simple crystal-like lattice structure
  const atoms: { pos: [number, number, number]; color: string; r?: number }[] = [
    // Central cluster - larger atoms (e.g., metal)
    { pos: [0, 0, 0], color: "#3b82f6", r: 0.5 },
    { pos: [1.8, 1.8, 0], color: "#3b82f6", r: 0.5 },
    { pos: [-1.8, 1.8, 0], color: "#3b82f6", r: 0.5 },
    { pos: [0, -1.8, 1.8], color: "#3b82f6", r: 0.5 },
    { pos: [0, -1.8, -1.8], color: "#3b82f6", r: 0.5 },
    // Smaller atoms (e.g., oxygen/nitrogen)
    { pos: [1.0, 0.5, 1.0], color: "#ef4444", r: 0.3 },
    { pos: [-1.0, 0.5, -1.0], color: "#ef4444", r: 0.3 },
    { pos: [1.0, -0.5, -1.0], color: "#ef4444", r: 0.3 },
    { pos: [-1.0, -0.5, 1.0], color: "#ef4444", r: 0.3 },
    // Carbon-like atoms
    { pos: [0, 1.2, 1.2], color: "#64748b", r: 0.25 },
    { pos: [0, 1.2, -1.2], color: "#64748b", r: 0.25 },
    { pos: [1.2, 0, 1.2], color: "#64748b", r: 0.25 },
    { pos: [-1.2, 0, -1.2], color: "#64748b", r: 0.25 },
    // Hydrogen-like atoms
    { pos: [0.8, 2.2, 0.8], color: "#22c55e", r: 0.2 },
    { pos: [-0.8, 2.2, -0.8], color: "#22c55e", r: 0.2 },
    { pos: [2.2, 1.0, 0.8], color: "#22c55e", r: 0.2 },
    { pos: [-2.2, 1.0, -0.8], color: "#22c55e", r: 0.2 },
  ];

  const bonds: { start: [number, number, number]; end: [number, number, number] }[] = [
    { start: [0, 0, 0], end: [1.0, 0.5, 1.0] },
    { start: [0, 0, 0], end: [-1.0, 0.5, -1.0] },
    { start: [0, 0, 0], end: [1.0, -0.5, -1.0] },
    { start: [0, 0, 0], end: [-1.0, -0.5, 1.0] },
    { start: [1.8, 1.8, 0], end: [1.0, 0.5, 1.0] },
    { start: [1.8, 1.8, 0], end: [0.8, 2.2, 0.8] },
    { start: [-1.8, 1.8, 0], end: [-1.0, 0.5, -1.0] },
    { start: [-1.8, 1.8, 0], end: [-0.8, 2.2, -0.8] },
    { start: [0, -1.8, 1.8], end: [-1.0, -0.5, 1.0] },
    { start: [0, -1.8, -1.8], end: [1.0, -0.5, -1.0] },
    { start: [0, 1.2, 1.2], end: [1.0, 0.5, 1.0] },
    { start: [0, 1.2, -1.2], end: [-1.0, 0.5, -1.0] },
    { start: [1.2, 0, 1.2], end: [1.0, 0.5, 1.0] },
    { start: [-1.2, 0, -1.2], end: [-1.0, 0.5, -1.0] },
    { start: [1.8, 1.8, 0], end: [2.2, 1.0, 0.8] },
    { start: [-1.8, 1.8, 0], end: [-2.2, 1.0, -0.8] },
  ];

  return (
    <group ref={groupRef}>
      {atoms.map((a, i) => (
        <Atom3D key={i} position={a.pos} color={a.color} radius={a.r} />
      ))}
      {bonds.map((b, i) => (
        <Bond key={i} start={b.start} end={b.end} />
      ))}
    </group>
  );
}

function GlowOrb() {
  return (
    <Float speed={2} rotationIntensity={0} floatIntensity={1.5}>
      <mesh>
        <sphereGeometry args={[4, 64, 64]} />
        <MeshDistortMaterial
          color="#3b82f6"
          attach="material"
          distort={0.2}
          speed={1.5}
          roughness={0.8}
          metalness={0.1}
          transparent
          opacity={0.08}
        />
      </mesh>
    </Float>
  );
}

interface CrystalViewerProps {
  className?: string;
  showControls?: boolean;
}

export function CrystalViewer({ className, showControls = true }: CrystalViewerProps) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [5, 3, 5], fov: 45 }}
        style={{ background: "transparent" }}
        onCreated={attachContextLossHandlers}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.4} color="#8b5cf6" />
        <RotatingStructure />
        <GlowOrb />
        {showControls && (
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            autoRotate={false}
            maxDistance={12}
            minDistance={3}
          />
        )}
      </Canvas>
    </div>
  );
}

export function CrystalViewerFallback({ className }: { className?: string }) {
  return (
    <div
      className={`${className} flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl`}
    >
      <div className="text-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-blue-100 animate-pulse mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-blue-400 rounded-lg animate-spin-slow" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4">Loading 3D viewer...</p>
      </div>
    </div>
  );
}
