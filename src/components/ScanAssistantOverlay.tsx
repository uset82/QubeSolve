"use client";

import React from "react";
import styles from "./ScanAssistantOverlay.module.css";
import { type CubeColor } from "@/lib/constants";

interface ScanAssistantOverlayProps {
  type: "rotate" | "hold" | "success" | "none";
  message: string;
  expectedColor?: CubeColor;
  detectedColor?: CubeColor;
}

export default function ScanAssistantOverlay({
  type,
  message,
  expectedColor,
  detectedColor,
}: ScanAssistantOverlayProps) {
  if (type === "none") return null;

  const isWarning = type === "rotate";
  const isHold = type === "hold";
  const isSuccess = type === "success";

  return (
    <div className={`${styles.overlay} ${isWarning ? styles.overlayWarning : ""} ${isSuccess ? styles.overlaySuccess : ""}`}>
      <div className={styles.content}>
        {isWarning && (
          <div className={styles.iconWrapper}>
            <div className={styles.rotateIcon}>🔄</div>
          </div>
        )}
        
        {isHold && (
          <div className={styles.pulseContainer}>
            <div className={styles.pulseInner} />
          </div>
        )}

        {isSuccess && (
          <div className={styles.checkIcon}>✅</div>
        )}

        <p className={styles.message}>{message}</p>
        
        {isWarning && expectedColor && (
          <div className={styles.colorContext}>
            <span>Target:</span>
            <div 
              className={styles.swatch} 
              style={{ backgroundColor: getHexForColor(expectedColor) }} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

function getHexForColor(color: CubeColor): string {
  const map: Record<CubeColor, string> = {
    white: "#FFFFFF",
    yellow: "#FFD93D",
    red: "#FF4444",
    orange: "#FF8C00",
    blue: "#4488FF",
    green: "#44CC44",
  };
  return map[color] || "#888";
}
