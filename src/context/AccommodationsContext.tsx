import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Accommodation, AccommodationStatus } from '../types/accommodation';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AccommodationsContextType {
  accommodations: Accommodation[];
  loading: boolean;
  updateAccommodationStatus: (id: string, status: AccommodationStatus) => Promise<void>;
  updateAccommodation: (id: string, updates: Partial<Accommodation>) => Promise<void>;
  deleteAccommodation: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AccommodationsContext = createContext<AccommodationsContextType | undefined>(undefined);

const PROPERTIES_STORAGE_KEY = 'uniroom_properties';
const ROOMS_STORAGE_KEY = 'uniroom_rooms';
const ACCOMMODATIONS_REFRESH_EVENT = 'uniroom:properties-updated';

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function readLocalProperties(): any[] {
  return safeParse<any[]>(localStorage.getItem(PROPERTIES_STORAGE_KEY), []);
}

function readLocalRooms(): any[] {
  return safeParse<any[]>(localStorage.getItem(ROOMS_STORAGE_KEY), []);
}

function writeLocalProperties(properties: any[]): void {
  localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(properties));
}

function normalizeProp(prop: any) {
  return {
    ...prop,
    landlordId: prop.landlordId ?? prop.landlord_id,
    distanceToUniversity: prop.distanceToUniversity ?? prop.distance_to_university,
    wholePropertyPrice: prop.wholePropertyPrice ?? prop.whole_property_price,
    wholePropertyUtilities: prop.wholePropertyUtilities ?? prop.whole_property_utilities,
    wholePropertyMinimumStay: prop.wholePropertyMinimumStay ?? prop.whole_property_minimum_stay,
    createdAt: prop.createdAt ?? prop.created_at,
    updatedAt: prop.updatedAt ?? prop.updated_at,
  };
}

function normalizeRoom(room: any) {
  return {
    ...room,
    propertyId: room.propertyId ?? room.property_id,
    landlordId: room.landlordId ?? room.landlord_id,
    roomType: room.roomType ?? room.room_type,
    availableFrom: room.availableFrom ?? room.available_from,
    minimumStay: room.minimumStay ?? room.minimum_stay,
    maxOccupants: room.maxOccupants ?? room.max_occupants,
    privateBathroom: room.privateBathroom ?? room.private_bathroom,
    airConditioning: room.airConditioning ?? room.air_conditioning,
    createdAt: room.createdAt ?? room.created_at,
    updatedAt: room.updatedAt ?? room.updated_at,
  };
}

function buildAccommodation(rawProp: any, rawRoom: any | null, totalOccupied: number): Accommodation {
  const prop = normalizeProp(rawProp);
  const room = rawRoom ? normalizeRoom(rawRoom) : null;
  const propAmen = prop.amenities ?? {};
  const price = room ? Number(room.price ?? 0) : Number(prop.wholePropertyPrice ?? 0);
  const utilities = room ? room.utilities : prop.wholePropertyUtilities;
  const availableFrom = room?.availableFrom ? new Date(room.availableFrom) : new Date();
  const minimumStay = room?.minimumStay ?? prop.wholePropertyMinimumStay ?? 6;

  return {
    id: room?.id || prop.id,
    propertyId: prop.id,
    title: room?.title ? `${room.title} · ${prop.title}` : prop.title,
    description: room?.description || prop.description || '',
    city: prop.city || '',
    zone: prop.zone || '',
    address: prop.address || '',
    price,
    images: room?.images?.length ? room.images : prop.images || [],
    landlordId: prop.landlordId,
    roomType: (room?.roomType ?? 'private') as Accommodation['roomType'],
    currentOccupants: totalOccupied,
    maxOccupants: prop.totalRooms ?? 1,
    coordinates: prop.coordinates ?? { lat: 0, lng: 0 },
    distanceToUniversity: Number(prop.distanceToUniversity ?? 0),
    universityName: prop.universityName || 'Universidade',
    amenities: {
      furnished: true,
      wifi: !!propAmen.wifi,
      utilitiesIncluded: false,
      kitchen: !!propAmen.kitchen,
      washingMachine: !!propAmen.laundry,
      balcony: !!room?.balcony,
      parking: !!propAmen.parking,
      airConditioning: !!propAmen.airConditioning,
      heating: !!propAmen.heating,
      elevator: !!propAmen.elevator,
    },
    utilities: utilities ?? undefined,
    availableFrom,
    minimumStay,
    status: room?.status === 'available' || prop.status === 'active' ? 'active' : prop.status,
    verified: !!prop.verified,
    createdAt: new Date(prop.createdAt || Date.now()),
    updatedAt: new Date(prop.updatedAt || Date.now()),
    views: Number((room?.views ?? prop.views) || 0),
  };
}

