import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Property, Room, PropertyStatus, RoomStatus } from '../types/property';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface PropertiesContextType {
  properties: Property[];
  rooms: Room[];
  loading: boolean;
  addProperty: (property: Property) => Promise<void>;
  addRoom: (room: Room) => Promise<void>;
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
  adminSuspendProperty: (id: string, reason: string, adminName: string) => Promise<void>;
  liftAdminSuspension: (id: string) => Promise<void>;
}

const PropertiesContext = createContext<PropertiesContextType | undefined>(undefined);

const PROPERTIES_STORAGE_KEY = 'uniroom_properties';
const ROOMS_STORAGE_KEY = 'uniroom_rooms';
const PROPERTIES_REFRESH_EVENT = 'uniroom:properties-updated';

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

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function toDate(value: unknown, fallback = new Date()): Date {
  if (!value) return fallback;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? fallback : date;
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
    images: Array.isArray(value.images) ? value.images : [],
    amenities: {
      ...defaultAmenities,
      ...(value.amenities ?? {}),
    },
    houseRules: value.houseRules ?? value.house_rules ?? undefined,
    totalRooms: Number(value.totalRooms ?? value.total_rooms ?? 0),
    roomIds: Array.isArray(value.roomIds) ? value.roomIds : [],
    wholePropertyAvailable: Boolean(value.wholePropertyAvailable ?? value.whole_property_available ?? false),
    wholePropertyPrice: value.wholePropertyPrice ?? value.whole_property_price ?? undefined,
    wholePropertyUtilities: value.wholePropertyUtilities ?? value.whole_property_utilities ?? undefined,
    wholePropertyMinimumStay: value.wholePropertyMinimumStay ?? value.whole_property_minimum_stay ?? undefined,
    status: (value.status ?? 'draft') as PropertyStatus,
    verified: Boolean(value.verified ?? false),
    createdAt: toDate(value.createdAt ?? value.created_at),
    updatedAt: toDate(value.updatedAt ?? value.updated_at),
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
    images: Array.isArray(value.images) ? value.images : [],
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
    updatedAt: toDate(value.updatedAt ?? value.updated_at),
    views: Number(value.views ?? 0),
  };
}

function readLocalProperties(): Property[] {
  return safeParse<any[]>(localStorage.getItem(PROPERTIES_STORAGE_KEY), [])
    .filter(item => item?.id)
    .map(normalizeProperty);
}

function readLocalRooms(): Room[] {
  return safeParse<any[]>(localStorage.getItem(ROOMS_STORAGE_KEY), [])
    .filter(item => item?.id)
    .map(normalizeRoom);
}

function writeLocalProperties(properties: Property[]): void {
  localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(properties));
}

function writeLocalRooms(rooms: Room[]): void {
  localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
}

function attachRoomIds(properties: Property[], rooms: Room[]): Property[] {
  return properties.map(property => ({
    ...property,
    roomIds: rooms.filter(room => room.propertyId === property.id).map(room => room.id),
    totalRooms: property.totalRooms || rooms.filter(room => room.propertyId === property.id).length,
  }));
}

function dbToProperty(row: any): Property {
  return normalizeProperty(row);
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
  if (p.adminSuspended !== undefined) out.admin_suspended = p.adminSuspended;
  if (p.adminSuspensionReason !== undefined) out.admin_suspension_reason = p.adminSuspensionReason;
  if (p.adminSuspendedAt !== undefined) out.admin_suspended_at = p.adminSuspendedAt;
  if (p.adminSuspendedBy !== undefined) out.admin_suspended_by = p.adminSuspendedBy;
  return out;
}

function dbToRoom(row: any): Room {
  return normalizeRoom(row);
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
  if (r.size !== undefined) out.size = r.size;
  if (r.roomType !== undefined) out.room_type = r.roomType;
  if (r.maxOccupants !== undefined) out.max_occupants = r.maxOccupants;
  if (r.privateBathroom !== undefined) out.private_bathroom = r.privateBathroom;
  if (r.balcony !== undefined) out.balcony = r.balcony;
  if (r.desk !== undefined) out.desk = r.desk;
  if (r.wardrobe !== undefined) out.wardrobe = r.wardrobe;
  if (r.airConditioning !== undefined) out.air_conditioning = r.airConditioning;
  if (r.price !== undefined) out.price = r.price;
  if (r.utilities !== undefined) out.utilities = r.utilities;
  if (r.availableFrom !== undefined) out.available_from = r.availableFrom instanceof Date ? r.availableFrom.toISOString().slice(0, 10) : r.availableFrom;
  if (r.minimumStay !== undefined) out.minimum_stay = r.minimumStay;
  if (r.status !== undefined) out.status = r.status;
  if (r.reservedBy !== undefined) out.reserved_by = r.reservedBy;
  if (r.occupiedBy !== undefined) out.occupied_by = r.occupiedBy;
  if (r.moveInDate !== undefined) out.move_in_date = r.moveInDate instanceof Date ? r.moveInDate.toISOString().slice(0, 10) : r.moveInDate;
  if (r.compatibilityScore !== undefined) out.compatibility_score = r.compatibilityScore;
  if (r.views !== undefined) out.views = r.views;
  return out;
}

