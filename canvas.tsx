import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipTitleRef = useRef<HTMLHeadingElement>(null);
  const tooltipDescRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // SCENE SETUP
    const scene = new THREE.Scene();
    const bgColor = new THREE.Color('#F8F8F8');
    scene.fog = new THREE.Fog(bgColor, 1200, 2400);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 200;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const panels: THREE.Mesh[] = [];
    const panelCount = 18;

    const geometries = [
      new THREE.PlaneGeometry(90, 130),
      new THREE.PlaneGeometry(130, 90),
      new THREE.PlaneGeometry(110, 110)
    ];

    const materialTemplate = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib['fog'],
        {
          uColor: { value: new THREE.Color(0x999999) },
          uOpacity: { value: 1.0 },
          uBlur: { value: 0.0 }
        }
      ]),
      vertexShader: `
        varying vec2 vUv;
        #include <fog_pars_vertex>
        void main() {
            vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uBlur;
        varying vec2 vUv;
        
        #include <fog_pars_fragment>

        float roundedBoxSDF(vec2 p, vec2 b, float r) {
            vec2 q = abs(p) - b + r;
            return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
        }

        void main() {
            float margin = uBlur * 2.5; 
            vec2 p = (vUv - 0.5) * (1.0 + margin);
            
            float dist = roundedBoxSDF(p, vec2(0.45), 0.06); 
            
            float edge0 = -max(uBlur, 0.001);
            float edge1 = max(uBlur, 0.001);
            float alpha = 1.0 - smoothstep(edge0, edge1, dist);
            
            gl_FragColor = vec4(uColor, alpha * uOpacity);
            
            #include <fog_fragment>
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: true
    });

    const projectData = [
      { title: "Arkay | Little Plains", desc: "Evolved the brand and digital experience for a legacy premium packaging manufacturer." },
      { title: "Museum Layout / 2", desc: "A contemporary spatial design approach defining a new era of interactive arts." },
      { title: "Vanguard Architecture", desc: "Structural architecture meeting minimal, cinematic motion physics." }
    ];

    let spawnIndex = 0;
    const vFOV = THREE.MathUtils.degToRad(camera.fov);

    function generateValidCoordinates() {
      const referenceDist = 600;
      const visibleHeight = 2 * Math.tan(vFOV / 2) * referenceDist;
      const visibleWidth = visibleHeight * camera.aspect;

      const safeH = (1000 / window.innerHeight) * visibleHeight;
      const safeW = (1000 / window.innerWidth) * visibleWidth;

      const halfSafeW = (safeW / 2) + 40;
      const halfSafeH = (safeH / 2) + 40;

      const maxW = (visibleWidth * 1.4) / 2;
      const maxH = (visibleHeight * 1.4) / 2;

      let nx = 0, ny = 0;
      const side = spawnIndex % 4;
      spawnIndex++;

      if (side === 0) {
        nx = (Math.random() - 0.5) * maxW * 2;
        ny = halfSafeH + Math.random() * Math.max(20, maxH - halfSafeH);
      } else if (side === 1) {
        nx = halfSafeW + Math.random() * Math.max(20, maxW - halfSafeW);
        ny = (Math.random() - 0.5) * maxH * 2;
      } else if (side === 2) {
        nx = (Math.random() - 0.5) * maxW * 2;
        ny = -halfSafeH - Math.random() * Math.max(20, maxH - halfSafeH);
      } else {
        nx = -halfSafeW - Math.random() * Math.max(20, maxW - halfSafeW);
        ny = (Math.random() - 0.5) * maxH * 2;
      }

      return { x: nx, y: ny };
    }

    for (let i = 0; i < panelCount; i++) {
      const geom = geometries[Math.floor(Math.random() * geometries.length)];
      const mat = materialTemplate.clone();
      mat.uniforms = THREE.UniformsUtils.clone(materialTemplate.uniforms);

      const mesh = new THREE.Mesh(geom, mat);
      const z = -(i / panelCount) * 1600;
      const coords = generateValidCoordinates();

      mesh.position.set(coords.x, coords.y, z);

      const data = projectData[i % projectData.length];
      mesh.userData = {
        baseZ: z,
        baseX: coords.x,
        baseY: coords.y,
        title: data.title,
        desc: data.desc
      };

      scene.add(mesh);
      panels.push(mesh);
    }

    // Scroll Physics
    let targetScroll = 0;
    let currentScroll = 0;
    const scrollDamping = 0.05;

    const onWheel = (e: WheelEvent) => {
      targetScroll += e.deltaY * 0.5;
    };
    window.addEventListener('wheel', onWheel, { passive: true });

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      targetScroll += (touchStartY - touchY) * 1.5;
      touchStartY = touchY;
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    // Cursor Tracking & Parallax
    let mouseX = 0, mouseY = 0;
    let rawMouseX = -1000, rawMouseY = -1000;
    let targetCameraX = 0, targetCameraY = 0;

    const onMouseMove = (e: MouseEvent) => {
      rawMouseX = e.clientX;
      rawMouseY = e.clientY;
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    const tempV = new THREE.Vector3();
    const tooltipEl = tooltipRef.current;
    const tooltipTitleEl = tooltipTitleRef.current;
    const tooltipDescEl = tooltipDescRef.current;

    let animationFrameId: number;

    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      currentScroll += (targetScroll - currentScroll) * scrollDamping;

      targetCameraX = mouseX * 40;
      targetCameraY = mouseY * 40;
      camera.position.x += (targetCameraX - camera.position.x) * 0.05;
      camera.position.y += (targetCameraY - camera.position.y) * 0.05;

      panels.forEach(mesh => {
        let zPos = mesh.userData.baseZ + currentScroll;
        let recycled = false;

        if (zPos > camera.position.z + 100) {
          mesh.userData.baseZ -= 1600;
          recycled = true;
        } else if (zPos < camera.position.z - 1700) {
          mesh.userData.baseZ += 1600;
          recycled = true;
        }

        if (recycled) {
          const newCoords = generateValidCoordinates();
          mesh.userData.baseX = newCoords.x;
          mesh.userData.baseY = newCoords.y;
        }

        zPos = mesh.userData.baseZ + currentScroll;
        mesh.position.set(mesh.userData.baseX, mesh.userData.baseY, zPos);
        const dist = camera.position.z - zPos;

        // Forcefield
        tempV.copy(mesh.position);
        tempV.project(camera);

        const absX = Math.abs(tempV.x);
        const absY = Math.abs(tempV.y);

        const safeW_NDC = 1000 / window.innerWidth;
        const safeH_NDC = 1000 / window.innerHeight;

        const bufferNDC = 0.08;
        const fadeEdge = 0.08;
        let safeMultiplier = 1.0;

        if (absX < (safeW_NDC / 2 + bufferNDC + fadeEdge) && absY < (safeH_NDC / 2 + bufferNDC + fadeEdge)) {
          const factorX = Math.max(0, Math.min(1, (absX - (safeW_NDC / 2 + bufferNDC)) / fadeEdge));
          const factorY = Math.max(0, Math.min(1, (absY - (safeH_NDC / 2 + bufferNDC)) / fadeEdge));
          safeMultiplier = Math.max(factorX, factorY);
        }

        let baseOpacity = 1.0;
        let targetBlur = 0.0;

        if (dist > 1200) {
          const t = Math.min(1, (dist - 1200) / 800);
          targetBlur = t * 0.40;
        } else if (dist > 50) {
          targetBlur = 0.0;
        } else {
          const exitT = Math.min(1, (50 - dist) / 150);
          mesh.scale.setScalar(1.0 + exitT * 0.3);
          baseOpacity = Math.max(0, 1.0 - exitT);
          targetBlur = 0.0;
        }

        const shaderMat = mesh.material as THREE.ShaderMaterial;
        shaderMat.uniforms.uOpacity.value = baseOpacity * safeMultiplier;
        shaderMat.uniforms.uBlur.value = targetBlur;
        mesh.visible = shaderMat.uniforms.uOpacity.value > 0.01;
      });

      // Raycasting
      pointer.x = mouseX;
      pointer.y = mouseY;
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(panels);

      let hoveredObject: THREE.Object3D | null = null;

      for (let i = 0; i < intersects.length; i++) {
        const object = intersects[i].object;
        const dist = camera.position.z - object.position.z;

        if (dist <= 1200 && dist > 50 && object.visible) {
          hoveredObject = object;
          break;
        }
      }

      if (hoveredObject && tooltipEl && tooltipTitleEl && tooltipDescEl) {
        document.body.style.cursor = 'pointer';
        tooltipEl.style.opacity = '1';

        let tx = rawMouseX + 15;
        let ty = rawMouseY + 15;

        if (tx + 300 > window.innerWidth) tx = rawMouseX - 300;
        if (ty + 100 > window.innerHeight) ty = rawMouseY - 120;

        tooltipEl.style.transform = `translate(${tx}px, ${ty}px)`;
        tooltipTitleEl.innerText = hoveredObject.userData.title || '';
        tooltipDescEl.innerText = hoveredObject.userData.desc || '';
      } else if (tooltipEl) {
        document.body.style.cursor = 'auto';
        tooltipEl.style.opacity = '0';
      }

      renderer.render(scene, camera);
    }

    animate();

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);

      document.body.style.cursor = 'auto';

      // Dispose of Three.js objects to prevent memory leaks
      geometries.forEach(geo => geo.dispose());
      materialTemplate.dispose();
      panels.forEach(mesh => {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <>
      <div ref={containerRef} id="webgl-container" />
      <div className="grain-overlay" />
      <div className="instructions">Scroll / Swipe to Traverse Depth</div>
      <div ref={tooltipRef} id="hover-tooltip">
        <h3 ref={tooltipTitleRef} id="tooltip-title">Arkay | Little Plains</h3>
        <p ref={tooltipDescRef} id="tooltip-desc">Evolved the brand and digital experience for a legacy premium packaging manufacturer.</p>
      </div>
    </>
  );
}
