import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowUp, FingerprintPattern, Handshake, Laptop, Layers, Mic, PencilRuler, Diamond, Astroid, SquircleDashed, SunMedium } from 'lucide-react';
import { motion } from 'framer-motion';

import art01 from './assets/artifacts/01.png';
import art02 from './assets/artifacts/02.png';
import art03 from './assets/artifacts/03.png';
import art04 from './assets/artifacts/04.png';
import art05 from './assets/artifacts/05.png';
import art06 from './assets/artifacts/06.png';
import art07 from './assets/artifacts/07.png';
import art08 from './assets/artifacts/08.png';
import art09 from './assets/artifacts/09.png';
import art10 from './assets/artifacts/10.png';
import art11 from './assets/artifacts/11.png';
import art12 from './assets/artifacts/12.png';
import art13 from './assets/artifacts/13.png';
import art14 from './assets/artifacts/14.png';
import art15 from './assets/artifacts/15.png';
import art16 from './assets/artifacts/16.png';
import art17 from './assets/artifacts/17.png';
import littlePlainsLogo from './assets/Little-plains.png';
import agentIcon from './assets/agent-icon.png';


function useResizeObserver() {
  const [height, setHeight] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback((node: HTMLElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (node) {
      observerRef.current = new ResizeObserver((entries) => {
        if (entries && entries[0]) {
          const entry = entries[0];
          if (entry.borderBoxSize && entry.borderBoxSize[0]) {
            setHeight(entry.borderBoxSize[0].blockSize);
          } else {
            setHeight(entry.target.getBoundingClientRect().height);
          }
        }
      });
      observerRef.current.observe(node);
    }
  }, []);

  return [ref, height] as const;
}

