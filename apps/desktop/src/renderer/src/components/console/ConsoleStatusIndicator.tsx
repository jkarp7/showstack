import { useConsoleStore } from '../../store/consoleStore';

interface Props {
  onClick?: () => void;
}

const STATUS_DOT: Record<string, string> = {
  connected: 'bg-green-500',
  connecting: 'bg-yellow-400 animate-pulse',
  error: 'bg-red-500',
  idle: 'bg-gray-400',
};

function formatLastSync(ts: number | null): string {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'synced just now';
  if (diff < 3_600_000) return `synced ${Math.floor(diff / 60_000)}m ago`;
  return `synced ${Math.floor(diff / 3_600_000)}h ago`;
}

export function ConsoleStatusIndicator({ onClick }: Props) {
  const { status, connection, lastSync } = useConsoleStore();

  if (status === 'idle' && !connection) return null;

  const dotClass = STATUS_DOT[status] ?? STATUS_DOT.idle;
  const label =
    status === 'connected' && connection
      ? `${connection.type.toUpperCase()} ${connection.ip}`
      : status === 'connecting'
        ? 'Connecting…'
        : status === 'error'
          ? 'Connection error'
          : 'Disconnected';

  const syncLabel = status === 'connected' ? formatLastSync(lastSync) : '';

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      title={`Console: ${label}${syncLabel ? ` — ${syncLabel}` : ''}`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
      <span className="font-medium">{label}</span>
      {syncLabel && <span className="text-gray-400 dark:text-gray-500">{syncLabel}</span>}
    </button>
  );
}
