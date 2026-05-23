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
  // Admin-only actions
  adminSuspendProperty: (id: string, reason: string, adminName: string) => void;
  liftAdminSuspension: (id: string) => void;
}

const PropertiesContext = createContext<PropertiesContextType | undefined>(undefined);

// Bump this version when mock data changes to force a reset for existing sessions
const DATA_VERSION = '2026-05-v5';

export function PropertiesProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(() => {
    const version = localStorage.getItem('uniroom_data_version');
    if (version !== DATA_VERSION) {
      localStorage.removeItem('uniroom_properties');
      localStorage.removeItem('uniroom_rooms');
      localStorage.setItem('uniroom_data_version', DATA_VERSION);
    }

    const stored = localStorage.getItem('uniroom_properties');

    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        return parsed.map((property: any) => ({
          ...property,
          createdAt: new Date(property.createdAt),
          updatedAt: new Date(property.updatedAt),
        }));
      } catch {
        localStorage.setItem('uniroom_properties', JSON.stringify(mockProperties));
        return mockProperties;
      }
    }

    localStorage.setItem('uniroom_properties', JSON.stringify(mockProperties));
    return mockProperties;
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    const stored = localStorage.getItem('uniroom_rooms');

    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        return parsed.map((room: any) => ({
          ...room,
          availableFrom: new Date(room.availableFrom),
          moveInDate: room.moveInDate ? new Date(room.moveInDate) : undefined,
          createdAt: new Date(room.createdAt),
          updatedAt: new Date(room.updatedAt),
        }));
      } catch {
        localStorage.setItem('uniroom_rooms', JSON.stringify(mockRooms));
        return mockRooms;
      }
    }

    localStorage.setItem('uniroom_rooms', JSON.stringify(mockRooms));
    return mockRooms;
  });

  useEffect(() => {
    try {
      localStorage.setItem('uniroom_properties', JSON.stringify(properties));
    } catch {
      // LocalStorage can fail in restricted environments.
    }
  }, [properties]);

  useEffect(() => {
    try {
      localStorage.setItem('uniroom_rooms', JSON.stringify(rooms));
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
    // Rooms keep their original state; they are hidden from public search
    // because the parent property is archived (SearchRooms filters by active properties).
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