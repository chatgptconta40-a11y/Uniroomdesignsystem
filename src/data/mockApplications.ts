import { Application, Notification } from '../types/accommodation';

const APPLICATIONS_STORAGE_KEY = 'uniroom_applications';
const NOTIFICATIONS_STORAGE_KEY = 'uniroom_notifications';

const initialApplications: Application[] = [
  {
    id: 'app1',
    userId: '1',
    accommodationId: '1',
    landlordId: '2',
    status: 'under_review',
    message: 'Olá! Sou estudante de Gestão no 2º ano na ESTGV. Procuro um quarto tranquilo perto da faculdade. Sou organizado, respeitador e gosto de manter a casa limpa. Estou muito interessado neste alojamento pela proximidade à universidade e pelo bom ambiente que descrevem.',
    moveInDate: new Date('2026-09-01'),
    createdAt: new Date('2026-04-15'),
    updatedAt: new Date('2026-04-16'),
  },
  {
    id: 'app2',
    userId: '1',
    accommodationId: '3',
    landlordId: '2',
    status: 'accepted',
    message: 'Boa tarde! Sou estudante de Informática e procuro alojamento a partir de setembro. Tenho horários flexíveis e gosto de um ambiente calmo para estudar.',
    moveInDate: new Date('2026-09-01'),
    createdAt: new Date('2026-04-10'),
    updatedAt: new Date('2026-04-12'),
    reviewedAt: new Date('2026-04-12'),
  },
  {
    id: 'app3',
    userId: '1',
    accommodationId: '5',
    landlordId: '2',
    status: 'rejected',
    message: 'Olá! Interessado no quarto. Sou estudante responsável e procuro alojamento de longa duração.',
    moveInDate: new Date('2026-09-01'),
    createdAt: new Date('2026-04-08'),
    updatedAt: new Date('2026-04-09'),
    reviewedAt: new Date('2026-04-09'),
  },
];

const initialNotifications: Notification[] = [
  {
    id: 'notif1',
    userId: '1',
    type: 'application_update',
    title: 'Candidatura aceite!',
    message: 'A tua candidatura para "Quarto Confortável no Porto" foi aceite.',
    link: '/applications',
    read: false,
    createdAt: new Date('2026-04-12'),
  },
  {
    id: 'notif2',
    userId: '1',
    type: 'application_update',
    title: 'Candidatura em análise',
    message: 'O senhorio está a analisar a tua candidatura para "Apartamento T2 Viseu Centro".',
    link: '/applications',
    read: false,
    createdAt: new Date('2026-04-16'),
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

function initializeStorage() {
  if (!localStorage.getItem(APPLICATIONS_STORAGE_KEY)) {
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(initialApplications));
  }
  if (!localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)) {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(initialNotifications));
  }
}

initializeStorage();

export function getApplicationsForUser(userId: string): Application[] {
  const stored = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
  const all: Application[] = stored ? JSON.parse(stored) : [];
  return all.filter(app => app.userId === userId);
}

export function getApplicationsForLandlord(landlordId: string): Application[] {
  const stored = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
  const all: Application[] = stored ? JSON.parse(stored) : [];
  return all.filter(app => app.landlordId === landlordId);
}

export function getApplicationById(id: string): Application | undefined {
  const stored = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
  const all: Application[] = stored ? JSON.parse(stored) : [];
  return all.find(app => app.id === id);
}

export function getNotificationsForUser(userId: string): Notification[] {
  const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  const all: Notification[] = stored ? JSON.parse(stored) : [];
  return all
    .filter(notif => notif.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getUnreadCount(userId: string): number {
  const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  const all: Notification[] = stored ? JSON.parse(stored) : [];
  return all.filter(notif => notif.userId === userId && !notif.read).length;
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
  }
): Application {
  const stored = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
  const all: Application[] = stored ? JSON.parse(stored) : [];

  const newApplication: Application = {
    id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    accommodationId,
    roomId: metadata?.roomId,
    propertyId: metadata?.propertyId,
    landlordId,
    status: 'pending',
    message,
    moveInDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  all.push(newApplication);
  localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(all));

  const notifStored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  const allNotifications: Notification[] = notifStored ? JSON.parse(notifStored) : [];

  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type: 'application_update',
    title: 'Candidatura enviada!',
    message: 'A tua candidatura foi enviada ao senhorio.',
    link: '/applications',
    read: false,
    createdAt: new Date(),
  };

  allNotifications.push(notification);
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(allNotifications));

  return newApplication;
}

export function updateApplicationStatus(applicationId: string, status: string): boolean {
  const stored = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
  const all: Application[] = stored ? JSON.parse(stored) : [];

  const index = all.findIndex(a => a.id === applicationId);
  if (index >= 0) {
    all[index].status = status as any;
    all[index].updatedAt = new Date();
    all[index].reviewedAt = new Date();
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(all));

    const notifStored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const allNotifications: Notification[] = notifStored ? JSON.parse(notifStored) : [];

    const statusMessages: Record<string, string> = {
      accepted: 'A tua candidatura foi aceite!',
      rejected: 'A tua candidatura foi rejeitada.',
      under_review: 'A tua candidatura está em análise.',
    };

    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: all[index].userId,
      type: 'application_update',
      title: 'Atualização de Candidatura',
      message: statusMessages[status] || 'O estado da tua candidatura foi atualizado.',
      link: '/applications',
      read: false,
      createdAt: new Date(),
    };

    allNotifications.push(notification);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(allNotifications));

    return true;
  }

  return false;
}

export function withdrawApplication(applicationId: string): boolean {
  return updateApplicationStatus(applicationId, 'withdrawn');
}

export function markNotificationAsRead(notificationId: string): boolean {
  const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  const all: Notification[] = stored ? JSON.parse(stored) : [];

  const index = all.findIndex(n => n.id === notificationId);
  if (index >= 0) {
    all[index].read = true;
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(all));
    return true;
  }

  return false;
}

export function markAllNotificationsAsRead(userId: string): void {
  const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  const all: Notification[] = stored ? JSON.parse(stored) : [];

  const updated = all.map(n => {
    if (n.userId === userId && !n.read) {
      return { ...n, read: true };
    }
    return n;
  });

  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
}