'use client';

import { useState } from 'react';
import { api } from '~/trpc/react';

export function RepoStatusButton() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [updateSteps, setUpdateSteps] = useState<string[]>([]);
  const [showSteps, setShowSteps] = useState(false);

  // Query repository status
  const { data: repoStatus, refetch: refetchStatus } = api.scripts.getRepoStatus.useQuery();

  // Full update mutation
  const fullUpdateMutation = api.scripts.fullUpdateRepo.useMutation({
    onSuccess: (data) => {
      setIsUpdating(false);
      setUpdateMessage(data.message);
      setUpdateSteps(data.steps);
      setShowSteps(true);
      
      if (data.success) {
        // Refetch status after successful update
        setTimeout(() => {
          void refetchStatus();
        }, 1000);
        
        // Clear message after 5 seconds for success
        setTimeout(() => {
          setUpdateMessage(null);
          setShowSteps(false);
        }, 5000);
      } else {
        // Clear message after 10 seconds for errors
        setTimeout(() => {
          setUpdateMessage(null);
          setShowSteps(false);
        }, 10000);
      }
    },
    onError: (error) => {
      setIsUpdating(false);
      setUpdateMessage(`Error: ${error.message}`);
      setUpdateSteps([`❌ ${error.message}`]);
      setShowSteps(true);
      setTimeout(() => {
        setUpdateMessage(null);
        setShowSteps(false);
      }, 10000);
    },
  });

  const handleFullUpdate = async () => {
    setIsUpdating(true);
    setUpdateMessage(null);
    setUpdateSteps([]);
    setShowSteps(false);
    fullUpdateMutation.mutate();
  };

  const getStatusColor = () => {
    if (!repoStatus?.isRepo) return 'text-gray-500';
    if (repoStatus.isBehind) return 'text-orange-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!repoStatus?.isRepo) return '❓';
    if (repoStatus.isBehind) return '⚠️';
    return '✅';
  };

  const getStatusText = () => {
    if (!repoStatus?.isRepo) return 'Not a git repository';
    if (repoStatus.isBehind) return 'Updates available';
    return 'Up to date';
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Status Display */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getStatusIcon()}</span>
            <div>
              <div className={`font-medium ${getStatusColor()}`}>
                Repository Status: {getStatusText()}
              </div>
              {repoStatus?.isRepo && (
                <div className="text-sm text-gray-500">
                  Branch: {repoStatus.branch ?? 'unknown'} | 
                  Last commit: {repoStatus.lastCommit ? repoStatus.lastCommit.substring(0, 8) : 'unknown'}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {repoStatus?.isBehind && (
            <button
              onClick={handleFullUpdate}
              disabled={isUpdating}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isUpdating
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Update Repository</span>
                </>
              )}
            </button>
          )}
          
          <button
            onClick={() => refetchStatus()}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh status"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Update Message */}
      {updateMessage && (
        <div className={`p-4 rounded-lg ${
          updateMessage.includes('Error') || updateMessage.includes('Failed')
            ? 'bg-red-100 text-red-700 border border-red-200'
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          <div className="font-medium mb-2">{updateMessage}</div>
          {showSteps && updateSteps.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowSteps(!showSteps)}
                className="text-sm font-medium hover:underline"
              >
                {showSteps ? 'Hide' : 'Show'} update steps
              </button>
              {showSteps && (
                <div className="mt-2 space-y-1">
                  {updateSteps.map((step, index) => (
                    <div key={index} className="text-sm font-mono">
                      {step}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Update Steps (always show when updating) */}
      {isUpdating && updateSteps.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="font-medium text-blue-800 mb-2">Update Progress:</div>
          <div className="space-y-1">
            {updateSteps.map((step, index) => (
              <div key={index} className="text-sm font-mono text-blue-700">
                {step}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
