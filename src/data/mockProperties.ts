import { Property, Room } from "../types/property";

const PROPERTIES_STORAGE_KEY = "uniroom_properties";
const ROOMS_STORAGE_KEY = "uniroom_rooms";

export const mockProperties: Property[] = [
  {
    id: "prop-1",
    landlordId: "2",
    title: "Apartamento T3 Moderno no Centro de Viseu",
    description:
      "Apartamento espaçoso e moderno, totalmente equipado, localizado no coração de Viseu. Ideal para estudantes que procuram conforto e proximidade à universidade.",
    address: "Rua Direita, 45",
    city: "Viseu",
    zone: "Centro Histórico",
    distanceToUniversity: 0.8,
    coordinates: { lat: 40.6582, lng: -7.9138 },
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
    ],
    amenities: {
      wifi: true,
      parking: true,
      gym: false,
      laundry: true,
      kitchen: true,
      livingRoom: true,
      backyard: false,
      airConditioning: true,
      heating: true,
      dishwasher: true,
      microwave: true,
      elevator: true,
    },
    houseRules: {
      smoking: false,
      pets: false,
      parties: false,
      quietHours: "22:00 - 08:00",
    },
    totalRooms: 3,
    roomIds: ["room-1", "room-2", "room-3"],
    wholePropertyAvailable: true,
    wholePropertyPrice: 950,
    wholePropertyUtilities: 100,
    wholePropertyMinimumStay: 12,
    status: "active",
    verified: true,
    createdAt: new Date("2026-03-15"),
    updatedAt: new Date("2026-04-20"),
    views: 245,
  },
  {
    id: "prop-2",
    landlordId: "2",
    title: "Casa T4 com Jardim - Zona Universitária",
    description:
      "Casa ampla com jardim privado, perfeita para partilha entre estudantes. Ambiente tranquilo e familiar.",
    address: "Rua dos Estudantes, 12",
    city: "Viseu",
    zone: "Zona Universitária",
    distanceToUniversity: 0.3,
    images: [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
    ],
    amenities: {
      wifi: true,
      parking: true,
      gym: false,
      laundry: true,
      kitchen: true,
      livingRoom: true,
      backyard: true,
      airConditioning: false,
      heating: true,
      dishwasher: false,
      microwave: true,
      elevator: false,
    },
    houseRules: {
      smoking: false,
      pets: true,
      parties: false,
      quietHours: "23:00 - 07:00",
    },
    totalRooms: 4,
    roomIds: ["room-4", "room-5", "room-6", "room-7"],
    wholePropertyAvailable: false,
    status: "active",
    verified: true,
    createdAt: new Date("2026-02-10"),
    updatedAt: new Date("2026-04-18"),
    views: 189,
  },
];

