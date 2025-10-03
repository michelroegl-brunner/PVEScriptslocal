'use client';

import { useState } from 'react';
import { api } from '~/trpc/react';
import { Terminal } from './Terminal';

interface InstalledScript {
  id: number;
  script_name: string;
  script_path: string;
  container_id: string | null;
  server_name: string | null;
  server_ip: string | null;
  execution_mode: 'local' | 'ssh';
  installation_date: string;
  status: 'in_progress' | 'success' | 'failed';
  output_log: string | null;
}

export function InstalledScriptsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed' | 'in_progress'>('all');
  const [serverFilter, setServerFilter] = useState<string>('all');
  const [updatingScript, setUpdatingScript] = useState<{ id: number; containerId: string; server?: any; mode: 'local' | 'ssh' } | null>(null);

  // Fetch installed scripts
  const { data: scriptsData, refetch: refetchScripts, isLoading } = api.installedScripts.getAllInstalledScripts.useQuery();
  const { data: statsData } = api.installedScripts.getInstallationStats.useQuery();

  // Delete script mutation
  const deleteScriptMutation = api.installedScripts.deleteInstalledScript.useMutation({
    onSuccess: () => {
      void refetchScripts();
    }
  });


  const scripts: InstalledScript[] = (scriptsData?.scripts as InstalledScript[]) ?? [];
  const stats = statsData?.stats;

  // Filter scripts based on search and filters
  const filteredScripts = scripts.filter((script: InstalledScript) => {
    const matchesSearch = script.script_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (script.container_id?.includes(searchTerm) ?? false) ||
                         (script.server_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === 'all' || script.status === statusFilter;
    
    const matchesServer = serverFilter === 'all' || 
                         (serverFilter === 'local' && script.execution_mode === 'local') ||
                         (script.server_name === serverFilter);
    
    return matchesSearch && matchesStatus && matchesServer;
  });

  // Get unique servers for filter
  const uniqueServers: string[] = [];
  const seen = new Set<string>();
  for (const script of scripts) {
    if (script.server_name && !seen.has(String(script.server_name))) {
      uniqueServers.push(String(script.server_name));
      seen.add(String(script.server_name));
    }
  }

  const handleDeleteScript = (id: number) => {
    if (confirm('Are you sure you want to delete this installation record?')) {
      void deleteScriptMutation.mutate({ id });
    }
  };

  const handleUpdateScript = async (script: InstalledScript) => {
    if (!script.container_id) {
      alert('No Container ID available for this script');
      return;
    }
    
    if (confirm(`Are you sure you want to update ${script.script_name}?`)) {
      // Get server info if it's SSH mode
      let server = null;
      if (script.execution_mode === 'ssh' && script.server_id) {
        try {
          // Fetch full server details including credentials
          const serverResponse = await fetch(`/api/trpc/servers.getServerById?input=${encodeURIComponent(JSON.stringify({ id: script.server_id }))}`);
          const serverData = await serverResponse.json();
          
          if (serverData.result?.data?.json?.success && serverData.result.data.json.server) {
            server = serverData.result.data.json.server;
          } else {
            alert('Failed to fetch server details. Please check server configuration.');
            return;
          }
        } catch (error) {
          console.error('Error fetching server details:', error);
          alert('Failed to fetch server details. Please check server configuration.');
          return;
        }
      }
      
      setUpdatingScript({
        id: script.id,
        containerId: script.container_id,
        server: server,
        mode: script.execution_mode
      });
    }
  };

  const handleCloseUpdateTerminal = () => {
    setUpdatingScript(null);
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string): string => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'success':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'in_progress':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getModeBadge = (mode: string): string => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (mode) {
      case 'local':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'ssh':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading installed scripts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Update Terminal */}
      {updatingScript && (
        <div className="mb-8">
          <Terminal
            scriptPath={`update-${updatingScript.containerId}`}
            onClose={handleCloseUpdateTerminal}
            mode={updatingScript.mode}
            server={updatingScript.server}
            isUpdate={true}
            containerId={updatingScript.containerId}
          />
        </div>
      )}

      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Installed Scripts</h2>
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-800">Total Installations</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.byStatus.success}</div>
              <div className="text-sm text-green-800">Successful</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.byStatus.failed}</div>
              <div className="text-sm text-red-800">Failed</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.byStatus.in_progress}</div>
              <div className="text-sm text-yellow-800">In Progress</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search scripts, container IDs, or servers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'success' | 'failed' | 'in_progress')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="in_progress">In Progress</option>
          </select>

          <select
            value={serverFilter}
            onChange={(e) => setServerFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Servers</option>
            <option value="local">Local</option>
            {uniqueServers.map(server => (
              <option key={server} value={server}>{server}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Scripts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredScripts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {scripts.length === 0 ? 'No installed scripts found.' : 'No scripts match your filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Script Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Container ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Server
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredScripts.map((script) => (
                  <tr key={script.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{script.script_name}</div>
                      <div className="text-sm text-gray-500">{script.script_path}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {script.container_id ? (
                        <span className="text-sm font-mono text-gray-900">{String(script.container_id)}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {script.execution_mode === 'local' ? (
                        <span className="text-sm text-gray-900">Local</span>
                      ) : (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{script.server_name}</div>
                          <div className="text-sm text-gray-500">{script.server_ip}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getModeBadge(String(script.execution_mode))}>
                        {String(script.execution_mode).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(String(script.status))}>
                        {String(script.status).replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(String(script.installation_date))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {script.container_id && (
                          <button
                            onClick={() => handleUpdateScript(script)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Update
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteScript(Number(script.id))}
                          className="text-red-600 hover:text-red-900"
                          disabled={deleteScriptMutation.isPending}
                        >
                          {deleteScriptMutation.isPending ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
