// Applications, Notifications & ActiveHomes — backed by Supabase.
// Preserves the original synchronous API via in-memory caches that hydrate
// on first import. Writes update the cache immediately and persist async.

import { Application, Notification, ActiveHome } from '../types/accommodation';
import { supabase } from '../lib/supabase';
import { getProperty, getRoom } from './mockProperties';

const PROPERTIES_REFRESH_EVENT = 'uniroom:properties-updated';

// ─── Caches ────────────────────────────────────────────────────────────────
const applicationsCache = new Map<string, Application>();
const notificationsCache = new Map<string, Notification>();
const activeHomesCache = new Map<string, ActiveHome>();

let hydrated = false;
let hydratePromise: Promise<void> | null = null;

function rowToApplication(row: any): Application {
  return {
    id: row.id,
    userId: row.user_id,
    accommodationId: row.property_id ?? '',
    propertyId: row.property_id ?? undefined,
    roomId: row.room_id ?? undefined,
    landlordId: row.landlord_id,
    landlordName: row.landlord_name ?? undefined,
    status: row.status,
    message: row.message ?? '',
    moveInDate: row.move_in_date ? new Date(row.move_in_date) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
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
    createdAt: new Date(row.created_at),
  };
}

function rowToActiveHome(row: any): ActiveHome {
  return {
    id: row.id,
    studentId: row.student_id,
    propertyId: row.property_id,
    roomId: row.room_id,
    applicationId: row.application_id ?? '',
    landlordId: row.landlord_id,
    landlordName: '',
    moveInDate: new Date(row.move_in_date),
    contractEndDate: row.contract_end_date ? new Date(row.contract_end_date) : new Date(),
    paymentDay: row.payment_day ?? 1,
    createdAt: new Date(row.created_at),
    monthlyRent: row.monthly_rent ? Number(row.monthly_rent) : undefined,
    utilities: row.utilities ? Number(row.utilities) : undefined,
  };
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    const [appsRes, notifsRes, homesRes] = await Promise.all([
      supabase.from('applications').select('*'),
      supabase.from('notifications').select('*'),
      supabase.from('active_homes').select('*'),
    ]);
    if (appsRes.error) console.error('mockApplications hydrate apps:', appsRes.error.message);
    if (notifsRes.error) console.error('mockApplications hydrate notifs:', notifsRes.error.message);
    if (homesRes.error) console.error('mockApplications hydrate homes:', homesRes.error.message);

    applicationsCache.clear();
    (appsRes.data ?? []).forEach(r => applicationsCache.set(r.id, rowToApplication(r)));
    notificationsCache.clear();
    (notifsRes.data ?? []).forEach(r => notificationsCache.set(r.id, rowToNotification(r)));
    activeHomesCache.clear();
    (homesRes.data ?? []).forEach(r => activeHomesCache.set(r.id, rowToActiveHome(r)));
    hydrated = true;
  })();
  return hydratePromise;
}

void hydrate();

function notifyPropertiesUpdated(): void {
  window.dispatchEvent(new CustomEvent(PROPERTIES_REFRESH_EVENT));
}

function persistApp(id: string, patch: Record<string, unknown>): void {
  void supabase.from('applications').update(patch).eq('id', id).then(({ error }) => {
    if (error) console.error('Application persist error:', error.message);
  });
}

