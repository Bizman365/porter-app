export type StaffRole = 'Super' | 'Maintenance' | 'Porter';

export type CleaningArea =
  | 'lobby'
  | 'stairs'
  | 'hallway'
  | 'trash_room'
  | 'laundry_room'
  | 'elevator'
  | 'courtyard'
  | 'roof'
  | 'basement'
  | 'garage'
  | 'common_bathroom'
  | 'exterior';

export type CleaningLogStatus = 'checked_in' | 'in_progress' | 'completed';

export type CleaningLog = {
  id: string;
  porterId: string;
  buildingName: string;
  address: string;
  area: CleaningArea;
  status: CleaningLogStatus;
  checkedInAt: string; // ISO
  completedAt?: string;
  photos: CleaningPhoto[];
  notes?: string;
  qrScanId?: string;
};

export type CleaningPhoto = {
  id: string;
  uri: string;
  capturedAt: string; // ISO timestamp
  gpsLat?: number;
  gpsLng?: number;
  area: CleaningArea;
  deviceId?: string;
  photoHash?: string; // SHA-256 for tamper detection
  buildingId?: string;
  porterId: string;
  checkInId: string;
};

export type JanitorialItem = {
  id: string;
  name: string;
  category: 'cleaner' | 'tool' | 'supply' | 'equipment';
  unit: string; // 'bottle', 'box', 'roll', 'each'
  currentStock: number;
  minStock: number; // reorder threshold
  buildingId?: string;
};

export type RestockRequest = {
  id: number;
  requestedBy: string;
  requestedByName: string;
  buildingName: string;
  items: { itemId: string; itemName: string; quantity: number }[];
  status: 'Requested' | 'Approved' | 'Ordered' | 'Delivered';
  urgency: 'Routine' | 'Urgent';
  createdAtISO: string;
  notes?: string;
};

export type MockStaff = {
  id: string;
  name: string;
  role: StaffRole;
  buildings: string[];
};

export type JobPriority = 'Emergency' | 'Urgent' | 'Routine';
export type JobStatus = 'Scheduled' | 'En Route' | 'In Progress' | 'Paused' | 'Completed';

export type MockJob = {
  id: string;
  scheduleId?: number;
  requestId?: number; // links to tenant_requests.id
  startISO: string;
  endISO: string;
  buildingName: string;
  address: string;
  unit: string;
  tenantName: string;
  category: string;
  subcategory: string;
  priority: JobPriority;
  status: JobStatus;
  pauseReason?: string;
  description: string;
  tenantPhotoUris: string[];
  points: number;
  completedAtISO?: string;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  titleKey: string;
  descKey: string;
  unlocked: boolean;
};

export const mockStaff: MockStaff = {
  id: 'staff_001',
  name: 'Marcus Johnson',
  role: 'Super',
  buildings: ['121 West 18th St', '350 East 62nd St'],
};

export const mockPorterStaff: MockStaff = {
  id: 'staff_002',
  name: 'Diego Rivera',
  role: 'Porter',
  buildings: ['121 West 18th St', '350 East 62nd St'],
};

export function getActiveStaff() {
  // Toggle this to switch between Super and Porter views
  const USE_PORTER_DEMO = true;
  return USE_PORTER_DEMO ? mockPorterStaff : mockStaff;
}

function todayAt(hours: number, minutes: number) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function isoPlusMinutes(iso: string, minutes: number) {
  const base = new Date(iso);
  base.setMinutes(base.getMinutes() + minutes);
  return base.toISOString();
}

const j1Start = todayAt(8, 30);
const j2Start = todayAt(10, 0);
const j3Start = todayAt(12, 15);
const j4Start = todayAt(14, 0);
const j5Start = todayAt(16, 30);

