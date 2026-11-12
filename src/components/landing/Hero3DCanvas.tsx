import React, { useEffect, useRef, useState } from 'react';

interface TradeHub {
  name: string;
  lat: number;
  lng: number;
  region: string;
}

const TRADE_HUBS: TradeHub[] = [
  { name: 'Rotterdam', lat: 51.92, lng: 4.47, region: 'EU Gateway' },
  { name: 'Singapore', lat: 1.35, lng: 103.82, region: 'SE Asia Hub' },
  { name: 'Shanghai', lat: 31.23, lng: 121.47, region: 'East Asia' },
  { name: 'Los Angeles', lat: 33.74, lng: -118.27, region: 'Pacific Coast' },
  { name: 'Dubai', lat: 25.2, lng: 55.27, region: 'Middle East Hub' },
  { name: 'Hamburg', lat: 53.55, lng: 9.99, region: 'Central Europe' },
  { name: 'Tokyo', lat: 35.68, lng: 139.69, region: 'North Pacific' },
  { name: 'Santos', lat: -23.96, lng: -46.33, region: 'South America' },
];

const TRADE_ROUTES = [
  { from: 0, to: 1 }, // Rotterdam -> Singapore
  { from: 1, to: 2 }, // Singapore -> Shanghai
  { from: 2, to: 3 }, // Shanghai -> Los Angeles
  { from: 0, to: 4 }, // Rotterdam -> Dubai
  { from: 4, to: 1 }, // Dubai -> Singapore
  { from: 3, to: 7 }, // Los Angeles -> Santos
  { from: 0, to: 5 }, // Rotterdam -> Hamburg
  { from: 2, to: 6 }, // Shanghai -> Tokyo
];

