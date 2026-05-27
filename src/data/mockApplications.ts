// Applications, Notifications & ActiveHomes — localStorage first + Supabase background.
// This file keeps the synchronous API used by the UI, but makes the important
// flow robust inside Figma Make: application -> accepted -> confirmed -> my-home.

import { Application, Notification, ActiveHome } from '../types/accommodation';
import { supabase } from '../lib/supabase';
import { getProperty, getRoom } from './mockProperties';

const PROPERTIES_REFRESH_EVENT = 'uniroom:properties-updated';

const APPLICATIONS_STORAGE_KEY = 'uniroom_applications';
const NOTIFICATIONS_STORAGE_KEY = 'uniroom_notifications';
const ACTIVE_HOMES_STORAGE_KEY = 'uniroom_active_homes';

// ─── Caches ────────────────────────────────────────────────────────────────

const applicationsCache = new Map<string, Application>();
const notificationsCache = new Map<string, Notification>();
const activeHomesCache = new Map<string, ActiveHome>();

let hydrated = false;
let hydratePromise: Promise<void> | null = null;

// ─── LocalStorage helpers ──────────────────────────────────────────────────

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
    id: value.id,
    userId: value.userId,
    accommodationId: value.accommodationId ?? value.propertyId ?? '',
    propertyId: value.propertyId,
    roomId: value.roomId,
    landlordId: value.landlordId,
    landlordName: value.landlordName,
    status: value.status,
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
    id: value.id,
    userId: value.userId,
    type: value.type,
    title: value.title,
    message: value.message ?? '',
    link: value.link,
    read: !!value.read,
    createdAt: toDate(value.createdAt),
  };
}

function normalizeActiveHome(value: any): ActiveHome {
  return {
    id: value.id,
    studentId: value.studentId,
    propertyId: value.propertyId,
    roomId: value.roomId,
    applicationId: value.applicationId ?? '',
    landlordId: value.landlordId,
    landlordName: value.landlordName ?? 'Senhorio',
    moveInDate: toDate(value.moveInDate),
    contractEndDate: toDate(value.contractEndDate),
    paymentDay: value.paymentDay ?? 5,
    createdAt: toDate(value.createdAt),
    propertyTitle: value.propertyTitle,
    roomTitle: value.roomTitle,
    monthlyRent: value.monthlyRent !== undefined ? Number(value.monthlyRent) : undefined,
    utilities: value.utilities !== undefined ? Number(value.utilities) : undefined,
  };
}

