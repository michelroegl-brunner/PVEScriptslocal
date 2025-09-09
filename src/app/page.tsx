
'use client';

import { useState } from 'react';
import { ScriptsList } from './_components/ScriptsList';
import { RepoStatus } from './_components/RepoStatus';
import { Terminal } from './_components/Terminal';

export default function Home() {
  const [runningScript, setRunningScript] = useState<{ path: string; name: string } | null>(null);

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
        <ScriptsList onRunScript={handleRunScript} />
      </div>
    </main>
  );
}
