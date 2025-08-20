import * as React from "react";
import clsx from "clsx";

/** Фирменный лоадер: PB + стрелки по кругу. Всегда по центру экрана. */
export function PBLogoLoader({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "fixed inset-0 z-[9999] grid place-items-center bg-background/80 backdrop-blur-sm",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24">
        {/* PB */}
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-extrabold tracking-widest text-xl sm:text-2xl md:text-3xl text-foreground select-none">
            PB
          </span>
        </div>

        {/* Кольцо со стрелками (крутится) */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full text-primary"
          style={{ animation: "spin 1.25s linear infinite" }}
        >
          <defs>
            <marker id="pb-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
            </marker>
          </defs>

          {/* тонкое кольцо-подложка */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth="2"
          />

          {/* две дуги со стрелками (как «крутящийся прогресс») */}
          <path
            d="M14 50 A36 36 0 0 1 50 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            markerEnd="url(#pb-arrow)"
          />
          <path
            d="M86 50 A36 36 0 0 1 50 86"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            markerEnd="url(#pb-arrow)"
            opacity=".9"
          />
        </svg>
      </div>
    </div>
  );
}