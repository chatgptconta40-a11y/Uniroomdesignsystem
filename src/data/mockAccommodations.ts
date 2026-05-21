import { Accommodation, FavoriteAccommodation, Application, SearchFilters } from '../types/accommodation';

// Storage keys
export const ACCOMMODATIONS_STORAGE_KEY = 'uniroom_accommodations';
export const FAVORITES_STORAGE_KEY = 'uniroom_favorites';
export const APPLICATIONS_STORAGE_KEY = 'uniroom_applications';

// Mock accommodations data
export const mockAccommodations: Accommodation[] = [
  {
    id: '1',
    title: 'Quarto confortável em Viseu Centro',
    description: 'Quarto mobilado em apartamento T3 partilhado com 2 estudantes. Ambiente tranquilo e boa localização.',
    city: 'Viseu',
    zone: 'Centro',
    address: 'Rua Formosa, Viseu',
    price: 280,
    images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800', 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800'],
    landlordId: '2',
    roomType: 'private',
    currentOccupants: 2,
    maxOccupants: 3,
    coordinates: { lat: 40.6566, lng: -7.9133 },
    distanceToUniversity: 0.8,
    universityName: 'ESTGV',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: false,
      kitchen: true,
      washingMachine: true,
      balcony: false,
      parking: false,
      airConditioning: false,
      heating: true,
      elevator: false,
    },
    utilities: 50,
    availableFrom: new Date('2026-09-01'),
    minimumStay: 10,
    status: 'active',
    verified: true,
    compatibilityScore: 92,
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-01'),
    views: 45,
  },
  {
    id: '2',
    title: 'Estúdio moderno em Lisboa',
    description: 'Estúdio completamente equipado próximo da Cidade Universitária. Ideal para estudante que valoriza privacidade.',
    city: 'Lisboa',
    zone: 'Alvalade',
    address: 'Avenida de Roma, Lisboa',
    price: 480,
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
    landlordId: '2',
    roomType: 'studio',
    currentOccupants: 0,
    maxOccupants: 1,
    coordinates: { lat: 38.7478, lng: -9.1501 },
    distanceToUniversity: 1.2,
    universityName: 'Universidade de Lisboa',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: true,
      kitchen: true,
      washingMachine: true,
      balcony: true,
      parking: true,
      airConditioning: true,
      heating: true,
      elevator: true,
    },
    availableFrom: new Date('2026-08-15'),
    minimumStay: 12,
    status: 'active',
    verified: true,
    compatibilityScore: 88,
    createdAt: new Date('2026-03-15'),
    updatedAt: new Date('2026-04-10'),
    views: 128,
  },
  {
    id: '3',
    title: 'Quarto partilhado económico - Porto',
    description: 'Quarto duplo em zona estudantil. Perfeito para quem procura opção económica.',
    city: 'Porto',
    zone: 'Paranhos',
    address: 'Rua do Campo Alegre, Porto',
    price: 220,
    images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800'],
    landlordId: '2',
    roomType: 'shared',
    currentOccupants: 1,
    maxOccupants: 2,
    coordinates: { lat: 41.1579, lng: -8.6291 },
    distanceToUniversity: 0.5,
    universityName: 'Universidade do Porto',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: false,
      kitchen: true,
      washingMachine: true,
      balcony: false,
      parking: false,
      airConditioning: false,
      heating: true,
      elevator: false,
    },
    utilities: 50,
    availableFrom: new Date('2026-09-01'),
    minimumStay: 10,
    status: 'active',
    verified: true,
    compatibilityScore: 75,
    createdAt: new Date('2026-04-05'),
    updatedAt: new Date('2026-04-05'),
    views: 67,
  },
  {
    id: '4',
    title: 'Apartamento T2 em Coimbra',
    description: 'Apartamento completo para partilhar com outro estudante. 2 quartos individuais.',
    city: 'Coimbra',
    zone: 'Alta',
    address: 'Rua da Sofia, Coimbra',
    price: 320,
    images: ['https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800', 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800'],
    landlordId: '2',
    roomType: 'apartment',
    currentOccupants: 1,
    maxOccupants: 2,
    coordinates: { lat: 40.2098, lng: -8.4294 },
    distanceToUniversity: 0.3,
    universityName: 'Universidade de Coimbra',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: false,
      kitchen: true,
      washingMachine: true,
      balcony: true,
      parking: false,
      airConditioning: false,
      heating: true,
      elevator: false,
    },
    utilities: 50,
    availableFrom: new Date('2026-07-01'),
    minimumStay: 10,
    status: 'active',
    verified: true,
    compatibilityScore: 85,
    createdAt: new Date('2026-03-20'),
    updatedAt: new Date('2026-04-12'),
    views: 93,
  },
  {
    id: '5',
    title: 'Quarto premium em Braga',
    description: 'Quarto espaçoso em vivenda moderna. Inclui todas as comodidades.',
    city: 'Braga',
    zone: 'Centro',
    address: 'Avenida Central, Braga',
    price: 380,
    images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800'],
    landlordId: '2',
    roomType: 'private',
    currentOccupants: 2,
    maxOccupants: 4,
    coordinates: { lat: 41.5454, lng: -8.4265 },
    distanceToUniversity: 1.5,
    universityName: 'Universidade do Minho',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: true,
      kitchen: true,
      washingMachine: true,
      balcony: true,
      parking: true,
      airConditioning: true,
      heating: true,
      elevator: true,
    },
    availableFrom: new Date('2026-09-01'),
    minimumStay: 10,
    status: 'active',
    verified: true,
    compatibilityScore: 94,
    createdAt: new Date('2026-04-08'),
    updatedAt: new Date('2026-04-18'),
    views: 112,
  },
  {
    id: '6',
    title: 'Quarto em Viseu - Zona Residencial',
    description: 'Quarto em casa tranquila com jardim. Ambiente familiar.',
    city: 'Viseu',
    zone: 'Jugueiros',
    address: 'Rua dos Jugueiros, Viseu',
    price: 250,
    images: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800'],
    landlordId: '2',
    roomType: 'private',
    currentOccupants: 1,
    maxOccupants: 2,
    coordinates: { lat: 40.6612, lng: -7.9070 },
    distanceToUniversity: 2.1,
    universityName: 'ESTGV',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: false,
      kitchen: true,
      washingMachine: true,
      balcony: false,
      parking: true,
      airConditioning: false,
      heating: true,
      elevator: false,
    },
    utilities: 50,
    availableFrom: new Date('2026-08-01'),
    minimumStay: 10,
    status: 'active',
    verified: false,
    compatibilityScore: 68,
    createdAt: new Date('2026-04-10'),
    updatedAt: new Date('2026-04-10'),
    views: 34,
  },
  {
    id: '7',
    title: 'Apartamento moderno em Lisboa - Saldanha',
    description: 'T3 renovado com 3 quartos individuais. Totalmente equipado.',
    city: 'Lisboa',
    zone: 'Saldanha',
    address: 'Praça Duque de Saldanha, Lisboa',
    price: 420,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
    landlordId: '2',
    roomType: 'private',
    currentOccupants: 2,
    maxOccupants: 3,
    coordinates: { lat: 38.7347, lng: -9.1457 },
    distanceToUniversity: 2.3,
    universityName: 'Universidade de Lisboa',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: false,
      kitchen: true,
      washingMachine: true,
      balcony: true,
      parking: false,
      airConditioning: true,
      heating: true,
      elevator: true,
    },
    availableFrom: new Date('2026-09-01'),
    minimumStay: 10,
    status: 'active',
    verified: true,
    compatibilityScore: 81,
    createdAt: new Date('2026-03-25'),
    updatedAt: new Date('2026-04-15'),
    views: 156,
  },
  {
    id: '8',
    title: 'Quarto em Porto - Zona Universitária',
    description: 'Quarto em apartamento partilhado com estudantes. Bom ambiente.',
    city: 'Porto',
    zone: 'Asprela',
    address: 'Rua do Campo Alegre, Porto',
    price: 300,
    images: ['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800'],
    landlordId: '2',
    roomType: 'private',
    currentOccupants: 3,
    maxOccupants: 4,
    coordinates: { lat: 41.1784, lng: -8.6065 },
    distanceToUniversity: 0.4,
    universityName: 'Universidade do Porto',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: false,
      kitchen: true,
      washingMachine: true,
      balcony: false,
      parking: false,
      airConditioning: false,
      heating: true,
      elevator: false,
    },
    utilities: 50,
    availableFrom: new Date('2026-09-01'),
    minimumStay: 10,
    status: 'active',
    verified: true,
    compatibilityScore: 79,
    createdAt: new Date('2026-04-02'),
    updatedAt: new Date('2026-04-14'),
    views: 88,
  },
  {
    id: '9',
    title: 'Estúdio compacto em Coimbra',
    description: 'Estúdio pequeno mas funcional. Ideal para estudante organizado.',
    city: 'Coimbra',
    zone: 'Baixa',
    address: 'Rua Ferreira Borges, Coimbra',
    price: 350,
    images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'],
    landlordId: '2',
    roomType: 'studio',
    currentOccupants: 0,
    maxOccupants: 1,
    coordinates: { lat: 40.2100, lng: -8.4291 },
    distanceToUniversity: 0.6,
    universityName: 'Universidade de Coimbra',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: true,
      kitchen: true,
      washingMachine: false,
      balcony: false,
      parking: false,
      airConditioning: false,
      heating: true,
      elevator: false,
    },
    utilities: 50,
    availableFrom: new Date('2026-08-01'),
    minimumStay: 10,
    status: 'active',
    verified: true,
    compatibilityScore: 72,
    createdAt: new Date('2026-04-06'),
    updatedAt: new Date('2026-04-06'),
    views: 54,
  },
  {
    id: '10',
    title: 'Quarto espaçoso em Braga - São Victor',
    description: 'Quarto amplo em apartamento T4. Muita luz natural.',
    city: 'Braga',
    zone: 'São Victor',
    address: 'Rua de São Victor, Braga',
    price: 290,
    images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800', 'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800'],
    landlordId: '2',
    roomType: 'private',
    currentOccupants: 2,
    maxOccupants: 4,
    coordinates: { lat: 41.5518, lng: -8.4229 },
    distanceToUniversity: 1.8,
    universityName: 'Universidade do Minho',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: false,
      kitchen: true,
      washingMachine: true,
      balcony: true,
      parking: false,
      airConditioning: false,
      heating: true,
      elevator: false,
    },
    utilities: 50,
    availableFrom: new Date('2026-09-01'),
    minimumStay: 10,
    status: 'active',
    verified: false,
    compatibilityScore: 65,
    createdAt: new Date('2026-04-11'),
    updatedAt: new Date('2026-04-11'),
    views: 42,
  },
  {
    id: '11',
    title: 'T1 independente em Viseu',
    description: 'Apartamento T1 completo. Total privacidade e autonomia.',
    city: 'Viseu',
    zone: 'Repeses',
    address: 'Rua dos Repeses, Viseu',
    price: 400,
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
    landlordId: '2',
    roomType: 'apartment',
    currentOccupants: 0,
    maxOccupants: 1,
    coordinates: { lat: 40.6589, lng: -7.9201 },
    distanceToUniversity: 1.3,
    universityName: 'ESTGV',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: false,
      kitchen: true,
      washingMachine: true,
      balcony: true,
      parking: true,
      airConditioning: false,
      heating: true,
      elevator: false,
    },
    utilities: 50,
    availableFrom: new Date('2026-07-15'),
    minimumStay: 12,
    status: 'active',
    verified: true,
    compatibilityScore: 90,
    createdAt: new Date('2026-04-03'),
    updatedAt: new Date('2026-04-16'),
    views: 71,
  },
  {
    id: '12',
    title: 'Quarto económico em Lisboa - Lumiar',
    description: 'Opção acessível em zona bem servida de transportes.',
    city: 'Lisboa',
    zone: 'Lumiar',
    address: 'Alameda das Linhas de Torres, Lisboa',
    price: 310,
    images: ['https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800'],
    landlordId: '2',
    roomType: 'private',
    currentOccupants: 1,
    maxOccupants: 3,
    coordinates: { lat: 38.7689, lng: -9.1625 },
    distanceToUniversity: 3.5,
    universityName: 'Universidade de Lisboa',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: false,
      kitchen: true,
      washingMachine: true,
      balcony: false,
      parking: false,
      airConditioning: false,
      heating: true,
      elevator: false,
    },
    utilities: 50,
    availableFrom: new Date('2026-09-01'),
    minimumStay: 10,
    status: 'active',
    verified: false,
    compatibilityScore: 58,
    createdAt: new Date('2026-04-12'),
    updatedAt: new Date('2026-04-12'),
    views: 29,
  },
  {
    id: '13',
    title: 'Casa partilhada em Porto - Boavista',
    description: 'Vivenda com 5 quartos. Ambiente jovem e dinâmico.',
    city: 'Porto',
    zone: 'Boavista',
    address: 'Avenida da Boavista, Porto',
    price: 330,
    images: ['https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'],
    landlordId: '2',
    roomType: 'private',
    currentOccupants: 4,
    maxOccupants: 5,
    coordinates: { lat: 41.1589, lng: -8.6418 },
    distanceToUniversity: 1.9,
    universityName: 'Universidade do Porto',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: false,
      kitchen: true,
      washingMachine: true,
      balcony: true,
      parking: true,
      airConditioning: false,
      heating: true,
      elevator: false,
    },
    utilities: 50,
    availableFrom: new Date('2026-09-01'),
    minimumStay: 10,
    status: 'active',
    verified: true,
    compatibilityScore: 87,
    createdAt: new Date('2026-03-28'),
    updatedAt: new Date('2026-04-17'),
    views: 134,
  },
  {
    id: '14',
    title: 'Quarto premium em Coimbra - Santa Clara',
    description: 'Quarto com casa de banho privativa. Vista rio.',
    city: 'Coimbra',
    zone: 'Santa Clara',
    address: 'Avenida Sá da Bandeira, Coimbra',
    price: 450,
    images: ['https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'],
    landlordId: '2',
    roomType: 'private',
    currentOccupants: 1,
    maxOccupants: 2,
    coordinates: { lat: 40.2065, lng: -8.4372 },
    distanceToUniversity: 1.1,
    universityName: 'Universidade de Coimbra',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: true,
      kitchen: true,
      washingMachine: true,
      balcony: true,
      parking: true,
      airConditioning: true,
      heating: true,
      elevator: true,
    },
    availableFrom: new Date('2026-08-01'),
    minimumStay: 10,
    status: 'active',
    verified: true,
    compatibilityScore: 93,
    createdAt: new Date('2026-03-30'),
    updatedAt: new Date('2026-04-19'),
    views: 145,
  },
  {
    id: '15',
    title: 'Apartamento partilhado em Braga',
    description: 'T3 para 3 estudantes. Recentemente renovado.',
    city: 'Braga',
    zone: 'Gualtar',
    address: 'Rua de Gualtar, Braga',
    price: 310,
    images: ['https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800'],
    landlordId: '2',
    roomType: 'private',
    currentOccupants: 2,
    maxOccupants: 3,
    coordinates: { lat: 41.5597, lng: -8.3988 },
    distanceToUniversity: 0.7,
    universityName: 'Universidade do Minho',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: false,
      kitchen: true,
      washingMachine: true,
      balcony: false,
      parking: false,
      airConditioning: false,
      heating: true,
      elevator: false,
    },
    utilities: 50,
    availableFrom: new Date('2026-09-01'),
    minimumStay: 10,
    status: 'active',
    verified: true,
    compatibilityScore: 76,
    createdAt: new Date('2026-04-07'),
    updatedAt: new Date('2026-04-13'),
    views: 61,
  },
  {
    id: '16',
    title: 'Quarto vintage em Porto - Ribeira',
    description: 'Quarto com charme em edifício histórico. Zona ribeirinha.',
    city: 'Porto',
    zone: 'Ribeira',
    address: 'Cais da Ribeira, Porto',
    price: 360,
    images: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800'],
    landlordId: '2',
    roomType: 'private',
    currentOccupants: 2,
    maxOccupants: 3,
    coordinates: { lat: 41.1408, lng: -8.6139 },
    distanceToUniversity: 2.8,
    universityName: 'Universidade do Porto',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: false,
      kitchen: true,
      washingMachine: false,
      balcony: false,
      parking: false,
      airConditioning: false,
      heating: true,
      elevator: false,
    },
    utilities: 50,
    availableFrom: new Date('2026-08-15'),
    minimumStay: 10,
    status: 'active',
    verified: false,
    compatibilityScore: 62,
    createdAt: new Date('2026-04-09'),
    updatedAt: new Date('2026-04-09'),
    views: 48,
  },
  {
    id: '17',
    title: 'Estúdio novo em Viseu - Zona Industrial',
    description: 'Estúdio recém-construído. Equipamento moderno.',
    city: 'Viseu',
    zone: 'Zona Industrial',
    address: 'Rua da Indústria, Viseu',
    price: 380,
    images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800'],
    landlordId: '2',
    roomType: 'studio',
    currentOccupants: 0,
    maxOccupants: 1,
    coordinates: { lat: 40.6545, lng: -7.9245 },
    distanceToUniversity: 2.5,
    universityName: 'ESTGV',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: true,
      kitchen: true,
      washingMachine: true,
      balcony: true,
      parking: true,
      airConditioning: true,
      heating: true,
      elevator: true,
    },
    availableFrom: new Date('2026-07-01'),
    minimumStay: 12,
    status: 'active',
    verified: true,
    compatibilityScore: 84,
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-20'),
    views: 96,
  },
  {
    id: '18',
    title: 'Quarto simples em Lisboa - Benfica',
    description: 'Opção básica mas funcional. Boa relação qualidade-preço.',
    city: 'Lisboa',
    zone: 'Benfica',
    address: 'Estrada de Benfica, Lisboa',
    price: 270,
    images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800'],
    landlordId: '2',
    roomType: 'private',
    currentOccupants: 2,
    maxOccupants: 3,
    coordinates: { lat: 38.7433, lng: -9.2019 },
    distanceToUniversity: 4.2,
    universityName: 'Universidade de Lisboa',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: false,
      kitchen: true,
      washingMachine: true,
      balcony: false,
      parking: false,
      airConditioning: false,
      heating: false,
    },
    availableFrom: new Date('2026-09-01'),
    minimumStay: 10,
    status: 'active',
    verified: false,
    compatibilityScore: 52,
    createdAt: new Date('2026-04-14'),
    updatedAt: new Date('2026-04-14'),
    views: 23,
  },
  {
    id: '19',
    title: 'Apartamento de luxo em Coimbra',
    description: 'T2 de alto padrão com todas as comodidades premium.',
    city: 'Coimbra',
    zone: 'Solum',
    address: 'Avenida Fernão de Magalhães, Coimbra',
    price: 500,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800'],
    landlordId: '2',
    roomType: 'apartment',
    currentOccupants: 1,
    maxOccupants: 2,
    coordinates: { lat: 40.2030, lng: -8.4108 },
    distanceToUniversity: 1.7,
    universityName: 'Universidade de Coimbra',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: true,
      kitchen: true,
      washingMachine: true,
      balcony: true,
      parking: true,
      airConditioning: true,
      heating: true,
      elevator: true,
    },
    availableFrom: new Date('2026-08-01'),
    minimumStay: 12,
    status: 'active',
    verified: true,
    compatibilityScore: 95,
    createdAt: new Date('2026-03-22'),
    updatedAt: new Date('2026-04-18'),
    views: 187,
  },
  {
    id: '20',
    title: 'Quarto acolhedor em Braga - Centro Histórico',
    description: 'Quarto em apartamento no coração de Braga. Muita história.',
    city: 'Braga',
    zone: 'Centro Histórico',
    address: 'Rua Dom Diogo de Sousa, Braga',
    price: 295,
    images: ['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800'],
    landlordId: '2',
    roomType: 'private',
    currentOccupants: 1,
    maxOccupants: 2,
    coordinates: { lat: 41.5506, lng: -8.4260 },
    distanceToUniversity: 1.2,
    universityName: 'Universidade do Minho',
    amenities: {
      furnished: true,
      wifi: true,
      utilitiesIncluded: false,
      kitchen: true,
      washingMachine: true,
      balcony: false,
      parking: false,
      airConditioning: false,
      heating: true,
      elevator: false,
    },
    utilities: 50,
    availableFrom: new Date('2026-09-01'),
    minimumStay: 10,
    status: 'active',
    verified: true,
    compatibilityScore: 70,
    createdAt: new Date('2026-04-05'),
    updatedAt: new Date('2026-04-11'),
    views: 55,
  },
];

