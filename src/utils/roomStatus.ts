import { Room, RoomStatus } from '../types/property';

/**
 * Ensures a room's status is semantically consistent with its occupancy data.
 * - 'occupied' requires occupiedBy
 * - 'reserved' requires reservedBy
 * - 'available' must not have occupiedBy or reservedBy
 * If inconsistent, falls back to the most appropriate inferred state.
 */
export function normalizeRoomStatus(room: Room): RoomStatus {
  if (room.status === 'occupied' && !room.occupiedBy) return 'available';
  if (room.status === 'reserved' && !room.reservedBy) return 'available';
  return room.status;
}

export function getRoomStatusLabel(status: RoomStatus): string {
  const labels: Record<RoomStatus, string> = {
    available: 'Disponível',
    reserved: 'Reservado',
    occupied: 'Ocupado',
    paused: 'Pausado',
    draft: 'Rascunho',
  };
  return labels[status];
}

/**
 * Returns Tailwind CSS classes for a room status badge.
 * Signature: "bg-X text-X border-X" suitable for inline badge spans.
 */
export function getRoomStatusBadgeClasses(status: RoomStatus): string {
  const classes: Record<RoomStatus, string> = {
    available: 'bg-green-100 text-green-800 border-green-200',
    reserved: 'bg-blue-100 text-blue-800 border-blue-200',
    occupied: 'bg-orange-100 text-orange-800 border-orange-200',
    paused: 'bg-amber-100 text-amber-700 border-amber-200',
    draft: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return classes[status];
}
