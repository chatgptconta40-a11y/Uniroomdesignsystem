// Applications, Notifications & ActiveHomes — localStorage first.
// Safe version for Figma Make: no Supabase calls from this file, so the UI does not
// break because of missing/renamed Supabase columns while the product logic stays stable.

import { Application, Notification, ActiveHome } from '../types/accommodation';
import { getProperty, getRoom } from './mockProperties';

const PROPERTIES_REFRESH_EVENT = 'uniroom:properties-updated';

const APPLICATIONS_STORAGE_KEY = 'uniroom_applications';
const NOTIFICATIONS_STORAGE_KEY = 'uniroom_notifications';
const ACTIVE_HOMES_STORAGE_KEY = 'uniroom_active_homes';

const applicationsCache = new Map<string, Application>();
const notificationsCache = new Map<string, Notification>();
const activeHomesCache = new Map<string, ActiveHome>();

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function readLocalArray<T>(key: string): T[] {
  return safeParse<T[]>(localStorage.getItem(key), []);
}

function writeLocalArray<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function toDate(value: unknown, fallback = new Date()): Date {
  if (!value) return fallback;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function normalizeApplication(value: any): Application {
  return {
    id: String(value.id),
    userId: String(value.userId),
    accommodationId: String(value.accommodationId ?? value.propertyId ?? value.roomId ?? ''),
    roomId: value.roomId,
    propertyId: value.propertyId,
    landlordId: String(value.landlordId ?? ''),
    landlordName: value.landlordName,
    status: value.status ?? 'pending',
    message: value.message ?? '',
    moveInDate: value.moveInDate ? toDate(value.moveInDate) : undefined,
    createdAt: toDate(value.createdAt),
    updatedAt: toDate(value.updatedAt),
    reviewedAt: value.reviewedAt ? toDate(value.reviewedAt) : undefined,
    confirmedAt: value.confirmedAt ? toDate(value.confirmedAt) : undefined,
    linkedCandidateId: value.linkedCandidateId,
    visitDate: value.visitDate,
    visitFormat: value.visitFormat,
    visitNote: value.visitNote,
  };
}

function normalizeNotification(value: any): Notification {
  return {
    id: String(value.id),
    userId: String(value.userId),
    type: value.type ?? 'application_update',
    title: value.title ?? '',
    message: value.message ?? '',
    link: value.link,
    read: !!value.read,
    createdAt: toDate(value.createdAt),
  };
}

function normalizeActiveHome(value: any): ActiveHome {
  return {
    id: String(value.id),
    studentId: String(value.studentId),
    propertyId: String(value.propertyId),
    roomId: String(value.roomId),
    applicationId: String(value.applicationId ?? ''),
    landlordId: String(value.landlordId ?? ''),
    landlordName: value.landlordName ?? 'Senhorio',
    moveInDate: toDate(value.moveInDate),
    contractEndDate: toDate(value.contractEndDate),
    paymentDay: Number(value.paymentDay ?? 5),
    createdAt: toDate(value.createdAt),
    propertyTitle: value.propertyTitle,
    roomTitle: value.roomTitle,
    monthlyRent: value.monthlyRent !== undefined ? Number(value.monthlyRent) : undefined,
    utilities: value.utilities !== undefined ? Number(value.utilities) : undefined,
  };
}

function loadLocalState(): void {
  applicationsCache.clear();
  readLocalArray<any>(APPLICATIONS_STORAGE_KEY)
    .filter(item => item?.id && item?.userId)
    .forEach(item => {
      const app = normalizeApplication(item);
      applicationsCache.set(app.id, app);
    });

  notificationsCache.clear();
  readLocalArray<any>(NOTIFICATIONS_STORAGE_KEY)
    .filter(item => item?.id && item?.userId)
    .forEach(item => {
      const notification = normalizeNotification(item);
      notificationsCache.set(notification.id, notification);
    });

  activeHomesCache.clear();
  readLocalArray<any>(ACTIVE_HOMES_STORAGE_KEY)
    .filter(item => item?.id && item?.studentId)
    .forEach(item => {
      const home = normalizeActiveHome(item);
      activeHomesCache.set(home.id, home);
    });
}

function saveApplicationsLocal(): void {
  writeLocalArray(APPLICATIONS_STORAGE_KEY, Array.from(applicationsCache.values()));
}

function saveNotificationsLocal(): void {
  writeLocalArray(NOTIFICATIONS_STORAGE_KEY, Array.from(notificationsCache.values()));
}

function saveActiveHomesLocal(): void {
  writeLocalArray(ACTIVE_HOMES_STORAGE_KEY, Array.from(activeHomesCache.values()));
}

function notifyPropertiesUpdated(): void {
  window.dispatchEvent(new CustomEvent(PROPERTIES_REFRESH_EVENT));
}

function addNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  link?: string,
): void {
  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    userId,
    type,
    title,
    message,
    link,
    read: false,
    createdAt: new Date(),
  };

  notificationsCache.set(notification.id, notification);
  saveNotificationsLocal();
}

