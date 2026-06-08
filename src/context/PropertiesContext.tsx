import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Property, Room, PropertyStatus, RoomStatus } from '../types/property';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useDataBusRefresh } from '../lib/dataBus';
import { useAuth } from './AuthContext';

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
  refreshProperties: () => Promise<void>;
  fetchPropertyDetail: (id: string) => Promise<Property | null>;
  fetchRoomDetail: (id: string) => Promise<Room | null>;
  adminSuspendProperty: (id: string, reason: string, adminName: string) => Promise<void>;
  liftAdminSuspension: (id: string) => Promise<void>;
}

const PROPERTIES_LIGHT_FIELDS =
  'id, landlord_id, title, address, city, zone, distance_to_university, coordinates, total_rooms, whole_property_available, whole_property_price, status, verified, admin_suspended, views, created_at, updated_at';

const ROOMS_LIGHT_FIELDS =
  'id, property_id, landlord_id, title, room_number, price, utilities, room_type, status, available_from, size, private_bathroom, desk, wardrobe, balcony, created_at, updated_at';

const REFRESH_THROTTLE_MS = 120_000;

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
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === 'string' && value.trim()) return [value];
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

async function fetchRemoteProperties(): Promise<Property[]> {
  if (!isSupabaseConfigured) return [];
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (attempt === 1) console.log('[fetch] properties light');
      const { data, error } = await supabase
        .from('properties')
        .select(PROPERTIES_LIGHT_FIELDS)
        .order('created_at', { ascending: false });
      if (error) {
        if (isTransientError(error.message) && attempt < maxAttempts) {
          await sleep(attempt * 1200);
          continue;
        }
        if (!isTransientError(error.message)) console.warn('[UniRoom] Properties fetch error:', error.message);
        return [];
      }
      return (data ?? []).map(normalizeProperty);
    } catch {
      if (attempt < maxAttempts) { await sleep(attempt * 1200); continue; }
      return [];
    }
  }
  return [];
}

async function fetchRemoteRooms(): Promise<Room[]> {
  if (!isSupabaseConfigured) return [];
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (attempt === 1) console.log('[fetch] rooms light');
      const { data, error } = await supabase
        .from('rooms')
        .select(ROOMS_LIGHT_FIELDS)
        .order('created_at', { ascending: false });
      if (error) {
        if (isTransientError(error.message) && attempt < maxAttempts) {
          await sleep(attempt * 1200);
          continue;
        }
        if (!isTransientError(error.message)) console.warn('[UniRoom] Rooms fetch error:', error.message);
        return [];
      }
      return (data ?? []).map(normalizeRoom);
    } catch {
      if (attempt < maxAttempts) { await sleep(attempt * 1200); continue; }
      return [];
    }
  }
  return [];
}

async function fetchPropertyDetailRemote(id: string): Promise<Property | null> {
  if (!isSupabaseConfigured) return null;
  console.log('[fetch] property detail', id);
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return normalizeProperty(data);
}

async function fetchRoomDetailRemote(id: string): Promise<Room | null> {
  if (!isSupabaseConfigured) return null;
  console.log('[fetch] room detail', id);
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return normalizeRoom(data);
}

async function syncPropertyToSupabase(property: Property): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado.');
  }
  const { error } = await supabase
    .from('properties')
    .upsert(propertyToDb(property), { onConflict: 'id' });
  if (error) {
    if (!isNetworkError(error.message)) console.warn('[UniRoom] Property sync error:', error.message);
    throw new Error(error.message || 'Falha ao gravar a propriedade.');
  }
}

async function syncRoomToSupabase(room: Room): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado.');
  }
  const { error } = await supabase
    .from('rooms')
    .upsert(roomToDb(room), { onConflict: 'id' });
  if (error) {
    if (!isNetworkError(error.message)) console.warn('[UniRoom] Room sync error:', error.message);
    throw new Error(error.message || 'Falha ao gravar o quarto.');
  }
}

