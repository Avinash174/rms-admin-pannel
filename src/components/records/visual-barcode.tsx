"use client";

import React from 'react';

interface VisualBarcodeProps {
  code: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

export function VisualBarcode({
  code,
  width = 120,
  height = 28,
  showText = true,
  className = ""
}: VisualBarcodeProps) {
  if (!code) return null;

  const generateBars = (str: string) => {
    const bars: { width: number; isGap: boolean }[] = [];
    
    // Start quiet zone & guard bars
    bars.push({ width: 2, isGap: false });
    bars.push({ width: 1, isGap: true });
    bars.push({ width: 2, isGap: false });
    bars.push({ width: 2, isGap: true });

    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      const w1 = ((ch * 3 + i) % 3) + 1;
      const g1 = ((ch * 5 + i) % 2) + 1;
      const w2 = ((ch * 7 + i) % 3) + 1;
      const g2 = ((ch * 2 + i) % 2) + 1;
      
      bars.push({ width: w1, isGap: false });
      bars.push({ width: g1, isGap: true });
      bars.push({ width: w2, isGap: false });
      bars.push({ width: g2, isGap: true });
    }

    // End guard bars
    bars.push({ width: 2, isGap: false });
    bars.push({ width: 1, isGap: true });
    bars.push({ width: 3, isGap: false });

    return bars;
  };

  const bars = generateBars(code);
  const totalUnits = bars.reduce((sum, b) => sum + b.width, 0);

  let currentX = 0;

  return (
    <div className={`inline-flex flex-col items-center justify-center p-1.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs ${className}`}>
      {showText && (
        <span className="font-mono font-bold tracking-widest text-slate-900 text-[10px] mb-0.5 uppercase">
          {code}
        </span>
      )}
      <svg
        viewBox={`0 0 ${totalUnits} ${height}`}
        style={{ width: `${width}px`, height: `${height}px` }}
        preserveAspectRatio="none"
        className="block"
      >
        {bars.map((bar, idx) => {
          const x = currentX;
          currentX += bar.width;
          if (bar.isGap) return null;
          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={bar.width}
              height={height}
              fill="#0F172A"
            />
          );
        })}
      </svg>
    </div>
  );
}
