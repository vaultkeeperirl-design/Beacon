import React from 'react';

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 text-neutral-300">
      <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
          <p>
            By downloading, installing, or using the Beacon platform ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Decentralized Nature of the Service</h2>
          <p>
            Beacon is a decentralized, peer-to-peer (P2P) streaming platform. Unlike traditional streaming services, Beacon does not operate central servers that host content. Instead, the Platform relies on a mesh network of users ("Nodes") to relay data.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>You are a Node:</strong> By using the Platform, you agree to act as a Node in the network, utilizing a portion of your bandwidth to relay encrypted stream data to other users.</li>
            <li><strong>No Central Authority:</strong> Content is not stored on Beacon servers. We do not have the ability to modify or remove content once it is distributed across the network, although we strive to provide tools for community moderation.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. User Responsibilities</h2>
          <p>
            You are solely responsible for:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>The content you broadcast or stream through the Platform.</li>
            <li>Ensuring your use of the Platform complies with all applicable local, state, national, and international laws.</li>
            <li>Maintaining the security of your own device and network.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Content Liability</h2>
          <p>
            As a decentralized platform, Beacon cannot and does not proactively monitor all content. However, you acknowledge that:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>You may not use the Platform to distribute illegal content, including but not limited to copyrighted material you do not own, child exploitation material, or content promoting terrorism.</li>
            <li>We reserve the right to ban your unique ID from the bootstrap nodes if you are found to be in violation of these terms or our Community Guidelines.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. Disclaimer of Warranties</h2>
          <p>
            The Platform is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or implied. We do not guarantee that the Platform will be secure, uninterrupted, or error-free.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Beta Software Warning</h2>
          <p>
            Beacon is currently in Beta. The software may contain bugs, and you may experience crashes or data loss. Use at your own risk.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-neutral-800 text-sm text-neutral-500">
        Last Updated: {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
