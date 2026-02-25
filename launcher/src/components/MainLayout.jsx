import React from 'react';

export default function MainLayout({ children }) {
  return (
    <div className="flex-1 flex flex-col bg-gray-900 relative overflow-hidden h-screen">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-black z-0"></div>

      {/* Orange Glow Effect (top right) */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col p-8">
        {children}
      </div>
    </div>
  );
}
