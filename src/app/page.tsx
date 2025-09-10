
'use client';

import { useState } from 'react';
import { ScriptsList } from './_components/ScriptsList';
import { ScriptsGrid } from './_components/ScriptsGrid';
import { RepoStatus } from './_components/RepoStatus';
import { ResyncButton } from './_components/ResyncButton';
import { Terminal } from './_components/Terminal';

export default function Home() {
  const [runningScript, setRunningScript] = useState<{ path: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'local' | 'github'>('github');

  const handleRunScript = (scriptPath: string, scriptName: string) => {
    setRunningScript({ path: scriptPath, name: scriptName });
  };

  const handleCloseTerminal = () => {
    setRunningScript(null);
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🚀 PVE Scripts Local Management
          </h1>
          <p className="text-gray-600">
            Manage and execute Proxmox helper scripts locally with live output streaming
          </p>
        </div>

        {/* Repository Status */}
        <div className="mb-8">
          <RepoStatus />
        </div>

        {/* Script Source Tabs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('github')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'github'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                GitHub Scripts
              </button>
              <button
                onClick={() => setActiveTab('local')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'local'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Local Scripts
              </button>
            </div>
            {activeTab === 'github' && <ResyncButton />}
          </div>
        </div>

        {/* Running Script Terminal */}
        {runningScript && (
          <div className="mb-8">
            <Terminal
              scriptPath={runningScript.path}
              onClose={handleCloseTerminal}
            />
          </div>
        )}

        {/* Scripts List */}
        {activeTab === 'github' ? (
          <ScriptsGrid />
        ) : (
          <ScriptsList onRunScript={handleRunScript} />
        )}
      </div>
    </main>
  );
}
