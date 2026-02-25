import React from 'react';

export default function ProgressBar({ value, label }) {
  // Clamp value
  const progress = Math.min(Math.max(value, 0), 100);

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex justify-between text-xs text-gray-400 font-medium">
        <span>{label}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(249,115,22,0.6)]"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}
