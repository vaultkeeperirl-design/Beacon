import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Coins, Heart, Check, AlertCircle } from 'lucide-react';
import { useP2PSettings } from '../context/P2PContext';

/**
 * TipButton Component
 * Allows viewers to tip credits to the streamer.
 * Connects to the /api/tip endpoint and handles revenue split logic via the backend.
 */
export default function TipButton({ streamId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(10);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const { token, user } = useP2PSettings();
  const dropdownRef = useRef(null);

  const tipAmounts = [1, 5, 10, 50, 100];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTip = async () => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Please log in to tip');
      return;
    }

    if (amount <= 0) return;

    setStatus('loading');
    try {
      const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      await axios.post(
        `${API_URL}/api/tip`,
        { streamId, amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.response?.data?.error || 'Tip failed');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 bg-beacon-600 hover:bg-beacon-500 text-white rounded-lg transition-all shadow-lg shadow-beacon-600/20 border border-beacon-500/50 flex items-center gap-2 group"
        aria-label="Tip Streamer"
        title="Tip Streamer"
      >
        <Coins className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="hidden md:inline font-bold">Tip</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-3 w-64 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
          <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            Support {streamId}
          </h4>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {tipAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt)}
                className={`py-2 rounded-lg text-xs font-mono font-bold transition-all border ${
                  amount === amt
                    ? 'bg-beacon-600 border-beacon-500 text-white'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-500'
                }`}
              >
                {amt} CR
              </button>
            ))}
            <div className="relative col-span-3">
               <input
                 type="number"
                 value={amount}
                 onChange={(e) => setAmount(Number(e.target.value))}
                 className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:border-beacon-500 outline-none transition-colors pr-10"
                 placeholder="Custom amount..."
                 min="1"
               />
               <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-600 uppercase">CR</span>
            </div>
          </div>

          <button
            onClick={handleTip}
            disabled={status === 'loading' || amount <= 0}
            className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              status === 'success'
                ? 'bg-green-600 text-white'
                : status === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-beacon-600 hover:bg-beacon-500 text-white'
            } disabled:opacity-50`}
          >
            {status === 'loading' ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : status === 'success' ? (
              <><Check className="w-4 h-4" /> Sent!</>
            ) : status === 'error' ? (
              <><AlertCircle className="w-4 h-4" /> {errorMessage || 'Error'}</>
            ) : (
              `Tip ${amount} CR`
            )}
          </button>

          <p className="mt-3 text-[10px] text-neutral-500 text-center leading-tight">
            Tips are non-refundable and subject to Beacon's revenue split policy.
          </p>
        </div>
      )}
    </div>
  );
}
