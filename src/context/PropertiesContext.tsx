import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Property, Room, PropertyStatus, RoomStatus } from '../types/property';
import { isSupabaseConfigured, supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { useDataBusRefresh } from '../lib/dataBus';
import { useAuth } from './AuthContext';

// All reads and writes go through the Edge Function server (admin client,
// bypasses RLS completely). This is the only reliable way to ensure
// all users (student, landlord, admin, anonymous) see the same data.
const SERVER_BASE = `${supabaseUrl}/functions/v1/make-server-08c694dc`;

interface PropertiesContextType {
  properties: Property[];
  rooms: Room[];
  loading: boolean;
  addProperty: (property: Property, options?: { skipRefresh?: boolean }) => Promise<void>;
  addRoom: (room: Room, options?: { skipRefresh?: boolean }) => Promise<void>;
  updatePropertyStatus: (id: string, status: PropertyStatus) => Promise<void>;
  updateProperty: (id: string, updates: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  updateRoom: (id: string, updates: Partial<Room>) => Promise<void>;
  updateRoomStatus: (id: string, status: RoomStatus) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  getProperty: (id: string) => Property | undefined;
  getRoom: (id: string) => Room | undefined;
  getRoomsByProperty: (propertyId: string) => Room[];
  refreshProperties: (force?: boolean) => Promise<void>;
  fetchPropertyDetail: (id: string) => Promise<Property | null>;
  fetchRoomDetail: (id: string) => Promise<Room | null>;
  adminSuspendProperty: (id: string, reason: string, adminName: string) => Promise<void>;
  liftAdminSuspension: (id: string) => Promise<void>;
}

// Throttle for automatic (non-forced) refreshes only.
const REFRESH_THROTTLE_MS = 30_000;

const PropertiesContext = createContext<PropertiesContextType | undefined>(undefined);

export const PROPERTIES_REFRESH_EVENT = 'uniroom:properties-updated';

const defaultAmenities: Property['amenities'] = {
  wifi: false,
  parking: false,
  gym: false,
  laundry: false,
  kitchen: false,
  livingRoom: false,
  backyard: false,
  airConditioning: false,
  heating: false,
  dishwasher: false,
  microwave: false,
  elevator: false,
};

function toDate(value: unknown, fallback = new Date()): Date {
  if (!value) return fallback;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function asDateOnly(value: Date | string | undefined): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function normalizeImages(value: unknown): string[] {
  const isValid = (s: string) =>
    s.startsWith('https://') &&
    !s.startsWith('blob:') &&
    !s.startsWith('data:') &&
    s.trim().length > 0;
  if (Array.isArray(value)) return value.filter(Boolean).map(String).filter(isValid);
  if (typeof value === 'string' && isValid(value.trim())) return [value.trim()];
  return [];
}

function normalizeProperty(value: any): Property {
  return {
    id: String(value.id),
    landlordId: String(value.landlordId ?? value.landlord_id ?? ''),
    title: value.title ?? '',
    description: value.description ?? '',
    address: value.address ?? '',
    city: value.city ?? '',
    zone: value.zone ?? '',
    distanceToUniversity: Number(value.distanceToUniversity ?? value.distance_to_university ?? 0),
    coordinates: value.coordinates ?? undefined,
    publicAddress: Boolean(
      value.publicAddress ??
      value.public_address ??
      (value.houseRules ?? value.house_rules)?.publicAddress ??
      false,
    ),
    images: normalizeImages(value.images),
    amenities: {
      ...defaultAmenities,
      ...(value.amenities ?? {}),
    },
    houseRules: value.houseRules ?? value.house_rules ?? undefined,
    totalRooms: Number(value.totalRooms ?? value.total_rooms ?? 0),
    roomIds: Array.isArray(value.roomIds) ? value.roomIds.map(String) : [],
    wholePropertyAvailable: Boolean(value.wholePropertyAvailable ?? value.whole_property_available ?? false),
    wholePropertyPrice: value.wholePropertyPrice ?? value.whole_property_price ?? undefined,
    wholePropertyUtilities: value.wholePropertyUtilities ?? value.whole_property_utilities ?? undefined,
    wholePropertyMinimumStay: value.wholePropertyMinimumStay ?? value.whole_property_minimum_stay ?? undefined,
    status: (value.status ?? 'draft') as PropertyStatus,
    verified: Boolean(value.verified ?? false),
    createdAt: toDate(value.createdAt ?? value.created_at),
    updatedAt: toDate(value.updatedAt ?? value.updated_at ?? value.createdAt ?? value.created_at),
    views: Number(value.views ?? 0),
    adminSuspended: Boolean(value.adminSuspended ?? value.admin_suspended ?? false),
    adminSuspensionReason: value.adminSuspensionReason ?? value.admin_suspension_reason ?? undefined,
    adminSuspendedAt: value.adminSuspendedAt ?? value.admin_suspended_at ?? undefined,
    adminSuspendedBy: value.adminSuspendedBy ?? value.admin_suspended_by ?? undefined,
  };
}

function normalizeRoom(value: any): Room {
  return {
    id: String(value.id),
    propertyId: String(value.propertyId ?? value.property_id ?? ''),
    landlordId: String(value.landlordId ?? value.landlord_id ?? ''),
    roomNumber: value.roomNumber ?? value.room_number ?? '',
    title: value.title ?? '',
    description: value.description ?? '',
    images: normalizeImages(value.images),
    size: value.size ?? value.area ?? undefined,
    roomType: (value.roomType ?? value.room_type ?? 'private') as Room['roomType'],
    maxOccupants: Number(value.maxOccupants ?? value.max_occupants ?? 1),
    privateBathroom: Boolean(value.privateBathroom ?? value.private_bathroom ?? false),
    balcony: Boolean(value.balcony ?? false),
    desk: Boolean(value.desk ?? false),
    wardrobe: Boolean(value.wardrobe ?? false),
    airConditioning: Boolean(value.airConditioning ?? value.air_conditioning ?? false),
    price: Number(value.price ?? 0),
    utilities: value.utilities !== undefined && value.utilities !== null ? Number(value.utilities) : undefined,
    availableFrom: toDate(value.availableFrom ?? value.available_from),
    minimumStay: Number(value.minimumStay ?? value.minimum_stay ?? 1),
    status: (value.status ?? 'draft') as RoomStatus,
    reservedBy: value.reservedBy ?? value.reserved_by ?? undefined,
    occupiedBy: value.occupiedBy ?? value.occupied_by ?? undefined,
    moveInDate: value.moveInDate || value.move_in_date ? toDate(value.moveInDate ?? value.move_in_date) : undefined,
    compatibilityScore: value.compatibilityScore ?? value.compatibility_score ?? undefined,
    createdAt: toDate(value.createdAt ?? value.created_at),
    updatedAt: toDate(value.updatedAt ?? value.updated_at ?? value.createdAt ?? value.created_at),
    views: Number(value.views ?? 0),
  };
}

function notifyPropertiesChanged(): void {
  window.dispatchEvent(new Event(PROPERTIES_REFRESH_EVENT));
}

function attachRoomIds(properties: Property[], rooms: Room[]): Property[] {
  return properties.map(property => {
    const propertyRooms = rooms.filter(room => room.propertyId === property.id);
    return {
      ...property,
      roomIds: propertyRooms.map(room => room.id),
      totalRooms: Math.max(Number(property.totalRooms || 0), propertyRooms.length),
    };
  });
}

function propertyToDb(p: Partial<Property>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (p.id !== undefined) out.id = p.id;
  if (p.landlordId !== undefined) out.landlord_id = p.landlordId;
  if (p.title !== undefined) out.title = p.title;
  if (p.description !== undefined) out.description = p.description;
  if (p.address !== undefined) out.address = p.address;
  if (p.city !== undefined) out.city = p.city;
  if (p.zone !== undefined) out.zone = p.zone;
  if (p.distanceToUniversity !== undefined) out.distance_to_university = p.distanceToUniversity;
  if (p.coordinates !== undefined) out.coordinates = p.coordinates;
  if (p.images !== undefined) out.images = p.images;
  if (p.amenities !== undefined) out.amenities = p.amenities;
  if (p.houseRules !== undefined) out.house_rules = p.houseRules;
  if (p.totalRooms !== undefined) out.total_rooms = p.totalRooms;
  if (p.wholePropertyAvailable !== undefined) out.whole_property_available = p.wholePropertyAvailable;
  if (p.wholePropertyPrice !== undefined) out.whole_property_price = p.wholePropertyPrice;
  if (p.wholePropertyUtilities !== undefined) out.whole_property_utilities = p.wholePropertyUtilities;
  if (p.wholePropertyMinimumStay !== undefined) out.whole_property_minimum_stay = p.wholePropertyMinimumStay;
  if (p.status !== undefined) out.status = p.status;
  if (p.verified !== undefined) out.verified = p.verified;
  if (p.views !== undefined) out.views = p.views;
  if (p.createdAt !== undefined) out.created_at = p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt;
  if (p.updatedAt !== undefined) out.updated_at = p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt;
  return out;
}

function roomToDb(r: Partial<Room>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (r.id !== undefined) out.id = r.id;
  if (r.propertyId !== undefined) out.property_id = r.propertyId;
  if (r.landlordId !== undefined) out.landlord_id = r.landlordId;
  if (r.roomNumber !== undefined) out.room_number = r.roomNumber;
  if (r.title !== undefined) out.title = r.title;
  if (r.description !== undefined) out.description = r.description;
  if (r.images !== undefined) out.images = r.images;
  if (r.size !== undefined) { out.area = r.size; out.size = r.size; }
  if (r.roomType !== undefined) out.room_type = r.roomType;
  if (r.maxOccupants !== undefined) out.max_occupants = r.maxOccupants;
  if (r.privateBathroom !== undefined) out.private_bathroom = r.privateBathroom;
  if (r.balcony !== undefined) out.balcony = r.balcony;
  if (r.desk !== undefined) out.desk = r.desk;
  if (r.wardrobe !== undefined) out.wardrobe = r.wardrobe;
  if (r.airConditioning !== undefined) out.air_conditioning = r.airConditioning;
  if (r.price !== undefined) out.price = r.price;
  if (r.utilities !== undefined) out.utilities = r.utilities;
  if (r.availableFrom !== undefined) out.available_from = asDateOnly(r.availableFrom);
  if (r.minimumStay !== undefined) out.minimum_stay = r.minimumStay;
  if (r.status !== undefined) out.status = r.status;
  if (r.reservedBy !== undefined) out.reserved_by = r.reservedBy;
  if (r.occupiedBy !== undefined) out.occupied_by = r.occupiedBy;
  if (r.moveInDate !== undefined) out.move_in_date = asDateOnly(r.moveInDate);
  if (r.compatibilityScore !== undefined) out.compatibility_score = r.compatibilityScore;
  if (r.views !== undefined) out.views = r.views;
  if (r.createdAt !== undefined) out.created_at = r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt;
  if (r.updatedAt !== undefined) out.updated_at = r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt;
  return out;
}

function isTransientError(message?: string): boolean {
  if (!message) return false;
  return /failed to fetch|networkerror|load failed|statement timeout|canceling statement|connection/i.test(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Server helpers ───────────────────────────────────────────────────────────

async function serverGet<T>(path: string): Promise<T[]> {
  if (!isSupabaseConfigured) return [];
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${SERVER_BASE}${path}`, {
        headers: { Authorization: `Bearer ${supabaseAnonKey}` },
      });
      if (!res.ok) {
        const msg = `HTTP ${res.status}`;
        if (attempt < maxAttempts) { await sleep(attempt * 1000); continue; }
        console.warn(`[UniRoom] GET ${path} error: ${msg}`);
        return [];
      }
      const json = await res.json();
      return (json.data ?? []) as T[];
    } catch (err) {
      if (isTransientError(String(err)) && attempt < maxAttempts) { await sleep(attempt * 1000); continue; }
      console.warn(`[UniRoom] GET ${path} exception:`, err);
      return [];
    }
  }
  return [];
}

async function serverGetOne<T>(path: string): Promise<T | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const res = await fetch(`${SERVER_BASE}${path}`, {
      headers: { Authorization: `Bearer ${supabaseAnonKey}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? null) as T | null;
  } catch {
    return null;
  }
}

async function serverPost(path: string, body: unknown): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase não configurado.');
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token ?? supabaseAnonKey;
  const res = await fetch(`${SERVER_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error(String(json.error ?? `Server error ${res.status}`));
  }
}

// ─── Remote fetch ─────────────────────────────────────────────────────────────

async function fetchRemoteProperties(): Promise<Property[]> {
  console.log('[fetch] properties via server');
  const rows = await serverGet<unknown>('/properties');
  return rows.map(normalizeProperty);
}

async function fetchRemoteRooms(): Promise<Room[]> {
  console.log('[fetch] rooms via server');
  const rows = await serverGet<unknown>('/rooms');
  return rows.map(normalizeRoom);
}

async function fetchPropertyDetailRemote(id: string): Promise<Property | null> {
  console.log('[fetch] property detail via server', id);
  const row = await serverGetOne<unknown>(`/properties/${encodeURIComponent(id)}`);
  return row ? normalizeProperty(row) : null;
}

async function fetchRoomDetailRemote(id: string): Promise<Room | null> {
  console.log('[fetch] room detail via server', id);
  const row = await serverGetOne<unknown>(`/rooms/${encodeURIComponent(id)}`);
  return row ? normalizeRoom(row) : null;
}

// ─── Remote sync ──────────────────────────────────────────────────────────────

async function syncPropertyToServer(property: Property): Promise<void> {
  await serverPost('/properties', propertyToDb(property));
}

async function syncRoomToServer(room: Room): Promise<void> {
  await serverPost('/rooms', roomToDb(room));
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PropertiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const roomsRef = useRef<Room[]>([]);
  useEffect(() => { roomsRef.current = rooms; }, [rooms]);

  const applyToState = useCallback((nextProperties: Property[], nextRooms: Room[]) => {
    const withRoomIds = attachRoomIds(nextProperties, nextRooms);
    setProperties(withRoomIds);
    setRooms(nextRooms);
    notifyPropertiesChanged();
  }, []);

  const lastRefreshAtRef = useRef<number>(0);
  const inflightRefreshRef = useRef<Promise<void> | null>(null);

  const refreshProperties = useCallback(async (force = false) => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    if (!force && inflightRefreshRef.current) return inflightRefreshRef.current;
    if (!force && Date.now() - lastRefreshAtRef.current < REFRESH_THROTTLE_MS) return;
    if (force) inflightRefreshRef.current = null;

    const run = (async () => {
      setLoading(true);
      try {
        const [remoteProperties, remoteRooms] = await Promise.all([
          fetchRemoteProperties(),
          fetchRemoteRooms(),
        ]);
        applyToState(remoteProperties, remoteRooms);
        lastRefreshAtRef.current = Date.now();
      } finally {
        setLoading(false);
        inflightRefreshRef.current = null;
      }
    })();
    inflightRefreshRef.current = run;
    return run;
  }, [applyToState]);

  useEffect(() => {
    void refreshProperties();
  }, [refreshProperties, user?.id, user?.type]);

  useDataBusRefresh('properties', refreshProperties);

  // Realtime: apply row-level changes directly to state (no full refetch needed)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel(`uniroom:properties-rooms:${Math.random().toString(36).slice(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, payload => {
        if (payload.eventType === 'DELETE') {
          const removedId = String((payload.old as { id?: string }).id ?? '');
          if (removedId) setProperties(prev => prev.filter(p => p.id !== removedId));
          return;
        }
        const incoming = normalizeProperty(payload.new);
        setProperties(prev => {
          const idx = prev.findIndex(p => p.id === incoming.id);
          const next = idx === -1 ? [incoming, ...prev] : prev.map(p => p.id === incoming.id ? incoming : p);
          return attachRoomIds(next, roomsRef.current);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, payload => {
        if (payload.eventType === 'DELETE') {
          const removedId = String((payload.old as { id?: string }).id ?? '');
          if (!removedId) return;
          setRooms(prev => {
            const next = prev.filter(r => r.id !== removedId);
            roomsRef.current = next;
            setProperties(props => attachRoomIds(props, next));
            return next;
          });
          return;
        }
        const incoming = normalizeRoom(payload.new);
        setRooms(prev => {
          const idx = prev.findIndex(r => r.id === incoming.id);
          const next = idx === -1 ? [incoming, ...prev] : prev.map(r => r.id === incoming.id ? incoming : r);
          roomsRef.current = next;
          setProperties(props => attachRoomIds(props, next));
          return next;
        });
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, []);

  const addProperty = async (property: Property, options?: { skipRefresh?: boolean }) => {
    const next = normalizeProperty({ ...property, createdAt: property.createdAt || new Date(), updatedAt: new Date() });
    // Optimistic
    setProperties(prev => {
      if (prev.some(p => p.id === next.id)) return prev;
      return attachRoomIds([next, ...prev], roomsRef.current);
    });
    await syncPropertyToServer(next);
    if (!options?.skipRefresh) await refreshProperties(true);
  };

  const addRoom = async (room: Room, options?: { skipRefresh?: boolean }) => {
    const next = normalizeRoom({ ...room, createdAt: room.createdAt || new Date(), updatedAt: new Date() });
    // Optimistic
    setRooms(prev => {
      if (prev.some(r => r.id === next.id)) return prev;
      const updated = [next, ...prev];
      roomsRef.current = updated;
      setProperties(props => attachRoomIds(props, updated));
      return updated;
    });
    await syncRoomToServer(next);
    if (!options?.skipRefresh) await refreshProperties(true);
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    const existing = properties.find(p => p.id === id);
    if (!existing) return;
    const updated = normalizeProperty({ ...existing, ...updates, updatedAt: new Date() });
    // Optimistic
    setProperties(prev => attachRoomIds(prev.map(p => p.id === id ? updated : p), roomsRef.current));
    await syncPropertyToServer(updated);
    await refreshProperties(true);
  };

  const updatePropertyStatus = async (id: string, status: PropertyStatus) => updateProperty(id, { status });
  const deleteProperty = async (id: string) => updatePropertyStatus(id, 'archived');

  const updateRoom = async (id: string, updates: Partial<Room>) => {
    const existing = rooms.find(r => r.id === id);
    if (!existing) return;
    const updated = normalizeRoom({ ...existing, ...updates, updatedAt: new Date() });
    // Optimistic
    setRooms(prev => {
      const next = prev.map(r => r.id === id ? updated : r);
      roomsRef.current = next;
      setProperties(props => attachRoomIds(props, next));
      return next;
    });
    await syncRoomToServer(updated);
    await refreshProperties(true);
  };

  const updateRoomStatus = async (id: string, status: RoomStatus) => updateRoom(id, { status });
  const deleteRoom = async (id: string) => updateRoomStatus(id, 'paused');

  const getProperty = (id: string) => properties.find(p => p.id === id);
  const getRoom = (id: string) => rooms.find(r => r.id === id);
  const getRoomsByProperty = (propertyId: string) => rooms.filter(r => r.propertyId === propertyId);

  const adminSuspendProperty = async (id: string, reason: string, adminName: string) => {
    await updateProperty(id, {
      status: 'paused',
      adminSuspended: true,
      adminSuspensionReason: reason,
      adminSuspendedAt: new Date().toISOString(),
      adminSuspendedBy: adminName,
    });
  };

  const liftAdminSuspension = async (id: string) => {
    await updateProperty(id, {
      adminSuspended: false,
      adminSuspensionReason: undefined,
      adminSuspendedAt: undefined,
      adminSuspendedBy: undefined,
    });
  };

  return (
    <PropertiesContext.Provider value={{
      properties, rooms, loading,
      addProperty, addRoom,
      updatePropertyStatus, updateProperty, deleteProperty,
      updateRoom, updateRoomStatus, deleteRoom,
      getProperty, getRoom, getRoomsByProperty,
      refreshProperties,
      fetchPropertyDetail: fetchPropertyDetailRemote,
      fetchRoomDetail: fetchRoomDetailRemote,
      adminSuspendProperty, liftAdminSuspension,
    }}>
      {children}
    </PropertiesContext.Provider>
  );
}

// ─── Safe fallback for isolated component previews ────────────────────────────

const noop = async () => {};

const FALLBACK_CONTEXT: PropertiesContextType = {
  properties: [], rooms: [], loading: false,
  addProperty: noop as PropertiesContextType['addProperty'],
  addRoom: noop as PropertiesContextType['addRoom'],
  updatePropertyStatus: noop as PropertiesContextType['updatePropertyStatus'],
  updateProperty: noop as PropertiesContextType['updateProperty'],
  deleteProperty: noop as PropertiesContextType['deleteProperty'],
  updateRoom: noop as PropertiesContextType['updateRoom'],
  updateRoomStatus: noop as PropertiesContextType['updateRoomStatus'],
  deleteRoom: noop as PropertiesContextType['deleteRoom'],
  getProperty: () => undefined,
  getRoom: () => undefined,
  getRoomsByProperty: () => [],
  refreshProperties: noop,
  fetchPropertyDetail: async () => null,
  fetchRoomDetail: async () => null,
  adminSuspendProperty: noop as PropertiesContextType['adminSuspendProperty'],
  liftAdminSuspension: noop as PropertiesContextType['liftAdminSuspension'],
};

export function useProperties() {
  return useContext(PropertiesContext) ?? FALLBACK_CONTEXT;
}