function insertNotification(notif: Notification): void {
  void supabase.from('notifications').insert({
    id: notif.id, user_id: notif.userId, type: notif.type,
    title: notif.title, message: notif.message, link: notif.link ?? null, read: notif.read,
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
    userId, type, title, message, link, read: false, createdAt: new Date(),
  };
  notificationsCache.set(notif.id, notif);
  insertNotification(notif);
}

function updateRoomInDb(roomId: string, patch: Record<string, unknown>): void {
  void supabase.from('rooms').update(patch).eq('id', roomId).then(({ error }) => {
    if (error) console.error('Room update error:', error.message);
    else notifyPropertiesUpdated();
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
    const next: Application = { ...app, status: 'rejected', reviewedAt: new Date(), updatedAt: new Date() };
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
}

// ─── Read API ─────────────────────────────────────────────────────────────

export function getApplicationsForUser(userId: string): Application[] {
  return Array.from(applicationsCache.values()).filter(a => a.userId === userId);
}

export function getApplicationsForLandlord(landlordId: string): Application[] {
  return Array.from(applicationsCache.values()).filter(a => a.landlordId === landlordId);
}

export function getApplicationById(id: string): Application | undefined {
  return applicationsCache.get(id);
}

export function getExistingApplicationForRoom(userId: string, roomId: string): Application | null {
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
  const dup = Array.from(applicationsCache.values()).find(app =>
    app.userId === userId &&
    app.roomId === metadata?.roomId &&
    app.status !== 'withdrawn' &&
    app.status !== 'rejected',
  );
  if (dup) return dup;

  const id = `app_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const newApp: Application = {
    id, userId, accommodationId,
    roomId: metadata?.roomId, propertyId: metadata?.propertyId,
    landlordId, landlordName: metadata?.landlordName,
    linkedCandidateId: metadata?.linkedCandidateId,
    status: 'pending', message, moveInDate,
    createdAt: new Date(), updatedAt: new Date(),
  };
  applicationsCache.set(id, newApp);

  void supabase.from('applications').insert({
    id, user_id: userId,
    property_id: metadata?.propertyId ?? null,
    room_id: metadata?.roomId ?? null,
    landlord_id: landlordId, status: 'pending', message,
    move_in_date: moveInDate ? moveInDate.toISOString().slice(0, 10) : null,
    linked_candidate_id: metadata?.linkedCandidateId ?? null,
  }).then(({ error }) => {
    if (error) console.error('Application insert error:', error.message);
  });

  addNotification(userId, 'application_update', 'Candidatura enviada!',
    'A tua candidatura foi enviada ao senhorio.', '/applications');

  return newApp;
}

export function updateApplicationLinkCandidateId(applicationId: string, linkedCandidateId: string): void {
  const app = applicationsCache.get(applicationId);
  if (!app) return;
  const next = { ...app, linkedCandidateId, updatedAt: new Date() };
  applicationsCache.set(applicationId, next);
  persistApp(applicationId, { linked_candidate_id: linkedCandidateId });
}

export function updateApplicationStatus(
  applicationId: string,
  status: Application['status'],
  note?: string,
): boolean {
  const app = applicationsCache.get(applicationId);
  if (!app) return false;
  const previous = app.status;
  const shouldReview = status === 'accepted' || status === 'rejected' || status === 'under_review';
  const reviewedAt = shouldReview ? new Date() : app.reviewedAt;
  const next: Application = { ...app, status, updatedAt: new Date(), reviewedAt };
  applicationsCache.set(applicationId, next);

  const patch: Record<string, unknown> = { status };
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
      addNotification(next.userId, 'application_update', titles[status],
        note || statusMessages[status],
        status === 'confirmed' ? '/my-home' : '/applications');
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
  const app = applicationsCache.get(applicationId);
  if (!app) return;
  const shouldMoveToReview = app.status === 'pending';
  const next: Application = {
    ...app, visitDate, visitFormat, visitNote: visitNote || undefined,
    updatedAt: new Date(),
    ...(shouldMoveToReview ? { status: 'under_review', reviewedAt: new Date() } : {}),
  };
  applicationsCache.set(applicationId, next);

  const patch: Record<string, unknown> = {
    visit_date: visitDate, visit_format: visitFormat,
    visit_note: visitNote ?? null,
  };
  if (shouldMoveToReview) {
    patch.status = 'under_review';
    patch.reviewed_at = next.reviewedAt!.toISOString();
  }
  persistApp(applicationId, patch);

  const d = new Date(visitDate);
  const dateStr = d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });
  const timeStr = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  addNotification(next.userId, 'application_update', 'Visita agendada',
    `O senhorio agendou uma visita para ${dateStr} às ${timeStr} (${visitFormat === 'videochamada' ? 'videochamada' : 'presencial'}).`,
    '/applications');
}

export function confirmStay(applicationId: string): ActiveHome | null {
  const app = applicationsCache.get(applicationId);
  if (!app) return null;
  if (app.status === 'confirmed') return getActiveHomeForStudent(app.userId);
  if (app.status !== 'accepted') return null;
  if (!app.roomId || !app.propertyId) return null;

  const room = getRoom(app.roomId);
  const property = getProperty(app.propertyId);

  const moveInDate = app.moveInDate || new Date('2026-09-01');
  const contractEndDate = new Date(moveInDate);
  contractEndDate.setMonth(contractEndDate.getMonth() + 10);

  const confirmedAt = new Date();
  const next: Application = { ...app, status: 'confirmed', confirmedAt, updatedAt: new Date() };
  applicationsCache.set(applicationId, next);
  persistApp(applicationId, { status: 'confirmed', confirmed_at: confirmedAt.toISOString() });

  updateRoomInDb(app.roomId, { status: 'occupied', occupied_by: app.userId, reserved_by: null });

  const home: ActiveHome = {
    id: `home_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    studentId: app.userId, propertyId: app.propertyId, roomId: app.roomId,
    applicationId: app.id, landlordId: app.landlordId,
    landlordName: app.landlordName || 'Senhorio',
    moveInDate, contractEndDate, paymentDay: 5, createdAt: new Date(),
    propertyTitle: property?.title, roomTitle: room?.title,
    monthlyRent: room?.price, utilities: room?.utilities,
  };

  // Replace existing home for this student if any
  for (const h of Array.from(activeHomesCache.values())) {
    if (h.studentId === app.userId) {
      activeHomesCache.delete(h.id);
      void supabase.from('active_homes').delete().eq('id', h.id);
    }
  }
  activeHomesCache.set(home.id, home);
  void supabase.from('active_homes').insert({
    id: home.id, student_id: home.studentId, property_id: home.propertyId,
    room_id: home.roomId, application_id: home.applicationId,
    landlord_id: home.landlordId,
    move_in_date: home.moveInDate.toISOString().slice(0, 10),
    contract_end_date: home.contractEndDate.toISOString().slice(0, 10),
    payment_day: home.paymentDay,
    monthly_rent: home.monthlyRent ?? null,
    utilities: home.utilities ?? null,
  }).then(({ error }) => {
    if (error) console.error('ActiveHome insert error:', error.message);
  });

  addNotification(app.userId, 'application_update', 'Estadia confirmada!',
    'Bem-vindo/a! A tua estadia foi confirmada com sucesso.', '/my-home');

  return home;
}

export function withdrawApplication(applicationId: string): boolean {
  return updateApplicationStatus(applicationId, 'withdrawn');
}

// ─── Notifications ─────────────────────────────────────────────────────────

export function getNotificationsForUser(userId: string): Notification[] {
  return Array.from(notificationsCache.values())
    .filter(n => n.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getUnreadCount(userId: string): number {
  return Array.from(notificationsCache.values()).filter(n => n.userId === userId && !n.read).length;
}

export function markNotificationAsRead(notificationId: string): boolean {
  const n = notificationsCache.get(notificationId);
  if (!n) return false;
  notificationsCache.set(notificationId, { ...n, read: true });
  void supabase.from('notifications').update({ read: true }).eq('id', notificationId);
  return true;
}

export function markAllNotificationsAsRead(userId: string): void {
  const ids: string[] = [];
  for (const [id, n] of notificationsCache) {
    if (n.userId === userId && !n.read) {
      notificationsCache.set(id, { ...n, read: true });
      ids.push(id);
    }
  }
  if (ids.length > 0) {
    void supabase.from('notifications').update({ read: true }).in('id', ids);
  }
}

// ─── Active homes ──────────────────────────────────────────────────────────

export function getActiveHomeForStudent(studentId: string): ActiveHome | null {
  return Array.from(activeHomesCache.values()).find(h => h.studentId === studentId) ?? null;
}

export function removeActiveHome(studentId: string, propertyId: string, roomId: string): boolean {
  let removed = false;
  for (const [id, h] of activeHomesCache) {
    if (h.studentId === studentId && h.propertyId === propertyId && h.roomId === roomId) {
      activeHomesCache.delete(id);
      void supabase.from('active_homes').delete().eq('id', id);
      removed = true;
    }
  }
  return removed;
}

export async function refreshApplicationsState(): Promise<void> {
  hydrated = false;
  hydratePromise = null;
  await hydrate();
}
