import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-beacon-500/30 selection:text-beacon-100 flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-beacon-600 focus:text-white focus:rounded-lg focus:font-bold focus:shadow-xl"
      >
        Skip to main content
      </a>
      <Navbar />
      <div className="pt-16 flex flex-1">
        <Sidebar />
        <main
          id="main-content"
          tabIndex="-1"
          className="flex-1 p-6 overflow-x-hidden min-h-[calc(100vh-64px)] relative outline-none"
        >
          <div className="max-w-7xl mx-auto">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
