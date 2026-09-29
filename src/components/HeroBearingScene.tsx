import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BearingProduct } from '../types';
import { buildProductBearing3D } from '../utils/productBearing3D';
import { advanceRotation } from '../utils/bearingMotion';

export type BearingFamily = 'ball' | 'roller' | 'accessories' | 'engineered' | 'track';

// Illustrative family geometry, not manufacturer CAD or a rated operating simulation.
function buildBearing(family: BearingFamily) {
  const root = new THREE.Group();
  const shell = new THREE.Group();
  const moving = new THREE.Group();
  const cage = new THREE.Group();
  const elements = new THREE.Group();
  const textures: THREE.Texture[] = [];

  const steel = new THREE.MeshStandardMaterial({ color: '#bcc5d0', metalness: 1, roughness: 0.22 });
  const polished = new THREE.MeshStandardMaterial({ color: '#e2e6ed', metalness: 1, roughness: 0.13 });
  const bronze = new THREE.MeshStandardMaterial({ color: '#b78b45', metalness: 0.85, roughness: 0.3 });
  const polymer = new THREE.MeshStandardMaterial({ color: '#806044', metalness: 0.12, roughness: 0.43 });
  const dark = new THREE.MeshStandardMaterial({ color: '#303c48', metalness: 0.65, roughness: 0.34 });
  const materials: THREE.Material[] = [steel, polished, bronze, polymer, dark];

  const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material, group = shell) => {
    const m = new THREE.Mesh(geometry, material);
    group.add(m);
    return m;
  };

  const lathe = (points: number[][], material = steel, group = shell) => {
    const geometry = new THREE.LatheGeometry(
      points.map(([r, z]) => new THREE.Vector2(r, z)),
      128
    );
    geometry.rotateX(Math.PI / 2);
    return mesh(geometry, material, group);
  };

  const torus = (radius: number, tube: number, z: number, material = polished, group = shell) => {
    const m = mesh(new THREE.TorusGeometry(radius, tube, 8, 128), material, group);
    m.position.z = z;
    return m;
  };

  const cylinder = (radius: number, depth: number, z: number, material: THREE.Material, group: THREE.Group) => {
    const m = mesh(new THREE.CylinderGeometry(radius, radius, depth, 64), material, group);
    m.rotation.x = Math.PI / 2;
    m.position.z = z;
    return m;
  };

  root.add(shell, moving, cage, elements);

  if (family === 'accessories') {
    // A tapered adapter sleeve, locknut and tab washer around a shaft seat.
    lathe([[1.02, -0.85], [1.11, -0.85], [1.37, 0.7], [1.37, 0.85], [1.06, 0.85], [1.02, -0.85]], steel, shell);
    torus(1.35, 0.025, 0.82, polished, shell);
    lathe([[1.4, 0.45], [1.88, 0.45], [1.94, 0.5], [1.94, 0.95], [1.88, 1], [1.4, 1], [1.4, 0.45]], dark, elements);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const notch = mesh(new THREE.BoxGeometry(0.16, 0.22, 0.58), steel, elements);
      notch.position.set(Math.cos(a) * 1.91, Math.sin(a) * 1.91, 0.73);
      notch.rotation.z = a;
    }
    lathe([[1.37, 0.19], [1.85, 0.19], [1.85, 0.29], [1.37, 0.29], [1.37, 0.19]], bronze, cage);
    const tab = mesh(new THREE.BoxGeometry(0.18, 0.28, 0.12), bronze, cage);
    tab.position.set(0, 1.84, 0.24);
    cylinder(0.97, 1.7, 0, dark, moving);
    torus(0.97, 0.025, 0.87, polished, moving);
  } else if (family === 'engineered') {
    // Mounted bearing unit: cast housing, insert, retaining hardware and shaft.
    const base = mesh(new THREE.BoxGeometry(5.05, 0.48, 1.55), dark, shell);
    base.position.y = -1.99;
    lathe([[1.61, -0.69], [2.28, -0.69], [2.3, -0.62], [2.3, 0.62], [2.28, 0.69], [1.61, 0.69], [1.61, -0.69]], steel, shell);
    for (const x of [-1.87, 1.87]) {
      const foot = mesh(new THREE.BoxGeometry(0.85, 0.45, 1.5), steel, shell);
      foot.position.set(x, -1.6, 0);
      cylinder(0.19, 0.18, 0.87, dark, cage).position.set(x, -1.96, 0.87);
      cylinder(0.29, 0.11, 0.99, polished, cage).position.set(x, -1.96, 0.99);
    }
    lathe([[1.34, -0.62], [1.55, -0.62], [1.6, -0.53], [1.6, 0.53], [1.55, 0.62], [1.34, 0.62], [1.34, -0.62]], polished, elements);
    for (let i = 0; i < 14; i++) {
      const a = (i * Math.PI) / 7;
      const ball = mesh(new THREE.SphereGeometry(0.19, 20, 16), polished, elements);
      ball.position.set(Math.cos(a) * 1.28, Math.sin(a) * 1.28, 0);
    }
    lathe([[0.84, -0.72], [1.1, -0.72], [1.1, 0.72], [0.84, 0.72], [0.84, -0.72]], bronze, moving);
    cylinder(0.8, 2.05, 0, dark, moving);
  } else if (family === 'track') {
    // Stud cam follower: broad outer tread rotates about a fixed integral stud.
    lathe([[1.78, -0.73], [2.22, -0.73], [2.29, -0.66], [2.29, 0.66], [2.22, 0.73], [1.78, 0.73], [1.78, -0.73]], steel, shell);
    for (const z of [-0.52, 0.52]) torus(2.25, 0.018, z, polished, shell);
    for (let i = 0; i < 21; i++) {
      const a = (i * Math.PI * 2) / 21;
      const needle = cylinder(0.17, 1.12, 0, polished, elements);
      needle.position.set(Math.cos(a) * 1.59, Math.sin(a) * 1.59, 0);
    }
    lathe([[1.06, -0.83], [1.85, -0.83], [1.85, -0.69], [1.06, -0.69], [1.06, -0.83]], bronze, cage);
    cylinder(1.41, 1.55, 0, dark, moving);
    cylinder(0.69, 1.24, 1.4, steel, moving);
    cylinder(0.86, 0.2, 2.02, polished, moving);
    mesh(new THREE.CircleGeometry(0.29, 6), dark, moving).position.z = 2.122;
    torus(0.98, 0.035, 0.79, polished, moving);
  } else if (family === 'roller') {
    // Spherical roller bearing: double-row barrel rollers in an open outer ring.
    lathe([[2.02, -0.8], [2.28, -0.8], [2.3, -0.73], [2.3, 0.73], [2.28, 0.8], [2.02, 0.8]], steel, shell);
    lathe([[2.02, 0.8], [2.04, 0.42], [2.01, -0.42], [2.02, -0.8]], dark, shell);
    torus(2.28, 0.02, 0.78, polished, shell);
    torus(2.28, 0.02, -0.78, polished, shell);
    lathe([[0.95, -0.8], [1.32, -0.8], [1.32, -0.72], [1.22, -0.5], [1.22, 0.5], [1.32, 0.72], [1.32, 0.8], [0.95, 0.8], [0.95, -0.8]], steel, moving);
    torus(0.97, 0.02, 0.78, polished, moving);
    torus(0.97, 0.02, -0.78, polished, moving);
    for (const z of [-0.34, 0.34]) torus(1.68, 0.045, z, bronze, cage);
    for (let row = 0; row < 2; row++) {
      const zCenter = row === 0 ? -0.34 : 0.34;
      const tilt = row === 0 ? -0.16 : 0.16;
      for (let i = 0; i < 13; i++) {
        const a = (i * Math.PI * 2) / 13 + (row * Math.PI) / 13;
        const mount = new THREE.Group();
        mount.position.set(Math.cos(a) * 1.66, Math.sin(a) * 1.66, zCenter);
        mount.quaternion.setFromAxisAngle(new THREE.Vector3(-Math.sin(a), Math.cos(a), 0), tilt);
        elements.add(mount);
        const spin = new THREE.Group();
        mount.add(spin);
        const points: number[][] = [[0, -0.27], [0.18, -0.27]];
        for (let j = 0; j <= 8; j++) {
          const z = -0.27 + (0.54 * j) / 8;
          points.push([0.22 + 0.04 * Math.sin((Math.PI * j) / 8), z]);
        }
        points.push([0.18, 0.27], [0, 0.27]);
        lathe(points, polished, spin);
      }
    }
  } else {
    // Deep groove ball bearing: polished deep tracks, pressed cage, steel balls.
    lathe([[1.74, -0.42], [2.22, -0.42], [2.24, -0.36], [2.24, 0.36], [2.22, 0.42], [1.74, 0.42]], steel, shell);
    torus(2.22, 0.015, 0.4, polished, shell);
    torus(2.22, 0.015, -0.4, polished, shell);
    lathe([[1.02, -0.42], [1.38, -0.42], [1.38, 0.42], [1.02, 0.42], [1.02, -0.42]], steel, moving);
    torus(1.04, 0.015, 0.4, polished, moving);
    torus(1.04, 0.015, -0.4, polished, moving);
    torus(1.56, 0.032, 0.16, bronze, cage);
    torus(1.56, 0.032, -0.16, bronze, cage);
    for (let i = 0; i < 9; i++) {
      const a = (i * Math.PI * 2) / 9;
      const ball = mesh(new THREE.SphereGeometry(0.24, 28, 20), polished, elements);
      ball.position.set(Math.cos(a) * 1.56, Math.sin(a) * 1.56, 0);
      const bridge = mesh(new THREE.BoxGeometry(0.26, 0.03, 0.32), bronze, cage);
      const bA = a + Math.PI / 9;
      bridge.position.set(Math.cos(bA) * 1.56, Math.sin(bA) * 1.56, 0);
      bridge.rotation.z = bA;
    }
  }

  // Refined edge grooves and laser-style markings
  if (family === 'ball' || family === 'roller') {
    const front = family === 'roller' ? 0.8 : 0.35;
    for (let i = 0; i < 6; i++) torus(2.035 + i * 0.035, 0.0015, front + 0.001, steel);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    ctx.translate(512, 512);
    ctx.fillStyle = '#27313d';
    ctx.font = '500 20px Arial';
    ctx.textAlign = 'center';
    const label = family === 'ball' ? 'POLAD CHARKHESH  •  BALL BEARINGS' : 'POLAD CHARKHESH  •  ROLLER BEARINGS';
    Array.from(label).forEach((c, i) => {
      ctx.save();
      ctx.rotate((i - (label.length - 1) / 2) * 0.028);
      ctx.fillText(c, 0, -469);
      ctx.restore();
    });
    const engraving = new THREE.CanvasTexture(canvas);
    engraving.colorSpace = THREE.SRGBColorSpace;
    textures.push(engraving);
    const ink = new THREE.MeshBasicMaterial({
      map: engraving,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    materials.push(ink);
    mesh(new THREE.PlaneGeometry(4.6, 4.6), ink).position.z = front + 0.002;
  }

  return {
    root,
    moving,
    cage,
    elements,
    parts: [shell, elements, cage, moving],
    setExploded(amount: number) {
      [shell, elements, cage, moving].forEach((part, i) => {
        part.position.z = (i - 1.5) * 2.7 * amount;
      });
    },
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      root.traverse((o) => {
        if (o instanceof THREE.Mesh) geometries.add(o.geometry);
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}

export interface HeroBearingSceneProps {
  family: BearingFamily;
  paused: boolean;
  label: string;
  fallback: React.ReactNode;
  product?: BearingProduct;
  rpm?: number;
  playback?: number;
  exploded?: boolean;
  reducedMotion?: boolean;
  partLabels?: string[];
}

export const HeroBearingScene: React.FC<HeroBearingSceneProps> = ({
  family,
  paused,
  label,
  fallback,
  product,
  rpm = 0,
  playback = 1,
  exploded = false,
  reducedMotion = false,
  partLabels = [],
}) => {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<{ play: (value: boolean) => void } | null>(null);
  const pauseRef = useRef(paused);
  pauseRef.current = paused;
  const speedRef = useRef({ rpm, playback });
  speedRef.current = { rpm, playback };
  const viewRef = useRef({ exploded, reducedMotion });
  viewRef.current = { exploded, reducedMotion };
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const target = host.current;
    if (!target || failed) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      setFailed(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    target.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
    camera.position.set(0, 0, 9.8);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.035);
    scene.environment = environment.texture;
    room.dispose();
    pmrem.dispose();

    const light = new THREE.DirectionalLight('#e4f1ff', 3);
    light.position.set(-3, 4, 5);
    scene.add(light);

    const edge = new THREE.DirectionalLight('#a9c8ff', 2);
    edge.position.set(4, -2, 1);
    scene.add(edge);

    const productModel = product ? buildProductBearing3D(product) : undefined;
    const heroModel = product ? undefined : buildBearing(family);
    const model = productModel || heroModel!;
    scene.add(model.root);

    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let running = false;
    let inView = true;
    let expansion = viewRef.current.exploded ? 1 : 0;
    let shaftAngle = 0;
    let cageAngle = 0;
    let spinAngle = 0;

    const draw = (now: number) => {
      const delta = previous ? (now - previous) / 1000 : 1 / 60;
      const seconds = previous && running ? delta : 0;
      previous = now;
      const targetExpansion = viewRef.current.exploded ? 1 : 0;
      expansion = viewRef.current.reducedMotion
        ? targetExpansion
        : THREE.MathUtils.damp(expansion, targetExpansion, 7, Math.min(delta, 0.05));
      if (Math.abs(expansion - targetExpansion) < 0.001) expansion = targetExpansion;
      elapsed += product ? seconds : Math.min(seconds, 0.05);

      if (productModel) {
        const { rpm: currentRpm, playback: rate } = speedRef.current;
        shaftAngle = advanceRotation(shaftAngle, currentRpm, seconds, rate);
        cageAngle = advanceRotation(cageAngle, currentRpm * productModel.geometry.cageRatio, seconds, rate);
        spinAngle = advanceRotation(spinAngle, currentRpm * productModel.geometry.spinRatio, seconds, rate);
        model.root.rotation.set(0.56, -0.4, -0.22);
        model.root.scale.setScalar(1 - expansion * 0.2);
        model.moving.rotation.z = (shaftAngle * Math.PI) / 180;
        model.cage.rotation.z = (cageAngle * Math.PI) / 180;
        productModel.elements.rotation.z = (cageAngle * Math.PI) / 180;
        productModel.setExploded(expansion);
        productModel.spins.forEach((spin) => {
          if (productModel.geometry.roller) spin.rotation.z = (-spinAngle * Math.PI) / 180;
          else spin.rotation.y = (-spinAngle * Math.PI) / 180;
        });
        target.dataset.shaftAngle = shaftAngle.toFixed(3);
        target.dataset.cageAngle = cageAngle.toFixed(3);
      } else {
        model.root.rotation.set(
          0.56 + Math.sin(elapsed * 0.35) * 0.055,
          -0.4 + Math.cos(elapsed * 0.25) * 0.07 - expansion * 0.62,
          -0.22
        );
        model.root.scale.setScalar(1 - expansion * 0.23);
        model.root.position.y = Math.sin(elapsed * 0.55) * 0.045;
        if (family === 'track') {
          heroModel!.parts[0].rotation.z = elapsed * 0.55;
          heroModel!.elements.rotation.z = elapsed * 0.4;
        } else if (family === 'engineered') {
          model.moving.rotation.z = elapsed * 0.55;
          heroModel!.elements.rotation.z = elapsed * 0.22;
        } else if (family === 'ball' || family === 'roller') {
          model.moving.rotation.z = elapsed * 0.65;
          model.cage.rotation.z = elapsed * 0.24;
          heroModel!.elements.rotation.z = elapsed * 0.24;
        }
        heroModel!.setExploded(expansion);
      }

      model.root.updateMatrixWorld(true);
      model.parts.forEach((part, i) => {
        const badge = target.querySelector<HTMLElement>(`[data-part="${i}"]`);
        if (!badge) return;
        const point = part.getWorldPosition(new THREE.Vector3()).project(camera);
        badge.style.left = `${(point.x * 0.5 + 0.5) * 100}%`;
        badge.style.top = `${(-point.y * 0.5 + 0.5) * 100}%`;
        badge.style.opacity = String(expansion > 0.9 ? 1 : 0);
      });
      target.dataset.expansion = expansion.toFixed(3);
      renderer.render(scene, camera);
      target.dataset.motionTime = elapsed.toFixed(3);
      if (running || (inView && !document.hidden && expansion !== targetExpansion)) {
        frame = requestAnimationFrame(draw);
      }
    };

    const resize = () => {
      const { width, height } = target.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.position.z = Math.max(
        9.8,
        (viewRef.current.exploded ? 4.15 : 2.65) / (Math.tan((17 * Math.PI) / 180) * camera.aspect),
        product ? 7.5 + (2.3 * product.B) / product.D : 0
      );
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (!running) {
        cancelAnimationFrame(frame);
        draw(performance.now());
      }
    };

    const sync = () => {
      running = !pauseRef.current && inView && !document.hidden && (!product || speedRef.current.rpm > 0);
      cancelAnimationFrame(frame);
      previous = 0;
      draw(performance.now());
    };

    const observer = new ResizeObserver(resize);
    observer.observe(target);
    resize();
    sync();

    const intersection = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.05 }
    );
    intersection.observe(target);

    document.addEventListener('visibilitychange', sync);
    controller.current = {
      play() {
        resize();
        sync();
      },
    };

    const lost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', lost);

    return () => {
      cancelAnimationFrame(frame);
      controller.current = null;
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', sync);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      model.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [family, failed, product]);

  useEffect(() => controller.current?.play(!paused), [paused, rpm, playback, exploded, reducedMotion]);

  return failed ? (
    <div className="hero-model-fallback">{fallback}</div>
  ) : (
    <div
      ref={host}
      className="hero-bearing-canvas"
      role="img"
      aria-label={label}
      data-family={family}
      data-product={product?.code}
      data-rpm={product ? rpm : undefined}
      data-playback={product ? playback : undefined}
    >
      {partLabels.map((name, i) => (
        <span key={i} className="bearing-part-pin" data-part={i} aria-hidden="true" title={name}>
          {i + 1}
        </span>
      ))}
    </div>
  );
};
export default HeroBearingScene;
