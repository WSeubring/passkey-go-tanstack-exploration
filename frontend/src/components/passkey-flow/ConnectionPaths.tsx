import { useId, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import type { EntityType } from "./flowData";

type Position = { x: number; y: number };

type ConnectionPathsProps = {
  connection?: {
    from: EntityType;
    to: EntityType;
    label: string;
  };
  positions: Record<EntityType, Position>;
  stepId: number;
};

function computePath(from: Position, to: Position): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Guard against near-zero distance (positions not yet measured)
  if (dist < 1) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }

  // Control point offset for curve
  const cx = (from.x + to.x) / 2;
  const cy = (from.y + to.y) / 2;

  // Perpendicular offset for curvature
  const offsetMag = dist * 0.2;
  const nx = -dy / dist;
  const ny = dx / dist;

  const cpx = cx + nx * offsetMag;
  const cpy = cy + ny * offsetMag;

  return `M ${from.x} ${from.y} Q ${cpx} ${cpy} ${to.x} ${to.y}`;
}

// Neutral stroke for the path (--primary)
const strokeColor = "hsl(222.2, 47.4%, 11.2%)";
// Subtle accent for the traveling particle
const accentColor = "hsl(221.2, 83.2%, 53.3%)";

function AnimatedPath({
  connection,
  positions,
  stepId,
  markerId,
}: {
  connection: { from: EntityType; to: EntityType; label: string };
  positions: Record<EntityType, Position>;
  stepId: number;
  markerId: string;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const progress = useMotionValue(0);

  const from = positions[connection.from];
  const to = positions[connection.to];
  const pathD = computePath(from, to);

  // Single animation source driving both path drawing and particle
  useEffect(() => {
    progress.set(0);
    const controls = animate(progress, 1, {
      duration: 1.2,
      ease: "easeInOut",
    });
    return () => controls.stop();
  }, [stepId, progress]);

  // Drive pathLength from the same progress motion value
  const pathLength = useTransform(progress, [0, 1], [0, 1]);
  const pathOpacity = useTransform(progress, [0, 0.05], [0.8, 1]);

  // Particle position along path
  const particleX = useTransform(progress, (v) => {
    if (!pathRef.current) return from.x;
    const len = pathRef.current.getTotalLength();
    const point = pathRef.current.getPointAtLength(v * len);
    return point.x;
  });

  const particleY = useTransform(progress, (v) => {
    if (!pathRef.current) return from.y;
    const len = pathRef.current.getTotalLength();
    const point = pathRef.current.getPointAtLength(v * len);
    return point.y;
  });

  // Label position at midpoint
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  // Offset label away from path
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dist < 1 ? 0 : -dy / dist;
  const ny = dist < 1 ? 0 : dx / dist;
  const labelOffsetX = midX + nx * 30;
  const labelOffsetY = midY + ny * 30;

  return (
    <motion.g
      key={`connection-${stepId}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background path (faint) */}
      <path
        d={pathD}
        stroke="hsl(214.3, 31.8%, 91.4%)"
        strokeWidth={1}
        fill="none"
      />

      {/* Animated drawn path */}
      <motion.path
        ref={pathRef}
        d={pathD}
        stroke={strokeColor}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        markerEnd={`url(#${markerId})`}
        style={{ pathLength, opacity: pathOpacity }}
      />

      {/* Traveling particle */}
      <motion.circle
        cx={particleX}
        cy={particleY}
        r={3.5}
        fill={accentColor}
        opacity={0.8}
      />

      {/* Floating label */}
      <motion.foreignObject
        x={labelOffsetX - 90}
        y={labelOffsetY - 18}
        width={180}
        height={36}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <div className="flex items-center justify-center">
          <span className="whitespace-nowrap rounded-full border border-border bg-card px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:text-xs">
            {connection.label}
          </span>
        </div>
      </motion.foreignObject>
    </motion.g>
  );
}

export function ConnectionPaths({
  connection,
  positions,
  stepId,
}: ConnectionPathsProps) {
  const filterId = useId();
  const markerId = `arrow-${filterId.replace(/:/g, "")}`;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ zIndex: 1 }}
    >
      <defs>
        {/* Single arrowhead marker */}
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth={6}
          markerHeight={6}
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColor} />
        </marker>
      </defs>
      <AnimatePresence mode="wait">
        {connection && (
          <AnimatedPath
            key={`path-${stepId}-${connection.from}-${connection.to}`}
            connection={connection}
            positions={positions}
            stepId={stepId}
            markerId={markerId}
          />
        )}
      </AnimatePresence>
    </svg>
  );
}
