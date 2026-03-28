import { useState, useEffect, useRef } from 'react';
import { parseIPWithPort } from '@showstack/shared';
import { useConsoleStore } from '../../store/consoleStore';
import { logger } from '../../utils/logger';
import type { ConsoleType } from '../../types/console';

interface Props {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
}

const CONSOLE_HINTS: Record<ConsoleType, string> = {
  eos: 'Enable OSC RX on Eos: Setup → System Settings → Show Control → OSC',
  grandma2: 'Enable Telnet on GrandMA2: Setup → Network → Telnet (port 30000)',
  grandma3: 'Configure MA-Net3 on GrandMA3: Setup → Network',
};

export function ConsoleConnectionDialog({ isOpen, projectId, onClose }: Props) {
  const { status, connection, connect, disconnect } = useConsoleStore();

  const [consoleType, setConsoleType] = useState<ConsoleType>('eos');
  const [ipInput, setIpInput] = useState('');
  const [ipError, setIpError] = useState('');
  const [reachabilityWarning, setReachabilityWarning] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const reachabilityChecked = useRef<string>('');

  // Pre-populate IP from existing connection
  useEffect(() => {
    if (isOpen && connection) {
      setConsoleType(connection.type);
      setIpInput(connection.ip);
    }
    if (!isOpen) {
      setIpError('');
      setReachabilityWarning('');
      setErrorMessage('');
      reachabilityChecked.current = '';
    }
  }, [isOpen, connection]);

  if (!isOpen) return null;

  const validateIP = (value: string): boolean => {
    if (!value) {
      setIpError('');
      return false;
    }
    const parsed = parseIPWithPort(value);
    if (!parsed) {
      setIpError('Invalid IP address (e.g. 192.168.1.100 or 192.168.1.100:3032)');
      return false;
    }
    setIpError('');
    return true;
  };

  const checkReachability = async (value: string) => {
    if (reachabilityChecked.current === value) return;
    reachabilityChecked.current = value;

    const parsed = parseIPWithPort(value);
    if (!parsed) return;

    try {
      // We don't have equipment IDs for a console IP — use the IP itself as a synthetic id
      const results = await window.api.infrastructure.getPortStatusReport(projectId, [
        { id: '__console__', ip_address: parsed.ip },
      ]);
      const result = results.find((r) => r.ip === parsed.ip);
      if (result && result.status !== 'reachable') {
        setReachabilityWarning(`${parsed.ip} is currently ${result.status} — connection may fail`);
      } else {
        setReachabilityWarning('');
      }
    } catch (error) {
      logger.warn('Reachability check failed:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleBlur = () => {
    if (validateIP(ipInput)) {
      checkReachability(ipInput);
    }
  };

  const handleConnect = async () => {
    if (!validateIP(ipInput)) return;

    const parsed = parseIPWithPort(ipInput);
    if (!parsed) return;

    setErrorMessage('');

    // If already connected to this console type, disconnect first
    if (connection?.type === consoleType) {
      await disconnect(consoleType);
    }

    const ok = await connect(consoleType, parsed.ip, parsed.port);
    if (!ok) {
      setErrorMessage(
        `Failed to connect to ${parsed.ip}. Check that ${consoleType === 'eos' ? 'OSC RX is enabled on the console' : 'the console is reachable'}.`,
      );
    }
  };

  const handleDisconnect = async () => {
    if (connection) {
      await disconnect(connection.type);
    }
  };

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  const ipValid = !ipError && ipInput.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[480px]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Connect to Console</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Console type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Console Type
            </label>
            <select
              value={consoleType}
              onChange={(e) => setConsoleType(e.target.value as ConsoleType)}
              disabled={isConnected || isConnecting}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60"
            >
              <option value="eos">ETC Eos Family (Eos, Ion, Gio, Element)</option>
              <option value="grandma2">GrandMA2 (coming soon)</option>
              <option value="grandma3">GrandMA3 (coming soon)</option>
            </select>
          </div>

          {/* IP address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Console IP Address
            </label>
            <input
              type="text"
              value={ipInput}
              onChange={(e) => {
                setIpInput(e.target.value);
                if (ipError) setIpError('');
                if (reachabilityWarning) setReachabilityWarning('');
                reachabilityChecked.current = '';
              }}
              onBlur={handleBlur}
              disabled={isConnected || isConnecting}
              placeholder="192.168.1.100 or 192.168.1.100:3032"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60"
            />
            {ipError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{ipError}</p>}
            {reachabilityWarning && !ipError && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                {reachabilityWarning}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {CONSOLE_HINTS[consoleType]}
            </p>
          </div>

          {/* Status banner */}
          {isConnected && connection && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-sm text-green-800 dark:text-green-400">
                Connected to {connection.ip}
              </span>
            </div>
          )}

          {errorMessage && <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
              Disconnect
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
              {isConnected ? 'Close' : 'Cancel'}
            </button>
            {!isConnected && (
              <button
                onClick={handleConnect}
                disabled={!ipValid || isConnecting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition text-sm"
              >
                {isConnecting ? 'Connecting…' : 'Connect'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
