import React from 'react';

export default function CommunityGuidelines() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 text-neutral-300">
      <h1 className="text-3xl font-bold text-white mb-8">Community Guidelines</h1>

      <p className="mb-8 text-lg">
        Beacon is built on the principles of freedom and decentralization, but that freedom comes with responsibility. To ensure the network remains usable and safe for everyone, we ask that you adhere to the following guidelines.
      </p>

      <div className="space-y-8">
        <section className="bg-neutral-900/50 p-6 rounded-lg border border-neutral-800">
          <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
            🚫 Prohibited Content
          </h2>
          <p className="mb-4">
            The following content is strictly prohibited on the Beacon network. Nodes found broadcasting this content may be blacklisted by the community.
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span><strong>Illegal Acts:</strong> Content depicting, promoting, or facilitating illegal activities, including terrorism, human trafficking, or the sale of illegal goods.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span><strong>Violence & Gore:</strong> Real-world graphic violence, torture, or gore intended to shock or disgust.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span><strong>Hate Speech:</strong> Content that promotes violence or hatred against individuals or groups based on race, ethnicity, religion, gender, or sexual orientation.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span><strong>Sexual Violence & Exploitation:</strong> Non-consensual sexual content or any content involving the exploitation of minors.</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Respect the Mesh</h2>
          <p>
            Beacon relies on users sharing bandwidth. Please:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Do not intentionally flood the network with spam or malicious data.</li>
            <li>Do not attempt to exploit vulnerabilities in other users' nodes.</li>
            <li>Respect the bandwidth limits of others.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Enforcement</h2>
          <p>
            Because Beacon is decentralized, enforcement is community-driven.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Blocklists:</strong> Users can maintain and share blocklists of bad actors.</li>
            <li><strong>Node Rejection:</strong> Your node may automatically reject connections from peers identified as malicious.</li>
            <li><strong>Bootstrap Ban:</strong> The core development team reserves the right to ban malicious nodes from the default bootstrap servers.</li>
          </ul>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-neutral-800 text-sm text-neutral-500">
        Last Updated: {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
