export type MaintenanceCategory =
  | 'plumbing'      // Canalização
  | 'electricity'   // Eletricidade
  | 'heating'       // Água quente / Esquentador
  | 'internet'      // Internet
  | 'appliances'    // Eletrodomésticos
  | 'locks'         // Fechaduras / Portas
  | 'cleaning'      // Limpeza / Espaços comuns
  | 'other';        // Outro

export type MaintenanceUrgency = 'low' | 'medium' | 'high';

export type MaintenanceStatus = 'pending' | 'received' | 'in_progress' | 'resolved' | 'closed';

export interface MaintenanceRequest {
  id: string;
  userId: string;
  roomId?: string;
  propertyId?: string;
  landlordId: string;
  category: MaintenanceCategory;
  title: string;
  description: string;
  urgency: MaintenanceUrgency;
  status: MaintenanceStatus;
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export const maintenanceCategoryLabels: Record<MaintenanceCategory, string> = {
  plumbing: 'Canalização',
  electricity: 'Eletricidade',
  heating: 'Água quente / Esquentador',
  internet: 'Internet',
  appliances: 'Eletrodomésticos',
  locks: 'Fechaduras / Portas',
  cleaning: 'Limpeza / Espaços comuns',
  other: 'Outro',
};

export const maintenanceUrgencyLabels: Record<MaintenanceUrgency, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export const maintenanceStatusLabels: Record<MaintenanceStatus, string> = {
  pending: 'Pendente',
  received: 'Recebido',
  in_progress: 'Em Resolução',
  resolved: 'Resolvido',
  closed: 'Fechado',
};
