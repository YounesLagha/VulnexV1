'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export default function ScoreRing({ score, size = 160, strokeWidth = 12 }: ScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / 100) * circumference;

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e'; // green-500
    if (score >= 50) return '#fb923c'; // orange-400
    return '#ef4444'; // red-500
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return 'SECURE';
    if (score >= 50) return 'WARNING';
    return 'CRITICAL';
  };

  const color = getScoreColor(score);
  const status = getScoreStatus(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background Circle */}
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(51 65 85)"
          strokeWidth={strokeWidth}
          opacity={0.2}
        />

        {/* Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>

      {/* Score Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center"
        >
          <div className="text-4xl font-bold font-mono" style={{ color }}>
            {displayScore}
          </div>
          <div className="text-xs text-slate-500 mt-1">/ 100</div>
          <div
            className="text-xs font-semibold mt-2 px-2 py-0.5 rounded"
            style={{
              color,
              backgroundColor: `${color}15`,
              border: `1px solid ${color}30`
            }}
          >
            {status}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
