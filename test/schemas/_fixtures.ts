/**
 * Valid baseline fixtures for every domain entity.
 *
 * Each fixture is a KNOWN-GOOD object that parses cleanly. Tests clone a fixture
 * and mutate a single field to prove that one constraint (bad uuid, out-of-enum,
 * negative where nonnegative required, etc.) is actually enforced. This keeps the
 * invalid cases surgical instead of "everything is wrong".
 */

// A syntactically valid v4 UUID reused everywhere we need one.
export const UUID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
export const UUID_2 = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

export const ISO_DATE = '2026-07-07';
export const ISO_DATETIME = '2026-07-07T09:30:00.000Z';
export const LOCAL_TIME = '21:00';

export const validProfile = {
  id: UUID,
  displayName: 'Craig',
  timezone: 'Africa/Nairobi',
  eveningThresholdLocal: LOCAL_TIME,
  createdAt: ISO_DATETIME,
};

export const validChallenge = {
  id: UUID,
  userId: UUID_2,
  name: '75 Hard',
  description: 'The faithful 75 Hard program.',
  durationDays: 75,
  startDate: ISO_DATE,
  strictness: 'strict' as const,
  freezeTokens: 0,
  isArchived: false,
  createdAt: ISO_DATETIME,
};

export const validRule = {
  id: UUID,
  challengeId: UUID_2,
  name: 'Drink 1 gallon of water',
  iconSlot: 'water' as const,
  type: 'quantity' as const,
  targetValue: 3.7,
  unit: 'L',
  frequency: 'daily' as const,
  frequencyCount: null,
  isRequired: true,
  sortOrder: 0,
};

export const validEntry = {
  id: UUID,
  userId: UUID_2,
  ruleId: UUID,
  entryDate: ISO_DATE,
  completed: true,
  value: 3.7,
  note: 'felt good',
  photoPath: 'user/uuid/2026-07-07.jpg',
  createdAt: ISO_DATETIME,
};

export const validChallengeReset = {
  id: UUID,
  challengeId: UUID_2,
  resetDate: ISO_DATE,
  reason: 'missed workout',
};

export const validTemplate = {
  id: UUID,
  userId: null,
  name: '75 Hard',
  description: 'System template.',
  durationDays: 75,
  strictness: 'strict' as const,
  isSystem: true,
  definition: {
    rules: [
      {
        name: 'Drink 1 gallon of water',
        iconSlot: 'water' as const,
        type: 'quantity' as const,
        targetValue: 3.7,
        unit: 'L',
        frequency: 'daily' as const,
        frequencyCount: null,
        isRequired: true,
        sortOrder: 0,
      },
    ],
  },
};

export const validVice = {
  id: UUID,
  userId: UUID_2,
  name: 'Cigarettes',
  quitDate: ISO_DATE,
  reason: 'health',
  triggers: 'stress',
  costPerUnit: 0.5,
  timePerUnitMinutes: 5,
  unitLabel: 'cigarette',
  isArchived: false,
};

export const validRelapse = {
  id: UUID,
  viceId: UUID_2,
  relapseDate: ISO_DATE,
  note: 'stressful day',
};

export const validQuote = {
  id: UUID,
  text: 'You have power over your mind, not outside events.',
  author: 'Marcus Aurelius',
  source: 'Meditations',
  category: 'daily' as const,
};

export const validPushSubscription = {
  id: UUID,
  userId: UUID_2,
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
  keys: { p256dh: 'BKp...', auth: 'x1y2z3' },
  userAgent: 'Mozilla/5.0',
  createdAt: ISO_DATETIME,
};

export const validNotificationPrefs = {
  userId: UUID,
  pushEnabled: true,
  emailEnabled: false,
  quietStartLocal: '22:00',
  quietEndLocal: '07:00',
};
