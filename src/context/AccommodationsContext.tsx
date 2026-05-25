import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Accommodation, AccommodationStatus } from '../types/accommodation';
import { supabase } from '../lib/supabase';

interface AccommodationsContextType {
  accommodations: Accommodation[];
  loading: boolean;
  updateAccommodationStatus: (id: string, status: AccommodationStatus) => Promise<void>;
  updateAccommodation: (id: string, updates: Partial<Accommodation>) => Promise<void>;
  deleteAccommodation: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AccommodationsContext = createContext<AccommodationsContextType | undefined>(undefined);

// Builds an Accommodation view by joining a property + first available room
function buildAccommodation(prop: any, room: any | null, totalOccupied: number): Accommodation {
  const price = room ? Number(room.price ?? 0) : Number(prop.whole_property_price ?? 0);
  const utilities = room ? room.utilities : prop.whole_property_utilities;
  const availableFrom = room?.available_from ? new Date(room.available_from) : new Date();
  const minimumStay = room?.minimum_stay ?? prop.whole_property_minimum_stay ?? 6;
  const propAmen = prop.amenities ?? {};
  return {
    id: prop.id,
    title: prop.title,
    description: prop.description ?? '',
    city: prop.city ?? '',
    zone: prop.zone ?? '',
    address: prop.address ?? '',
    price,
    images: prop.images ?? [],
    landlordId: prop.landlord_id,
    roomType: (room?.room_type ?? 'private') as Accommodation['roomType'],
    currentOccupants: totalOccupied,
    maxOccupants: prop.total_rooms ?? 1,
    coordinates: prop.coordinates ?? { lat: 0, lng: 0 },
    distanceToUniversity: Number(prop.distance_to_university ?? 0),
    universityName: 'Universidade',
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
    status: prop.status,
    verified: !!prop.verified,
    createdAt: new Date(prop.created_at),
    updatedAt: new Date(prop.updated_at),
    views: prop.views ?? 0,
  };
}

export function AccommodationsProvider({ children }: { children: ReactNode }) {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [propsRes, roomsRes] = await Promise.all([
      supabase.from('properties').select('*'),
      supabase.from('rooms').select('*'),
    ]);
    if (propsRes.error) console.error('Accommodations props error:', propsRes.error.message);
    if (roomsRes.error) console.error('Accommodations rooms error:', roomsRes.error.message);
    const props = propsRes.data ?? [];
    const rooms = roomsRes.data ?? [];
    const list: Accommodation[] = props.map(p => {
      const propRooms = rooms.filter(r => r.property_id === p.id);
      const firstAvailable = propRooms.find(r => r.status === 'available') ?? propRooms[0] ?? null;
      const occupied = propRooms.filter(r => r.status === 'occupied').length;
      return buildAccommodation(p, firstAvailable, occupied);
    });
    setAccommodations(list);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const updateAccommodationStatus = async (id: string, status: AccommodationStatus) => {
    const { error } = await supabase.from('properties').update({ status }).eq('id', id);
    if (error) { console.error('updateAccommodationStatus error:', error.message); return; }
    setAccommodations(prev => prev.map(a => a.id === id ? { ...a, status, updatedAt: new Date() } : a));
  };

  const updateAccommodation = async (id: string, updates: Partial<Accommodation>) => {
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
      const { error } = await supabase.from('properties').update(dbUpd).eq('id', id);
      if (error) { console.error('updateAccommodation error:', error.message); return; }
    }
    setAccommodations(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a));
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
