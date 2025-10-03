
'use client';

import { useState } from 'react';
import { ScriptsGrid } from './_components/ScriptsGrid';
import { InstalledScriptsTab } from './_components/InstalledScriptsTab';
import { ResyncButton } from './_components/ResyncButton';
import { Terminal } from './_components/Terminal';
import { SettingsButton } from './_components/SettingsButton';

export default function Home() {
  const [runningScript, setRunningScript] = useState<{ path: string; name: string; mode?: 'local' | 'ssh'; server?: any } | null>(null);
  const [activeTab, setActiveTab] = useState<'scripts' | 'installed'>('scripts');

  const handleRunScript = (scriptPath: string, scriptName: string, mode?: 'local' | 'ssh', server?: any) => {
    setRunningScript({ path: scriptPath, name: scriptName, mode, server });
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
            🚀 PVE Scripts Management
          </h1>
          <p className="text-gray-600">
            Manage and execute Proxmox helper scripts locally with live output streaming
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('scripts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'scripts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📦 Available Scripts
              </button>
              <button
                onClick={() => setActiveTab('installed')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'installed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🗂️ Installed Scripts
              </button>
            </nav>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <SettingsButton />
            <ResyncButton />
          </div>
        </div>

        {/* Running Script Terminal */}
        {runningScript && (
          <div className="mb-8">
            <Terminal
              scriptPath={runningScript.path}
              onClose={handleCloseTerminal}
              mode={runningScript.mode}
              server={runningScript.server}
            />
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'scripts' && (
          <ScriptsGrid onInstallScript={handleRunScript} />
        )}
        
        {activeTab === 'installed' && (
          <InstalledScriptsTab />
        )}
      </div>
    </main>
  );
}
