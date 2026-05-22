import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Property, Room, PropertyStatus, RoomStatus } from '../types/property';
import { mockProperties, mockRooms } from '../data/mockProperties';

interface PropertiesContextType {
  properties: Property[];
  rooms: Room[];
  updatePropertyStatus: (id: string, status: PropertyStatus) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  updateRoomStatus: (id: string, status: RoomStatus) => void;
  deleteRoom: (id: string) => void;
  getProperty: (id: string) => Property | undefined;
  getRoom: (id: string) => Room | undefined;
  getRoomsByProperty: (propertyId: string) => Room[];
}

const PropertiesContext = createContext<PropertiesContextType | undefined>(undefined);

export function PropertiesProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(() => {
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

  return (
    <PropertiesContext.Provider
      value={{
        properties,
        rooms,
        updatePropertyStatus,
        updateProperty,
        deleteProperty,
        updateRoom,
        updateRoomStatus,
        deleteRoom,
        getProperty,
        getRoom,
        getRoomsByProperty,
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