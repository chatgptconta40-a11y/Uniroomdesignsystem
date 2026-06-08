import { createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
import { Accommodation, AccommodationStatus } from '../types/accommodation';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useProperties } from './PropertiesContext';
import type { Property, Room } from '../types/property';

interface AccommodationsContextType {
  accommodations: Accommodation[];
  loading: boolean;
  updateAccommodationStatus: (id: string, status: AccommodationStatus) => Promise<void>;
  updateAccommodation: (id: string, updates: Partial<Accommodation>) => Promise<void>;
  deleteAccommodation: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AccommodationsContext = createContext<AccommodationsContextType | undefined>(undefined);

function buildAccommodation(prop: Property, room: Room | null, totalOccupied: number): Accommodation {
  const propAmen = prop.amenities ?? ({} as Property['amenities']);
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
    status: (room?.status === 'available' || prop.status === 'active' ? 'active' : prop.status) as AccommodationStatus,
    verified: !!prop.verified,
    createdAt: new Date(prop.createdAt || Date.now()),
    updatedAt: new Date(prop.updatedAt || Date.now()),
    views: Number((room?.views ?? prop.views) || 0),
  };
}

export function AccommodationsProvider({ children }: { children: ReactNode }) {
  const { properties, rooms, loading, refreshProperties } = useProperties();

  const accommodations = useMemo<Accommodation[]>(() => {
    return properties
      .filter(prop => prop.status === 'active')
      .flatMap(prop => {
        const propRooms = rooms.filter(room => room.propertyId === prop.id);
        const visibleRooms = propRooms.filter(room => room.status === 'available');
        const occupied = propRooms.filter(room => room.status === 'occupied').length;

        if (visibleRooms.length === 0 && prop.wholePropertyAvailable) {
          return [buildAccommodation(prop, null, occupied)];
        }
        return visibleRooms.map(room => buildAccommodation(prop, room, occupied));
      });
  }, [properties, rooms]);

  const refresh = useCallback(async () => {
    await refreshProperties();
  }, [refreshProperties]);

  const updateAccommodationStatus = async (id: string, status: AccommodationStatus) => {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('properties').update({ status }).eq('id', id);
      } catch { /* network unavailable */ }
    }
  };

  const updateAccommodation = async (id: string, updates: Partial<Accommodation>) => {
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