// Helper functions
export function getAccommodations(): Accommodation[] {
  const stored = localStorage.getItem(ACCOMMODATIONS_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(ACCOMMODATIONS_STORAGE_KEY, JSON.stringify(mockAccommodations));
  return mockAccommodations;
}

export function getAccommodation(id: string): Accommodation | null {
  const accommodations = getAccommodations();
  return accommodations.find(a => a.id === id) || null;
}

export function searchAccommodations(filters: SearchFilters): Accommodation[] {
  let results = getAccommodations();

  // Only show active accommodations in search
  results = results.filter(a => a.status === 'active');

  // Filter by cities
  if (filters.cities && filters.cities.length > 0) {
    results = results.filter(a => filters.cities!.includes(a.city));
  }

  // Filter by price range
  if (filters.minPrice !== undefined) {
    results = results.filter(a => a.price >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    results = results.filter(a => a.price <= filters.maxPrice!);
  }

  // Filter by room types
  if (filters.roomTypes && filters.roomTypes.length > 0) {
    results = results.filter(a => filters.roomTypes!.includes(a.roomType));
  }

  // Filter by minimum compatibility
  if (filters.minCompatibility !== undefined) {
    results = results.filter(a => (a.compatibilityScore || 0) >= filters.minCompatibility!);
  }

  // Filter by maximum distance
  if (filters.maxDistance !== undefined) {
    results = results.filter(a => a.distanceToUniversity <= filters.maxDistance!);
  }

  // Sort results
  switch (filters.sortBy) {
    case 'compatibility':
      results.sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0));
      break;
    case 'price_asc':
      results.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      results.sort((a, b) => b.price - a.price);
      break;
    case 'distance':
      results.sort((a, b) => a.distanceToUniversity - b.distanceToUniversity);
      break;
    case 'recent':
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    default:
      // Default: sort by compatibility
      results.sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0));
  }

  return results;
}

