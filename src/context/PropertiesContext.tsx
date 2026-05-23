import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Property, Room, PropertyStatus, RoomStatus } from '../types/property';
import { mockProperties, mockRooms } from '../data/mockProperties';

interface PropertiesContextType {
  properties: Property[];
  rooms: Room[];
  addProperty: (property: Property) => void;
  addRoom: (room: Room) => void;
  updatePropertyStatus: (id: string, status: PropertyStatus) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  updateRoomStatus: (id: string, status: RoomStatus) => void;
  deleteRoom: (id: string) => void;
  getProperty: (id: string) => Property | undefined;
  getRoom: (id: string) => Room | undefined;
  getRoomsByProperty: (propertyId: string) => Room[];
  refreshProperties: () => void;
  adminSuspendProperty: (id: string, reason: string, adminName: string) => void;
  liftAdminSuspension: (id: string) => void;
}

const PropertiesContext = createContext<PropertiesContextType | undefined>(undefined);

const DATA_VERSION = '2026-05-v7';
const DATA_VERSION_KEY = 'uniroom_data_version';
const PROPERTIES_KEY = 'uniroom_properties';
const ROOMS_KEY = 'uniroom_rooms';
const REFRESH_EVENT = 'uniroom:properties-updated';

function reviveProperties(items: any[]): Property[] {
  return items.map(property => ({
    ...property,
    createdAt: new Date(property.createdAt),
    updatedAt: new Date(property.updatedAt),
  }));
}

function reviveRooms(items: any[]): Room[] {
  return items.map(room => ({
    ...room,
    availableFrom: new Date(room.availableFrom),
    moveInDate: room.moveInDate ? new Date(room.moveInDate) : undefined,
    createdAt: new Date(room.createdAt),
    updatedAt: new Date(room.updatedAt),
  }));
}

function readStoredProperties(): Property[] {
  const stored = localStorage.getItem(PROPERTIES_KEY);

  if (!stored) {
    localStorage.setItem(PROPERTIES_KEY, JSON.stringify(mockProperties));
    return mockProperties;
  }

  try {
    return reviveProperties(JSON.parse(stored));
  } catch {
    localStorage.setItem(PROPERTIES_KEY, JSON.stringify(mockProperties));
    return mockProperties;
  }
}

function readStoredRooms(): Room[] {
  const stored = localStorage.getItem(ROOMS_KEY);

  if (!stored) {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(mockRooms));
    return mockRooms;
  }

  try {
    return reviveRooms(JSON.parse(stored));
  } catch {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(mockRooms));
    return mockRooms;
  }
}

function ensureFreshMockData() {
  const version = localStorage.getItem(DATA_VERSION_KEY);

  if (version !== DATA_VERSION) {
    localStorage.removeItem(PROPERTIES_KEY);
    localStorage.removeItem(ROOMS_KEY);
    localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
  }
}

export function PropertiesProvider({ children }: { children: ReactNode }) {
  ensureFreshMockData();

  const [properties, setProperties] = useState<Property[]>(() => readStoredProperties());
  const [rooms, setRooms] = useState<Room[]>(() => readStoredRooms());

  const refreshProperties = () => {
    setProperties(readStoredProperties());
    setRooms(readStoredRooms());
  };

  useEffect(() => {
    const handleRefresh = () => refreshProperties();

    window.addEventListener(REFRESH_EVENT, handleRefresh);
    window.addEventListener('storage', handleRefresh);
    window.addEventListener('focus', handleRefresh);

    return () => {
      window.removeEventListener(REFRESH_EVENT, handleRefresh);
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PROPERTIES_KEY, JSON.stringify(properties));
    } catch {
      // LocalStorage can fail in restricted environments.
    }
  }, [properties]);

  useEffect(() => {
    try {
      localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
    } catch {
      // LocalStorage can fail in restricted environments.
    }
  }, [rooms]);

  const addProperty = (property: Property) => {
    setProperties(previous => [...previous, property]);
  };

  const addRoom = (room: Room) => {
    setRooms(previous => [...previous, room]);
  };

  const updatePropertyStatus = (id: string, status: PropertyStatus) => {
    setProperties(previous =>
      previous.map(property =>
        property.id === id
          ? { ...property, status, updatedAt: new Date() }
          : property,
      ),
    );
  };

  const updateProperty = (id: string, updates: Partial<Property>) => {
    setProperties(previous =>
      previous.map(property =>
        property.id === id
          ? { ...property, ...updates, updatedAt: new Date() }
          : property,
      ),
    );
  };

  const deleteProperty = (id: string) => {
    setProperties(previous =>
      previous.map(property =>
        property.id === id
          ? { ...property, status: 'archived' as PropertyStatus, updatedAt: new Date() }
          : property,
      ),
    );
  };

  const updateRoom = (id: string, updates: Partial<Room>) => {
    setRooms(previous =>
      previous.map(room =>
        room.id === id
          ? { ...room, ...updates, updatedAt: new Date() }
          : room,
      ),
    );
  };

  const updateRoomStatus = (id: string, status: RoomStatus) => {
    setRooms(previous =>
      previous.map(room =>
        room.id === id
          ? { ...room, status, updatedAt: new Date() }
          : room,
      ),
    );
  };

  const deleteRoom = (id: string) => {
    setRooms(previous =>
      previous.map(room =>
        room.id === id
          ? { ...room, status: 'paused' as RoomStatus, updatedAt: new Date() }
          : room,
      ),
    );
  };

  const getProperty = (id: string) => {
    return properties.find(property => property.id === id);
  };

  const getRoom = (id: string) => {
    return rooms.find(room => room.id === id);
  };

  const getRoomsByProperty = (propertyId: string) => {
    return rooms.filter(room => room.propertyId === propertyId);
  };

  const adminSuspendProperty = (id: string, reason: string, adminName: string) => {
    setProperties(previous =>
      previous.map(property =>
        property.id === id
          ? {
              ...property,
              status: 'paused' as PropertyStatus,
              adminSuspended: true,
              adminSuspensionReason: reason,
              adminSuspendedAt: new Date().toISOString(),
              adminSuspendedBy: adminName,
              updatedAt: new Date(),
            }
          : property,
      ),
    );
  };

  const liftAdminSuspension = (id: string) => {
    setProperties(previous =>
      previous.map(property =>
        property.id === id
          ? {
              ...property,
              adminSuspended: false,
              adminSuspensionReason: undefined,
              adminSuspendedAt: undefined,
              adminSuspendedBy: undefined,
              updatedAt: new Date(),
            }
          : property,
      ),
    );
  };

  return (
    <PropertiesContext.Provider
      value={{
        properties,
        rooms,
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
  const context = useContext(PropertiesContext);

  if (!context) {
    throw new Error('useProperties must be used within PropertiesProvider');
  }

  return context;
}