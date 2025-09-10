'use client';

import { useState } from 'react';
import { api } from '~/trpc/react';
import type { Script } from '~/types/script';

interface ScriptDetailModalProps {
  script: Script | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ScriptDetailModal({ script, isOpen, onClose }: ScriptDetailModalProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);

  // Check if script files exist locally
  const { data: scriptFilesData } = api.scripts.checkScriptFiles.useQuery(
    { slug: script?.slug ?? '' },
    { enabled: !!script && isOpen }
  );

  // Load script mutation
  const loadScriptMutation = api.scripts.loadScript.useMutation({
    onSuccess: (data) => {
      setIsLoading(false);
      if (data.success) {
        setLoadMessage(`✅ ${data.message}`);
      } else {
        setLoadMessage(`❌ ${data.error}`);
      }
      // Clear message after 5 seconds
      setTimeout(() => setLoadMessage(null), 5000);
    },
    onError: (error) => {
      setIsLoading(false);
      setLoadMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setLoadMessage(null), 5000);
    },
  });

  if (!isOpen || !script) return null;

  const handleImageError = () => {
    setImageError(true);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleLoadScript = async () => {
    if (!script) return;
    
    setIsLoading(true);
    setLoadMessage(null);
    loadScriptMutation.mutate({ slug: script.slug });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {script.logo && !imageError ? (
              <img
                src={script.logo}
                alt={`${script.name} logo`}
                className="w-16 h-16 rounded-lg object-contain"
                onError={handleImageError}
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-2xl font-semibold">
                  {script.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{script.name}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  script.type === 'ct' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {script.type.toUpperCase()}
                </span>
                {script.updateable && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Updateable
                  </span>
                )}
                {script.privileged && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Privileged
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Load Script Button */}
            <button
              onClick={handleLoadScript}
              disabled={isLoading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isLoading
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Load Script</span>
                </>
              )}
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

        {/* Load Message */}
        {loadMessage && (
          <div className="mx-6 mb-4 p-3 rounded-lg bg-blue-50 text-blue-800 text-sm">
            {loadMessage}
          </div>
        )}

        {/* Script Files Status */}
        {scriptFilesData?.success && (
          <div className="mx-6 mb-4 p-3 rounded-lg bg-gray-50 text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${scriptFilesData.ctExists ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>CT Script: {scriptFilesData.ctExists ? 'Available' : 'Not loaded'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${scriptFilesData.installExists ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>Install Script: {scriptFilesData.installExists ? 'Available' : 'Not loaded'}</span>
              </div>
            </div>
            {scriptFilesData.files.length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                Files: {scriptFilesData.files.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600">{script.description}</p>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Slug</dt>
                  <dd className="text-sm text-gray-900 font-mono">{script.slug}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date Created</dt>
                  <dd className="text-sm text-gray-900">{script.date_created}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Categories</dt>
                  <dd className="text-sm text-gray-900">{script.categories.join(', ')}</dd>
                </div>
                {script.interface_port && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Interface Port</dt>
                    <dd className="text-sm text-gray-900">{script.interface_port}</dd>
                  </div>
                )}
                {script.config_path && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Config Path</dt>
                    <dd className="text-sm text-gray-900 font-mono">{script.config_path}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Links</h3>
              <dl className="space-y-2">
                {script.website && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Website</dt>
                    <dd className="text-sm">
                      <a
                        href={script.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 break-all"
                      >
                        {script.website}
                      </a>
                    </dd>
                  </div>
                )}
                {script.documentation && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Documentation</dt>
                    <dd className="text-sm">
                      <a
                        href={script.documentation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 break-all"
                      >
                        {script.documentation}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Install Methods */}
          {script.install_methods.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Install Methods</h3>
              <div className="space-y-4">
                {script.install_methods.map((method, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 capitalize">{method.type}</h4>
                      <span className="text-sm text-gray-500 font-mono">{method.script}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <dt className="font-medium text-gray-500">CPU</dt>
                        <dd className="text-gray-900">{method.resources.cpu} cores</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500">RAM</dt>
                        <dd className="text-gray-900">{method.resources.ram} MB</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500">HDD</dt>
                        <dd className="text-gray-900">{method.resources.hdd} GB</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500">OS</dt>
                        <dd className="text-gray-900">{method.resources.os} {method.resources.version}</dd>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Default Credentials */}
          {(script.default_credentials.username || script.default_credentials.password) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Default Credentials</h3>
              <dl className="space-y-2">
                {script.default_credentials.username && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Username</dt>
                    <dd className="text-sm text-gray-900 font-mono">{script.default_credentials.username}</dd>
                  </div>
                )}
                {script.default_credentials.password && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Password</dt>
                    <dd className="text-sm text-gray-900 font-mono">{script.default_credentials.password}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Notes */}
          {script.notes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
              <ul className="space-y-2">
                {script.notes.map((note, index) => {
                  // Handle both object and string note formats
                  const noteText = typeof note === 'string' ? note : note.text;
                  const noteType = typeof note === 'string' ? 'info' : note.type;
                  
                  return (
                    <li key={index} className={`text-sm p-3 rounded-lg ${
                      noteType === 'warning' 
                        ? 'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-400' 
                        : noteType === 'error'
                        ? 'bg-red-50 text-red-800 border-l-4 border-red-400'
                        : 'bg-gray-50 text-gray-600'
                    }`}>
                      <div className="flex items-start">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                          noteType === 'warning' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : noteType === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {noteType}
                        </span>
                        <span>{noteText}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
