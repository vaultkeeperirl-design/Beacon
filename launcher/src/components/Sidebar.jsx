import React from 'react';
import { Radio } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-16 h-screen bg-gray-950 flex flex-col items-center py-4 border-r border-gray-800">
      <div className="mb-6 p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg shadow-lg shadow-orange-900/20">
        <Radio className="w-6 h-6 text-white" />
      </div>

      <div className="flex-1 flex flex-col items-center gap-4">
        {/* Active Game Item */}
        <div className="group relative">
           <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-r shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
           <button className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700">
             <img src="icon.png" alt="Beacon" className="w-8 h-8 object-contain" />
           </button>
        </div>

        {/* Placeholder for other games */}
        <button className="w-10 h-10 rounded bg-transparent flex items-center justify-center hover:bg-gray-800 transition-colors opacity-50 cursor-not-allowed" title="More Coming Soon">
           <div className="w-8 h-8 border-2 border-dashed border-gray-600 rounded-full"></div>
        </button>
      </div>

      <div className="mt-auto flex flex-col items-center gap-4">
        {/* Settings or User Profile could go here */}
        <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700"></div>
      </div>
    </div>
  );
}
