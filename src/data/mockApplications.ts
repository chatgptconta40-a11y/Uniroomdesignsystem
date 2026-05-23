import { Application, Notification, ActiveHome } from '../types/accommodation';
import { getProperty, getRoom } from './mockProperties';

const APPLICATIONS_KEY = 'uniroom_applications';
const NOTIFICATIONS_KEY = 'uniroom_notifications';
const ACTIVE_HOMES_KEY = 'uniroom_active_homes';
const DATA_VERSION_KEY = 'uniroom_applications_version';
const CURRENT_VERSION = '2026-05-v4';

const LANDLORD_APPLICATIONS_KEY = 'uniroom_landlord_applications';
const ROOMS_KEY = 'uniroom_rooms';

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

    return parsed.map((app: any) => ({
      ...app,
      moveInDate: app.moveInDate ? new Date(app.moveInDate) : undefined,
      createdAt: new Date(app.createdAt),
      updatedAt: new Date(app.updatedAt),
      reviewedAt: app.reviewedAt ? new Date(app.reviewedAt) : undefined,
      confirmedAt: app.confirmedAt ? new Date(app.confirmedAt) : undefined,
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

    return parsed.map((home: any) => ({
      ...home,
      moveInDate: new Date(home.moveInDate),
      contractEndDate: new Date(home.contractEndDate),
      createdAt: new Date(home.createdAt),
    }));
  } catch {
    return [];
  }
}

function saveActiveHomes(homes: ActiveHome[]): void {
  localStorage.setItem(ACTIVE_HOMES_KEY, JSON.stringify(homes));
}

function addNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  link?: string,
): void {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  const all: Notification[] = stored ? JSON.parse(stored) : [];

  all.push({
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
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

function updateRoomStatusInStorage(
  roomId: string,
  updates: Record<string, unknown>,
): void {
  const stored = localStorage.getItem(ROOMS_KEY);

  if (!stored) return;

  try {
    const rooms = JSON.parse(stored);
    const idx = rooms.findIndex((room: any) => room.id === roomId);

    if (idx < 0) return;

    rooms[idx] = {
      ...rooms[idx],
      ...updates,
      updatedAt: new Date(),
    };

    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
  } catch {
    // Ignore invalid persisted mock data.
  }
}

function syncLandlordCandidatesFromApplication(
  application: Application,
  status: Application['status'],
): void {
  const stored = localStorage.getItem(LANDLORD_APPLICATIONS_KEY);

  if (!stored) return;

  try {
    const candidates = JSON.parse(stored);

    const updated = candidates.map((candidate: any) => {
      const sameStudentApplication =
        candidate.linkedStudentAppId === application.id ||
        (
          candidate.studentId === application.userId &&
          candidate.roomId === application.roomId &&
          candidate.propertyId === application.propertyId
        );

      if (sameStudentApplication) {
        if (status === 'withdrawn') {
          return { ...candidate, status: 'rejected' };
        }

        if (status === 'confirmed') {
          return { ...candidate, status: 'accepted' };
        }

        if (status === 'pending' || status === 'under_review' || status === 'accepted' || status === 'rejected') {
          return { ...candidate, status };
        }
      }

      if (
        status === 'accepted' &&
        candidate.id !== application.linkedCandidateId &&
        candidate.roomId === application.roomId &&
        candidate.propertyId === application.propertyId &&
        (candidate.status === 'pending' || candidate.status === 'under_review')
      ) {
        return { ...candidate, status: 'rejected' };
      }

      return candidate;
    });

    localStorage.setItem(LANDLORD_APPLICATIONS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore invalid persisted mock data.
  }
}

function rejectCompetingApplications(acceptedApplication: Application): Application[] {
  const all = readApplications();

  const updated = all.map(app => {
    const isCompeting =
      app.id !== acceptedApplication.id &&
      app.roomId === acceptedApplication.roomId &&
      app.propertyId === acceptedApplication.propertyId &&
      (app.status === 'pending' || app.status === 'under_review');

    if (!isCompeting) return app;

    addNotification(
      app.userId,
      'application_update',
      'Quarto reservado por outro candidato',
      'A tua candidatura foi encerrada porque o quarto foi reservado por outro candidato.',
      '/applications',
    );

    return {
      ...app,
      status: 'rejected' as const,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    };
  });

  saveApplications(updated);
  return updated;
}

export function getApplicationsForUser(userId: string): Application[] {
  return readApplications().filter(app => app.userId === userId);
}

export function getApplicationsForLandlord(landlordId: string): Application[] {
  return readApplications().filter(app => app.landlordId === landlordId);
}

export function getApplicationById(id: string): Application | undefined {
  return readApplications().find(app => app.id === id);
}

export function getExistingApplicationForRoom(userId: string, roomId: string): Application | null {
  return readApplications().find(app =>
    app.userId === userId &&
    app.roomId === roomId &&
    app.status !== 'withdrawn' &&
    app.status !== 'rejected',
  ) ?? null;
}

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
  const all = readApplications();

  const duplicate = all.find(app =>
    app.userId === userId &&
    app.roomId === metadata?.roomId &&
    app.status !== 'withdrawn' &&
    app.status !== 'rejected',
  );

  if (duplicate) return duplicate;

  const newApp: Application = {
    id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
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

  addNotification(
    userId,
    'application_update',
    'Candidatura enviada!',
    'A tua candidatura foi enviada ao senhorio.',
    '/applications',
  );

  return newApp;
}

export function updateApplicationLinkCandidateId(
  applicationId: string,
  linkedCandidateId: string,
): void {
  const all = readApplications();
  const idx = all.findIndex(app => app.id === applicationId);

  if (idx < 0) return;

  all[idx] = {
    ...all[idx],
    linkedCandidateId,
    updatedAt: new Date(),
  };

  saveApplications(all);
}

export function updateApplicationStatus(
  applicationId: string,
  status: Application['status'],
  note?: string,
): boolean {
  let all = readApplications();
  const idx = all.findIndex(app => app.id === applicationId);

  if (idx < 0) return false;

  const previousStatus = all[idx].status;
  const shouldReview = status === 'accepted' || status === 'rejected' || status === 'under_review';

  all[idx] = {
    ...all[idx],
    status,
    updatedAt: new Date(),
    ...(shouldReview ? { reviewedAt: new Date() } : {}),
  };

  saveApplications(all);

  if (status === 'accepted') {
    const acceptedApp = all[idx];

    if (acceptedApp.roomId) {
      updateRoomStatusInStorage(acceptedApp.roomId, {
        status: 'reserved',
        reservedBy: acceptedApp.userId,
      });
    }

    all = rejectCompetingApplications(acceptedApp);
    syncLandlordCandidatesFromApplication(acceptedApp, 'accepted');
  } else {
    syncLandlordCandidatesFromApplication(all[idx], status);
  }

  if (previousStatus === status) return true;

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
      all[idx].userId,
      'application_update',
      titles[status],
      note || statusMessages[status],
      status === 'confirmed' ? '/my-home' : '/applications',
    );
  }

  return true;
}

export function syncVisitData(
  applicationId: string,
  visitDate: string,
  visitFormat: 'presencial' | 'videochamada',
  visitNote?: string,
): void {
  const all = readApplications();
  const idx = all.findIndex(app => app.id === applicationId);

  if (idx < 0) return;

  const shouldMoveToReview = all[idx].status === 'pending';

  all[idx] = {
    ...all[idx],
    visitDate,
    visitFormat,
    visitNote: visitNote || undefined,
    updatedAt: new Date(),
    ...(shouldMoveToReview ? { status: 'under_review' as const, reviewedAt: new Date() } : {}),
  };

  saveApplications(all);

  const visitDateObj = new Date(visitDate);
  const dateStr = visitDateObj.toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
  });
  const timeStr = visitDateObj.toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  });

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
  const idx = all.findIndex(app => app.id === applicationId);

  if (idx < 0) return null;

  const app = all[idx];

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

  all[idx] = {
    ...app,
    status: 'confirmed',
    confirmedAt: new Date(),
    updatedAt: new Date(),
  };

  saveApplications(all);

  updateRoomStatusInStorage(app.roomId, {
    status: 'occupied',
    occupiedBy: app.userId,
    reservedBy: undefined,
  });

  const activeHome: ActiveHome = {
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

  const homes = readActiveHomes();
  const existingIdx = homes.findIndex(home => home.studentId === app.userId);

  if (existingIdx >= 0) {
    homes[existingIdx] = activeHome;
  } else {
    homes.push(activeHome);
  }

  saveActiveHomes(homes);
  syncLandlordCandidatesFromApplication(all[idx], 'confirmed');

  addNotification(
    app.userId,
    'application_update',
    'Estadia confirmada!',
    'Bem-vindo/a! A tua estadia foi confirmada com sucesso.',
    '/my-home',
  );

  return activeHome;
}

