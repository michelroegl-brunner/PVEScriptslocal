'use client';

import { api } from '~/trpc/react';
import { useState } from 'react';
import { Terminal } from './Terminal';


interface ScriptsListProps {
  onRunScript: (scriptPath: string, scriptName: string) => void;
}

export function ScriptsList({ onRunScript }: ScriptsListProps) {
  const { data, isLoading, error, refetch } = api.scripts.getCtScripts.useQuery();
  const [selectedScript, setSelectedScript] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-600">Loading scripts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-red-600">
          Error loading scripts: {error.message}
        </div>
      </div>
    );
  }

  if (!data?.scripts || data.scripts.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-600">No scripts found in the scripts directory</div>
      </div>
    );
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString();
  };

  const getFileIcon = (extension: string): string => {
    switch (extension) {
      case '.sh':
      case '.bash':
        return '🐚';
      case '.py':
        return '🐍';
      case '.js':
        return '📜';
      case '.ts':
        return '🔷';
      default:
        return '📄';
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Available Scripts</h2>
        <p className="text-gray-600">
          Found {data.scripts.length} script(s) in {data.directoryInfo.path}
        </p>
        <div className="mt-2 text-sm text-gray-500">
          <p>Allowed extensions: {data.directoryInfo.allowedExtensions.join(', ')}</p>
          <p>Max execution time: {Math.round(data.directoryInfo.maxExecutionTime / 1000)}s</p>
        </div>
      </div>

      <div className="grid gap-4">
        {data.scripts.map((script) => (
          <div
            key={script.path}
            className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {script.logo ? (
                  <img 
                    src={script.logo} 
                    alt={`${script.name} logo`}
                    className="w-8 h-8 rounded object-contain"
                    onError={(e) => {
                      // Fallback to file icon if logo fails to load
                      e.currentTarget.style.display = 'none';
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.style.display = 'block';
                      }
                    }}
                  />
                ) : null}
                <span className="text-2xl" style={{ display: script.logo ? 'none' : 'block' }}>
                  {getFileIcon(script.extension)}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{script.name}</h3>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Size: {formatFileSize(script.size)}</p>
                    <p>Modified: {formatDate(script.lastModified)}</p>
                    <p>Extension: {script.extension}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedScript(script.path)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  View
                </button>
                <button
                  onClick={() => onRunScript(`scripts/ct/${script.name}`, script.name)}
                  className="px-4 py-2 text-sm font-medium rounded transition-colors bg-green-600 text-white hover:bg-green-700"
                >
                  ▶️ Run
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedScript && (
        <div className="mt-6">
          <Terminal
            scriptPath={`scripts/ct/${selectedScript.split('/').pop()}`}
            onClose={() => setSelectedScript(null)}
          />
        </div>
      )}
    </div>
  );
}
