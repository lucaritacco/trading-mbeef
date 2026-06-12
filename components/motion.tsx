"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  animate,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;

export function useRevealVariants(distance = 24): Variants {
  const reduced = useReducedMotion();
  return {
    hidden: { opacity: 0, y: reduced ? 0 : distance },
    visible: { opacity: 1, y: 0 },
  };
}

/** Aparece con fade + leve desplazamiento al entrar en viewport. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const variants = useRevealVariants();
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Contenedor que escalona la entrada de sus hijos StaggerItem. */
export function Stagger({
  children,
  className,
  step = 0.12,
}: {
  children: React.ReactNode;
  className?: string;
  step?: number;
}) {
  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: step } },
  };
  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const variants = useRevealVariants();
  return (
    <motion.div
      className={className}
      variants={variants}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Número que cuenta desde 0 al entrar en viewport. */
export function Counter({
  to,
  suffix = "",
  className,
}: {
  to: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!inView) return;
    if (reduced) {
      node.textContent = `${to}${suffix}`;
      return;
    }
    const controls = animate(0, to, {
      duration: 1.8,
      ease: EASE,
      onUpdate: (v) => {
        node.textContent = `${Math.round(v)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, to, suffix, reduced]);

  return (
    <span ref={ref} className={className} aria-label={`${to}${suffix}`}>
      0{suffix}
    </span>
  );
}
