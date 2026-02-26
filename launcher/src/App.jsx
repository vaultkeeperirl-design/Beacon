import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MainLayout from './components/MainLayout';
import ProgressBar from './components/ProgressBar';
import { Play, Download, RefreshCw, Radio, Trash2 } from 'lucide-react';

const STATUS = {
  NOT_INSTALLED: 'NOT_INSTALLED',
  INSTALLING: 'INSTALLING',
  INSTALLED: 'INSTALLED',
  UPDATING: 'UPDATING',
  LAUNCHING: 'LAUNCHING',
  PLAYING: 'PLAYING'
};

function App() {
  const [status, setStatus] = useState(STATUS.NOT_INSTALLED);
  const [progress, setProgress] = useState(0);
  const [isElectron, setIsElectron] = useState(false);
  const [appVersion, setAppVersion] = useState('0.0.0');

  useEffect(() => {
    // Check if running in Electron
    if (window.electron) {
      setIsElectron(true);

      if (window.electron.ipcRenderer && window.electron.ipcRenderer.invoke) {
        window.electron.ipcRenderer.invoke('get-app-version').then((version) => {
          setAppVersion(version);
        });

        // Check initial install status
        window.electron.ipcRenderer.invoke('check-install').then((isInstalled) => {
            if (isInstalled) {
                setStatus(STATUS.INSTALLED);
            } else {
                setStatus(STATUS.NOT_INSTALLED);
            }
        });
      }

      // Listen for installation progress
      window.electron.ipcRenderer.on('install-progress', (event, value) => {
        setProgress(value);
      });

      window.electron.ipcRenderer.on('install-complete', () => {
        setStatus(STATUS.INSTALLED);
      });

      // Listen for launch status
      window.electron.ipcRenderer.on('app-launched', () => {
        setStatus(STATUS.PLAYING);
      });

      window.electron.ipcRenderer.on('app-closed', () => {
        setStatus(STATUS.INSTALLED);
      });

      window.electron.ipcRenderer.on('uninstall-complete', () => {
        setStatus(STATUS.NOT_INSTALLED);
      });

      window.electron.ipcRenderer.on('launch-error', (event, error) => {
        setStatus(STATUS.INSTALLED);
        alert(`Failed to launch app: ${error}`);
      });

    }
  }, []);

  const handleInstall = () => {
    setStatus(STATUS.INSTALLING);
    setProgress(0);

    if (isElectron) {
      window.electron.ipcRenderer.send('install-app');
    } else {
      // Mock install in browser
      let p = 0;
      const interval = setInterval(() => {
        p += 5;
        setProgress(p);
        if (p >= 100) {
          clearInterval(interval);
          setStatus(STATUS.INSTALLED);
        }
      }, 200);
    }
  };

  const handleUninstall = () => {
      if (confirm("Are you sure you want to uninstall Beacon P2P Node?")) {
           if (isElectron) {
              window.electron.ipcRenderer.send('uninstall-app');
           } else {
              setStatus(STATUS.NOT_INSTALLED);
           }
      }
  };

  const handleLaunch = () => {
    setStatus(STATUS.LAUNCHING);
    if (isElectron) {
      window.electron.ipcRenderer.send('launch-app');
    } else {
      setTimeout(() => setStatus(STATUS.PLAYING), 1000);
      alert("Launch App!");
    }
  };

  const handleUpdate = () => {
    setStatus(STATUS.UPDATING);
    setProgress(0);
    // similar logic to install
     if (isElectron) {
      window.electron.ipcRenderer.send('update-app');
    } else {
      let p = 0;
      const interval = setInterval(() => {
        p += 10;
        setProgress(p);
        if (p >= 100) {
          clearInterval(interval);
          setStatus(STATUS.INSTALLED);
        }
      }, 200);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-900 text-white font-sans selection:bg-orange-500 selection:text-white">
      <Sidebar />
      <MainLayout>
        {/* Header / Logo Area */}
        <div className="flex flex-col gap-2 mb-8 app-drag-region">
           <div className="flex items-center gap-3">
             <img src="logo-full.png" alt="Beacon" className="h-16 object-contain" />
             <span className="text-xs text-orange-500 uppercase tracking-widest border border-orange-500/30 px-2 py-0.5 rounded bg-orange-500/10">Beta</span>
           </div>
           <p className="text-gray-400 max-w-md">
             The decentralized P2P streaming platform. No middlemen. No gatekeepers. Just you and the mesh.
           </p>
        </div>

        {/* Hero / News Section */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="col-span-2 bg-gray-800/50 rounded-lg p-6 border border-gray-700/50 hover:border-orange-500/30 transition-colors group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
              {/* Background image for news */}
              <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80" alt="Streamer Setup" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" />

              <div className="relative z-20 h-full flex flex-col justify-end">
                <span className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">Latest Update</span>
                <h2 className="text-2xl font-bold mb-2">Mesh Network Protocol v1.0 Live</h2>
                <p className="text-gray-300 text-sm mb-4">
                  Enhanced peer discovery and bandwidth sharing incentives are now active. Join the revolution and earn credits by relaying streams.
                </p>
                <button className="text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded text-sm w-fit backdrop-blur-sm transition-colors">
                  Read Patch Notes
                </button>
              </div>
           </div>

           <div className="space-y-4">
              <div className="bg-gray-800/30 p-4 rounded border border-gray-700/30">
                <h3 className="text-gray-200 font-semibold mb-2 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-green-500" /> System Status
                </h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Signaling Server</span>
                    <span className="text-green-400">Online</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mesh Nodes</span>
                    <span className="text-orange-400">1,240 Active</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/30 p-4 rounded border border-gray-700/30">
                 <h3 className="text-gray-200 font-semibold mb-2">Community</h3>
                 <p className="text-xs text-gray-400 mb-3">Join our Discord to find co-streaming partners.</p>
                 <a href="#" className="text-orange-400 hover:text-orange-300 text-sm block">Join Discord &rarr;</a>
              </div>
           </div>
        </div>

        {/* Bottom Bar: Install/Play Actions */}
        <div className="mt-8 pt-6 border-t border-gray-800 flex items-center justify-between">
           <div className="flex flex-col gap-1">
             <h1 className="text-3xl font-black text-white tracking-tight">BEACON</h1>
             <span className="text-xs text-gray-500 font-mono">v{appVersion}</span>
           </div>

           <div className="flex items-center gap-6 w-1/2 max-w-md">
             {/* Action Button */}
             <div className="flex-1">
               {status === STATUS.NOT_INSTALLED && (
                 <button
                   onClick={handleInstall}
                   className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-lg"
                 >
                   <Download className="w-6 h-6" /> Install
                 </button>
               )}

               {(status === STATUS.INSTALLING || status === STATUS.UPDATING) && (
                 <div className="w-full space-y-2">
                    <button disabled className="w-full bg-gray-700 text-gray-400 font-bold py-4 px-8 rounded cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wide text-lg">
                      {status === STATUS.INSTALLING ? 'Installing...' : 'Updating...'}
                    </button>
                    <ProgressBar value={progress} label={status === STATUS.INSTALLING ? "Downloading assets..." : "Verifying files..."} />
                 </div>
               )}

               {(status === STATUS.INSTALLED || status === STATUS.PLAYING || status === STATUS.LAUNCHING) && (
                 <button
                   onClick={handleLaunch}
                   disabled={status === STATUS.PLAYING || status === STATUS.LAUNCHING}
                   className={`w-full font-bold py-4 px-8 rounded transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-lg shadow-[0_0_20px_rgba(249,115,22,0.6)]
                     ${status === STATUS.PLAYING || status === STATUS.LAUNCHING
                       ? 'bg-gray-700 text-gray-400 cursor-default'
                       : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white transform hover:scale-[1.02] active:scale-[0.98]'
                     }`}
                 >
                   {status === STATUS.PLAYING ? 'Running' : status === STATUS.LAUNCHING ? (
                     <>
                       <RefreshCw className="w-6 h-6 animate-spin" /> Launching...
                     </>
                   ) : (
                     <>
                       <Play className="w-6 h-6 fill-current" /> Launch
                     </>
                   )}
                 </button>
               )}
             </div>

             {/* Secondary Actions */}
             <div className="flex gap-2">
                <button
                    onClick={handleUpdate}
                    disabled={status !== STATUS.INSTALLED}
                    className="p-3 text-gray-500 hover:text-white transition-colors rounded hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed"
                    title="Check for Updates"
                >
                    <RefreshCw className={`w-5 h-5 ${status === STATUS.UPDATING ? 'animate-spin text-orange-500' : ''}`} />
                </button>

                {(status === STATUS.INSTALLED || status === STATUS.LAUNCHING) && (
                    <button
                        onClick={handleUninstall}
                        className="p-3 text-gray-500 hover:text-red-500 transition-colors rounded hover:bg-gray-800"
                        title="Uninstall"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                )}
             </div>
           </div>
        </div>
      </MainLayout>
    </div>
  );
}

export default App;
