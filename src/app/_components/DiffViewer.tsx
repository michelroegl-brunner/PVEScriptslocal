'use client';

import { useState } from 'react';
import { api } from '~/trpc/react';

interface DiffViewerProps {
  scriptSlug: string;
  filePath: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DiffViewer({ scriptSlug, filePath, isOpen, onClose }: DiffViewerProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Get diff content
  const { data: diffData, refetch } = api.scripts.getScriptDiff.useQuery(
    { slug: scriptSlug, filePath },
    { enabled: isOpen && !!scriptSlug && !!filePath }
  );

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await refetch();
    setIsLoading(false);
  };

  if (!isOpen) return null;

  const renderDiffLine = (line: string, index: number) => {
    const lineNumber = line.match(/^([+-]?\d+):/)?.[1];
    const content = line.replace(/^[+-]?\d+:\s*/, '');
    const isAdded = line.startsWith('+');
    const isRemoved = line.startsWith('-');
    const isContext = line.startsWith(' ');

    return (
      <div
        key={index}
        className={`flex font-mono text-sm ${
          isAdded
            ? 'bg-green-50 text-green-800 border-l-4 border-green-400'
            : isRemoved
            ? 'bg-red-50 text-red-800 border-l-4 border-red-400'
            : 'bg-gray-50 text-gray-700'
        }`}
      >
        <div className="w-16 text-right pr-2 text-gray-500 select-none">
          {lineNumber}
        </div>
        <div className="flex-1 pl-2">
          <span className={isAdded ? 'text-green-600' : isRemoved ? 'text-red-600' : ''}>
            {isAdded ? '+' : isRemoved ? '-' : ' '}
          </span>
          <span className="whitespace-pre-wrap">{content}</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Script Diff</h2>
            <p className="text-sm text-gray-600">{filePath}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-100 border border-green-300"></div>
              <span className="text-green-700">Added (Remote)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-100 border border-red-300"></div>
              <span className="text-red-700">Removed (Local)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-100 border border-gray-300"></div>
              <span className="text-gray-700">Unchanged</span>
            </div>
          </div>
        </div>

        {/* Diff Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {diffData?.success ? (
            diffData.diff ? (
              <div className="divide-y divide-gray-200">
                {diffData.diff.split('\n').map((line, index) => 
                  line.trim() ? renderDiffLine(line, index) : null
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No differences found</p>
                <p className="text-sm">The local and remote files are identical</p>
              </div>
            )
          ) : diffData?.error ? (
            <div className="p-8 text-center text-red-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Error loading diff</p>
              <p className="text-sm">{diffData.error}</p>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading diff...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
