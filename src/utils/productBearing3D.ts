import * as THREE from 'three';
import { BearingProduct } from '../types';
import { bearingGeometry } from './bearingMotion';

// All external dimensions use one uniform scale. Internal profiles are estimates.
export function buildProductBearing3D(p: BearingProduct) {
  const g = bearingGeometry(p);
  const scale = 2.3 / g.outer;
  const R = 2.3;
  const bore = g.bore * scale;
  const half = (R * p.B) / p.D;
  const gap = R - bore;
  const pitch = g.pitch * scale;
  const radius = (g.elementDiameter * scale) / 2;

  const root = new THREE.Group();
  const shell = new THREE.Group();
  const moving = new THREE.Group();
  const cage = new THREE.Group();
  const elements = new THREE.Group();
  const spins: THREE.Group[] = [];

  root.add(shell, elements, cage, moving);
  shell.name = 'outer-ring';
  elements.name = 'rolling-elements';
  moving.name = 'inner-ring';
  cage.name = 'cage';

  const steel = new THREE.MeshStandardMaterial({ color: '#bcc5d0', metalness: 1, roughness: 0.22 });
  const polished = new THREE.MeshStandardMaterial({ color: '#e2e6ed', metalness: 1, roughness: 0.13 });
  const bronze = new THREE.MeshStandardMaterial({ color: '#b78b45', metalness: 0.85, roughness: 0.3 });
  const dark = new THREE.MeshStandardMaterial({ color: '#293744', metalness: 0.65, roughness: 0.33 });
  const materials = [steel, polished, bronze, dark];

  const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material, group: THREE.Group = shell) => {
    const m = new THREE.Mesh(geometry, material);
    group.add(m);
    return m;
  };

  const lathe = (points: number[][], material: THREE.Material, group: THREE.Group = shell) => {
    const geometry = new THREE.LatheGeometry(
      points.map(([r, z]) => new THREE.Vector2(r, z)),
      128
    );
    geometry.rotateX(Math.PI / 2);
    return mesh(geometry, material, group);
  };

  const torus = (r: number, tube: number, z: number, material: THREE.Material, group: THREE.Group = shell) => {
    const m = mesh(new THREE.TorusGeometry(r, tube, 8, 128), material, group);
    m.position.z = z;
    return m;
  };

  const b = Math.min(0.035, gap * 0.055, half * 0.12);
  const trackOuter = pitch + radius * 0.72;
  const trackInner = pitch - radius * 0.72;
  const angular = p.schematicType === 'angular-contact';
  const outerFront = angular ? pitch + radius * 1.04 : trackOuter;

  // Raceway relief is cut into the inner wall of the fixed outer ring.
  const outerProfile: number[][] = [
    [R - b, -half],
    [R, -half + b],
    [R, half - b],
    [R - b, half],
    [outerFront + b, half],
    [outerFront, half - b],
  ];
  const innerProfile: number[][] = [
    [bore + b, -half],
    [bore, -half + b],
    [bore, half - b],
    [bore + b, half],
    [trackInner - b, half],
    [trackInner, half - b],
  ];

  const rowZ = Array.from({ length: g.rows }, (_, i) => (g.rows === 2 ? (i - 0.5) * half : 0));

  for (let i = 40; i >= 0; i--) {
    const z = -half + b + ((2 * half - 2 * b) * i) / 40;
    const nearest = Math.min(...rowZ.map((center) => Math.abs(z - center)));
    const relief = g.roller
      ? nearest < half / (g.rows === 2 ? 2.8 : 1.25)
        ? radius * 0.28
        : 0
      : Math.sqrt(Math.max(0, radius ** 2 - nearest ** 2)) * 0.3;
    outerProfile.push([Math.max(trackOuter + relief, angular && z > 0 ? outerFront : 0), z]);
    innerProfile.push([trackInner - relief, z]);
  }

  outerProfile.push([trackOuter, -half + b], [trackOuter + b, -half], [R - b, -half]);
  innerProfile.push([trackInner, -half + b], [trackInner - b, -half], [bore + b, -half]);

  const outer = lathe(outerProfile, steel);
  outer.name = 'outer-ring';

  // Reverse inner-ring contour
  lathe([...innerProfile].reverse(), steel, moving);
  torus(R - b, 0.008, half - 0.005, polished);
  torus(bore + b, 0.008, half - 0.005, polished, moving);

  for (let i = 1; i < 5; i++) {
    torus(outerFront + ((R - outerFront) * i) / 5, 0.0013, half + 0.001, steel);
  }

  const marker = mesh(new THREE.BoxGeometry(Math.max(0.015, trackInner - bore - 0.05), 0.012, 0.002), dark, moving);
  marker.position.set((bore + trackInner) / 2, 0, half + 0.002);

  const tapered = p.schematicType === 'tapered';
  const barrel = ['spherical', 'carb'].includes(p.schematicType || '');
  const rollerHalf = half * (g.rows === 2 ? 0.37 : 0.77);

  for (let row = 0; row < g.rows; row++) {
    const centerZ = rowZ[row];
    const front = centerZ + (g.roller ? rollerHalf * 0.91 : radius * 0.25);
    torus(pitch - radius * 0.86, 0.022, front, bronze, cage);
    torus(pitch + radius * 0.86, 0.022, front, bronze, cage);

    for (let i = 0; i < g.count; i++) {
      const a = (i * Math.PI * 2) / g.count + (row * Math.PI) / g.count;
      const mount = new THREE.Group();
      mount.position.set(Math.cos(a) * pitch, Math.sin(a) * pitch, centerZ);
      elements.add(mount);

      if (tapered || barrel) {
        const tilt = tapered ? 0.09 : g.rows === 2 ? (row === 0 ? -0.1 : 0.1) : 0;
        mount.quaternion.setFromAxisAngle(new THREE.Vector3(-Math.sin(a), Math.cos(a), 0), tilt);
      }

      const spin = new THREE.Group();
      mount.add(spin);
      spins.push(spin);

      if (g.roller) {
        const points: number[][] = [
          [0, -rollerHalf],
          [radius * 0.88, -rollerHalf],
        ];
        for (let j = 0; j <= 12; j++) {
          const z = -rollerHalf + 0.012 + ((2 * rollerHalf - 0.024) * j) / 12;
          const profile = tapered ? 0.8 + (0.2 * j) / 12 : barrel ? 0.88 + 0.12 * Math.sin((Math.PI * j) / 12) : 1;
          points.push([radius * profile, z]);
        }
        points.push([radius * 0.9, rollerHalf], [0, rollerHalf]);
        lathe(points, polished, spin);

        const cap = mesh(new THREE.CircleGeometry(radius * 0.84, 32), steel, spin);
        cap.position.z = rollerHalf + 0.001;

        const mark = mesh(new THREE.CircleGeometry(0.012, 12), dark, spin);
        mark.position.set(radius * 0.4, 0, rollerHalf + 0.002);
      } else {
        mesh(new THREE.SphereGeometry(radius, 32, 24), polished, spin);
      }

      const between = a + Math.PI / g.count;
      const bridge = mesh(
        new THREE.BoxGeometry(radius * 1.8, 0.045, g.roller ? rollerHalf * 1.9 : radius * 0.36),
        bronze,
        cage
      );
      bridge.position.set(Math.cos(between) * pitch, Math.sin(between) * pitch, centerZ);
      bridge.rotation.z = between;
    }
  }

  const parts = [shell, elements, cage, moving];
  return {
    root,
    moving,
    cage,
    elements,
    parts,
    spins,
    geometry: g,
    setExploded(amount: number) {
      const spacing = Math.max(0.85, Math.min(1.6, half * 1.3 + 0.6));
      parts.forEach((part, i) => {
        part.position.z = (i - 1.5) * spacing * amount;
      });
    },
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      root.traverse((o) => {
        if (o instanceof THREE.Mesh) geometries.add(o.geometry);
      });
      geometries.forEach((v) => v.dispose());
      materials.forEach((v) => v.dispose());
    },
  };
}
