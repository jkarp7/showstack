import { useState } from 'react';
import { useConsoleStore } from '../../store/consoleStore';
import { logger } from '../../utils/logger';
import type { EosPatchChannel } from '../../types/console';

interface ImportedRow {
  channel: EosPatchChannel;
  conflict: boolean; // true if a fixture with matching channel already exists
}

interface Props {
  isOpen: boolean;
  /** Current project fixture channel numbers — used for conflict detection */
  existingChannels?: Set<number>;
  onImportApply: (channels: EosPatchChannel[]) => void;
  onClose: () => void;
}

type SyncDirection = 'import' | 'export';

export function ConsoleSyncDialog({ isOpen, existingChannels, onImportApply, onClose }: Props) {
  const { connection, status, setLastSync, setLastImport } = useConsoleStore();
  const [direction, setDirection] = useState<SyncDirection>('import');
  const [busy, setBusy] = useState(false);
  const [importRows, setImportRows] = useState<ImportedRow[] | null>(null);
  const [exportSent, setExportSent] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const isConnected = status === 'connected' && connection !== null;

  const handleImport = async () => {
    if (!isConnected || !connection) return;
    setBusy(true);
    setErrorMessage('');
    setImportRows(null);
    setExportSent(null);

    try {
      const result = await window.api.console.importPatch(connection.type);
      if (!result.success || !result.channels) {
        setErrorMessage(result.error ?? 'Import failed — no data received');
        return;
      }
      const rows: ImportedRow[] = result.channels.map((ch) => ({
        channel: ch,
        conflict: existingChannels?.has(ch.channelNumber) ?? false,
      }));
      setImportRows(rows);
      setLastImport(result.channels);
    } catch (error) {
      logger.error('Console import failed:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage('Import failed — see logs for details');
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    if (!isConnected || !connection) return;
    setBusy(true);
    setErrorMessage('');
    setImportRows(null);
    setExportSent(null);

    try {
      const fixtures = await window.api.fixtures.getAll();
      const result = await window.api.console.exportPatch(connection.type, fixtures);
      if (!result.success) {
        setErrorMessage(result.error ?? 'Export failed');
        return;
      }
      setExportSent(result.sent ?? 0);
      setLastSync(Date.now());
    } catch (error) {
      logger.error('Console export failed:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage('Export failed — see logs for details');
    } finally {
      setBusy(false);
    }
  };

  const handleApplyImport = () => {
    if (!importRows) return;
    const selected = importRows.map((r) => r.channel);
    onImportApply(selected);
    setLastSync(Date.now());
    onClose();
  };

  const conflictCount = importRows?.filter((r) => r.conflict).length ?? 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[700px] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Sync with {connection ? connection.ip : 'Console'}
          </h2>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!isConnected && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded text-sm border border-yellow-200 dark:border-yellow-800">
              Not connected to a console. Use the Connect button to establish a connection first.
            </div>
          )}

          {/* Direction toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setDirection('import');
                setImportRows(null);
                setExportSent(null);
                setErrorMessage('');
              }}
              className={`flex-1 py-2 px-4 rounded text-sm font-medium transition ${
                direction === 'import'
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Import Console → ShowStack
            </button>
            <button
              onClick={() => {
                setDirection('export');
                setImportRows(null);
                setExportSent(null);
                setErrorMessage('');
              }}
              className={`flex-1 py-2 px-4 rounded text-sm font-medium transition ${
                direction === 'export'
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Export ShowStack → Console
            </button>
          </div>

          {/* Direction description */}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {direction === 'import'
              ? 'Reads the full patch from the console and previews it below. You choose which channels to apply.'
              : 'Sends all ShowStack fixtures to the console as patch commands. Existing console patch may be overwritten.'}
          </p>

          {errorMessage && <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>}

          {/* Import preview */}
          {direction === 'import' && importRows !== null && (
            <div>
              {conflictCount > 0 && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-2">
                  {conflictCount} channel{conflictCount !== 1 ? 's' : ''} already exist in this
                  project and will be updated.
                </p>
              )}
              <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                        Ch
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                        Address
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                        Fixture
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                        Label
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((row) => (
                      <tr
                        key={row.channel.channelNumber}
                        className={`border-t border-gray-100 dark:border-gray-700 ${
                          row.conflict ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                        }`}
                      >
                        <td className="px-3 py-1.5 text-gray-900 dark:text-white">
                          {row.channel.channelNumber}
                        </td>
                        <td className="px-3 py-1.5 text-gray-500 dark:text-gray-400">
                          {row.channel.universe != null && row.channel.address != null
                            ? `${row.channel.universe}/${row.channel.address}`
                            : '—'}
                        </td>
                        <td className="px-3 py-1.5 text-gray-500 dark:text-gray-400">
                          {row.channel.fixtureType || '—'}
                        </td>
                        <td className="px-3 py-1.5 text-gray-500 dark:text-gray-400">
                          {row.channel.label || '—'}
                        </td>
                        <td className="px-3 py-1.5 text-yellow-600 dark:text-yellow-400 text-xs">
                          {row.conflict ? 'update' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {importRows.length} channel{importRows.length !== 1 ? 's' : ''} ready to import
              </p>
            </div>
          )}

          {/* Export result */}
          {direction === 'export' && exportSent !== null && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded text-sm border border-green-200 dark:border-green-800">
              Sent {exportSent} command{exportSent !== 1 ? 's' : ''} to console.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
          >
            Close
          </button>

          {direction === 'import' && importRows === null && (
            <button
              onClick={handleImport}
              disabled={!isConnected || busy}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition text-sm"
            >
              {busy ? 'Fetching patch…' : 'Fetch Patch from Console'}
            </button>
          )}

          {direction === 'import' && importRows !== null && (
            <button
              onClick={handleApplyImport}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition text-sm"
            >
              Apply Import ({importRows.length})
            </button>
          )}

          {direction === 'export' && exportSent === null && (
            <button
              onClick={handleExport}
              disabled={!isConnected || busy}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition text-sm"
            >
              {busy ? 'Sending…' : 'Send to Console'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