function mergeByUpdatedAt<T extends { id: string; updatedAt: Date }>(localItems: T[], remoteItems: T[]): T[] {
  const map = new Map<string, T>();

  localItems.forEach(item => map.set(item.id, item));

  remoteItems.forEach(item => {
    const current = map.get(item.id);
    if (!current || item.updatedAt >= current.updatedAt) {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values());
}

async function syncPropertyToSupabase(property: Property): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('properties')
    .upsert(propertyToDb(property), { onConflict: 'id' });

  if (error) console.warn('[UniRoom] Property sync error:', error.message);
}

async function syncRoomToSupabase(room: Room): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('rooms')
    .upsert(roomToDb(room), { onConflict: 'id' });

  if (error) console.warn('[UniRoom] Room sync error:', error.message);
}

export function PropertiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [properties, setProperties] = useState<Property[]>(() => {
    const localProperties = readLocalProperties();
    const localRooms = readLocalRooms();
    return attachRoomIds(localProperties, localRooms);
  });

  const [rooms, setRooms] = useState<Room[]>(() => readLocalRooms());
  const [loading, setLoading] = useState(false);

  const persistLocal = useCallback((nextProperties: Property[], nextRooms: Room[]) => {
    const normalizedProperties = attachRoomIds(nextProperties, nextRooms);
    setProperties(normalizedProperties);
    setRooms(nextRooms);
    writeLocalProperties(normalizedProperties);
    writeLocalRooms(nextRooms);
  }, []);

  const refreshProperties = useCallback(async () => {
    const localProperties = readLocalProperties();
    const localRooms = readLocalRooms();

    persistLocal(localProperties, localRooms);

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [propsRes, roomsRes] = await Promise.all([
        supabase.from('properties').select('*').order('created_at', { ascending: false }),
        supabase.from('rooms').select('*').order('created_at', { ascending: false }),
      ]);

      if (propsRes.error) {
        console.warn('[UniRoom] Properties fetch error:', propsRes.error.message);
      }

      if (roomsRes.error) {
        console.warn('[UniRoom] Rooms fetch error:', roomsRes.error.message);
      }

      const remoteProperties = (propsRes.data ?? []).map(dbToProperty);
      const remoteRooms = (roomsRes.data ?? []).map(dbToRoom);

      const mergedRooms = mergeByUpdatedAt(localRooms, remoteRooms);
      const mergedProperties = attachRoomIds(
        mergeByUpdatedAt(localProperties, remoteProperties),
        mergedRooms,
      );

      persistLocal(mergedProperties, mergedRooms);
    } finally {
      setLoading(false);
    }
  }, [persistLocal]);

  useEffect(() => {
    void refreshProperties();

    const handler = () => {
      void refreshProperties();
    };

    window.addEventListener(PROPERTIES_REFRESH_EVENT, handler);

    return () => window.removeEventListener(PROPERTIES_REFRESH_EVENT, handler);
  }, [refreshProperties, user?.id]);

  const addProperty = async (property: Property) => {
    const nextProperty: Property = {
      ...property,
      createdAt: property.createdAt || new Date(),
      updatedAt: new Date(),
    };

    const nextProperties = [...properties.filter(item => item.id !== nextProperty.id), nextProperty];
    persistLocal(nextProperties, rooms);
    void syncPropertyToSupabase(nextProperty);
  };

  const addRoom = async (room: Room) => {
    const nextRoom: Room = {
      ...room,
      createdAt: room.createdAt || new Date(),
      updatedAt: new Date(),
    };

    const nextRooms = [...rooms.filter(item => item.id !== nextRoom.id), nextRoom];

    const nextProperties = properties.map(property =>
      property.id === nextRoom.propertyId
        ? {
            ...property,
            roomIds: Array.from(new Set([...property.roomIds, nextRoom.id])),
            totalRooms: Math.max(property.totalRooms, property.roomIds.length + 1),
            updatedAt: new Date(),
          }
        : property,
    );

    persistLocal(nextProperties, nextRooms);
    void syncRoomToSupabase(nextRoom);

    const parent = nextProperties.find(property => property.id === nextRoom.propertyId);
    if (parent) void syncPropertyToSupabase(parent);
  };

  const updatePropertyStatus = async (id: string, status: PropertyStatus) => {
    const nextProperties = properties.map(property =>
      property.id === id ? { ...property, status, updatedAt: new Date() } : property,
    );

    persistLocal(nextProperties, rooms);

    const updated = nextProperties.find(property => property.id === id);
    if (updated) void syncPropertyToSupabase(updated);
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    const nextProperties = properties.map(property =>
      property.id === id ? { ...property, ...updates, updatedAt: new Date() } : property,
    );

    persistLocal(nextProperties, rooms);

    const updated = nextProperties.find(property => property.id === id);
    if (updated) void syncPropertyToSupabase(updated);
  };

  const deleteProperty = async (id: string) => {
    await updatePropertyStatus(id, 'archived');
  };

  const updateRoom = async (id: string, updates: Partial<Room>) => {
    const nextRooms = rooms.map(room =>
      room.id === id ? { ...room, ...updates, updatedAt: new Date() } : room,
    );

    persistLocal(properties, nextRooms);

    const updated = nextRooms.find(room => room.id === id);
    if (updated) void syncRoomToSupabase(updated);
  };

  const updateRoomStatus = async (id: string, status: RoomStatus) => {
    await updateRoom(id, { status });
  };

  const deleteRoom = async (id: string) => {
    await updateRoomStatus(id, 'paused');
  };

  const getProperty = (id: string) => properties.find(property => property.id === id);
  const getRoom = (id: string) => rooms.find(room => room.id === id);
  const getRoomsByProperty = (propertyId: string) => rooms.filter(room => room.propertyId === propertyId);

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
