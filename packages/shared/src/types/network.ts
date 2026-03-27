export interface PortStatusResult {
  equipment_id: string;
  ip: string;
  status: 'reachable' | 'unreachable' | 'timeout';
  latency_ms?: number;
  last_checked: number;
}
