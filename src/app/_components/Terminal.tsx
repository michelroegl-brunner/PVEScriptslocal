'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '~/trpc/react';

interface TerminalProps {
  scriptPath: string;
  onClose: () => void;
}

interface TerminalMessage {
  type: 'start' | 'output' | 'error' | 'end';
  data: string;
  timestamp: number;
}

export function Terminal({ scriptPath, onClose }: TerminalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [executionId] = useState(() => `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const wsRef = useRef<WebSocket | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const scriptName = scriptPath.split('/').pop() || scriptPath.split('\\').pop() || 'Unknown Script';

  useEffect(() => {
    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/script-execution`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message: TerminalMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setIsRunning(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const handleMessage = (message: TerminalMessage) => {
    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] `;
    
    switch (message.type) {
      case 'start':
        setOutput(prev => [...prev, `${prefix}🚀 ${message.data}`]);
        setIsRunning(true);
        break;
      case 'output':
        setOutput(prev => [...prev, message.data]);
        break;
      case 'error':
        setOutput(prev => [...prev, `${prefix}❌ ${message.data}`]);
        break;
      case 'end':
        setOutput(prev => [...prev, `${prefix}✅ ${message.data}`]);
        setIsRunning(false);
        break;
    }
  };

  const startScript = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'start',
        scriptPath,
        executionId
      }));
    }
  };

  const stopScript = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'stop',
        executionId
      }));
    }
  };

  const clearOutput = () => {
    setOutput([]);
  };

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      {/* Terminal Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-gray-300 font-mono text-sm ml-2">
            {scriptName}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-gray-400 text-xs">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Terminal Output */}
      <div 
        ref={outputRef}
        className="h-96 overflow-y-auto p-4 font-mono text-sm"
        style={{ backgroundColor: '#000000', color: '#00ff00' }}
      >
        {output.length === 0 ? (
          <div className="text-gray-500">
            <p>Terminal ready. Click "Start Script" to begin execution.</p>
            <p className="mt-2">Script: {scriptPath}</p>
          </div>
        ) : (
          output.map((line, index) => (
            <div key={index} className="whitespace-pre-wrap">
              {line}
            </div>
          ))
        )}
      </div>

      {/* Terminal Controls */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-t border-gray-700">
        <div className="flex space-x-2">
          <button
            onClick={startScript}
            disabled={!isConnected || isRunning}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              isConnected && !isRunning
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            ▶️ Start
          </button>
          
          <button
            onClick={stopScript}
            disabled={!isRunning}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              isRunning
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            ⏹️ Stop
          </button>
          
          <button
            onClick={clearOutput}
            className="px-3 py-1 text-xs font-medium bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            🗑️ Clear
          </button>
        </div>

        <button
          onClick={onClose}
          className="px-3 py-1 text-xs font-medium bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
}