export const Hero3DCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeHub, setActiveHub] = useState<TradeHub | null>(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ yaw: 0.6, pitch: 0.25 });
  const autoRotateSpeedRef = useRef(0.0035);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const handleResize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Convert lat/lng to 3D Cartesian coordinates on unit sphere
    const latLngToVector = (lat: number, lng: number) => {
      const phi = ((90 - lat) * Math.PI) / 180;
      const theta = ((lng + 180) * Math.PI) / 180;
      return {
        x: -(Math.sin(phi) * Math.cos(theta)),
        z: Math.sin(phi) * Math.sin(theta),
        y: Math.cos(phi),
      };
    };

    // Rotate 3D vector by yaw and pitch
    const rotateVector = (v: { x: number; y: number; z: number }, yaw: number, pitch: number) => {
      // Rotate around X (pitch)
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const y1 = v.y * cosP - v.z * sinP;
      const z1 = v.y * sinP + v.z * cosP;

      // Rotate around Y (yaw)
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const x2 = v.x * cosY + z1 * sinY;
      const z2 = -v.x * sinY + z1 * cosY;

      return { x: x2, y: y1, z: z2 };
    };

    // Generate latitude/longitude dot grid for globe
    const gridPoints: { lat: number; lng: number }[] = [];
    for (let lat = -70; lat <= 70; lat += 14) {
      const count = Math.max(8, Math.floor(28 * Math.cos((lat * Math.PI) / 180)));
      for (let i = 0; i < count; i++) {
        const lng = (i * 360) / count - 180;
        gridPoints.push({ lat, lng });
      }
    }

    const render = () => {
      t += 0.016;
      if (!isDraggingRef.current) {
        rotationRef.current.yaw += autoRotateSpeedRef.current;
      }

      const rect = canvas.parentElement?.getBoundingClientRect();
      const width = rect?.width || 500;
      const height = rect?.height || 500;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.42;

      ctx.clearRect(0, 0, width, height);

      // Deep atmospheric glow behind sphere
      const bgGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.2,
        centerX,
        centerY,
        radius * 1.3
      );
      bgGlow.addColorStop(0, 'rgba(215, 255, 67, 0.05)');
      bgGlow.addColorStop(0.5, 'rgba(17, 19, 21, 0.6)');
      bgGlow.addColorStop(1, 'rgba(8, 9, 10, 0)');
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      // Outer equatorial orbital ring
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY,
        radius * 1.22,
        radius * 0.38,
        -0.25,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Second inclined orbital track
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY,
        radius * 1.32,
        radius * 0.44,
        0.55,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = 'rgba(215, 255, 67, 0.07)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Sphere rim outline
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw grid points (latitude & longitude coordinate lattice)
      gridPoints.forEach((p) => {
        const vec = latLngToVector(p.lat, p.lng);
        const rot = rotateVector(vec, rotationRef.current.yaw, rotationRef.current.pitch);

        // Perspective projection
        const depth = rot.z; // -1 to 1
        const scale = 1 + depth * 0.2;
        const screenX = centerX + rot.x * radius * scale;
        const screenY = centerY - rot.y * radius * scale;

        // Render front-facing or subtle back-facing points
        if (depth > -0.2) {
          const alpha = Math.max(0.04, (depth + 0.2) * 0.35);
          ctx.beginPath();
          ctx.arc(screenX, screenY, depth > 0.4 ? 1.4 : 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(245, 245, 242, ${alpha})`;
          ctx.fill();
        }
      });

      // Hub 3D positions
      const hubProjected = TRADE_HUBS.map((hub) => {
        const vec = latLngToVector(hub.lat, hub.lng);
        const rot = rotateVector(vec, rotationRef.current.yaw, rotationRef.current.pitch);
        const depth = rot.z;
        const scale = 1 + depth * 0.2;
        return {
          ...hub,
          screenX: centerX + rot.x * radius * scale,
          screenY: centerY - rot.y * radius * scale,
          depth,
          rot,
        };
      });

      // Draw Trade Routes (arced spline simulation)
      TRADE_ROUTES.forEach((route, idx) => {
        const from = hubProjected[route.from];
        const to = hubProjected[route.to];

        // Draw if at least partially facing camera
        if (from.depth > -0.35 || to.depth > -0.35) {
          const avgDepth = (from.depth + to.depth) / 2;
          const alpha = Math.max(0.1, (avgDepth + 0.35) * 0.6);

          // Control point pulled outwards for arched curvature above sphere
          const midX = (from.screenX + to.screenX) / 2;
          const midY = (from.screenY + to.screenY) / 2;
          const dist = Math.hypot(to.screenX - from.screenX, to.screenY - from.screenY);
          const archHeight = Math.min(dist * 0.3, 40);

          // Vector pointing outward from center
          const dx = midX - centerX;
          const dy = midY - centerY;
          const len = Math.hypot(dx, dy) || 1;
          const ctrlX = midX + (dx / len) * archHeight;
          const ctrlY = midY + (dy / len) * archHeight;

          // Route line
          ctx.beginPath();
          ctx.moveTo(from.screenX, from.screenY);
          ctx.quadraticCurveTo(ctrlX, ctrlY, to.screenX, to.screenY);
          ctx.strokeStyle = `rgba(215, 255, 67, ${alpha * 0.6})`;
          ctx.lineWidth = 1.25;
          ctx.stroke();

          // Animated trade dispatch packet moving along arc
          const packetProgress = ((t * 0.4 + idx * 0.25) % 1);
          const invP = 1 - packetProgress;
          const px = invP * invP * from.screenX + 2 * invP * packetProgress * ctrlX + packetProgress * packetProgress * to.screenX;
          const py = invP * invP * from.screenY + 2 * invP * packetProgress * ctrlY + packetProgress * packetProgress * to.screenY;

          if (avgDepth > -0.15) {
            ctx.beginPath();
            ctx.arc(px, py, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = '#D7FF43';
            ctx.shadowColor = '#D7FF43';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      });

      // Draw Hub Nodes
      hubProjected.forEach((hub) => {
        if (hub.depth > -0.1) {
          const isFront = hub.depth > 0.2;
          const glowAlpha = Math.max(0.2, hub.depth);

          // Beacon ripple ring
          const pulse = (t * 2) % 2;
          ctx.beginPath();
          ctx.arc(hub.screenX, hub.screenY, 3.5 + pulse * 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(215, 255, 67, ${Math.max(0, (2 - pulse) * 0.25)})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Solid waypoint core
          ctx.beginPath();
          ctx.arc(hub.screenX, hub.screenY, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#D7FF43';
          ctx.fill();

          // White center specular
          ctx.beginPath();
          ctx.arc(hub.screenX, hub.screenY, 1, 0, Math.PI * 2);
          ctx.fillStyle = '#08090A';
          ctx.fill();

          // Label for dominant front-facing hubs
          if (isFront) {
            ctx.font = '10px "Space Grotesk", monospace';
            ctx.fillStyle = `rgba(245, 245, 242, ${glowAlpha * 0.9})`;
            ctx.textAlign = 'left';
            ctx.fillText(hub.name, hub.screenX + 8, hub.screenY + 3);

            // Region micro-tag
            ctx.font = '8px system-ui, sans-serif';
            ctx.fillStyle = `rgba(153, 157, 155, ${glowAlpha * 0.7})`;
            ctx.fillText(hub.region, hub.screenX + 8, hub.screenY + 13);
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Mouse drag handlers for interactive exploration
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    rotationRef.current.yaw += deltaX * 0.006;
    rotationRef.current.pitch = Math.max(
      -1,
      Math.min(1, rotationRef.current.pitch + deltaY * 0.006)
    );
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      className="relative w-full h-[380px] sm:h-[460px] lg:h-[560px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating coordination telemetry telemetry card (restrained, anti-slop) */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 p-3.5 bg-[#171A1C]/90 backdrop-blur-md border border-white/10 rounded-xl text-xs max-w-[220px] pointer-events-none shadow-2xl">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-[#D7FF43]" />
          <span className="font-mono text-[11px] text-[#F5F5F2] tracking-wider uppercase">
            Global Trade Grid
          </span>
        </div>
        <p className="text-[11px] text-[#999D9B] leading-relaxed">
          Interactive coordinate projection. Drag to rotate trade corridors and live waypoints.
        </p>
      </div>

      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex flex-col items-end gap-1 pointer-events-none">
        <span className="font-mono text-[10px] text-[#999D9B] tracking-widest uppercase">
          Orchestration Layer
        </span>
        <span className="font-mono text-xs text-[#D7FF43]">
          ACTIVE · MULTI-HUB
        </span>
      </div>
    </div>
  );
};
