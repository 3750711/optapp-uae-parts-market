import * as React from "react";
import clsx from "clsx";

/** Фирменный лоадер: PB + стрелки по кругу. */
export function PBLogoLoader({
  fullscreen = false,
  message = "Загрузка страницы…",
  className,
}: {
  fullscreen?: boolean;
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        fullscreen
          ? "fixed inset-0 z-[9999] grid place-items-center bg-background/80 backdrop-blur-sm"
          : "inline-flex items-center gap-3",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative h-24 w-24">
        {/* PB */}
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-extrabold tracking-widest text-3xl text-foreground select-none">
            PB
          </span>
        </div>

        {/* Кольцо со стрелками (крутится) */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full text-primary"
          style={{ animation: "spin 1.25s linear infinite" }} // чуть медленнее стандартного
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

      {message && (
        <div className="mt-4 text-sm text-muted-foreground">{message}</div>
      )}
    </div>
  );
}