'use client';

import { api } from '~/trpc/react';
import { useState } from 'react';

export function RepoStatus() {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { data: repoStatus, isLoading: statusLoading, refetch: refetchStatus } = api.scripts.getRepoStatus.useQuery();
  const updateRepoMutation = api.scripts.updateRepo.useMutation({
    onSuccess: () => {
      setIsUpdating(false);
      refetchStatus();
    },
    onError: () => {
      setIsUpdating(false);
    }
  });

  const handleUpdate = async () => {
    setIsUpdating(true);
    updateRepoMutation.mutate();
  };

  if (statusLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="text-gray-600">Loading repository status...</div>
        </div>
      </div>
    );
  }

  if (!repoStatus) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="text-red-600">Failed to load repository status</div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (!repoStatus.isRepo) return 'text-gray-500';
    if (repoStatus.isBehind) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusText = () => {
    if (!repoStatus.isRepo) return 'No repository found';
    if (repoStatus.isBehind) return 'Behind remote';
    return 'Up to date';
  };

  const getStatusIcon = () => {
    if (!repoStatus.isRepo) return '❓';
    if (repoStatus.isBehind) return '⚠️';
    return '✅';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Repository Status</h3>
            <div className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </div>
            {repoStatus.isRepo && (
              <div className="text-xs text-gray-500 mt-1">
                <p>Branch: {repoStatus.branch || 'Unknown'}</p>
                {repoStatus.lastCommit && (
                  <p>Last commit: {repoStatus.lastCommit.substring(0, 8)}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => refetchStatus()}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            🔄 Refresh
          </button>
          
          <button
            onClick={handleUpdate}
            disabled={isUpdating || !repoStatus.isRepo}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              isUpdating || !repoStatus.isRepo
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isUpdating ? '⏳ Updating...' : '⬇️ Update Repo'}
          </button>
        </div>
      </div>

      {updateRepoMutation.isSuccess && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          ✅ {updateRepoMutation.data?.message}
        </div>
      )}

      {updateRepoMutation.isError && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          ❌ {updateRepoMutation.error?.message || 'Failed to update repository'}
        </div>
      )}
    </div>
  );
}
