import React from 'react';

const TermsContent = () => (
  <div className="space-y-4 text-sm text-gray-300">
    <h3 className="text-lg font-bold text-white">Terms of Service</h3>
    <p>By using the Beacon platform, you agree to become a Node in our decentralized network. This means your device will help relay encrypted stream data to other users.</p>
    <p>You are solely responsible for the content you broadcast. Beacon does not host content on central servers and cannot proactively monitor all streams.</p>

    <h3 className="text-lg font-bold text-white mt-6">Community Guidelines</h3>
    <p>Strictly prohibited content includes:</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>Illegal acts (terrorism, human trafficking, sale of illegal goods)</li>
      <li>Real-world violence and gore</li>
      <li>Hate speech and harassment</li>
      <li>Non-consensual sexual content or child exploitation</li>
    </ul>
    <p>Violating these rules may result in your unique ID being banned from the network bootstrap nodes.</p>
  </div>
);

export default function TermsModal({ onAgree, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">One Last Thing...</h2>
          <p className="text-gray-400 mt-1">Please review and agree to our rules before launching.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent bg-gray-900/50">
          <TermsContent />
        </div>

        <div className="p-6 border-t border-gray-800 bg-gray-900 flex justify-end gap-3 rounded-b-xl">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onAgree}
            className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg shadow-orange-900/20"
          >
            I Agree & Launch
          </button>
        </div>
      </div>
    </div>
  );
}
