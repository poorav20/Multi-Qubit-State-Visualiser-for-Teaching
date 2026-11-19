import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { StateVector } from '../../engine/quantumMath';
import { computeBlochVector, numQubits } from '../../engine/quantumMath';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface BlochSphere3DProps {
  stateVector: StateVector;
}

export const BlochSphere3D: React.FC<BlochSphere3DProps> = ({ stateVector }) => {
  const nQ = numQubits(stateVector);
  const qubits = Array.from({ length: nQ }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500 flex items-center justify-between">
        <span>
          Individual Qubit Reduced Density Matrix Bloch Spheres (Tr_rest(ρ))
        </span>
        <span className="font-semibold text-slate-700">
          Surface = Pure/Separable · Interior = Entangled/Mixed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {qubits.map((q) => (
          <SingleBlochSphere key={q} qubitNumber={q} stateVector={stateVector} />
        ))}
      </div>
    </div>
  );
};

interface SingleBlochProps {
  qubitNumber: number;
  stateVector: StateVector;
}

const SingleBlochSphere: React.FC<SingleBlochProps> = ({ qubitNumber, stateVector }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const bloch = computeBlochVector(stateVector, qubitNumber);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const size = container.clientWidth || 240;
    const height = 240;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // dark slate

    const camera = new THREE.PerspectiveCamera(40, size / height, 0.1, 100);
    camera.position.set(2.2, 1.8, 2.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Transparent Wireframe Sphere (R = 1)
    const sphereGeom = new THREE.SphereGeometry(1, 24, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const sphereMesh = new THREE.Mesh(sphereGeom, sphereMat);
    mainGroup.add(sphereMesh);

    // 2. Equator & Meridian Reference Rings
    const ringGeom = new THREE.RingGeometry(0.99, 1.01, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x64748b, side: THREE.DoubleSide });
    const equator = new THREE.Mesh(ringGeom, ringMat);
    equator.rotation.x = Math.PI / 2;
    mainGroup.add(equator);

    // 3. Axes
    const axisMat = new THREE.LineBasicMaterial({ color: 0x475569 });
    // Z axis (vertical: -1.3 to +1.3)
    const zGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1.3, 0),
      new THREE.Vector3(0, 1.3, 0),
    ]);
    mainGroup.add(new THREE.Line(zGeom, axisMat));

    // X axis (front-back)
    const xGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.3, 0, 0),
      new THREE.Vector3(1.3, 0, 0),
    ]);
    mainGroup.add(new THREE.Line(xGeom, axisMat));

    // Y axis (depth)
    const yGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -1.3),
      new THREE.Vector3(0, 0, 1.3),
    ]);
    mainGroup.add(new THREE.Line(yGeom, axisMat));

    // 4. Pole Labels (Text Sprites)
    const addLabel = (text: string, pos: [number, number, number], color = '#94a3b8') => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = color;
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 32, 16);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(0.35, 0.18, 1);
      sprite.position.set(...pos);
      mainGroup.add(sprite);
    };

    addLabel('|0⟩', [0, 1.45, 0], '#38bdf8');
    addLabel('|1⟩', [0, -1.45, 0], '#38bdf8');
    addLabel('|+⟩', [1.45, 0, 0]);
    addLabel('|-⟩', [-1.45, 0, 0]);

    // 5. Bloch Vector Arrow
    // Mapping: Three.js coordinates: Y is vertical (Z-axis in standard Bloch), X is X, Z is Y.
    // Three.js vector: (rx, rz, ry)
    const arrowDir = new THREE.Vector3(bloch.x, bloch.z, bloch.y);
    const arrowLen = Math.max(0.001, bloch.length);
    const normalizedDir = arrowDir.clone().normalize();

    const arrowColor = bloch.isPure ? 0x10b981 : 0xf43f5e;
    const arrowHelper = new THREE.ArrowHelper(
      normalizedDir,
      new THREE.Vector3(0, 0, 0),
      arrowLen,
      arrowColor,
      0.2,
      0.1
    );
    mainGroup.add(arrowHelper);

    // Tip Sphere
    const tipGeom = new THREE.SphereGeometry(0.06, 16, 16);
    const tipMat = new THREE.MeshBasicMaterial({ color: arrowColor });
    const tipMesh = new THREE.Mesh(tipGeom, tipMat);
    tipMesh.position.copy(arrowDir);
    mainGroup.add(tipMesh);

    // Mouse Interaction
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
      mainGroup.rotation.y += dx * 0.01;
      mainGroup.rotation.x += dy * 0.01;
    };
    const onMouseUp = () => (isDragging = false);

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      if (!isDragging) {
        mainGroup.rotation.y += 0.004;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
    };
  }, [bloch.x, bloch.y, bloch.z, bloch.length, bloch.isPure]);

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-3 flex flex-col items-center shadow-lg">
      <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800">
        <span className="font-bold text-sm text-cyan-400">Qubit #{qubitNumber}</span>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          {bloch.isPure ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/80">
              <ShieldCheck className="w-3.5 h-3.5" /> Pure (Separable)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800/80">
              <ShieldAlert className="w-3.5 h-3.5" /> Mixed (Entangled)
            </span>
          )}
        </div>
      </div>

      <div ref={mountRef} className="w-full h-[240px] cursor-grab active:cursor-grabbing" />

      <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
        <div>
          <span>|r| = </span>
          <span className={`font-bold ${bloch.isPure ? 'text-emerald-400' : 'text-rose-400'}`}>
            {bloch.length.toFixed(3)}
          </span>
        </div>
        <div>
          <span>Purity = </span>
          <span className="font-bold text-cyan-400">{bloch.purity.toFixed(3)}</span>
        </div>
        <div className="col-span-2 text-[10px] text-slate-500 truncate">
          r = ({bloch.x.toFixed(2)}, {bloch.y.toFixed(2)}, {bloch.z.toFixed(2)})
        </div>
      </div>
    </div>
  );
};