export function PropertiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Snapshot estável da lista atual de rooms, para os callbacks do canal
  // Realtime poderem recalcular roomIds sem reanexar o listener.
  const roomsRef = useRef<Room[]>([]);
  useEffect(() => { roomsRef.current = rooms; }, [rooms]);

  const applyToState = useCallback((nextProperties: Property[], nextRooms: Room[]) => {
    const normalizedRooms = nextRooms.map(normalizeRoom);
    const normalizedProperties = attachRoomIds(nextProperties.map(normalizeProperty), normalizedRooms);
    setProperties(normalizedProperties);
    setRooms(normalizedRooms);
    notifyPropertiesChanged();
  }, []);

  const lastRefreshAtRef = useRef<number>(0);
  const inflightRefreshRef = useRef<Promise<void> | null>(null);

  const refreshProperties = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    if (inflightRefreshRef.current) return inflightRefreshRef.current;
    const now = Date.now();
    if (now - lastRefreshAtRef.current < REFRESH_THROTTLE_MS) return;

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

  // ─── Realtime: properties + rooms ──────────────────────────────────────
  // Mutamos diretamente o state com a row recebida (sem refetch completo),
  // recalculando depois roomIds/totalRooms para manter consistência.
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel(`uniroom:properties-rooms:${Math.random().toString(36).slice(2, 9)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'properties' },
        payload => {
          if (payload.eventType === 'DELETE') {
            const removedId = String((payload.old as { id?: string }).id ?? '');
            if (!removedId) return;
            setProperties(prev => {
              if (!prev.some(p => p.id === removedId)) return prev;
              return prev.filter(p => p.id !== removedId);
            });
            return;
          }

          const incoming = normalizeProperty(payload.new);

          setProperties(prev => {
            const idx = prev.findIndex(p => p.id === incoming.id);
            const nextList = idx === -1
              ? [incoming, ...prev]
              : prev.map(p => (p.id === incoming.id ? incoming : p));
            // attachRoomIds depende dos rooms — recalcula usando o snapshot
            // mais recente via setRooms abaixo. Aqui mantemos a lista crua,
            // o recompute corre em useMemo derivado? Não, fazemos imediato:
            return attachRoomIds(nextList, roomsRef.current);
          });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        payload => {
          if (payload.eventType === 'DELETE') {
            const removedId = String((payload.old as { id?: string }).id ?? '');
            if (!removedId) return;
            setRooms(prev => {
              if (!prev.some(r => r.id === removedId)) return prev;
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
            const next = idx === -1
              ? [incoming, ...prev]
              : prev.map(r => (r.id === incoming.id ? incoming : r));
            roomsRef.current = next;
            setProperties(props => attachRoomIds(props, next));
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const addProperty = async (property: Property, options?: { skipRefresh?: boolean }) => {
    const nextProperty = normalizeProperty({
      ...property,
      createdAt: property.createdAt || new Date(),
      updatedAt: new Date(),
    });
    await syncPropertyToSupabase(nextProperty);
    if (!options?.skipRefresh) await refreshProperties();
  };

  const addRoom = async (room: Room, options?: { skipRefresh?: boolean }) => {
    const nextRoom = normalizeRoom({
      ...room,
      createdAt: room.createdAt || new Date(),
      updatedAt: new Date(),
    });
    await syncRoomToSupabase(nextRoom);
    if (!options?.skipRefresh) await refreshProperties();
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    const existing = properties.find(p => p.id === id);
    if (!existing) return;
    const updated = normalizeProperty({ ...existing, ...updates, updatedAt: new Date() });
    await syncPropertyToSupabase(updated);
    await refreshProperties();
  };

  const updatePropertyStatus = async (id: string, status: PropertyStatus) => {
    await updateProperty(id, { status });
  };

  const deleteProperty = async (id: string) => {
    await updatePropertyStatus(id, 'archived');
  };

  const updateRoom = async (id: string, updates: Partial<Room>) => {
    const existing = rooms.find(r => r.id === id);
    if (!existing) return;
    const updated = normalizeRoom({ ...existing, ...updates, updatedAt: new Date() });
    await syncRoomToSupabase(updated);
    await refreshProperties();
  };

  const updateRoomStatus = async (id: string, status: RoomStatus) => {
    await updateRoom(id, { status });
  };

  const deleteRoom = async (id: string) => {
    await updateRoomStatus(id, 'paused');
  };

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
    <PropertiesContext.Provider
      value={{
        properties,
        rooms,
        loading,
        addProperty,
        addRoom,
        updatePropertyStatus,
        updateProperty,
        deleteProperty,
        updateRoom,
        updateRoomStatus,
        deleteRoom,
        getProperty,
        getRoom,
        getRoomsByProperty,
        refreshProperties,
        fetchPropertyDetail: fetchPropertyDetailRemote,
        fetchRoomDetail: fetchRoomDetailRemote,
        adminSuspendProperty,
        liftAdminSuspension,
      }}
    >
      {children}
    </PropertiesContext.Provider>
  );
}

export function useProperties() {
  const ctx = useContext(PropertiesContext);
  if (!ctx) throw new Error('useProperties must be used within PropertiesProvider');
  return ctx;
}