export const mockRooms: Room[] = [
  {
    id: "room-1",
    propertyId: "prop-1",
    landlordId: "2",
    roomNumber: "Quarto 1",
    title: "Quarto Master com Casa de Banho Privativa",
    description:
      "Quarto espaçoso com casa de banho privativa, varanda com vista para a cidade e roupeiro embutido.",
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457",
    ],
    size: 18,
    roomType: "private",
    maxOccupants: 1,
    privateBathroom: true,
    balcony: true,
    desk: true,
    wardrobe: true,
    airConditioning: true,
    price: 380,
    utilities: 40,
    availableFrom: new Date("2026-09-01"),
    minimumStay: 10,
    status: "occupied",
    occupiedBy: "1", // João Silva
    moveInDate: new Date("2026-04-01"),
    compatibilityScore: 85,
    createdAt: new Date("2026-03-15"),
    updatedAt: new Date("2026-04-20"),
    views: 98,
  },
  {
    id: "room-2",
    propertyId: "prop-1",
    landlordId: "2",
    roomNumber: "Quarto 2",
    title: "Quarto Confortável com Varanda",
    description:
      "Quarto acolhedor com varanda, secretária e roupeiro. Casa de banho partilhada.",
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
    ],
    size: 14,
    roomType: "private",
    maxOccupants: 1,
    privateBathroom: false,
    balcony: true,
    desk: true,
    wardrobe: true,
    airConditioning: false,
    price: 300,
    utilities: 40,
    availableFrom: new Date("2026-09-01"),
    minimumStay: 10,
    status: "available",
    compatibilityScore: 78,
    createdAt: new Date("2026-03-15"),
    updatedAt: new Date("2026-04-20"),
    views: 76,
  },
  {
    id: "room-3",
    propertyId: "prop-1",
    landlordId: "2",
    roomNumber: "Quarto 3",
    title: "Quarto Económico",
    description:
      "Quarto funcional com o essencial. Ótima relação qualidade/preço.",
    images: [
      "https://images.unsplash.com/photo-1556020685-ae41abfc9365",
    ],
    size: 12,
    roomType: "private",
    maxOccupants: 1,
    privateBathroom: false,
    balcony: false,
    desk: true,
    wardrobe: true,
    airConditioning: false,
    price: 270,
    utilities: 40,
    availableFrom: new Date("2026-09-01"),
    minimumStay: 10,
    status: "available",
    compatibilityScore: 72,
    createdAt: new Date("2026-03-15"),
    updatedAt: new Date("2026-04-20"),
    views: 65,
  },
  {
    id: "room-4",
    propertyId: "prop-2",
    landlordId: "2",
    roomNumber: "Quarto A",
    title: "Quarto Amplo com Vista Jardim",
    description:
      "Quarto grande com vista para o jardim, muito iluminado e arejado.",
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af",
    ],
    size: 16,
    roomType: "private",
    maxOccupants: 1,
    privateBathroom: true,
    balcony: false,
    desk: true,
    wardrobe: true,
    airConditioning: false,
    price: 320,
    utilities: 35,
    availableFrom: new Date("2026-09-01"),
    minimumStay: 10,
    status: "reserved",
    reservedBy: "4", // Ana Costa
    moveInDate: new Date("2026-09-01"),
    compatibilityScore: 80,
    createdAt: new Date("2026-02-10"),
    updatedAt: new Date("2026-04-18"),
    views: 54,
  },
  {
    id: "room-5",
    propertyId: "prop-2",
    landlordId: "2",
    roomNumber: "Quarto B",
    title: "Quarto Acolhedor",
    description: "Quarto confortável perfeito para estudar.",
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
    ],
    size: 13,
    roomType: "private",
    maxOccupants: 1,
    privateBathroom: false,
    balcony: false,
    desk: true,
    wardrobe: true,
    airConditioning: false,
    price: 280,
    utilities: 35,
    availableFrom: new Date("2026-09-01"),
    minimumStay: 10,
    status: "available",
    compatibilityScore: 75,
    createdAt: new Date("2026-02-10"),
    updatedAt: new Date("2026-04-18"),
    views: 48,
  },
  {
    id: "room-6",
    propertyId: "prop-2",
    landlordId: "2",
    roomNumber: "Quarto C",
    title: "Quarto Standard",
    description: "Quarto com tudo o que precisas.",
    images: [
      "https://images.unsplash.com/photo-1556020685-ae41abfc9365",
    ],
    size: 12,
    roomType: "private",
    maxOccupants: 1,
    privateBathroom: false,
    balcony: false,
    desk: true,
    wardrobe: true,
    airConditioning: false,
    price: 260,
    utilities: 35,
    availableFrom: new Date("2026-09-01"),
    minimumStay: 10,
    status: "reserved",
    reservedBy: "5", // Pedro Oliveira
    moveInDate: new Date("2026-09-01"),
    compatibilityScore: 70,
    createdAt: new Date("2026-02-10"),
    updatedAt: new Date("2026-04-18"),
    views: 42,
  },
  {
    id: "room-7",
    propertyId: "prop-2",
    landlordId: "2",
    roomNumber: "Quarto D",
    title: "Quarto Pequeno mas Acolhedor",
    description:
      "Quarto mais pequeno, ideal para orçamentos apertados.",
    images: [
      "https://images.unsplash.com/photo-1556020685-ae41abfc9365",
    ],
    size: 10,
    roomType: "private",
    maxOccupants: 1,
    privateBathroom: false,
    balcony: false,
    desk: true,
    wardrobe: false,
    airConditioning: false,
    price: 240,
    utilities: 35,
    availableFrom: new Date("2026-09-01"),
    minimumStay: 10,
    status: "available",
    compatibilityScore: 68,
    createdAt: new Date("2026-02-10"),
    updatedAt: new Date("2026-04-18"),
    views: 38,
  },
];

export function getProperties(): Property[] {
  const stored = localStorage.getItem(PROPERTIES_STORAGE_KEY);

  if (stored) {
    const parsed = JSON.parse(stored);

    return parsed.map((property: any) => ({
      ...property,
      createdAt: new Date(property.createdAt),
      updatedAt: new Date(property.updatedAt),
    }));
  }

  localStorage.setItem(
    PROPERTIES_STORAGE_KEY,
    JSON.stringify(mockProperties),
  );
  return mockProperties;
}

export function getRooms(): Room[] {
  const stored = localStorage.getItem(ROOMS_STORAGE_KEY);

  if (stored) {
    const parsed = JSON.parse(stored);

    return parsed.map((room: any) => ({
      ...room,
      availableFrom: new Date(room.availableFrom),
      createdAt: new Date(room.createdAt),
      updatedAt: new Date(room.updatedAt),
    }));
  }

  localStorage.setItem(
    ROOMS_STORAGE_KEY,
    JSON.stringify(mockRooms),
  );
  return mockRooms;
}

export function getProperty(id: string): Property | null {
  const properties = getProperties();
  return (
    properties.find((property) => property.id === id) || null
  );
}

export function getRoom(id: string): Room | null {
  const rooms = getRooms();
  return rooms.find((room) => room.id === id) || null;
}

export function getRoomsByProperty(propertyId: string): Room[] {
  const rooms = getRooms();
  return rooms.filter((room) => room.propertyId === propertyId);
}

export function getPropertiesByLandlord(
  landlordId: string,
): Property[] {
  const properties = getProperties();
  return properties.filter(
    (property) => property.landlordId === landlordId,
  );
}

export function getAvailableRooms(): Room[] {
  const rooms = getRooms();
  const properties = getProperties();

  const activePropertyIds = properties
    .filter((property) => property.status === "active")
    .map((property) => property.id);

  return rooms.filter(
    (room) =>
      room.status === "available" &&
      activePropertyIds.includes(room.propertyId),
  );
}