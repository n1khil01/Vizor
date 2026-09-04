"use client";

import Image from "next/image";
import { useTheme } from "@/lib/useTheme";

/**
 * The Vizor mark, as designed — not a hand-traced approximation. Two
 * pre-cut transparent PNGs (public/vizor-mark-{dark,light}.png, keyed out of
 * the source flat-background files in /logo) stand in for a single
 * currentColor SVG because the mark carries its own faceted shading, not a
 * flat silhouette a CSS color swap could reproduce.
 *
 * `dark.png` is the dark-ink mark, for light backgrounds; `light.png` is the
 * light mark, for dark backgrounds — named for the mark's own color, not the
 * theme it appears under, which is the opposite pairing from the file names
 * in /logo (vizor-logo-light-mode.jpeg holds the dark mark, for use in light
 * mode). Renamed on the way in to avoid exactly that ambiguity here.
 */
export function VizorMark({
  className = "",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  const theme = useTheme();
  const src = theme === "dark" ? "/vizor-mark-light.png" : "/vizor-mark-dark.png";

  return (
    <Image
      src={src}
      alt=""
      width={512}
      height={482}
      priority={priority}
      // Inline, not a `w-auto` utility class: two width rules in one
      // className list race on stylesheet order, not source order, so a
      // caller's own `h-*` class isn't reliably guaranteed to win over a
      // conflicting width utility here. An inline style always wins.
      style={{ width: "auto" }}
      className={`object-contain ${className}`}
    />
  );
}
