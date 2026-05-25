import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Property, Room, PropertyStatus, RoomStatus } from '../types/property';
import { supabase } from '../lib/supabase';
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

function dbToProperty(row: any): Property {
  return {
    id: row.id,
    landlordId: row.landlord_id,
    title: row.title,
    description: row.description ?? '',
    address: row.address ?? '',
    city: row.city ?? '',
    zone: row.zone ?? '',
    distanceToUniversity: Number(row.distance_to_university ?? 0),
    coordinates: row.coordinates ?? undefined,
    images: row.images ?? [],
    amenities: row.amenities ?? {
      wifi: false, parking: false, gym: false, laundry: false, kitchen: false,
      livingRoom: false, backyard: false, airConditioning: false, heating: false,
      dishwasher: false, microwave: false, elevator: false,
    },
    houseRules: row.house_rules ?? undefined,
    totalRooms: row.total_rooms ?? 0,
    roomIds: [],
    wholePropertyAvailable: row.whole_property_available ?? false,
    wholePropertyPrice: row.whole_property_price ?? undefined,
    wholePropertyUtilities: row.whole_property_utilities ?? undefined,
    wholePropertyMinimumStay: row.whole_property_minimum_stay ?? undefined,
    status: row.status,
    verified: row.verified ?? false,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    views: row.views ?? 0,
    adminSuspended: row.admin_suspended ?? false,
    adminSuspensionReason: row.admin_suspension_reason ?? undefined,
    adminSuspendedAt: row.admin_suspended_at ?? undefined,
    adminSuspendedBy: row.admin_suspended_by ?? undefined,
  };
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
  return out;
}

function dbToRoom(row: any): Room {
  return {
    id: row.id,
    propertyId: row.property_id,
    landlordId: row.landlord_id,
    roomNumber: row.room_number ?? '',
    title: row.title,
    description: row.description ?? '',
    images: row.images ?? [],
    size: row.size ?? undefined,
    roomType: row.room_type,
    maxOccupants: row.max_occupants ?? 1,
    privateBathroom: row.private_bathroom ?? false,
    balcony: row.balcony ?? false,
    desk: row.desk ?? false,
    wardrobe: row.wardrobe ?? false,
    airConditioning: row.air_conditioning ?? false,
    price: Number(row.price ?? 0),
    utilities: row.utilities ?? undefined,
    availableFrom: row.available_from ? new Date(row.available_from) : new Date(),
    minimumStay: row.minimum_stay ?? 0,
    status: row.status,
    reservedBy: row.reserved_by ?? undefined,
    occupiedBy: row.occupied_by ?? undefined,
    moveInDate: row.move_in_date ? new Date(row.move_in_date) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    views: row.views ?? 0,
  };
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
  if (r.views !== undefined) out.views = r.views;
  return out;
}

export function PropertiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshProperties = useCallback(async () => {
    setLoading(true);
    const [propsRes, roomsRes] = await Promise.all([
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
      supabase.from('rooms').select('*').order('created_at', { ascending: false }),
    ]);
    if (propsRes.error) console.error('Properties fetch error:', propsRes.error.message);
    if (roomsRes.error) console.error('Rooms fetch error:', roomsRes.error.message);
    const propsList = (propsRes.data ?? []).map(dbToProperty);
    const roomsList = (roomsRes.data ?? []).map(dbToRoom);
    propsList.forEach(p => { p.roomIds = roomsList.filter(r => r.propertyId === p.id).map(r => r.id); });
    setProperties(propsList);
    setRooms(roomsList);
    setLoading(false);
  }, []);

  useEffect(() => { refreshProperties(); }, [refreshProperties, user?.id]);

  const addProperty = async (property: Property) => {
    const { error } = await supabase.from('properties').insert(propertyToDb(property));
    if (error) { console.error('addProperty error:', error.message); throw error; }
    await refreshProperties();
  };

  const addRoom = async (room: Room) => {
    const { error } = await supabase.from('rooms').insert(roomToDb(room));
    if (error) { console.error('addRoom error:', error.message); throw error; }
    await refreshProperties();
  };

  const updatePropertyStatus = async (id: string, status: PropertyStatus) => {
    const { error } = await supabase.from('properties').update({ status }).eq('id', id);
    if (error) { console.error('updatePropertyStatus error:', error.message); return; }
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status, updatedAt: new Date() } : p));
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    const { error } = await supabase.from('properties').update(propertyToDb(updates)).eq('id', id);
    if (error) { console.error('updateProperty error:', error.message); return; }
    setProperties(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p));
  };

  const deleteProperty = async (id: string) => {
    await updatePropertyStatus(id, 'archived');
  };

  const updateRoom = async (id: string, updates: Partial<Room>) => {
    const { error } = await supabase.from('rooms').update(roomToDb(updates)).eq('id', id);
    if (error) { console.error('updateRoom error:', error.message); return; }
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r));
  };

  const updateRoomStatus = async (id: string, status: RoomStatus) => {
    const { error } = await supabase.from('rooms').update({ status }).eq('id', id);
    if (error) { console.error('updateRoomStatus error:', error.message); return; }
    setRooms(prev => prev.map(r => r.id === id ? { ...r, status, updatedAt: new Date() } : r));
  };

  const deleteRoom = async (id: string) => {
    await updateRoomStatus(id, 'paused');
  };

  const getProperty = (id: string) => properties.find(p => p.id === id);
  const getRoom = (id: string) => rooms.find(r => r.id === id);
  const getRoomsByProperty = (propertyId: string) => rooms.filter(r => r.propertyId === propertyId);

  const adminSuspendProperty = async (id: string, reason: string, adminName: string) => {
    const { error } = await supabase.from('properties').update({
      status: 'paused',
      admin_suspended: true,
      admin_suspension_reason: reason,
      admin_suspended_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) { console.error('adminSuspend error:', error.message); return; }
    setProperties(prev => prev.map(p => p.id === id ? {
      ...p, status: 'paused', adminSuspended: true,
      adminSuspensionReason: reason, adminSuspendedAt: new Date().toISOString(),
      adminSuspendedBy: adminName, updatedAt: new Date(),
    } : p));
  };

  const liftAdminSuspension = async (id: string) => {
    const { error } = await supabase.from('properties').update({
      admin_suspended: false, admin_suspension_reason: null, admin_suspended_at: null,
    }).eq('id', id);
    if (error) { console.error('liftSuspension error:', error.message); return; }
    setProperties(prev => prev.map(p => p.id === id ? {
      ...p, adminSuspended: false, adminSuspensionReason: undefined,
      adminSuspendedAt: undefined, adminSuspendedBy: undefined, updatedAt: new Date(),
    } : p));
  };

  return (
    <PropertiesContext.Provider value={{
      properties, rooms, loading,
      addProperty, addRoom, updatePropertyStatus, updateProperty, deleteProperty,
      updateRoom, updateRoomStatus, deleteRoom,
      getProperty, getRoom, getRoomsByProperty,
      refreshProperties, adminSuspendProperty, liftAdminSuspension,
    }}>
      {children}
    </PropertiesContext.Provider>
  );
}

export function useProperties() {
  const ctx = useContext(PropertiesContext);
  if (!ctx) throw new Error('useProperties must be used within PropertiesProvider');
  return ctx;
}