function rejectCompetingApplications(accepted: Application): void {
  const competing = Array.from(applicationsCache.values()).filter(app =>
    app.id !== accepted.id &&
    app.roomId === accepted.roomId &&
    app.propertyId === accepted.propertyId &&
    (app.status === 'pending' || app.status === 'under_review'),
  );

  competing.forEach(app => {
    const next: Application = {
      ...app,
      status: 'rejected',
      reviewedAt: new Date(),
      updatedAt: new Date(),
    };

    applicationsCache.set(next.id, next);

    addNotification(
      next.userId,
      'application_update',
      'Quarto reservado por outro candidato',
      'A tua candidatura foi encerrada porque o quarto foi reservado por outro candidato.',
      '/applications',
    );
  });

  saveApplicationsLocal();
}

loadLocalState();

// ─── Read API ─────────────────────────────────────────────────────────────

export function getApplicationsForUser(userId: string): Application[] {
  loadLocalState();

  return Array.from(applicationsCache.values())
    .filter(app => app.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getApplicationsForLandlord(landlordId: string): Application[] {
  loadLocalState();

  return Array.from(applicationsCache.values())
    .filter(app => app.landlordId === landlordId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getApplicationById(id: string): Application | undefined {
  loadLocalState();
  return applicationsCache.get(id);
}

export function getExistingApplicationForRoom(userId: string, roomId: string): Application | null {
  loadLocalState();

  return Array.from(applicationsCache.values()).find(app =>
    app.userId === userId &&
    app.roomId === roomId &&
    app.status !== 'withdrawn' &&
    app.status !== 'rejected',
  ) ?? null;
}

// ─── Write API ────────────────────────────────────────────────────────────

export function createApplication(
  userId: string,
  accommodationId: string,
  landlordId: string,
  message: string,
  moveInDate?: Date,
  metadata?: {
    roomId?: string;
    propertyId?: string;
    landlordName?: string;
    linkedCandidateId?: string;
  },
): Application {
  loadLocalState();

  const duplicate = Array.from(applicationsCache.values()).find(app =>
    app.userId === userId &&
    app.roomId === metadata?.roomId &&
    app.status !== 'withdrawn' &&
    app.status !== 'rejected',
  );

  if (duplicate) return duplicate;

  const id = `app_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const newApp: Application = {
    id,
    userId,
    accommodationId,
    roomId: metadata?.roomId,
    propertyId: metadata?.propertyId,
    landlordId,
    landlordName: metadata?.landlordName,
    linkedCandidateId: metadata?.linkedCandidateId,
    status: 'pending',
    message,
    moveInDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  applicationsCache.set(id, newApp);
  saveApplicationsLocal();

  addNotification(
    userId,
    'application_update',
    'Candidatura enviada!',
    'A tua candidatura foi enviada ao senhorio.',
    '/applications',
  );

  return newApp;
}

export function updateApplicationLinkCandidateId(applicationId: string, linkedCandidateId: string): void {
  loadLocalState();

  const app = applicationsCache.get(applicationId);
  if (!app) return;

  applicationsCache.set(applicationId, {
    ...app,
    linkedCandidateId,
    updatedAt: new Date(),
  });

  saveApplicationsLocal();
}

export function updateApplicationStatus(
  applicationId: string,
  status: Application['status'],
  note?: string,
): boolean {
  loadLocalState();

  const app = applicationsCache.get(applicationId);
  if (!app) return false;

  const previous = app.status;
  const shouldReview = status === 'accepted' || status === 'rejected' || status === 'under_review';
  const reviewedAt = shouldReview ? new Date() : app.reviewedAt;

  const next: Application = {
    ...app,
    status,
    updatedAt: new Date(),
    reviewedAt,
  };

  applicationsCache.set(applicationId, next);
  saveApplicationsLocal();

  if (status === 'accepted') {
    rejectCompetingApplications(next);
  }

  if (previous !== status) {
    const statusMessages: Record<string, string> = {
      accepted: 'O senhorio aceitou a tua candidatura! Confirma a estadia em "As Minhas Candidaturas".',
      rejected: 'A tua candidatura foi recusada pelo senhorio.',
      under_review: 'O senhorio está a analisar a tua candidatura.',
      withdrawn: 'A tua candidatura foi cancelada.',
      confirmed: 'A tua estadia foi confirmada com sucesso.',
    };

    const titles: Record<string, string> = {
      accepted: 'Candidatura aceite!',
      rejected: 'Candidatura recusada',
      under_review: 'Candidatura em análise',
      withdrawn: 'Candidatura cancelada',
      confirmed: 'Estadia confirmada!',
    };

    if (statusMessages[status]) {
      addNotification(
        next.userId,
        'application_update',
        titles[status],
        note || statusMessages[status],
        status === 'confirmed' ? '/my-home' : '/applications',
      );
    }
  }

  notifyPropertiesUpdated();

  return true;
}

export function syncVisitData(
  applicationId: string,
  visitDate: string,
  visitFormat: 'presencial' | 'videochamada',
  visitNote?: string,
): void {
  loadLocalState();

  const app = applicationsCache.get(applicationId);
  if (!app) return;

  const shouldMoveToReview = app.status === 'pending';

  const next: Application = {
    ...app,
    visitDate,
    visitFormat,
    visitNote: visitNote || undefined,
    updatedAt: new Date(),
    ...(shouldMoveToReview ? { status: 'under_review' as const, reviewedAt: new Date() } : {}),
  };

  applicationsCache.set(applicationId, next);
  saveApplicationsLocal();

  const d = new Date(visitDate);
  const dateStr = d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });
  const timeStr = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

  addNotification(
    next.userId,
    'application_update',
    'Visita agendada',
    `O senhorio agendou uma visita para ${dateStr} às ${timeStr} (${visitFormat === 'videochamada' ? 'videochamada' : 'presencial'}).`,
    '/applications',
  );
}

export function confirmStay(applicationId: string): ActiveHome | null {
  loadLocalState();

  const app = applicationsCache.get(applicationId);
  if (!app) return null;

  if (app.status === 'confirmed') {
    return getActiveHomeForStudent(app.userId);
  }

  if (app.status !== 'accepted') return null;
  if (!app.roomId || !app.propertyId) return null;

  const room = getRoom(app.roomId);
  const property = getProperty(app.propertyId);

  const moveInDate = app.moveInDate || new Date('2026-09-01');
  const contractEndDate = new Date(moveInDate);
  contractEndDate.setMonth(contractEndDate.getMonth() + 10);

  const confirmedAt = new Date();

  const next: Application = {
    ...app,
    status: 'confirmed',
    confirmedAt,
    updatedAt: new Date(),
  };

  applicationsCache.set(applicationId, next);
  saveApplicationsLocal();

  const home: ActiveHome = {
    id: `home_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    studentId: app.userId,
    propertyId: app.propertyId,
    roomId: app.roomId,
    applicationId: app.id,
    landlordId: app.landlordId,
    landlordName: app.landlordName || 'Senhorio',
    moveInDate,
    contractEndDate,
    paymentDay: 5,
    createdAt: new Date(),
    propertyTitle: property?.title,
    roomTitle: room?.title,
    monthlyRent: room?.price,
    utilities: room?.utilities,
  };

  for (const existingHome of Array.from(activeHomesCache.values())) {
    if (existingHome.studentId === app.userId) {
      activeHomesCache.delete(existingHome.id);
    }
  }

  activeHomesCache.set(home.id, home);
  saveActiveHomesLocal();

  addNotification(
    app.userId,
    'application_update',
    'Estadia confirmada!',
    'Bem-vindo/a! A tua estadia foi confirmada com sucesso.',
    '/my-home',
  );

  notifyPropertiesUpdated();

  return home;
}

export function withdrawApplication(applicationId: string): boolean {
  return updateApplicationStatus(applicationId, 'withdrawn');
}

// ─── Notifications ─────────────────────────────────────────────────────────

export function getNotificationsForUser(userId: string): Notification[] {
  loadLocalState();

  return Array.from(notificationsCache.values())
    .filter(notification => notification.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getUnreadCount(userId: string): number {
  loadLocalState();

  return Array.from(notificationsCache.values()).filter(
    notification => notification.userId === userId && !notification.read,
  ).length;
}

export function markNotificationAsRead(notificationId: string): boolean {
  loadLocalState();

  const notification = notificationsCache.get(notificationId);
  if (!notification) return false;

  notificationsCache.set(notificationId, {
    ...notification,
    read: true,
  });

  saveNotificationsLocal();
  return true;
}

export function markAllNotificationsAsRead(userId: string): void {
  loadLocalState();

  for (const [id, notification] of notificationsCache) {
    if (notification.userId === userId && !notification.read) {
      notificationsCache.set(id, {
        ...notification,
        read: true,
      });
    }
  }

  saveNotificationsLocal();
}

// ─── Active homes ──────────────────────────────────────────────────────────

export function getActiveHomeForStudent(studentId: string): ActiveHome | null {
  loadLocalState();

  return Array.from(activeHomesCache.values()).find(home => home.studentId === studentId) ?? null;
}

export function removeActiveHome(studentId: string, propertyId: string, roomId: string): boolean {
  loadLocalState();

  let removed = false;

  for (const [id, home] of activeHomesCache) {
    if (
      home.studentId === studentId &&
      home.propertyId === propertyId &&
      home.roomId === roomId
    ) {
      activeHomesCache.delete(id);
      removed = true;
    }
  }

  if (removed) {
    saveActiveHomesLocal();
    notifyPropertiesUpdated();
  }

  return removed;
}

export async function refreshApplicationsState(): Promise<void> {
  loadLocalState();
}

// ─── ID migration ──────────────────────────────────────────────────────────
// Called after login to recover data stored under an old local ID when
// Supabase had previously assigned a different UUID to the same email.

export function migrateActiveHomeByEmail(email: string, currentStudentId: string): void {
  if (!email || !currentStudentId) return;
  loadLocalState();

  // No migration needed if a home already exists under the current ID.
  if (Array.from(activeHomesCache.values()).some(h => h.studentId === currentStudentId)) return;

  let allUsers: any[] = [];
  try {
    allUsers = safeParse<any[]>(localStorage.getItem('uniroom_all_users'), []);
  } catch { return; }

  const normalizedEmail = String(email).toLowerCase();
  const oldIds = allUsers
    .filter(u => String(u.email || '').toLowerCase() === normalizedEmail && String(u.id) !== String(currentStudentId))
    .map(u => String(u.id));

  if (oldIds.length === 0) return;

  let migratedHomes = false;
  let migratedApps = false;
  let migratedNotifs = false;

  for (const [key, home] of activeHomesCache) {
    if (oldIds.includes(home.studentId)) {
      activeHomesCache.set(key, { ...home, studentId: currentStudentId });
      migratedHomes = true;
    }
  }

  for (const [key, app] of applicationsCache) {
    if (oldIds.includes(app.userId)) {
      applicationsCache.set(key, { ...app, userId: currentStudentId });
      migratedApps = true;
    }
  }

  for (const [key, notif] of notificationsCache) {
    if (oldIds.includes(notif.userId)) {
      notificationsCache.set(key, { ...notif, userId: currentStudentId });
      migratedNotifs = true;
    }
  }

  if (migratedHomes) saveActiveHomesLocal();
  if (migratedApps) saveApplicationsLocal();
  if (migratedNotifs) saveNotificationsLocal();
}