export function withdrawApplication(applicationId: string): boolean {
  return updateApplicationStatus(applicationId, 'withdrawn');
}

export function getNotificationsForUser(userId: string): Notification[] {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  const all: Notification[] = stored ? JSON.parse(stored) : [];

  return all
    .filter(notification => notification.userId === userId)
    .map(notification => ({
      ...notification,
      createdAt: new Date(notification.createdAt),
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getUnreadCount(userId: string): number {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  const all: Notification[] = stored ? JSON.parse(stored) : [];

  return all.filter(notification => notification.userId === userId && !notification.read).length;
}

export function markNotificationAsRead(notificationId: string): boolean {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  const all: Notification[] = stored ? JSON.parse(stored) : [];
  const idx = all.findIndex(notification => notification.id === notificationId);

  if (idx < 0) return false;

  all[idx].read = true;
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));

  return true;
}

export function markAllNotificationsAsRead(userId: string): void {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  const all: Notification[] = stored ? JSON.parse(stored) : [];

  all.forEach(notification => {
    if (notification.userId === userId) {
      notification.read = true;
    }
  });

  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
}

export function getActiveHomeForStudent(studentId: string): ActiveHome | null {
  return readActiveHomes().find(home => home.studentId === studentId) ?? null;
}

export function removeActiveHome(
  studentId: string,
  propertyId: string,
  roomId: string,
): boolean {
  const homes = readActiveHomes();
  const filtered = homes.filter(home =>
    !(home.studentId === studentId && home.propertyId === propertyId && home.roomId === roomId),
  );

  if (filtered.length === homes.length) return false;

  saveActiveHomes(filtered);
  return true;
}