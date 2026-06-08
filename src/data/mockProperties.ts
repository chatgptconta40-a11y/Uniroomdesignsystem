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
      "https://images.unsplash.com/photo-1663939385000-7334cf87dd51?w=900&q=80",
      "https://images.unsplash.com/photo-1775595224346-5df1ebaf1f22?w=900&q=80",
      "https://images.unsplash.com/photo-1775486133989-365f979d0aaa?w=900&q=80",
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
      studentsOnly: true,
      quietHours: "22:00 - 08:00",
      cleaningPolicy: "Rotação semanal entre moradores",
      visitorsPolicy: "Permitido com aviso prévio",
      preferredGender: "any",
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
      "https://images.unsplash.com/photo-1773429963191-9067803abf88?w=900&q=80",
      "https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?w=900&q=80",
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
      studentsOnly: false,
      quietHours: "23:00 - 07:00",
      cleaningPolicy: "Limpeza individual de quartos; áreas comuns em conjunto",
      visitorsPolicy: "Visitas permitidas",
      preferredGender: "any",
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
  // ── Test-scenario property: ESTGV, 3 rooms, draft (guião) ──────────────────
  {
    id: "prop-estgv",
    landlordId: "2",
    title: "Apartamento T3 junto à ESTGV",
    description:
      "Apartamento remodelado a 5 minutos a pé da ESTGV, com sala comum, cozinha equipada e lavandaria. Ambiente calmo e ideal para estudantes. Regras: apenas estudantes, sem festas, sem animais.",
    address: "Rua da Escola Politécnica, 8",
    city: "Viseu",
    zone: "Zona Universitária",
    distanceToUniversity: 0.4,
    coordinates: { lat: 40.6610, lng: -7.9090 },
    images: [
      "https://images.unsplash.com/photo-1763976284798-4ce1a02678c3?w=900&q=80",
      "https://images.unsplash.com/photo-1774311237295-a65a4c1ff38a?w=900&q=80",
    ],
    amenities: {
      wifi: true,
      parking: false,
      gym: false,
      laundry: true,
      kitchen: true,
      livingRoom: true,
      backyard: false,
      airConditioning: false,
      heating: true,
      dishwasher: false,
      microwave: true,
      elevator: false,
    },
    houseRules: {
      smoking: false,
      pets: false,
      parties: false,
      studentsOnly: true,
      quietHours: "23:00 - 08:00",
      cleaningPolicy: "Rotação semanal entre moradores",
      visitorsPolicy: "Visitas permitidas com aviso prévio",
      preferredGender: "any",
    },
    totalRooms: 3,
    roomIds: ["room-estgv-1", "room-estgv-2", "room-estgv-3"],
    wholePropertyAvailable: false,
    status: "draft",
    verified: false,
    createdAt: new Date("2026-05-01"),
    updatedAt: new Date("2026-05-20"),
    views: 0,
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
      "https://images.unsplash.com/photo-1638454668466-e8dbd5462f20?w=900&q=80",
      "https://images.unsplash.com/photo-1772944780860-e99bd902d59a?w=900&q=80",
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
      "https://images.unsplash.com/photo-1541586655971-3ef599c4ba77?w=900&q=80",
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
      "https://images.unsplash.com/photo-1728356633026-51d0bec74ad3?w=900&q=80",
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
      "https://images.unsplash.com/photo-1580152213601-87df3d2c56e6?w=900&q=80",
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
      "https://images.unsplash.com/photo-1655276588918-fe4730b4227c?w=900&q=80",
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
      "https://images.unsplash.com/photo-1603527413520-73e05f787ee3?w=900&q=80",
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
  // ── Test-scenario property: ESTGV, 3 rooms (suite + 2 standard), draft ──────
  {
    id: "room-estgv-1",
    propertyId: "prop-estgv",
    landlordId: "2",
    roomNumber: "Suite",
    title: "Suite com WC Privativo",
    description: "Quarto suite espaçoso com casa de banho privativa, cama de casal e roupeiro embutido. Muito iluminado, com janela para o pátio interno.",
    images: [
      "https://images.unsplash.com/photo-1638454668466-e8dbd5462f20?w=900&q=80",
    ],
    size: 20,
    roomType: "private",
    maxOccupants: 1,
    privateBathroom: true,
    balcony: false,
    desk: true,
    wardrobe: true,
    airConditioning: false,
    price: 310,
    utilities: 30,
    availableFrom: new Date("2026-09-01"),
    minimumStay: 9,
    status: "available",
    compatibilityScore: 88,
    createdAt: new Date("2026-05-01"),
    updatedAt: new Date("2026-05-20"),
    views: 12,
  },
  {
    id: "room-estgv-2",
    propertyId: "prop-estgv",
    landlordId: "2",
    roomNumber: "Quarto 1",
    title: "Quarto Standard",
    description: "Quarto privado mobilado com cama de solteiro, secretária, roupeiro e janela com boa luz natural. Casa de banho partilhada com outro quarto.",
    images: [
      "https://images.unsplash.com/photo-1772944780860-e99bd902d59a?w=900&q=80",
    ],
    size: 14,
    roomType: "private",
    maxOccupants: 1,
    privateBathroom: false,
    balcony: false,
    desk: true,
    wardrobe: true,
    airConditioning: false,
    price: 250,
    utilities: 30,
    availableFrom: new Date("2026-09-01"),
    minimumStay: 9,
    status: "draft",
    compatibilityScore: 82,
    createdAt: new Date("2026-05-01"),
    updatedAt: new Date("2026-05-20"),
    views: 0,
  },
  {
    id: "room-estgv-3",
    propertyId: "prop-estgv",
    landlordId: "2",
    roomNumber: "Quarto 2",
    title: "Quarto Standard",
    description: "Quarto privado mobilado com cama de solteiro, secretária e roupeiro. Casa de banho partilhada. Acesso direto à cozinha e sala comum.",
    images: [
      "https://images.unsplash.com/photo-1728356633026-51d0bec74ad3?w=900&q=80",
    ],
    size: 13,
    roomType: "private",
    maxOccupants: 1,
    privateBathroom: false,
    balcony: false,
    desk: true,
    wardrobe: true,
    airConditioning: false,
    price: 250,
    utilities: 30,
    availableFrom: new Date("2026-09-01"),
    minimumStay: 9,
    status: "draft",
    compatibilityScore: 79,
    createdAt: new Date("2026-05-01"),
    updatedAt: new Date("2026-05-20"),
    views: 0,
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
      "https://images.unsplash.com/photo-1592839656073-833413ae8874?w=900&q=80",
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