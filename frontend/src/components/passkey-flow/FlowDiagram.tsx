import { useRef, useState, useEffect, useCallback } from "react";
import { EntityNode } from "./EntityNode";
import { ConnectionPaths } from "./ConnectionPaths";
import type { FlowStep, EntityType } from "./flowData";

type Position = { x: number; y: number };

type FlowDiagramProps = {
  step: FlowStep;
};

export function FlowDiagram({ step }: FlowDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const browserRef = useRef<HTMLDivElement>(null);
  const serverRef = useRef<HTMLDivElement>(null);
  const authenticatorRef = useRef<HTMLDivElement>(null);

  const [positions, setPositions] = useState<Record<EntityType, Position>>({
    browser: { x: 0, y: 0 },
    server: { x: 0, y: 0 },
    authenticator: { x: 0, y: 0 },
  });
  const [measured, setMeasured] = useState(false);

  const measurePositions = useCallback(() => {
    if (
      !containerRef.current ||
      !browserRef.current ||
      !serverRef.current ||
      !authenticatorRef.current
    )
      return;

    const containerRect = containerRef.current.getBoundingClientRect();

    const getCenter = (el: HTMLElement): Position => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2,
      };
    };

    setPositions({
      browser: getCenter(browserRef.current),
      server: getCenter(serverRef.current),
      authenticator: getCenter(authenticatorRef.current),
    });
    setMeasured(true);
  }, []);

  useEffect(() => {
    measurePositions();

    const observer = new ResizeObserver(() => {
      measurePositions();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [measurePositions]);

  // Remeasure on step change to catch any layout shifts
  useEffect(() => {
    requestAnimationFrame(measurePositions);
  }, [step.id, measurePositions]);

  return (
    <div ref={containerRef} className="relative w-full min-h-[300px] sm:min-h-[380px]">
      {/* SVG connection layer — only render after positions are measured */}
      {measured && (
        <ConnectionPaths
          connection={step.connection}
          positions={positions}
          stepId={step.id}
        />
      )}

      {/* Entity nodes in triangle layout */}
      <div className="relative" style={{ zIndex: 2 }}>
        {/* Top row: Browser and Server */}
        <div className="flex items-start justify-between px-2 sm:px-8">
          <div ref={browserRef}>
            <EntityNode
              type="browser"
              isActive={step.activeEntities.includes("browser")}
              statusText={step.entityStatus?.browser}
              stepId={step.id}
            />
          </div>
          <div ref={serverRef}>
            <EntityNode
              type="server"
              isActive={step.activeEntities.includes("server")}
              statusText={step.entityStatus?.server}
              stepId={step.id}
            />
          </div>
        </div>

        {/* Bottom row: Authenticator centered */}
        <div className="mt-20 flex justify-center sm:mt-28">
          <div ref={authenticatorRef}>
            <EntityNode
              type="authenticator"
              isActive={step.activeEntities.includes("authenticator")}
              statusText={step.entityStatus?.authenticator}
              stepId={step.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
