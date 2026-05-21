import { Roommate, Review, HouseRules } from '../types/roommate';

export const mockRoommates: Record<string, Roommate[]> = {
  '1': [ // Viseu Centro
    {
      id: 'r1',
      name: 'Ana Costa',
      age: 21,
      course: 'Gestão',
      university: 'ESTGV',
      verified: true,
      lifestyle: {
        userId: 'r1',
        bedtime: 'moderate',
        wakeupTime: 'moderate',
        schedule: 'flexible',
        cleanliness: 4,
        cleaningFrequency: 'weekly',
        noiseTolerance: 3,
        musicVolume: 'moderate',
        guestsFrequency: 'sometimes',
        guestsAcceptance: 4,
        smoking: false,
        pets: false,
        cooking: 'often',
        personality: 'moderate',
        socialPreference: 'moderate',
      },
      bio: 'Estudante de Gestão no 2º ano. Gosto de manter a casa organizada e ter um bom ambiente.',
    },
    {
      id: 'r2',
      name: 'Pedro Silva',
      age: 22,
      course: 'Informática',
      university: 'ESTGV',
      verified: true,
      lifestyle: {
        userId: 'r2',
        bedtime: 'late',
        wakeupTime: 'late',
        schedule: 'night',
        cleanliness: 3,
        cleaningFrequency: 'weekly',
        noiseTolerance: 4,
        musicVolume: 'moderate',
        guestsFrequency: 'rarely',
        guestsAcceptance: 3,
        smoking: false,
        pets: false,
        cooking: 'sometimes',
        personality: 'introvert',
        socialPreference: 'quiet',
      },
      bio: 'Estudante de Informática. Mais noturno, gosto de tranquilidade para estudar.',
    },
  ],
};

export const mockReviews: Record<string, Review[]> = {
  '1': [
    {
      id: 'rev1',
      accommodationId: '1',
      userId: 'u1',
      userName: 'Miguel Ferreira',
      rating: 5,
      comment: 'Excelente casa! Ambiente muito bom, moradores simpáticos e casa sempre limpa. Localização perfeita perto da faculdade.',
      createdAt: new Date('2026-03-15'),
      helpful: 12,
    },
    {
      id: 'rev2',
      accommodationId: '1',
      userId: 'u2',
      userName: 'Sofia Martins',
      rating: 4,
      comment: 'Boa experiência no geral. Casa bem localizada e bem conservada. Apenas a cozinha às vezes fica um pouco desorganizada.',
      createdAt: new Date('2026-02-20'),
      helpful: 8,
    },
  ],
};

export const mockHouseRules: Record<string, HouseRules> = {
  '1': {
    smokingAllowed: true,
    smokingLocation: 'Apenas na varanda',
    petsAllowed: false,
    guestsPolicy: 'Permitido com aviso prévio',
    quietHours: 'Silêncio após as 23h',
    sharedSpaces: ['Cozinha', 'Sala de estar', 'Casa de banho'],
    cleaningSchedule: 'Rotação semanal entre moradores',
    other: ['Sem festas na casa', 'Respeitar espaços individuais'],
  },
};

export function getRoommatesForAccommodation(accommodationId: string): Roommate[] {
  return mockRoommates[accommodationId] || [];
}

export function getReviewsForAccommodation(accommodationId: string): Review[] {
  return mockReviews[accommodationId] || [];
}

export function getHouseRules(accommodationId: string): HouseRules | null {
  return mockHouseRules[accommodationId] || null;
}

export function getAverageRating(accommodationId: string): number {
  const reviews = getReviewsForAccommodation(accommodationId);
  if (reviews.length === 0) return 0;

  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Number((sum / reviews.length).toFixed(1));
}
