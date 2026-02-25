import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-beacon-500/30 selection:text-beacon-100 flex flex-col">
      <Navbar />
      <div className="pt-16 flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-x-hidden min-h-[calc(100vh-64px)] relative">
          <div className="max-w-7xl mx-auto">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
