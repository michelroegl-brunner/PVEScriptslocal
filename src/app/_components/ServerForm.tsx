'use client';

import { useState } from 'react';
import type { CreateServerData } from '../../types/server';

interface ServerFormProps {
  onSubmit: (data: CreateServerData) => void;
  initialData?: CreateServerData;
  isEditing?: boolean;
  onCancel?: () => void;
}

export function ServerForm({ onSubmit, initialData, isEditing = false, onCancel }: ServerFormProps) {
  const [formData, setFormData] = useState<CreateServerData>(
    initialData ?? {
      name: '',
      ip: '',
      user: '',
      password: '',
    }
  );

  const [errors, setErrors] = useState<Partial<CreateServerData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateServerData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Server name is required';
    }

    if (!formData.ip.trim()) {
      newErrors.ip = 'IP address is required';
    } else {
      // Basic IP validation
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(formData.ip)) {
        newErrors.ip = 'Please enter a valid IP address';
      }
    }

    if (!formData.user.trim()) {
      newErrors.user = 'Username is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      if (!isEditing) {
        setFormData({ name: '', ip: '', user: '', password: '' });
      }
    }
  };

  const handleChange = (field: keyof CreateServerData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Server Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={handleChange('name')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Production Server"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="ip" className="block text-sm font-medium text-gray-700 mb-1">
            IP Address *
          </label>
          <input
            type="text"
            id="ip"
            value={formData.ip}
            onChange={handleChange('ip')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.ip ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., 192.168.1.100"
          />
          {errors.ip && <p className="mt-1 text-sm text-red-600">{errors.ip}</p>}
        </div>

        <div>
          <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
            Username *
          </label>
          <input
            type="text"
            id="user"
            value={formData.user}
            onChange={handleChange('user')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.user ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., root"
          />
          {errors.user && <p className="mt-1 text-sm text-red-600">{errors.user}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <input
            type="password"
            id="password"
            value={formData.password}
            onChange={handleChange('password')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.password ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter password"
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {isEditing && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isEditing ? 'Update Server' : 'Add Server'}
        </button>
      </div>
    </form>
  );
}

