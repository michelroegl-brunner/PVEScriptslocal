'use client';

import { useEffect, useState } from 'react';
import { api } from '~/trpc/react';

interface ProxmoxCheckProps {
  children: React.ReactNode;
}

export function ProxmoxCheck({ children }: ProxmoxCheckProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isProxmoxVE, setIsProxmoxVE] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: proxmoxData, isLoading } = api.scripts.checkProxmoxVE.useQuery();

  useEffect(() => {
    if (proxmoxData && typeof proxmoxData === 'object' && 'success' in proxmoxData) {
      setIsChecking(false);
      if (proxmoxData.success) {
        const isProxmox = 'isProxmoxVE' in proxmoxData ? proxmoxData.isProxmoxVE as boolean : false;
        setIsProxmoxVE(isProxmox);
        if (!isProxmox) {
          setError('This application can only run on a Proxmox VE Host');
        }
      } else {
        const errorMsg = 'error' in proxmoxData ? proxmoxData.error as string : 'Failed to check Proxmox VE status';
        setError(errorMsg);
        setIsProxmoxVE(false);
      }
    }
  }, [proxmoxData]);

  // Show loading state
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking system requirements...</p>
        </div>
      </div>
    );
  }

  // Show error if not running on Proxmox VE
  if (!isProxmoxVE || error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-800 mb-2">
              System Requirements Not Met
            </h1>
            <p className="text-red-700 mb-4">
              {error ?? 'This application can only run on a Proxmox VE Host'}
            </p>
            <div className="text-sm text-red-600 bg-red-100 rounded-lg p-4">
              <p className="font-medium mb-2">To use this application, you need:</p>
              <ul className="text-left space-y-1">
                <li>• A Proxmox VE host system</li>
                <li>• The <code className="bg-red-200 px-1 rounded">pveversion</code> command must be available</li>
                <li>• Proper permissions to execute system commands</li>
              </ul>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry Check
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If running on Proxmox VE, render the children
  return <>{children}</>;
}