export function getFavorites(userId: string): FavoriteAccommodation[] {
  const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
  const all: FavoriteAccommodation[] = stored ? JSON.parse(stored) : [];
  return all.filter(f => f.userId === userId);
}

export function toggleFavorite(userId: string, accommodationId: string): boolean {
  const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
  let favorites: FavoriteAccommodation[] = stored ? JSON.parse(stored) : [];

  const existing = favorites.findIndex(
    f => f.userId === userId && f.accommodationId === accommodationId
  );

  if (existing >= 0) {
    favorites.splice(existing, 1);
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    return false; // removed
  } else {
    favorites.push({
      userId,
      accommodationId,
      savedAt: new Date(),
    });
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    return true; // added
  }
}

export function isFavorite(userId: string, accommodationId: string): boolean {
  const favorites = getFavorites(userId);
  return favorites.some(f => f.accommodationId === accommodationId);
}

export function getApplications(userId: string): Application[] {
  const stored = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
  const all: Application[] = stored ? JSON.parse(stored) : [];
  return all.filter(a => a.userId === userId);
}

export function createApplication(
  userId: string,
  accommodationId: string,
  landlordId: string,
  message: string,
  moveInDate?: Date
): Application {
  const stored = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
  const all: Application[] = stored ? JSON.parse(stored) : [];

  const newApplication: Application = {
    id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    accommodationId,
    landlordId,
    status: 'pending',
    message,
    moveInDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  all.push(newApplication);
  localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(all));

  return newApplication;
}

export function getLandlordApplications(landlordId: string): Application[] {
  const stored = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
  const all: Application[] = stored ? JSON.parse(stored) : [];
  return all.filter(a => a.landlordId === landlordId);
}

export function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): boolean {
  const stored = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
  const all: Application[] = stored ? JSON.parse(stored) : [];

  const index = all.findIndex(a => a.id === applicationId);
  if (index >= 0) {
    all[index].status = status;
    all[index].updatedAt = new Date();
    all[index].reviewedAt = new Date();
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(all));
    return true;
  }

  return false;
}