export const mockTodayJobs: MockJob[] = [
  {
    id: 'job_1001',
    scheduleId: 1001,
    requestId: 5001,
    startISO: j1Start,
    endISO: isoPlusMinutes(j1Start, 60),
    buildingName: 'Chelsea Gardens',
    address: '121 West 18th St, New York, NY',
    unit: '7B',
    tenantName: 'Ava Martinez',
    category: 'Plumbing',
    subcategory: 'Leaky faucet',
    priority: 'Routine',
    status: 'Completed',
    description:
      'Kitchen sink faucet drips constantly. Tenant reports it worsens after using hot water. Please check cartridge and tighten connections.',
    tenantPhotoUris: ['https://picsum.photos/seed/leak/800/600'],
    points: 25,
    completedAtISO: isoPlusMinutes(j1Start, 55),
  },
  {
    id: 'job_1002',
    scheduleId: 1002,
    requestId: 5002,
    startISO: j2Start,
    endISO: isoPlusMinutes(j2Start, 90),
    buildingName: 'Chelsea Gardens',
    address: '121 West 18th St, New York, NY',
    unit: '12A',
    tenantName: 'Noah Williams',
    category: 'HVAC',
    subcategory: 'No heat',
    priority: 'Urgent',
    status: 'In Progress',
    description:
      'Bedroom radiator not heating. Tenant reports living room heats normally. Please inspect valve, bleeder, and thermostat controls.',
    tenantPhotoUris: ['https://picsum.photos/seed/radiator/800/600', 'https://picsum.photos/seed/thermostat/800/600'],
    points: 40,
  },
  {
    id: 'job_1003',
    scheduleId: 1003,
    requestId: 5003,
    startISO: j3Start,
    endISO: isoPlusMinutes(j3Start, 75),
    buildingName: 'East River Lofts',
    address: '350 East 62nd St, New York, NY',
    unit: '3C',
    tenantName: 'Olivia Chen',
    category: 'Electrical',
    subcategory: 'Outlet not working',
    priority: 'Urgent',
    status: 'Scheduled',
    description:
      'Two outlets in living room stopped working after plugging in a vacuum. Breakers appear normal per tenant. Check GFCI upstream.',
    tenantPhotoUris: ['https://picsum.photos/seed/outlet/800/600'],
    points: 45,
  },
  {
    id: 'job_1004',
    scheduleId: 1004,
    requestId: 5004,
    startISO: j4Start,
    endISO: isoPlusMinutes(j4Start, 120),
    buildingName: 'East River Lofts',
    address: '350 East 62nd St, New York, NY',
    unit: '9F',
    tenantName: 'Ethan Brooks',
    category: 'Appliances',
    subcategory: 'Dishwasher leaking',
    priority: 'Emergency',
    status: 'Scheduled',
    description:
      'Water pooling under dishwasher and spreading toward cabinetry. Tenant shut off dishwasher, but floor is wet. Please inspect hose and seal.',
    tenantPhotoUris: ['https://picsum.photos/seed/dishwasher/800/600'],
    points: 75,
  },
  {
    id: 'job_1005',
    scheduleId: 1005,
    requestId: 5005,
    startISO: j5Start,
    endISO: isoPlusMinutes(j5Start, 45),
    buildingName: 'Chelsea Gardens',
    address: '121 West 18th St, New York, NY',
    unit: '2D',
    tenantName: 'Sophia Patel',
    category: 'General',
    subcategory: 'Door alignment',
    priority: 'Routine',
    status: 'Scheduled',
    description:
      'Front door rubs on frame and doesn’t latch smoothly. Tenant requests adjustment so it closes quietly.',
    tenantPhotoUris: [],
    points: 30,
  },
];

