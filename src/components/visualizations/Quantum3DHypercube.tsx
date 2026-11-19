import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { StateVector } from '../../engine/quantumMath';
import type { SeparabilityResult } from '../../engine/quantumMath';
import { C, numQubits, basisLabel } from '../../engine/quantumMath';
import { RotateCw, ZoomIn, ZoomOut, Maximize2, Sparkles } from 'lucide-react';

interface Quantum3DHypercubeProps {
  stateVector: StateVector;
  highlightIndex?: number | null;
  onHover?: (index: number | null) => void;
  showSeparabilityPlanes?: boolean;
  separabilityResults?: SeparabilityResult[];
}

export const Quantum3DHypercube: React.FC<Quantum3DHypercubeProps> = ({
  stateVector,
  highlightIndex = null,
  onHover,
  showSeparabilityPlanes = true,
  separabilityResults = [],
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodesGroupRef = useRef<THREE.Group | null>(null);
  const planesGroupRef = useRef<THREE.Group | null>(null);

  const nQ = numQubits(stateVector);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 550;
    const height = 400;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0f172a); // dark slate

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(3.8, 3.2, 5.2);
    camera.lookAt(0, 0, 0);

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 0.8);
    dirLight2.position.set(-5, -4, -5);
    scene.add(dirLight2);

    // --- Groups ---
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    const edgesGroup = new THREE.Group();
    mainGroup.add(edgesGroup);

    const planesGroup = new THREE.Group();
    planesGroupRef.current = planesGroup;
    mainGroup.add(planesGroup);

    const nodesGroup = new THREE.Group();
    nodesGroupRef.current = nodesGroup;
    mainGroup.add(nodesGroup);

    // --- Coordinate Calculations ---
    // Hypercube grid coordinates normalized in [-1.2, 1.2]
    const getPos = (i: number): [number, number, number] => {
      if (nQ === 2) {
        // Little-endian: |q2 q1>
        // q1 = horiz (X: -1.2 to +1.2)
        // q2 = vert (Y: +1.2 to -1.2)
        const q1 = i & 1;
        const q2 = (i >> 1) & 1;
        const x = (q1 === 0 ? -1.3 : 1.3);
        const y = (q2 === 0 ? 1.1 : -1.1);
        return [x, y, 0];
      } else {
        // 3 Qubits: |q3 q2 q1>
        const q1 = i & 1;
        const q2 = (i >> 1) & 1;
        const q3 = (i >> 2) & 1;
        const x = (q1 === 0 ? -1.2 : 1.2);
        const y = (q2 === 0 ? 1.0 : -1.0);
        const z = (q3 === 0 ? 1.0 : -1.0);
        return [x, y, z];
      }
    };

    // --- Build Edges ---
    const nStates = 1 << nQ;
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
    });

    for (let i = 0; i < nStates; i++) {
      for (let bit = 0; bit < nQ; bit++) {
        const j = i ^ (1 << bit);
        if (i < j) {
          const p1 = new THREE.Vector3(...getPos(i));
          const p2 = new THREE.Vector3(...getPos(j));
          const geom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
          const line = new THREE.Line(geom, edgeMaterial);
          edgesGroup.add(line);
        }
      }
    }

    // --- Mouse Orbit Interaction ---
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) {
        // Raycasting for hover
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(nodesGroup.children, true);
        if (intersects.length > 0) {
          let topObj: THREE.Object3D | null = intersects[0].object;
          while (topObj && topObj.parent !== nodesGroup) {
            topObj = topObj.parent;
          }
          if (topObj && topObj.userData.index !== undefined) {
            if (onHover) onHover(topObj.userData.index);
            container.style.cursor = 'pointer';
            return;
          }
        }
        if (onHover) onHover(null);
        container.style.cursor = 'grab';
        return;
      }

      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      mainGroup.rotation.y += deltaX * 0.008;
      mainGroup.rotation.x += deltaY * 0.008;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(3.0, Math.min(10.0, camera.position.z + e.deltaY * 0.005));
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    // --- Animation Loop ---
    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (autoRotate && !isDragging) {
        mainGroup.rotation.y += delta * 0.25;
      }

      // Gentle pulsing of nodes
      nodesGroup.children.forEach((node) => {
        if (node.userData.innerMesh) {
          const baseScale = node.userData.targetScale || 1;
          const pulse = 1 + 0.04 * Math.sin(elapsed * 3 + node.userData.index);
          node.userData.innerMesh.scale.set(
            baseScale * pulse,
            baseScale * pulse,
            baseScale * pulse
          );
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // --- Resize Handler ---
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [nQ]);

  // Update Nodes and Separability Planes when stateVector changes
  useEffect(() => {
    const nodesGroup = nodesGroupRef.current;
    const planesGroup = planesGroupRef.current;
    if (!nodesGroup || !planesGroup) return;

    // Clear old node meshes
    while (nodesGroup.children.length > 0) {
      nodesGroup.remove(nodesGroup.children[0]);
    }
    while (planesGroup.children.length > 0) {
      planesGroup.remove(planesGroup.children[0]);
    }

    const getPos = (i: number): [number, number, number] => {
      if (nQ === 2) {
        const q1 = i & 1;
        const q2 = (i >> 1) & 1;
        return [q1 === 0 ? -1.3 : 1.3, q2 === 0 ? 1.1 : -1.1, 0];
      } else {
        const q1 = i & 1;
        const q2 = (i >> 1) & 1;
        const q3 = (i >> 2) & 1;
        return [q1 === 0 ? -1.2 : 1.2, q2 === 0 ? 1.0 : -1.0, q3 === 0 ? 1.0 : -1.0];
      }
    };

    // --- Recreate Nodes ---
    stateVector.forEach((c, i) => {
      const [x, y, z] = getPos(i);
      const mag = C.mag(c);
      const phi = C.phase(c);
      const isHighlighted = highlightIndex === i;

      const nodeObj = new THREE.Group();
      nodeObj.position.set(x, y, z);
      nodeObj.userData.index = i;

      // 1. Outer Reference Wireframe Sphere (radius 0.45)
      const outerGeom = new THREE.SphereGeometry(0.45, 20, 20);
      const outerMat = new THREE.MeshBasicMaterial({
        color: isHighlighted ? 0xf59e0b : 0x475569,
        wireframe: true,
        transparent: true,
        opacity: isHighlighted ? 0.7 : 0.25,
      });
      const outerMesh = new THREE.Mesh(outerGeom, outerMat);
      nodeObj.add(outerMesh);

      // 2. Inner Glowing Teal Sphere (radius proportional to |c_i|)
      if (mag > 0.001) {
        const innerRadius = Math.max(0.05, 0.45 * mag);
        const innerGeom = new THREE.SphereGeometry(innerRadius, 24, 24);
        const innerMat = new THREE.MeshStandardMaterial({
          color: isHighlighted ? 0xfbbf24 : 0x0d9488,
          emissive: isHighlighted ? 0xd97706 : 0x0f766e,
          emissiveIntensity: isHighlighted ? 0.8 : 0.5,
          roughness: 0.2,
          metalness: 0.1,
          transparent: true,
          opacity: 0.9,
        });
        const innerMesh = new THREE.Mesh(innerGeom, innerMat);
        nodeObj.add(innerMesh);
        nodeObj.userData.innerMesh = innerMesh;
        nodeObj.userData.targetScale = 1;

        // 3. 3D Phase Needle
        // In 2D: 0 = straight UP (12 o'clock / +Y). +phi = Counterclockwise.
        // In 3D: Pointer starts at (0, +0.45, 0) and rotates in XY plane by +phi CCW:
        // x = -0.45 * sin(phi), y = 0.45 * cos(phi)
        const needleX = -0.45 * Math.sin(phi);
        const needleY = 0.45 * Math.cos(phi);

        const needleGeom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(needleX, needleY, 0),
        ]);
        const needleMat = new THREE.LineBasicMaterial({
          color: 0xffffff,
          linewidth: 3,
        });
        const needleLine = new THREE.Line(needleGeom, needleMat);
        nodeObj.add(needleLine);

        // Needle tip pointer
        const tipGeom = new THREE.SphereGeometry(0.04, 12, 12);
        const tipMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const tipMesh = new THREE.Mesh(tipGeom, tipMat);
        tipMesh.position.set(needleX, needleY, 0);
        nodeObj.add(tipMesh);
      }

      // 4. Text Canvas Billboard for Basis State Label
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = isHighlighted ? '#f59e0b' : '#38bdf8';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`|${basisLabel(i, nQ)}⟩`, 64, 32);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(0.65, 0.32, 1);
      sprite.position.set(0, -0.6, 0);
      nodeObj.add(sprite);

      nodesGroup.add(nodeObj);
    });

    // --- Separability Planes ---
    if (showSeparabilityPlanes && separabilityResults.length > 0) {
      separabilityResults.forEach((r) => {
        const isSep = r.isSeparable;
        const color = isSep ? 0x10b981 : 0xef4444;

        if (r.qubit === 1) {
          // Q1 plane: Vertical plane cutting X=0
          const geom = new THREE.PlaneGeometry(0.05, 3.2);
          const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
          });
          const plane = new THREE.Mesh(geom, mat);
          plane.scale.set(1, 1, nQ === 3 ? 3.0 : 1);
          planesGroup.add(plane);
        } else if (r.qubit === 2) {
          // Q2 plane: Horizontal plane cutting Y=0
          const geom = new THREE.PlaneGeometry(3.2, 0.05);
          const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
          });
          const plane = new THREE.Mesh(geom, mat);
          plane.rotation.x = Math.PI / 2;
          plane.scale.set(1, nQ === 3 ? 3.0 : 1, 1);
          planesGroup.add(plane);
        } else if (r.qubit === 3 && nQ === 3) {
          // Q3 plane: Depth plane cutting Z=0
          const geom = new THREE.PlaneGeometry(3.2, 3.2);
          const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.22,
            side: THREE.DoubleSide,
          });
          const plane = new THREE.Mesh(geom, mat);
          planesGroup.add(plane);
        }
      });
    }
  }, [stateVector, nQ, highlightIndex, showSeparabilityPlanes, separabilityResults]);

  const handleResetCamera = () => {
    if (cameraRef.current && sceneRef.current) {
      cameraRef.current.position.set(3.8, 3.2, 5.2);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  const handleZoom = (delta: number) => {
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.max(2.5, Math.min(9.0, cameraRef.current.position.z + delta));
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-xl">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-[400px] cursor-grab active:cursor-grabbing" />

      {/* Top Floating Controls */}
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-semibold text-white">3D Quantum Hypercube</span>
        <span className="text-[10px] text-slate-400">({nQ} Qubits · 360° Orbit)</span>
      </div>

      {/* Floating Toolbar */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-md p-1 rounded-xl border border-slate-700">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
            autoRotate ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle Auto-Orbit Rotation"
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={() => handleZoom(-0.8)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => handleZoom(0.8)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleResetCamera}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="Reset Camera View"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Legend Overlay */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-800/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 pointer-events-none">
        <span>Drag mouse to orbit 360° · Scroll wheel to zoom</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span>
            Sphere Area = |c|²
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-white inline-block"></span>
            Needle = Phase (12:00 = 0)
          </span>
        </div>
      </div>
    </div>
  );
};
