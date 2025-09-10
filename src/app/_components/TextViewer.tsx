'use client';

import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface TextViewerProps {
  scriptName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ScriptContent {
  ctScript?: string;
  installScript?: string;
}

export function TextViewer({ scriptName, isOpen, onClose }: TextViewerProps) {
  const [scriptContent, setScriptContent] = useState<ScriptContent>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ct' | 'install'>('ct');

  // Extract slug from script name (remove .sh extension)
  const slug = scriptName.replace(/\.sh$/, '');

  useEffect(() => {
    if (isOpen && scriptName) {
      loadScriptContent();
    }
  }, [isOpen, scriptName]);

  const loadScriptContent = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [ctResponse, installResponse] = await Promise.allSettled([
        fetch(`/api/trpc/scripts.getScriptContent?input=${encodeURIComponent(JSON.stringify({ json: { path: `ct/${scriptName}` } }))}`),
        fetch(`/api/trpc/scripts.getScriptContent?input=${encodeURIComponent(JSON.stringify({ json: { path: `install/${slug}-install.sh` } }))}`)
      ]);

      const content: ScriptContent = {};

      if (ctResponse.status === 'fulfilled' && ctResponse.value.ok) {
        const ctData = await ctResponse.value.json();
        if (ctData.result?.data?.json?.success) {
          content.ctScript = ctData.result.data.json.content;
        }
      }

      if (installResponse.status === 'fulfilled' && installResponse.value.ok) {
        const installData = await installResponse.value.json();
        if (installData.result?.data?.json?.success) {
          content.installScript = installData.result.data.json.content;
        }
      }

      setScriptContent(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load script content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Script Viewer: {scriptName}
            </h2>
            {scriptContent.ctScript && scriptContent.installScript && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('ct')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    activeTab === 'ct'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  CT Script
                </button>
                <button
                  onClick={() => setActiveTab('install')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    activeTab === 'install'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Install Script
                </button>
              </div>
            )}
          </div>
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
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-lg text-gray-600">Loading script content...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-lg text-red-600">Error: {error}</div>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              {activeTab === 'ct' && scriptContent.ctScript ? (
                <SyntaxHighlighter
                  language="bash"
                  style={tomorrow}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    height: '100%',
                    overflow: 'auto'
                  }}
                  showLineNumbers={true}
                  wrapLines={true}
                >
                  {scriptContent.ctScript}
                </SyntaxHighlighter>
              ) : activeTab === 'install' && scriptContent.installScript ? (
                <SyntaxHighlighter
                  language="bash"
                  style={tomorrow}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    height: '100%',
                    overflow: 'auto'
                  }}
                  showLineNumbers={true}
                  wrapLines={true}
                >
                  {scriptContent.installScript}
                </SyntaxHighlighter>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-lg text-gray-600">
                    {activeTab === 'ct' ? 'CT script not found' : 'Install script not found'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