export default function Canvas() {
  const [inputValue, setInputValue] = useState('');
  const [contentRef, contentHeight] = useResizeObserver();
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
      new THREE.PlaneGeometry(135, 195),
      new THREE.PlaneGeometry(195, 135),
      new THREE.PlaneGeometry(165, 165)
    ];

    const materialTemplate = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib['fog'],
        {
          uTexture: { value: null as THREE.Texture | null },
          uColor: { value: new THREE.Color(0xffffff) },
          uOpacity: { value: 1.0 },
          uBlur: { value: 0.0 },
          uPlaneAspect: { value: 1.0 },
          uTextureAspect: { value: 1.0 }
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
        uniform sampler2D uTexture;
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uBlur;
        uniform float uPlaneAspect;
        uniform float uTextureAspect;
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
            
            // Calculate cover UVs
            vec2 uvCover = vUv;
            float s = uPlaneAspect / uTextureAspect;
            if (s > 1.0) {
                uvCover.y = (vUv.y - 0.5) / s + 0.5;
            } else {
                uvCover.x = (vUv.x - 0.5) * s + 0.5;
            }
            
            vec4 texColor = texture2D(uTexture, uvCover);
            gl_FragColor = vec4(texColor.rgb * uColor, texColor.a * alpha * uOpacity);
            
            #include <fog_fragment>
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: true
    });

    // Static aspect ratios of the 17 PNG images to avoid runtime loading issues
    const IMAGE_ASPECT_RATIOS = [
      0.7803837953091685, // 01.png
      0.7803837953091685, // 02.png
      0.7803837953091685, // 03.png
      0.9682539682539683, // 04.png
      1.3309090909090909, // 05.png
      0.7803837953091685, // 06.png
      0.7803837953091685, // 07.png
      1.3309090909090909, // 08.png
      0.9682539682539683, // 09.png
      0.7803837953091685, // 10.png
      0.7803837953091685, // 11.png
      0.6802973977695167, // 12.png
      0.8672985781990521, // 13.png
      0.811529933481153,  // 14.png
      0.8571428571428571, // 15.png
      1.2240802675585284, // 16.png
      0.782051282051282   // 17.png
    ];

    // Texture Loader and Image Loading
    const artifactImages = [
      art01, art02, art03, art04, art05, art06, art07, art08, art09, art10,
      art11, art12, art13, art14, art15, art16, art17
    ];
    const textureLoader = new THREE.TextureLoader();
    const textures = artifactImages.map((src) => {
      const tex = textureLoader.load(src);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
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

      const textureIndex = i % textures.length;
      const texture = textures[textureIndex];
      mat.uniforms.uTexture.value = texture;
      mat.uniforms.uTextureAspect.value = IMAGE_ASPECT_RATIOS[textureIndex];

      // Calculate plane aspect ratio
      const width = (geom as THREE.PlaneGeometry).parameters.width;
      const height = (geom as THREE.PlaneGeometry).parameters.height;
      mat.uniforms.uPlaneAspect.value = width / height;

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
          mesh.scale.setScalar(1.0);
        } else if (dist > 50) {
          targetBlur = 0.0;
          mesh.scale.setScalar(1.0);
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

      <div ref={tooltipRef} id="hover-tooltip">
        <h3 ref={tooltipTitleRef} id="tooltip-title">Arkay | Little Plains</h3>
        <p ref={tooltipDescRef} id="tooltip-desc">Evolved the brand and digital experience for a legacy premium packaging manufacturer.</p>
      </div>
      <header className="fixed top-0 left-0 z-40 flex items-center justify-center w-screen p-6">
        <nav className="w-full flex items-center justify-between">
          <img src={littlePlainsLogo} className="w-auto h-[30px]" />
          <div className="flex items-center gap-2">
            <p className="text-[#718394] font-medium text-xs" > NYC 10:05 AM </p>
            <div className="flex items-center gap-0.5">
              <SunMedium size={16} strokeWidth={2} className="text-[#718394]" />
              <p className="text-[#718394] font-medium text-xs" > 84°F </p>
            </div>
          </div>

        </nav>
      </header>

      {/* Fixed, screen-centered 1000x1000 div ready for custom styling */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] z-30 flex flex-col gap-7 items-center justify-center">
        {/* Content goes here */}
        <div className="w-[582px] flex flex-col gap-7 items-center relative">
          <h1 className="text-3xl text-foreground text-center leading-[120%]">
            Hi, we're Little Planes <br /> <span className="font-regular text-[#888888]">A New York-based agency</span>
          </h1>

          {/* input field */}
          <div
            className="w-[566px] h-auto py-2.5 pl-4 pr-3 bg-background/84 backdrop-blur-xl flex items-center gap-2.5 rounded-2xl focus-gradient-border relative z-20"
          >
            <img src={agentIcon} />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-[#888888]"
              placeholder="I want to..."
            />
            <Button
              variant={inputValue.trim().length > 0 ? "default" : "ghost"}
              size="icon"
              className="rounded-xl transition-all duration-300"
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <span className={`absolute transition-all duration-150 transform ${inputValue.trim().length > 0 ? 'scale-90 blur-[2px] opacity-0 pointer-events-none' : 'scale-100 blur-0 opacity-100'}`}>
                  <Mic className="w-5 h-5" />
                </span>
                <span className={`absolute transition-all duration-150 transform ${inputValue.trim().length === 0 ? 'scale-90 blur-[2px] opacity-0 pointer-events-none' : 'scale-100 blur-0 opacity-100'}`}>
                  <ArrowUp className="w-5 h-5" />
                </span>
              </div>
            </Button>
          </div>

          {/* suggested list */}
          <motion.div
            className="bg-background/70 backdrop-blur-2xl rounded-4xl p-2 w-[584px] absolute top-23 z-10 suggested-list overflow-hidden"
            animate={{
              height: inputValue.trim().length > 0 ? 82 : (contentHeight > 0 ? contentHeight + 16 : 'auto')
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30
            }}
          >
            {inputValue.trim().length === 0 && (
              <div ref={contentRef} className="pt-[72px] flex flex-col gap-0.5">
                <div className="py-2 px-3">
                  <p className="text-sm text-[#888888]"> Suggestions:</p>
                </div>
                <div className="flex items-center justify-start gap-2 py-2 px-3 hover:bg-[#ebebeb] rounded-3xl cursor-pointer">
                  <Diamond size={16} strokeWidth={2} color="#888888" />
                  <p className="text-sm text-foreground">View healthcare projects</p>
                </div>
                <div className="flex items-center justify-start gap-2 py-2 px-3 hover:bg-[#ebebeb] rounded-3xl cursor-pointer">
                  <Astroid size={16} strokeWidth={2} color="#888888" />
                  <p className="text-sm text-foreground">Know your approach to AI-native brands</p>
                </div>
                <div className="flex items-center justify-start gap-2 py-2 px-3 hover:bg-[#ebebeb] rounded-3xl cursor-pointer">
                  <SquircleDashed size={16} strokeWidth={2} color="#888888" />
                  <p className="text-sm text-foreground">View healthcare projects</p>
                </div>
                <div className="flex items-center justify-start gap-2 py-2 px-3 hover:bg-[#ebebeb] rounded-3xl cursor-pointer">
                  <Diamond size={16} strokeWidth={2} color="#888888" />
                  <p className="text-sm text-foreground">Read: The Art of Digital Empathy</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* bottom chips */}
          <div className="flex items-center gap-2 flex-wrap justify-center w-full relative z-0">
            <Chip icon={Layers} label="Browse current exhibitions" />
            <Chip icon={FingerprintPattern} label="Inspect the founder blueprint" />
            <Chip icon={Handshake} label="View client ecosystem" />
            <Chip icon={Laptop} label="View open positions" />
            <Chip icon={PencilRuler} label="View our capabilities" />
          </div>

        </div>
      </div>
    </>
  );
}
