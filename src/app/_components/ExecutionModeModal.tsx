'use client';

import { useState, useEffect } from 'react';
import type { Server } from '../../types/server';

interface ExecutionModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (mode: 'local' | 'ssh', server?: Server) => void;
  scriptName: string;
}

export function ExecutionModeModal({ isOpen, onClose, onExecute, scriptName }: ExecutionModeModalProps) {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'local' | 'ssh'>('local');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  useEffect(() => {
    if (isOpen) {
      void fetchServers();
    }
  }, [isOpen]);

  const fetchServers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/servers');
      if (!response.ok) {
        throw new Error('Failed to fetch servers');
      }
      const data = await response.json();
      console.log('Fetched servers:', data);
      setServers(data as Server[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = () => {
    if (selectedMode === 'ssh' && !selectedServer) {
      setError('Please select a server for SSH execution');
      return;
    }
    
    console.log('ExecutionModeModal executing with:', { mode: selectedMode, server: selectedServer });
    onExecute(selectedMode, selectedServer ?? undefined);
    onClose();
  };

  const handleModeChange = (mode: 'local' | 'ssh') => {
    setSelectedMode(mode);
    if (mode === 'local') {
      setSelectedServer(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Execution Mode</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              How would you like to execute &quot;{scriptName}&quot;?
            </h3>
            <p className="text-gray-600 text-sm">
              Choose between local execution or running the script on a remote server via SSH.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Execution Mode Selection */}
          <div className="space-y-4 mb-6">
            {/* Local Execution */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedMode === 'local' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleModeChange('local')}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  id="local"
                  name="executionMode"
                  value="local"
                  checked={selectedMode === 'local'}
                  onChange={() => handleModeChange('local')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="local" className="ml-3 flex-1 cursor-pointer">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">Local Execution</h4>
                      <p className="text-sm text-gray-500">Run the script on this server</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* SSH Execution */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedMode === 'ssh' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleModeChange('ssh')}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  id="ssh"
                  name="executionMode"
                  value="ssh"
                  checked={selectedMode === 'ssh'}
                  onChange={() => handleModeChange('ssh')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="ssh" className="ml-3 flex-1 cursor-pointer">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">SSH Execution</h4>
                      <p className="text-sm text-gray-500">Run the script on a remote server</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Server Selection (only for SSH mode) */}
          {selectedMode === 'ssh' && (
            <div className="mb-6">
              <label htmlFor="server" className="block text-sm font-medium text-gray-700 mb-2">
                Select Server
              </label>
              {loading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading servers...</p>
                </div>
              ) : servers.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No servers configured</p>
                  <p className="text-xs mt-1">Add servers in Settings to use SSH execution</p>
                </div>
              ) : (
                <select
                  id="server"
                  value={selectedServer?.id ?? ''}
                  onChange={(e) => {
                    const serverId = parseInt(e.target.value);
                    const server = servers.find(s => s.id === serverId);
                    console.log('Server selected:', { serverId, server });
                    setSelectedServer(server ?? null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a server...</option>
                  {servers.map((server) => (
                    <option key={server.id} value={server.id}>
                      {server.name} ({server.ip}) - {server.user}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleExecute}
              disabled={selectedMode === 'ssh' && !selectedServer}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                selectedMode === 'ssh' && !selectedServer
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {selectedMode === 'local' ? 'Run Locally' : 'Run on Server'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
