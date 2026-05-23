import { Application, Notification, ActiveHome } from '../types/accommodation';

const APPLICATIONS_KEY = 'uniroom_applications';
const NOTIFICATIONS_KEY = 'uniroom_notifications';
const ACTIVE_HOMES_KEY = 'uniroom_active_homes';
const DATA_VERSION_KEY = 'uniroom_applications_version';
const CURRENT_VERSION = '2026-05-v3';

// ─── Initial data ─────────────────────────────────────────────────────────────

const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'app1',
    userId: '1',
    accommodationId: 'room-estgv-2',
    roomId: 'room-estgv-2',
    propertyId: 'prop-estgv',
    landlordId: '2',
    landlordName: 'Maria Santos',
    status: 'under_review',
    linkedCandidateId: 'lapp-demo-a',
    visitDate: '2026-05-28T15:00:00',
    visitFormat: 'presencial',
    visitNote: 'Encontremo-nos na entrada do edifício.',
    message: 'Olá! Sou estudante de Engenharia Informática no 2º ano na Universidade de Lisboa. Procuro um quarto tranquilo perto da faculdade. Sou organizado, respeitador e gosto de manter a casa limpa.',
    moveInDate: new Date('2026-09-01'),
    createdAt: new Date('2026-05-18'),
    updatedAt: new Date('2026-05-19'),
  },
  {
    id: 'app2',
    userId: '1',
    accommodationId: 'room-estgv-1',
    roomId: 'room-estgv-1',
    propertyId: 'prop-estgv',
    landlordId: '2',
    landlordName: 'Maria Santos',
    status: 'accepted',
    linkedCandidateId: 'lapp-demo-b',
    message: 'Boa tarde! Sou estudante de Informática e procuro alojamento a partir de setembro. Tenho horários flexíveis e gosto de um ambiente calmo para estudar.',
    moveInDate: new Date('2026-09-01'),
    createdAt: new Date('2026-04-10'),
    updatedAt: new Date('2026-05-22'),
    reviewedAt: new Date('2026-05-22'),
  },
  {
    id: 'app3',
    userId: '1',
    accommodationId: 'room-1',
    roomId: 'room-1',
    propertyId: 'prop-1',
    landlordId: '2',
    landlordName: 'Maria Santos',
    status: 'rejected',
    linkedCandidateId: 'lapp-demo-c',
    message: 'Olá! Interessado no quarto. Sou estudante responsável e procuro alojamento de longa duração.',
    moveInDate: new Date('2026-09-01'),
    createdAt: new Date('2026-04-08'),
    updatedAt: new Date('2026-04-09'),
    reviewedAt: new Date('2026-04-09'),
  },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif1',
    userId: '1',
    type: 'application_update',
    title: 'Candidatura aceite!',
    message: 'O senhorio aceitou a tua candidatura! Confirma a estadia em "As Minhas Candidaturas".',
    link: '/applications',
    read: false,
    createdAt: new Date('2026-05-22'),
  },
  {
    id: 'notif2',
    userId: '1',
    type: 'application_update',
    title: 'Visita agendada',
    message: 'O senhorio agendou uma visita para 28 de maio às 15h.',
    link: '/applications',
    read: false,
    createdAt: new Date('2026-05-19'),
  },
  {
    id: 'notif3',
    userId: '1',
    type: 'message',
    title: 'Nova mensagem',
    message: 'Recebeste uma mensagem do senhorio.',
    link: '/messages',
    read: true,
    createdAt: new Date('2026-04-14'),
  },
];

const INITIAL_ACTIVE_HOMES: ActiveHome[] = [];

// ─── Storage helpers ──────────────────────────────────────────────────────────

function initStorage() {
  const version = localStorage.getItem(DATA_VERSION_KEY);
  if (version !== CURRENT_VERSION) {
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(INITIAL_APPLICATIONS));
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem(ACTIVE_HOMES_KEY, JSON.stringify(INITIAL_ACTIVE_HOMES));
    localStorage.setItem(DATA_VERSION_KEY, CURRENT_VERSION);
  }
}

initStorage();

function readApplications(): Application[] {
  const stored = localStorage.getItem(APPLICATIONS_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((a: any) => ({
      ...a,
      moveInDate: a.moveInDate ? new Date(a.moveInDate) : undefined,
      createdAt: new Date(a.createdAt),
      updatedAt: new Date(a.updatedAt),
      reviewedAt: a.reviewedAt ? new Date(a.reviewedAt) : undefined,
      confirmedAt: a.confirmedAt ? new Date(a.confirmedAt) : undefined,
    }));
  } catch {
    return [];
  }
}

