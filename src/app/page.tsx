
'use client';

import { useState } from 'react';
import { ScriptsGrid } from './_components/ScriptsGrid';
import { ResyncButton } from './_components/ResyncButton';
import { Terminal } from './_components/Terminal';
import { SettingsButton } from './_components/SettingsButton';

export default function Home() {
  const [runningScript, setRunningScript] = useState<{ path: string; name: string; mode?: 'local' | 'ssh'; server?: any } | null>(null);

  const handleRunScript = (scriptPath: string, scriptName: string, mode?: 'local' | 'ssh', server?: any) => {
    console.log('handleRunScript called with:', { scriptPath, scriptName, mode, server });
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

        {/* Scripts List */}
        <ScriptsGrid onInstallScript={handleRunScript} />
      </div>
    </main>
  );
}
