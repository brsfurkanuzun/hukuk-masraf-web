"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const DURATION = 320;

export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  const skipRef = useRef(open);
  const [mounted, setMounted] = useState(open);
  const [settled, setSettled] = useState(open);
  openRef.current = open;

  useEffect(() => {
    if (open) {
      setMounted(true);
    }
  }, [open]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!mounted || !shell) {
      return;
    }
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (open) {
        setSettled(true);
        return;
      }
      setSettled(false);
      setMounted(false);
      return;
    }

    if (open) {
      const target = shell.scrollHeight;
      const animation = shell.animate([{ height: "0px", opacity: 0 }, { height: `${target}px`, opacity: 1 }], {
        duration: DURATION,
        easing: EASING,
        fill: "forwards",
      });
      animation.onfinish = () => {
        if (!openRef.current) {
          return;
        }
        shell.style.height = "auto";
        shell.style.opacity = "1";
        animation.cancel();
        setSettled(true);
      };
      return () => animation.cancel();
    }

    const from = shell.getBoundingClientRect().height;
    const animation = shell.animate([{ height: `${from}px`, opacity: 1 }, { height: "0px", opacity: 0 }], {
      duration: DURATION,
      easing: EASING,
      fill: "forwards",
    });
    animation.onfinish = () => {
      if (openRef.current) {
        return;
      }
      setSettled(false);
      setMounted(false);
    };
    return () => animation.cancel();
  }, [mounted, open]);

  if (!mounted) {
    return null;
  }

  return (
    <div ref={shellRef} style={{ overflow: "hidden", height: settled ? "auto" : 0, opacity: settled ? 1 : 0 }}>
      {children}
    </div>
  );
}
