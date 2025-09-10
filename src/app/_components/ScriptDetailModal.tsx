'use client';

import { useState } from 'react';
import type { Script } from '~/types/script';

interface ScriptDetailModalProps {
  script: Script | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ScriptDetailModal({ script, isOpen, onClose }: ScriptDetailModalProps) {
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !script) return null;

  const handleImageError = () => {
    setImageError(true);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
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
                {script.notes.map((note, index) => (
                  <li key={index} className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