function loadLocalState(): void {
  const localApps = readLocalArray<any>(APPLICATIONS_STORAGE_KEY);
  const localNotifs = readLocalArray<any>(NOTIFICATIONS_STORAGE_KEY);
  const localHomes = readLocalArray<any>(ACTIVE_HOMES_STORAGE_KEY);

  applicationsCache.clear();
  localApps
    .filter(app => app?.id && app?.userId)
    .forEach(app => {
      const normalized = normalizeApplication(app);
      applicationsCache.set(normalized.id, normalized);
    });

  notificationsCache.clear();
  localNotifs
    .filter(notif => notif?.id && notif?.userId)
    .forEach(notif => {
      const normalized = normalizeNotification(notif);
      notificationsCache.set(normalized.id, normalized);
    });

  activeHomesCache.clear();
  localHomes
    .filter(home => home?.id && home?.studentId)
    .forEach(home => {
      const normalized = normalizeActiveHome(home);
      activeHomesCache.set(normalized.id, normalized);
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

function saveAllLocal(): void {
  saveApplicationsLocal();
  saveNotificationsLocal();
  saveActiveHomesLocal();
}

function mergeApplication(app: Application): void {
  const current = applicationsCache.get(app.id);

  if (!current) {
    applicationsCache.set(app.id, app);
    return;
  }

  /*
    localStorage wins when it has a more advanced status than Supabase,
    because Figma preview can reload before Supabase hydration catches up.
  */
  const localRank = getStatusRank(current.status);
  const remoteRank = getStatusRank(app.status);

  if (remoteRank > localRank) {
    applicationsCache.set(app.id, app);
    return;
  }

  if (remoteRank === localRank && app.updatedAt > current.updatedAt) {
    applicationsCache.set(app.id, app);
  }
}

function mergeActiveHome(home: ActiveHome): void {
  const current = activeHomesCache.get(home.id);

  if (!current || home.createdAt >= current.createdAt) {
    activeHomesCache.set(home.id, home);
  }
}

function mergeNotification(notification: Notification): void {
  const current = notificationsCache.get(notification.id);

  if (!current || notification.createdAt >= current.createdAt) {
    notificationsCache.set(notification.id, notification);
  }
}

function getStatusRank(status: Application['status']): number {
  const ranks: Record<Application['status'], number> = {
    pending: 1,
    under_review: 2,
    accepted: 3,
    confirmed: 4,
    rejected: 4,
    withdrawn: 4,
  };

  return ranks[status] ?? 0;
}

// ─── Supabase row mappers ──────────────────────────────────────────────────

function rowToApplication(row: any): Application {
  return {
    id: row.id,
    userId: row.user_id,
    accommodationId: row.property_id ?? row.room_id ?? '',
    propertyId: row.property_id ?? undefined,
    roomId: row.room_id ?? undefined,
    landlordId: row.landlord_id,
    landlordName: row.landlord_name ?? undefined,
    status: row.status,
    message: row.message ?? '',
    moveInDate: row.move_in_date ? new Date(row.move_in_date) : undefined,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
    confirmedAt: row.confirmed_at ? new Date(row.confirmed_at) : undefined,
    linkedCandidateId: row.linked_candidate_id ?? undefined,
    visitDate: row.visit_date ?? undefined,
    visitFormat: row.visit_format ?? undefined,
    visitNote: row.visit_note ?? undefined,
  };
}

function rowToNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message ?? '',
    link: row.link ?? undefined,
    read: !!row.read,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  };
}

function rowToActiveHome(row: any): ActiveHome {
  const room = row.room_id ? getRoom(row.room_id) : null;
  const property = row.property_id ? getProperty(row.property_id) : null;

  return {
    id: row.id,
    studentId: row.student_id,
    propertyId: row.property_id,
    roomId: row.room_id,
    applicationId: row.application_id ?? '',
    landlordId: row.landlord_id,
    landlordName: row.landlord_name ?? 'Senhorio',
    moveInDate: row.move_in_date ? new Date(row.move_in_date) : new Date(),
    contractEndDate: row.contract_end_date ? new Date(row.contract_end_date) : new Date(),
    paymentDay: row.payment_day ?? 5,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    propertyTitle: property?.title,
    roomTitle: room?.title,
    monthlyRent: row.monthly_rent ? Number(row.monthly_rent) : room?.price,
    utilities: row.utilities ? Number(row.utilities) : room?.utilities,
  };
}

// ─── Hydration ─────────────────────────────────────────────────────────────

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    /*
      1) Load localStorage immediately. This is the source of truth for the UI.
      2) Try Supabase in background.
      3) Merge Supabase data without deleting local confirmed homes.
    */
    loadLocalState();

    const [appsRes, notifsRes, homesRes] = await Promise.all([
      supabase.from('applications').select('*'),
      supabase.from('notifications').select('*'),
      supabase.from('active_homes').select('*'),
    ]);

    if (appsRes.error) {
      console.error('mockApplications hydrate apps:', appsRes.error.message);
    } else {
      (appsRes.data ?? []).forEach(row => mergeApplication(rowToApplication(row)));
    }

    if (notifsRes.error) {
      console.error('mockApplications hydrate notifs:', notifsRes.error.message);
    } else {
      (notifsRes.data ?? []).forEach(row => mergeNotification(rowToNotification(row)));
    }

    if (homesRes.error) {
      console.error('mockApplications hydrate homes:', homesRes.error.message);
    } else {
      (homesRes.data ?? []).forEach(row => mergeActiveHome(rowToActiveHome(row)));
    }

    saveAllLocal();
    hydrated = true;
  })();

  return hydratePromise;
}

loadLocalState();
void hydrate();

// ─── Persistence helpers ───────────────────────────────────────────────────

function notifyPropertiesUpdated(): void {
  window.dispatchEvent(new CustomEvent(PROPERTIES_REFRESH_EVENT));
}

function persistApp(id: string, patch: Record<string, unknown>): void {
  void supabase.from('applications').update(patch).eq('id', id).then(({ error }) => {
    if (error) console.error('Application persist error:', error.message);
  });
}

function insertApplication(app: Application): void {
  void supabase.from('applications').insert({
    id: app.id,
    user_id: app.userId,
    property_id: app.propertyId ?? null,
    room_id: app.roomId ?? null,
    landlord_id: app.landlordId,
    status: app.status,
    message: app.message,
    move_in_date: app.moveInDate ? app.moveInDate.toISOString().slice(0, 10) : null,
    linked_candidate_id: app.linkedCandidateId ?? null,
  }).then(({ error }) => {
    if (error) console.error('Application insert error:', error.message);
  });
}

function insertNotification(notif: Notification): void {
  void supabase.from('notifications').insert({
    id: notif.id,
    user_id: notif.userId,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    link: notif.link ?? null,
    read: notif.read,
  }).then(({ error }) => {
    if (error) console.error('Notification insert error:', error.message);
  });
}

function addNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  link?: string,
): void {
  const notif: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    userId,
    type,
    title,
    message,
    link,
    read: false,
    createdAt: new Date(),
  };

  notificationsCache.set(notif.id, notif);
  saveNotificationsLocal();
  insertNotification(notif);
}

function updateRoomInDb(roomId: string, patch: Record<string, unknown>): void {
  void supabase.from('rooms').update(patch).eq('id', roomId).then(({ error }) => {
    if (error) console.error('Room update error:', error.message);
    else notifyPropertiesUpdated();
  });
}

function insertActiveHome(home: ActiveHome): void {
  void supabase.from('active_homes').insert({
    id: home.id,
    student_id: home.studentId,
    property_id: home.propertyId,
    room_id: home.roomId,
    application_id: home.applicationId,
    landlord_id: home.landlordId,
    move_in_date: home.moveInDate.toISOString().slice(0, 10),
    contract_end_date: home.contractEndDate.toISOString().slice(0, 10),
    payment_day: home.paymentDay,
    monthly_rent: home.monthlyRent ?? null,
    utilities: home.utilities ?? null,
  }).then(({ error }) => {
    if (error) console.error('ActiveHome insert error:', error.message);
  });
}

function deleteActiveHomeFromDb(homeId: string): void {
  void supabase.from('active_homes').delete().eq('id', homeId).then(({ error }) => {
    if (error) console.error('ActiveHome delete error:', error.message);
  });
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

    applicationsCache.set(app.id, next);
    persistApp(app.id, { status: 'rejected', reviewed_at: next.reviewedAt!.toISOString() });

    addNotification(
      app.userId,
      'application_update',
      'Quarto reservado por outro candidato',
      'A tua candidatura foi encerrada porque o quarto foi reservado por outro candidato.',
      '/applications',
    );
  });

  saveApplicationsLocal();
}

// ─── Read API ─────────────────────────────────────────────────────────────

export function getApplicationsForUser(userId: string): Application[] {
  loadLocalState();

  return Array.from(applicationsCache.values())
    .filter(application => application.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getApplicationsForLandlord(landlordId: string): Application[] {
  loadLocalState();

  return Array.from(applicationsCache.values())
    .filter(application => application.landlordId === landlordId)
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
  insertApplication(newApp);

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

  const next = {
    ...app,
    linkedCandidateId,
    updatedAt: new Date(),
  };

  applicationsCache.set(applicationId, next);
  saveApplicationsLocal();
  persistApp(applicationId, { linked_candidate_id: linkedCandidateId });
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

  const patch: Record<string, unknown> = {
    status,
    updated_at: next.updatedAt.toISOString(),
  };

  if (shouldReview) patch.reviewed_at = reviewedAt!.toISOString();

  persistApp(applicationId, patch);

  if (status === 'accepted') {
    if (next.roomId) updateRoomInDb(next.roomId, { status: 'reserved', reserved_by: next.userId });
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

  const patch: Record<string, unknown> = {
    visit_date: visitDate,
    visit_format: visitFormat,
    visit_note: visitNote ?? null,
    updated_at: next.updatedAt.toISOString(),
  };

  if (shouldMoveToReview) {
    patch.status = 'under_review';
    patch.reviewed_at = next.reviewedAt!.toISOString();
  }

  persistApp(applicationId, patch);

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

  persistApp(applicationId, {
    status: 'confirmed',
    confirmed_at: confirmedAt.toISOString(),
    updated_at: next.updatedAt.toISOString(),
  });

  updateRoomInDb(app.roomId, {
    status: 'occupied',
    occupied_by: app.userId,
    reserved_by: null,
  });

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

  /*
    Produto real: o estudante só deve ter uma casa ativa.
    Substituímos qualquer active_home anterior imediatamente em localStorage.
  */
  for (const h of Array.from(activeHomesCache.values())) {
    if (h.studentId === app.userId) {
      activeHomesCache.delete(h.id);
      deleteActiveHomeFromDb(h.id);
    }
  }

  activeHomesCache.set(home.id, home);
  saveActiveHomesLocal();
  insertActiveHome(home);

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

  void supabase.from('notifications').update({ read: true }).eq('id', notificationId);

  return true;
}

export function markAllNotificationsAsRead(userId: string): void {
  loadLocalState();

  const ids: string[] = [];

  for (const [id, notification] of notificationsCache) {
    if (notification.userId === userId && !notification.read) {
      notificationsCache.set(id, {
        ...notification,
        read: true,
      });

      ids.push(id);
    }
  }

  saveNotificationsLocal();

  if (ids.length > 0) {
    void supabase.from('notifications').update({ read: true }).in('id', ids);
  }
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
      deleteActiveHomeFromDb(id);
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
  hydrated = false;
  hydratePromise = null;
  await hydrate();
}