function buildAccommodationsFromLocal(): Accommodation[] {
  const properties = readLocalProperties().map(normalizeProp);
  const rooms = readLocalRooms().map(normalizeRoom);

  return properties
    .filter(prop => prop.status === 'active')
    .flatMap(prop => {
      const propRooms = rooms.filter(room => room.propertyId === prop.id);
      const visibleRooms = propRooms.filter(room => room.status === 'available');

      if (visibleRooms.length === 0 && prop.wholePropertyAvailable) {
        const occupied = propRooms.filter(room => room.status === 'occupied').length;
        return [buildAccommodation(prop, null, occupied)];
      }

      return visibleRooms.map(room => {
        const occupied = propRooms.filter(item => item.status === 'occupied').length;
        return buildAccommodation(prop, room, occupied);
      });
    });
}

function mergeById<T extends { id: string }>(localItems: T[], remoteItems: T[]): T[] {
  const map = new Map<string, T>();
  localItems.forEach(item => map.set(item.id, item));
  remoteItems.forEach(item => map.set(item.id, item));
  return Array.from(map.values());
}

export function AccommodationsProvider({ children }: { children: ReactNode }) {
  const [accommodations, setAccommodations] = useState<Accommodation[]>(() => buildAccommodationsFromLocal());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const localList = buildAccommodationsFromLocal();
    setAccommodations(localList);

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [propsRes, roomsRes] = await Promise.all([
        supabase.from('properties').select('*'),
        supabase.from('rooms').select('*'),
      ]);

      const remoteProps = (propsRes.data ?? []).map(normalizeProp);
      const remoteRooms = (roomsRes.data ?? []).map(normalizeRoom);

      const remoteList = remoteProps
        .filter(prop => prop.status === 'active')
        .flatMap(prop => {
          const propRooms = remoteRooms.filter(room => room.propertyId === prop.id);
          const visibleRooms = propRooms.filter(room => room.status === 'available');

          if (visibleRooms.length === 0 && prop.wholePropertyAvailable) {
            const occupied = propRooms.filter(room => room.status === 'occupied').length;
            return [buildAccommodation(prop, null, occupied)];
          }

          return visibleRooms.map(room => {
            const occupied = propRooms.filter(item => item.status === 'occupied').length;
            return buildAccommodation(prop, room, occupied);
          });
        });

      setAccommodations(mergeById(localList, remoteList));
    } catch {
      // network unavailable — local data already set above
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const handler = () => {
      void refresh();
    };

    window.addEventListener(ACCOMMODATIONS_REFRESH_EVENT, handler);

    return () => window.removeEventListener(ACCOMMODATIONS_REFRESH_EVENT, handler);
  }, [refresh]);

  const updateAccommodationStatus = async (id: string, status: AccommodationStatus) => {
    const properties = readLocalProperties();
    const nextProperties = properties.map(property =>
      property.id === id ? { ...property, status, updatedAt: new Date() } : property,
    );

    writeLocalProperties(nextProperties);
    window.dispatchEvent(new Event(ACCOMMODATIONS_REFRESH_EVENT));
    setAccommodations(prev => prev.map(a => a.id === id ? { ...a, status, updatedAt: new Date() } : a));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('properties').update({ status }).eq('id', id);
      } catch { /* network unavailable */ }
    }
  };

  const updateAccommodation = async (id: string, updates: Partial<Accommodation>) => {
    const properties = readLocalProperties();
    const nextProperties = properties.map(property =>
      property.id === id
        ? {
            ...property,
            title: updates.title ?? property.title,
            description: updates.description ?? property.description,
            address: updates.address ?? property.address,
            city: updates.city ?? property.city,
            zone: updates.zone ?? property.zone,
            status: updates.status ?? property.status,
            images: updates.images ?? property.images,
            verified: updates.verified ?? property.verified,
            updatedAt: new Date(),
          }
        : property,
    );

    writeLocalProperties(nextProperties);
    window.dispatchEvent(new Event(ACCOMMODATIONS_REFRESH_EVENT));
    setAccommodations(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a));

    if (isSupabaseConfigured) {
      const dbUpd: Record<string, unknown> = {};
      if (updates.title !== undefined) dbUpd.title = updates.title;
      if (updates.description !== undefined) dbUpd.description = updates.description;
      if (updates.address !== undefined) dbUpd.address = updates.address;
      if (updates.city !== undefined) dbUpd.city = updates.city;
      if (updates.zone !== undefined) dbUpd.zone = updates.zone;
      if (updates.status !== undefined) dbUpd.status = updates.status;
      if (updates.images !== undefined) dbUpd.images = updates.images;
      if (updates.verified !== undefined) dbUpd.verified = updates.verified;

      if (Object.keys(dbUpd).length > 0) {
        try {
          await supabase.from('properties').update(dbUpd).eq('id', id);
        } catch { /* network unavailable */ }
      }
    }
  };

  const deleteAccommodation = async (id: string) => {
    await updateAccommodationStatus(id, 'archived');
  };

  return (
    <AccommodationsContext.Provider value={{ accommodations, loading, updateAccommodationStatus, updateAccommodation, deleteAccommodation, refresh }}>
      {children}
    </AccommodationsContext.Provider>
  );
}

export function useAccommodations() {
  const ctx = useContext(AccommodationsContext);
  if (!ctx) throw new Error('useAccommodations must be used within AccommodationsProvider');
  return ctx;
}
