export type CalfStatus = 'healthy' | 'warning' | 'critical' | 'offline';

export interface CalfData {
  id: string;
  name: string;
  tagMac: string;
  age: string;
  breed: string;
  status: CalfStatus;
  temperature: number;
  temperatureHistory: { time: string; value: number }[];
  activity: 'active' | 'resting' | 'inactive';
  motionState: 0 | 1; // from gateway: 0=still, 1=movement
  rssi: number;
  batteryMv: number;
  lastSeen: string;
  alerts: CalfAlert[];
  dailyActivityMinutes: number;
  dailyRestMinutes: number;
}

export interface CalfAlert {
  id: string;
  calfId: string;
  calfName: string;
  type: 'fever' | 'hypothermia' | 'inactive' | 'low_battery' | 'sos' | 'offline';
  message: string;
  severity: 'warning' | 'critical';
  timestamp: string;
  acknowledged: boolean;
}

export interface HerdStats {
  totalCalves: number;
  healthy: number;
  warnings: number;
  critical: number;
  offline: number;
  avgTemperature: number;
  activeAlerts: number;
}

// Simulates gateway scan_report data
export interface GatewayPacket {
  pkt_type: 'scan_report' | 'command' | 'response' | 'state';
  gw_addr: string;
  time: string;
  data: Record<string, unknown>;
}

const now = new Date();
const timeStr = (minutesAgo: number) => {
  const d = new Date(now.getTime() - minutesAgo * 60000);
  return d.toISOString().replace('T', ' ').slice(0, 19);
};

const tempHistory = (base: number): { time: string; value: number }[] =>
  Array.from({ length: 24 }, (_, i) => ({
    time: `${String(i).padStart(2, '0')}:00`,
    value: +(base + (Math.random() - 0.5) * 0.8).toFixed(1),
  }));

export const mockCalves: CalfData[] = [
  {
    id: 'calf-001', name: 'Daisy', tagMac: 'f0c812210801',
    age: '3 weeks', breed: 'Holstein', status: 'healthy',
    temperature: 38.6, temperatureHistory: tempHistory(38.6),
    activity: 'active', motionState: 1, rssi: -47, batteryMv: 3200,
    lastSeen: timeStr(1), alerts: [], dailyActivityMinutes: 340, dailyRestMinutes: 520,
  },
  {
    id: 'calf-002', name: 'Buttercup', tagMac: 'f0c812210802',
    age: '5 weeks', breed: 'Jersey', status: 'healthy',
    temperature: 38.4, temperatureHistory: tempHistory(38.4),
    activity: 'resting', motionState: 0, rssi: -55, batteryMv: 2900,
    lastSeen: timeStr(3), alerts: [], dailyActivityMinutes: 280, dailyRestMinutes: 580,
  },
  {
    id: 'calf-003', name: 'Clover', tagMac: 'f0c812210803',
    age: '2 weeks', breed: 'Angus', status: 'warning',
    temperature: 39.8, temperatureHistory: tempHistory(39.8),
    activity: 'resting', motionState: 0, rssi: -62, batteryMv: 3100,
    lastSeen: timeStr(5), alerts: [
      { id: 'a1', calfId: 'calf-003', calfName: 'Clover', type: 'fever', message: 'Temperature elevated: 39.8°C (threshold: 39.5°C)', severity: 'warning', timestamp: timeStr(5), acknowledged: false },
    ],
    dailyActivityMinutes: 180, dailyRestMinutes: 680,
  },
  {
    id: 'calf-004', name: 'Poppy', tagMac: 'f0c812210804',
    age: '1 week', breed: 'Hereford', status: 'critical',
    temperature: 40.3, temperatureHistory: tempHistory(40.3),
    activity: 'inactive', motionState: 0, rssi: -70, batteryMv: 2400,
    lastSeen: timeStr(2), alerts: [
      { id: 'a2', calfId: 'calf-004', calfName: 'Poppy', type: 'fever', message: 'High fever detected: 40.3°C', severity: 'critical', timestamp: timeStr(2), acknowledged: false },
      { id: 'a3', calfId: 'calf-004', calfName: 'Poppy', type: 'inactive', message: 'No movement detected for 4+ hours', severity: 'critical', timestamp: timeStr(120), acknowledged: false },
    ],
    dailyActivityMinutes: 60, dailyRestMinutes: 800,
  },
  {
    id: 'calf-005', name: 'Maple', tagMac: 'f0c812210805',
    age: '4 weeks', breed: 'Holstein', status: 'healthy',
    temperature: 38.5, temperatureHistory: tempHistory(38.5),
    activity: 'active', motionState: 1, rssi: -50, batteryMv: 3300,
    lastSeen: timeStr(1), alerts: [], dailyActivityMinutes: 360, dailyRestMinutes: 500,
  },
  {
    id: 'calf-006', name: 'Fern', tagMac: 'f0c812210806',
    age: '6 weeks', breed: 'Simmental', status: 'warning',
    temperature: 38.2, temperatureHistory: tempHistory(38.2),
    activity: 'resting', motionState: 0, rssi: -58, batteryMv: 2100,
    lastSeen: timeStr(8), alerts: [
      { id: 'a4', calfId: 'calf-006', calfName: 'Fern', type: 'low_battery', message: 'Tag battery low: 2100mV', severity: 'warning', timestamp: timeStr(30), acknowledged: false },
    ],
    dailyActivityMinutes: 250, dailyRestMinutes: 610,
  },
  {
    id: 'calf-007', name: 'Hazel', tagMac: 'f0c812210807',
    age: '3 weeks', breed: 'Charolais', status: 'offline',
    temperature: 0, temperatureHistory: [],
    activity: 'inactive', motionState: 0, rssi: 0, batteryMv: 0,
    lastSeen: timeStr(180), alerts: [
      { id: 'a5', calfId: 'calf-007', calfName: 'Hazel', type: 'offline', message: 'Tag offline — no signal for 3+ hours', severity: 'critical', timestamp: timeStr(180), acknowledged: false },
    ],
    dailyActivityMinutes: 0, dailyRestMinutes: 0,
  },
  {
    id: 'calf-008', name: 'Rosie', tagMac: 'f0c812210808',
    age: '2 weeks', breed: 'Jersey', status: 'healthy',
    temperature: 38.7, temperatureHistory: tempHistory(38.7),
    activity: 'active', motionState: 1, rssi: -45, batteryMv: 3400,
    lastSeen: timeStr(0), alerts: [], dailyActivityMinutes: 310, dailyRestMinutes: 550,
  },
];

export function getHerdStats(): HerdStats {
  const onlineCalves = mockCalves.filter(c => c.status !== 'offline');
  return {
    totalCalves: mockCalves.length,
    healthy: mockCalves.filter(c => c.status === 'healthy').length,
    warnings: mockCalves.filter(c => c.status === 'warning').length,
    critical: mockCalves.filter(c => c.status === 'critical').length,
    offline: mockCalves.filter(c => c.status === 'offline').length,
    avgTemperature: onlineCalves.length
      ? +(onlineCalves.reduce((s, c) => s + c.temperature, 0) / onlineCalves.length).toFixed(1)
      : 0,
    activeAlerts: mockCalves.flatMap(c => c.alerts).filter(a => !a.acknowledged).length,
  };
}

export function getAllAlerts(): CalfAlert[] {
  return mockCalves
    .flatMap(c => c.alerts)
    .sort((a, b) => (a.severity === 'critical' ? -1 : 1) - (b.severity === 'critical' ? -1 : 1));
}
