"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import GradientBg from "@/components/gradient-bg";
import GradientBgMobile from "@/components/gradient-bg-mobile";

const PHONE_QUERY = "(max-width: 767px)";

type GradientBgAdaptiveProps = {
  className?: string;
  style?: CSSProperties;
  speed?: number;
  paused?: boolean;
};

// Desktop keeps the canvas gradient exactly as before; phones get the lighter
// CSS version. The CSS one renders first so a phone never mounts the canvas
// engine only to replace it after hydration.
export default function GradientBgAdaptive(props: GradientBgAdaptiveProps) {
  const [phone, setPhone] = useState(true);

  useEffect(() => {
    const query = window.matchMedia(PHONE_QUERY);
    const sync = () => setPhone(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  if (phone) return <GradientBgMobile {...props} />;

  return (
    <GradientBg
      className={props.className ?? ""}
      style={props.style}
      speed={props.speed ?? 28}
      paused={props.paused}
    />
  );
}