function inDaysFrom(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export const mockAllJobs: MockJob[] = (() => {
  const base = [...mockTodayJobs];
  const upcoming: MockJob[] = base.map((j, idx) => {
    const delta = (idx % 5) + 1;
    const startISO = inDaysFrom(j.startISO, delta);
    const endISO = inDaysFrom(j.endISO, delta);
    return {
      ...j,
      id: `job_${2000 + idx}`,
      startISO,
      endISO,
      status: 'Scheduled',
      completedAtISO: undefined,
      points: Math.max(20, j.points - 5 + (idx % 4) * 5),
    };
  });

  const completed: MockJob[] = base.slice(0, 2).map((j, idx) => {
    const delta = (idx % 5) + 2;
    const startISO = inDaysFrom(j.startISO, -delta);
    const endISO = inDaysFrom(j.endISO, -delta);
    return {
      ...j,
      id: `job_${3000 + idx}`,
      startISO,
      endISO,
      status: 'Completed',
      completedAtISO: inDaysFrom(endISO, 0),
      points: j.points + 10,
    };
  });

  return [...base, ...upcoming, ...completed].sort(
    (a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime(),
  );
})();

export const mockPoints = {
  total: 1250,
  thisWeek: 25,
  streakDays: 4,
} as const;

export const mockAchievements: Achievement[] = [
  { id: 'ach_first', title: 'First Job', description: 'Complete your first job', titleKey: 'achievements.firstJob.title', descKey: 'achievements.firstJob.desc', unlocked: true },
  { id: 'ach_ten', title: '10 Jobs Complete', description: 'Hit 10 completed jobs', titleKey: 'achievements.tenJobs.title', descKey: 'achievements.tenJobs.desc', unlocked: true },
  { id: 'ach_week', title: 'Week Warrior', description: '5 days straight', titleKey: 'achievements.weekWarrior.title', descKey: 'achievements.weekWarrior.desc', unlocked: true },
  { id: 'ach_speed', title: 'Speed Demon', description: 'Finish under estimate', titleKey: 'achievements.speedDemon.title', descKey: 'achievements.speedDemon.desc', unlocked: false },
  { id: 'ach_perfect', title: 'Perfect Score', description: 'Get a 5-star review', titleKey: 'achievements.perfectScore.title', descKey: 'achievements.perfectScore.desc', unlocked: false },
  { id: 'ach_mentor', title: 'Mentor', description: 'Help a teammate close a job', titleKey: 'achievements.mentor.title', descKey: 'achievements.mentor.desc', unlocked: false },
  { id: 'ach_zero', title: 'Zero Backlog', description: 'Close all assigned jobs in a day', titleKey: 'achievements.zeroBacklog.title', descKey: 'achievements.zeroBacklog.desc', unlocked: false },
  { id: 'ach_scan', title: 'Scanner Pro', description: '20 QR check-ins', titleKey: 'achievements.scannerPro.title', descKey: 'achievements.scannerPro.desc', unlocked: false },
];

export type PurchaseRequestStatus = 'Requested' | 'Approved' | 'Ordered' | 'Delivered' | 'Installed';

export type MockPurchaseRequest = {
  id: number;
  requestedBy: string;
  requestedByName: string;
  requestId: number;
  workOrderId?: number;
  partName: string;
  estimatedCost: number;
  vendor?: string;
  urgency?: string;
  status: PurchaseRequestStatus;
  createdAtISO: string;
};

export const mockPurchaseRequests: MockPurchaseRequest[] = ([
  {
    id: 90001,
    requestedBy: 'staff_001',
    requestedByName: 'Marcus Johnson',
    requestId: 5003,
    workOrderId: 1003,
    partName: 'GFCI outlet (15A)',
    estimatedCost: 28.5,
    vendor: 'Home Depot',
    urgency: 'Urgent',
    status: 'Ordered',
    createdAtISO: inDaysFrom(j3Start, -1),
  },
  {
    id: 90002,
    requestedBy: 'staff_001',
    requestedByName: 'Marcus Johnson',
    requestId: 5001,
    workOrderId: 1001,
    partName: 'Faucet cartridge kit',
    estimatedCost: 19.99,
    vendor: 'Ferguson',
    urgency: 'Routine',
    status: 'Delivered',
    createdAtISO: inDaysFrom(j1Start, -3),
  },
  {
    id: 90003,
    requestedBy: 'staff_001',
    requestedByName: 'Marcus Johnson',
    requestId: 5004,
    workOrderId: 1004,
    partName: 'Dishwasher inlet hose',
    estimatedCost: 36.0,
    vendor: 'Grainger',
    urgency: 'Emergency',
    status: 'Approved',
    createdAtISO: inDaysFrom(j4Start, -2),
  },
  {
    id: 90004,
    requestedBy: 'staff_001',
    requestedByName: 'Marcus Johnson',
    requestId: 5005,
    workOrderId: 1005,
    partName: 'Door hinge shims',
    estimatedCost: 12.0,
    vendor: 'Amazon',
    urgency: 'Routine',
    status: 'Installed',
    createdAtISO: inDaysFrom(j5Start, -6),
  },
] as MockPurchaseRequest[]).sort((a, b) => new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime());

export type CleaningScheduleItem = {
  id: string;
  buildingId: string;
  buildingName: string;
  address: string;
  latitude: number;
  longitude: number;
  areas: CleaningArea[];
  dsnySchedule: DSNYSchedule;
  cleaningTasks: CleaningTask[];
  status: 'scheduled' | 'in_progress' | 'completed';
};

export type DSNYSchedule = {
  trash: string[]; // e.g. ['Mon', 'Wed', 'Fri']
  recycling: string[]; // e.g. ['Tue']
  compost: string[]; // e.g. ['Tue']
  setOutTime: string; // e.g. '8:00 PM'
  district: string; // e.g. 'MN04'
};

export type CleaningTask = {
  id: string;
  label: string;
  labelEs: string;
  icon: string; // emoji
  required: boolean;
};

function defaultCleaningTasks(input: { hasCommonBathroom: boolean }) {
  const tasks: CleaningTask[] = [
    { id: 'take_out_trash', label: 'Take out trash', labelEs: 'Sacar basura', icon: '🗑️', required: true },
    { id: 'take_out_recycling', label: 'Take out recycling', labelEs: 'Sacar reciclaje', icon: '♻️', required: false },
    { id: 'take_out_compost', label: 'Take out compost', labelEs: 'Sacar compost', icon: '🥬', required: false },
    { id: 'sweep_lobby', label: 'Sweep lobby', labelEs: 'Barrer vestíbulo', icon: '🧹', required: true },
    { id: 'sweep_stairs', label: 'Sweep stairs', labelEs: 'Barrer escaleras', icon: '🧹', required: true },
    { id: 'sweep_hallways', label: 'Sweep hallways', labelEs: 'Barrer pasillos', icon: '🧹', required: true },
    { id: 'mop_lobby', label: 'Mop lobby', labelEs: 'Trapear vestíbulo', icon: '🧼', required: true },
  ];

  if (input.hasCommonBathroom) {
    tasks.push({ id: 'clean_bathroom', label: 'Clean common bathroom', labelEs: 'Limpiar baño común', icon: '🚽', required: true });
  }

  tasks.push({ id: 'photo_evidence', label: 'Photo evidence', labelEs: 'Foto evidencia', icon: '📸', required: true });
  return tasks;
}

export const mockCleaningSchedule: CleaningScheduleItem[] = [
  {
    id: 'cs_001',
    buildingId: 'bldg_andrews_1705',
    buildingName: '1705 Andrews Ave S',
    address: '1705 Andrews Ave, Bronx, NY',
    latitude: 40.8537, longitude: -73.9013,
    areas: ['lobby', 'stairs', 'hallway', 'trash_room', 'elevator'],
    dsnySchedule: { trash: ['Tue', 'Thu', 'Sat'], recycling: ['Sat'], compost: ['Sat'], setOutTime: '8:00 PM', district: '205' },
    cleaningTasks: defaultCleaningTasks({ hasCommonBathroom: false }),
    status: 'in_progress',
  },
  {
    id: 'cs_002',
    buildingId: 'bldg_park_1939',
    buildingName: '1939 Park Pl',
    address: '1939 Park Pl, Brooklyn, NY',
    latitude: 40.6735, longitude: -73.9287,
    areas: ['lobby', 'hallway', 'laundry_room', 'common_bathroom'],
    dsnySchedule: { trash: ['Tue', 'Thu', 'Sat'], recycling: ['Thu'], compost: ['Thu'], setOutTime: '8:00 PM', district: '316' },
    cleaningTasks: defaultCleaningTasks({ hasCommonBathroom: true }),
    status: 'completed',
  },
  {
    id: 'cs_003',
    buildingId: 'bldg_115th_83',
    buildingName: '83 W 115th St',
    address: '83 W 115th St, New York, NY',
    latitude: 40.7992, longitude: -73.9526,
    areas: ['lobby', 'stairs', 'hallway', 'exterior'],
    dsnySchedule: { trash: ['Tue', 'Thu', 'Sat'], recycling: ['Thu'], compost: ['Thu'], setOutTime: '8:00 PM', district: '110' },
    cleaningTasks: defaultCleaningTasks({ hasCommonBathroom: false }),
    status: 'scheduled',
  },
  {
    id: 'cs_004',
    buildingId: 'bldg_southern_1355',
    buildingName: '1355 Southern Blvd',
    address: '1355 Southern Blvd, Bronx, NY',
    latitude: 40.8282, longitude: -73.8932,
    areas: ['lobby', 'elevator', 'courtyard', 'trash_room'],
    dsnySchedule: { trash: ['Mon', 'Wed', 'Fri'], recycling: ['Wed'], compost: ['Wed'], setOutTime: '8:00 PM', district: '203' },
    cleaningTasks: defaultCleaningTasks({ hasCommonBathroom: false }),
    status: 'scheduled',
  },
  {
    id: 'cs_005',
    buildingId: 'bldg_halsey_22',
    buildingName: '22 Halsey St',
    address: '22 Halsey St, Brooklyn, NY',
    latitude: 40.6865, longitude: -73.9547,
    areas: ['basement', 'trash_room', 'stairs', 'roof'],
    dsnySchedule: { trash: ['Tue', 'Thu', 'Sat'], recycling: ['Tue'], compost: ['Tue'], setOutTime: '8:00 PM', district: '303' },
    cleaningTasks: defaultCleaningTasks({ hasCommonBathroom: false }),
    status: 'scheduled',
  },
];

export const mockJanitorialInventory: JanitorialItem[] = [
  { id: 'jan_001', name: 'All-purpose cleaner', category: 'cleaner', unit: 'bottle', currentStock: 6, minStock: 4 },
  { id: 'jan_002', name: 'Glass cleaner', category: 'cleaner', unit: 'bottle', currentStock: 3, minStock: 4 },
  { id: 'jan_003', name: 'Mop heads', category: 'supply', unit: 'each', currentStock: 2, minStock: 3 },
  { id: 'jan_004', name: 'Garbage bags (33 gal)', category: 'supply', unit: 'box', currentStock: 4, minStock: 3 },
  { id: 'jan_005', name: 'Garbage bags (55 gal)', category: 'supply', unit: 'box', currentStock: 1, minStock: 2 },
  { id: 'jan_006', name: 'Bleach', category: 'cleaner', unit: 'bottle', currentStock: 5, minStock: 3 },
  { id: 'jan_007', name: 'Disinfectant spray', category: 'cleaner', unit: 'bottle', currentStock: 2, minStock: 4 },
  { id: 'jan_008', name: 'Paper towels', category: 'supply', unit: 'roll', currentStock: 14, minStock: 10 },
  { id: 'jan_009', name: 'Rubber gloves', category: 'supply', unit: 'box', currentStock: 2, minStock: 3 },
  { id: 'jan_010', name: 'Broom', category: 'tool', unit: 'each', currentStock: 2, minStock: 1 },
  { id: 'jan_011', name: 'Dustpan', category: 'tool', unit: 'each', currentStock: 1, minStock: 1 },
  { id: 'jan_012', name: 'Toilet bowl cleaner', category: 'cleaner', unit: 'bottle', currentStock: 2, minStock: 3 },
];

export const mockRestockRequests: RestockRequest[] = [
  {
    id: 91001,
    requestedBy: 'staff_002',
    requestedByName: 'Diego Rivera',
    buildingName: 'Chelsea Gardens',
    items: [
      { itemId: 'jan_005', itemName: 'Garbage bags (55 gal)', quantity: 2 },
      { itemId: 'jan_007', itemName: 'Disinfectant spray', quantity: 6 },
    ],
    status: 'Requested',
    urgency: 'Urgent',
    createdAtISO: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    notes: 'Running low for trash rooms and lobby touchpoints.',
  },
  {
    id: 91002,
    requestedBy: 'staff_002',
    requestedByName: 'Diego Rivera',
    buildingName: 'East River Lofts',
    items: [{ itemId: 'jan_003', itemName: 'Mop heads', quantity: 4 }],
    status: 'Approved',
    urgency: 'Routine',
    createdAtISO: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
  },
  {
    id: 91003,
    requestedBy: 'staff_002',
    requestedByName: 'Diego Rivera',
    buildingName: 'Midtown Terrace',
    items: [
      { itemId: 'jan_008', itemName: 'Paper towels', quantity: 12 },
      { itemId: 'jan_009', itemName: 'Rubber gloves', quantity: 3 },
    ],
    status: 'Ordered',
    urgency: 'Routine',
    createdAtISO: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    notes: 'Supply closet is almost empty on towels.',
  },
];

export const mockCleaningLogs: CleaningLog[] = (() => {
  const now = new Date();
  const baseDay = new Date(now);
  baseDay.setHours(9, 10, 0, 0);
  const first = baseDay.toISOString();
  const second = new Date(baseDay.getTime() + 1000 * 60 * 55).toISOString();
  const third = new Date(baseDay.getTime() + 1000 * 60 * 60 * 2 + 1000 * 60 * 20).toISOString();

  const porterId = mockPorterStaff.id;

  const makePhoto = (seed: string, capturedAt: string, area: CleaningArea, buildingId: string, checkInId: string): CleaningPhoto => ({
    id: `ph_${seed}`,
    uri: `https://picsum.photos/seed/${seed}/900/700`,
    capturedAt,
    gpsLat: 40.74 + (seed.length % 7) * 0.001,
    gpsLng: -73.99 - (seed.length % 5) * 0.001,
    area,
    deviceId: 'dev_mock_expo',
    photoHash: `sha256_mock_${seed.padEnd(12, '0')}`.slice(0, 24),
    buildingId,
    porterId,
    checkInId,
  });

  const l1CheckIn = `checkin_${new Date(first).getTime()}`;
  const l2CheckIn = `checkin_${new Date(second).getTime()}`;
  const l3CheckIn = `checkin_${new Date(third).getTime()}`;

  const buildingA = mockCleaningSchedule[1];
  const buildingB = mockCleaningSchedule[0];

  return [
    {
      id: 'cl_001',
      porterId,
      buildingName: buildingA.buildingName,
      address: buildingA.address,
      area: 'lobby',
      status: 'completed',
      checkedInAt: inDaysFrom(first, -1),
      completedAt: inDaysFrom(new Date(new Date(first).getTime() + 1000 * 60 * 35).toISOString(), -1),
      qrScanId: 'qr_bldg_eastriver_350e62',
      notes: 'Lobby mopped; glass doors wiped; trash removed.',
      photos: [
        makePhoto('eastriver_lobby_1', inDaysFrom(first, -1), 'lobby', buildingA.buildingId, l1CheckIn),
        makePhoto('eastriver_lobby_2', inDaysFrom(new Date(new Date(first).getTime() + 1000 * 60 * 8).toISOString(), -1), 'lobby', buildingA.buildingId, l1CheckIn),
      ],
    },
    {
      id: 'cl_002',
      porterId,
      buildingName: buildingA.buildingName,
      address: buildingA.address,
      area: 'common_bathroom',
      status: 'completed',
      checkedInAt: inDaysFrom(second, -2),
      completedAt: inDaysFrom(new Date(new Date(second).getTime() + 1000 * 60 * 28).toISOString(), -2),
      qrScanId: 'qr_bldg_eastriver_350e62',
      notes: 'Disinfected surfaces; restocked paper towels.',
      photos: [
        makePhoto('eastriver_bath_1', inDaysFrom(second, -2), 'common_bathroom', buildingA.buildingId, l2CheckIn),
      ],
    },
    {
      id: 'cl_003',
      porterId,
      buildingName: buildingB.buildingName,
      address: buildingB.address,
      area: 'trash_room',
      status: 'completed',
      checkedInAt: inDaysFrom(third, -5),
      completedAt: inDaysFrom(new Date(new Date(third).getTime() + 1000 * 60 * 24).toISOString(), -5),
      qrScanId: 'qr_bldg_chelsea_121w18',
      notes: 'Trash consolidated; floor scrubbed; deodorizer applied.',
      photos: [
        makePhoto('chelsea_trash_1', inDaysFrom(third, -5), 'trash_room', buildingB.buildingId, l3CheckIn),
        makePhoto('chelsea_trash_2', inDaysFrom(new Date(new Date(third).getTime() + 1000 * 60 * 6).toISOString(), -5), 'trash_room', buildingB.buildingId, l3CheckIn),
      ],
    },
    {
      id: 'cl_004',
      porterId,
      buildingName: buildingB.buildingName,
      address: buildingB.address,
      area: 'stairs',
      status: 'completed',
      checkedInAt: inDaysFrom(third, -6),
      completedAt: inDaysFrom(new Date(new Date(third).getTime() + 1000 * 60 * 18).toISOString(), -6),
      qrScanId: 'qr_bldg_chelsea_121w18',
      notes: 'Stairs swept and spot-cleaned.',
      photos: [
        makePhoto('chelsea_stairs_1', inDaysFrom(third, -6), 'stairs', buildingB.buildingId, `checkin_${new Date(third).getTime() + 1}`),
      ],
    },
  ];
})();