function saveApplications(apps: Application[]): void {
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
}

function readActiveHomes(): ActiveHome[] {
  const stored = localStorage.getItem(ACTIVE_HOMES_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((h: any) => ({
      ...h,
      moveInDate: new Date(h.moveInDate),
      contractEndDate: new Date(h.contractEndDate),
      createdAt: new Date(h.createdAt),
    }));
  } catch {
    return [];
  }
}

function saveActiveHomes(homes: ActiveHome[]): void {
  localStorage.setItem(ACTIVE_HOMES_KEY, JSON.stringify(homes));
}

// ─── Application CRUD ─────────────────────────────────────────────────────────

export function getApplicationsForUser(userId: string): Application[] {
  return readApplications().filter(a => a.userId === userId);
}

export function getApplicationsForLandlord(landlordId: string): Application[] {
  return readApplications().filter(a => a.landlordId === landlordId);
}

export function getApplicationById(id: string): Application | undefined {
  return readApplications().find(a => a.id === id);
}

export function getExistingApplicationForRoom(userId: string, roomId: string): Application | null {
  const all = readApplications();
  return all.find(a => a.userId === userId && a.roomId === roomId && a.status !== 'withdrawn') ?? null;
}

export function createApplication(
  userId: string,
  accommodationId: string,
  landlordId: string,
  message: string,
  moveInDate?: Date,
  metadata?: { roomId?: string; propertyId?: string; landlordName?: string; linkedCandidateId?: string }
): Application {
  const all = readApplications();

  const newApp: Application = {
    id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

  all.push(newApp);
  saveApplications(all);
  addNotification(userId, 'application_update', 'Candidatura enviada!', 'A tua candidatura foi enviada ao senhorio.', '/applications');
  return newApp;
}

export function updateApplicationLinkCandidateId(applicationId: string, linkedCandidateId: string): void {
  const all = readApplications();
  const idx = all.findIndex(a => a.id === applicationId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], linkedCandidateId };
    saveApplications(all);
  }
}

export function updateApplicationStatus(applicationId: string, status: string, note?: string): boolean {
  const all = readApplications();
  const idx = all.findIndex(a => a.id === applicationId);
  if (idx < 0) return false;

  all[idx] = {
    ...all[idx],
    status: status as any,
    updatedAt: new Date(),
    ...(status === 'accepted' || status === 'rejected' || status === 'under_review'
      ? { reviewedAt: new Date() }
      : {}),
  };
  saveApplications(all);

  const statusMessages: Record<string, string> = {
    accepted: 'O senhorio aceitou a tua candidatura! Confirma a estadia em "As Minhas Candidaturas".',
    rejected: 'A tua candidatura foi recusada pelo senhorio.',
    under_review: 'O senhorio está a analisar a tua candidatura.',
  };

  const titles: Record<string, string> = {
    accepted: 'Candidatura aceite!',
    rejected: 'Candidatura recusada',
    under_review: 'Candidatura em análise',
  };

  if (statusMessages[status]) {
    addNotification(
      all[idx].userId,
      'application_update',
      titles[status],
      note || statusMessages[status],
      status === 'accepted' ? '/applications' : '/applications',
    );
  }

  return true;
}

export function syncVisitData(
  applicationId: string,
  visitDate: string,
  visitFormat: 'presencial' | 'videochamada',
  visitNote?: string
): void {
  const all = readApplications();
  const idx = all.findIndex(a => a.id === applicationId);
  if (idx < 0) return;
  const wasAlreadyReviewing = all[idx].status !== 'pending';
  all[idx] = {
    ...all[idx],
    visitDate,
    visitFormat,
    visitNote: visitNote || undefined,
    updatedAt: new Date(),
    ...(wasAlreadyReviewing ? {} : { status: 'under_review' as const, reviewedAt: new Date() }),
  };
  saveApplications(all);

  const visitDateObj = new Date(visitDate);
  const dateStr = visitDateObj.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });
  const timeStr = visitDateObj.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  addNotification(
    all[idx].userId,
    'application_update',
    'Visita agendada',
    `O senhorio agendou uma visita para ${dateStr} às ${timeStr} (${visitFormat === 'videochamada' ? 'videochamada' : 'presencial'}).`,
    '/applications',
  );
}

