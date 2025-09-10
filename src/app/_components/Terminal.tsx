'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

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
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [executionId] = useState(() => `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const isConnectingRef = useRef<boolean>(false);
  const hasConnectedRef = useRef<boolean>(false);

  const scriptName = scriptPath.split('/').pop() || scriptPath.split('\\').pop() || 'Unknown Script';

  useEffect(() => {
    // Initialize xterm.js terminal with proper timing
    if (!terminalRef.current || xtermRef.current) return;

    // Use setTimeout to ensure DOM is fully ready
    const initTerminal = () => {
      if (!terminalRef.current || xtermRef.current) return;

      const terminal = new XTerm({
        theme: {
          background: '#000000',
          foreground: '#00ff00',
          cursor: '#00ff00',
        },
        fontSize: 14,
        fontFamily: 'Courier New, monospace',
        cursorBlink: true,
        cursorStyle: 'block',
        scrollback: 1000,
        tabStopWidth: 4,
      });

      // Add addons
      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);

      // Open terminal
      terminal.open(terminalRef.current);
      
      // Fit after a small delay to ensure proper sizing
      setTimeout(() => {
        fitAddon.fit();
      }, 100);

      // Store references
      xtermRef.current = terminal;
      fitAddonRef.current = fitAddon;

      // Handle terminal input
      terminal.onData((data) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            action: 'input',
            executionId,
            input: data
          }));
        }
      });

      // Handle terminal resize
      const handleResize = () => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        terminal.dispose();
      };
    };

    // Initialize with a small delay
    const timeoutId = setTimeout(initTerminal, 50);

    return () => {
      clearTimeout(timeoutId);
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
        fitAddonRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Prevent multiple connections in React Strict Mode
    if (hasConnectedRef.current || isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    // Close any existing connection first
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    isConnectingRef.current = true;
    hasConnectedRef.current = true;

    // Small delay to prevent rapid reconnection
    const connectWithDelay = () => {
      // Connect to WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/script-execution`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        isConnectingRef.current = false;
        
        // Send start message immediately after connection
        ws.send(JSON.stringify({
          action: 'start',
          scriptPath,
          executionId
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: TerminalMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsRunning(false);
        isConnectingRef.current = false;
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('WebSocket readyState:', ws.readyState);
        setIsConnected(false);
        isConnectingRef.current = false;
      };
    };

    // Add small delay to prevent rapid reconnection
    const timeoutId = setTimeout(connectWithDelay, 100);

    return () => {
      clearTimeout(timeoutId);
      isConnectingRef.current = false;
      hasConnectedRef.current = false;
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        wsRef.current.close();
      }
    };
  }, [scriptPath, executionId]);

  const handleMessage = (message: TerminalMessage) => {
    if (!xtermRef.current) return;

    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] `;
    
    switch (message.type) {
      case 'start':
        xtermRef.current.writeln(`${prefix}🚀 ${message.data}`);
        setIsRunning(true);
        break;
      case 'output':
        // Write directly to terminal - xterm.js handles ANSI codes natively
        xtermRef.current.write(message.data);
        break;
      case 'error':
        // Check if this looks like ANSI terminal output (contains escape codes)
        if (message.data.includes('\x1B[') || message.data.includes('\u001b[')) {
          // This is likely terminal output sent to stderr, treat it as normal output
          xtermRef.current.write(message.data);
        } else {
          // This is a real error, show it with error prefix
          xtermRef.current.writeln(`${prefix}❌ ${message.data}`);
        }
        break;
      case 'end':
        xtermRef.current.writeln(`${prefix}✅ ${message.data}`);
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
    if (xtermRef.current) {
      xtermRef.current.clear();
    }
  };

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
        ref={terminalRef}
        className="h-96 w-full"
        style={{ minHeight: '384px' }}
      />

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