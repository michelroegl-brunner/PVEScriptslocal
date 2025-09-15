
'use client';

import { useState } from 'react';
import { ScriptsGrid } from './_components/ScriptsGrid';
import { ResyncButton } from './_components/ResyncButton';
import { RepoStatusButton } from './_components/RepoStatusButton';
import { Terminal } from './_components/Terminal';
import { ProxmoxCheck } from './_components/ProxmoxCheck';

export default function Home() {
  const [runningScript, setRunningScript] = useState<{ path: string; name: string } | null>(null);

  const handleRunScript = (scriptPath: string, scriptName: string) => {
    setRunningScript({ path: scriptPath, name: scriptName });
  };

  const handleCloseTerminal = () => {
    setRunningScript(null);
  };

  return (
    <ProxmoxCheck>
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

          {/* Repository Status and Update */}
          <div className="mb-8">
            <RepoStatusButton />
          </div>

          {/* Resync Button */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div></div>
              <ResyncButton />
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
          <ScriptsGrid onInstallScript={handleRunScript} />
        </div>
      </main>
    </ProxmoxCheck>
  );
}