export function confirmStay(applicationId: string): ActiveHome | null {
  const all = readApplications();
  const idx = all.findIndex(a => a.id === applicationId);
  if (idx < 0 || all[idx].status !== 'accepted') return null;

  const app = all[idx];
  if (!app.roomId || !app.propertyId) return null;

  all[idx] = {
    ...all[idx],
    status: 'confirmed',
    confirmedAt: new Date(),
    updatedAt: new Date(),
  };
  saveApplications(all);

  // Look up room/property in localStorage for rich fields
  let propertyTitle: string | undefined;
  let roomTitle: string | undefined;
  let monthlyRent: number | undefined;
  let utilities: number | undefined;

  try {
    const roomsStored = localStorage.getItem('uniroom_rooms');
    if (roomsStored) {
      const rooms = JSON.parse(roomsStored);
      const room = rooms.find((r: any) => r.id === app.roomId);
      if (room) {
        roomTitle = room.title;
        monthlyRent = room.price;
        utilities = room.utilities;
      }
    }
    const propsStored = localStorage.getItem('uniroom_properties');
    if (propsStored) {
      const props = JSON.parse(propsStored);
      const prop = props.find((p: any) => p.id === app.propertyId);
      if (prop) propertyTitle = prop.title;
    }
  } catch {
    // If lookup fails, proceed without rich fields
  }

  // Mark room as occupied in localStorage
  try {
    const roomsStored = localStorage.getItem('uniroom_rooms');
    if (roomsStored) {
      const rooms = JSON.parse(roomsStored);
      const rIdx = rooms.findIndex((r: any) => r.id === app.roomId);
      if (rIdx >= 0) {
        rooms[rIdx] = { ...rooms[rIdx], status: 'occupied', occupiedBy: app.userId };
        localStorage.setItem('uniroom_rooms', JSON.stringify(rooms));
      }
    }
  } catch {
    // proceed
  }

  const moveInDate = app.moveInDate || new Date('2026-09-01');
  const contractEndDate = new Date(moveInDate);
  contractEndDate.setMonth(contractEndDate.getMonth() + 10);

  const activeHome: ActiveHome = {
    id: `home_${Date.now()}`,
    studentId: app.userId,
    propertyId: app.propertyId,
    roomId: app.roomId,
    applicationId: app.id,
    landlordId: app.landlordId,
    landlordName: app.landlordName || 'Senhorio',
    moveInDate: moveInDate as Date,
    contractEndDate,
    paymentDay: 5,
    createdAt: new Date(),
    propertyTitle,
    roomTitle,
    monthlyRent,
    utilities,
  };

  const homes = readActiveHomes();
  const existingIdx = homes.findIndex(h => h.studentId === app.userId && h.propertyId === app.propertyId);
  if (existingIdx >= 0) {
    homes[existingIdx] = activeHome;
  } else {
    homes.push(activeHome);
  }
  saveActiveHomes(homes);

  addNotification(app.userId, 'application_update', 'Estadia confirmada!', 'Bem-vindo/a! A tua estadia foi confirmada com sucesso.', '/my-home');
  return activeHome;
}

export function withdrawApplication(applicationId: string): boolean {
  return updateApplicationStatus(applicationId, 'withdrawn');
}

// ─── Notifications ────────────────────────────────────────────────────────────

function addNotification(userId: string, type: Notification['type'], title: string, message: string, link?: string): void {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  const all: Notification[] = stored ? JSON.parse(stored) : [];
  all.push({
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    title,
    message,
    link,
    read: false,
    createdAt: new Date(),
  });
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
}

export function getNotificationsForUser(userId: string): Notification[] {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  const all: Notification[] = stored ? JSON.parse(stored) : [];
  return all
    .filter(n => n.userId === userId)
    .map(n => ({ ...n, createdAt: new Date(n.createdAt) }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getUnreadCount(userId: string): number {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  const all: Notification[] = stored ? JSON.parse(stored) : [];
  return all.filter(n => n.userId === userId && !n.read).length;
}

export function markNotificationAsRead(notificationId: string): boolean {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  const all: Notification[] = stored ? JSON.parse(stored) : [];
  const idx = all.findIndex(n => n.id === notificationId);
  if (idx < 0) return false;
  all[idx].read = true;
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
  return true;
}

export function markAllNotificationsAsRead(userId: string): void {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  const all: Notification[] = stored ? JSON.parse(stored) : [];
  all.forEach(n => { if (n.userId === userId) n.read = true; });
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
}

// ─── Active Homes ─────────────────────────────────────────────────────────────

export function getActiveHomeForStudent(studentId: string): ActiveHome | null {
  return readActiveHomes().find(h => h.studentId === studentId) ?? null;
}

export function removeActiveHome(studentId: string, propertyId: string, roomId: string): boolean {
  const homes = readActiveHomes();
  const filtered = homes.filter(h => !(h.studentId === studentId && h.propertyId === propertyId && h.roomId === roomId));
  if (filtered.length < homes.length) {
    saveActiveHomes(filtered);
    return true;
  }
  return false;
}
