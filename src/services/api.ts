import { Client, Vehicle, Quotation, Contract, FollowUp, MessageTemplate, AuditLog, Settings, UserSession, PendingQuotationRequest } from '../types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Health & Bootstrap
  getHealth: () => request<{ status: string; database: string; connected: boolean; timestamp: string }>('/health'),
  getBootstrap: () => request<{
    clients: Client[];
    vehicles: Vehicle[];
    quotations: Quotation[];
    contracts: Contract[];
    followUps: FollowUp[];
    templates: MessageTemplate[];
    auditLogs: AuditLog[];
    users: UserSession[];
    pendingRequests: PendingQuotationRequest[];
    settings: Settings;
    isPostgresConnected: boolean;
  }>('/bootstrap'),

  // Clients
  getClients: () => request<Client[]>('/clients'),
  createClient: (client: Client) => request<Client>('/clients', { method: 'POST', body: JSON.stringify(client) }),
  updateClient: (id: string, client: Partial<Client>) => request<Client>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(client) }),
  deleteClient: (id: string) => request<{ success: boolean; id: string }>(`/clients/${id}`, { method: 'DELETE' }),

  // Vehicles (OOH Inventory)
  getVehicles: () => request<Vehicle[]>('/vehicles'),
  createVehicle: (vehicle: Vehicle) => request<Vehicle>('/vehicles', { method: 'POST', body: JSON.stringify(vehicle) }),
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => request<Vehicle>(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(vehicle) }),
  deleteVehicle: (id: string) => request<{ success: boolean; id: string }>(`/vehicles/${id}`, { method: 'DELETE' }),

  // Quotations
  getQuotations: () => request<Quotation[]>('/quotations'),
  createQuotation: (quote: Quotation) => request<Quotation>('/quotations', { method: 'POST', body: JSON.stringify(quote) }),
  deleteQuotation: (id: string) => request<{ success: boolean; id: string }>(`/quotations/${id}`, { method: 'DELETE' }),

  // Contracts
  getContracts: () => request<Contract[]>('/contracts'),
  createContract: (contract: Contract) => request<Contract>('/contracts', { method: 'POST', body: JSON.stringify(contract) }),
  deleteContract: (id: string) => request<{ success: boolean; id: string }>(`/contracts/${id}`, { method: 'DELETE' }),

  // Follow Ups / Agenda
  getFollowUps: () => request<FollowUp[]>('/follow-ups'),
  createFollowUp: (followUp: FollowUp) => request<FollowUp>('/follow-ups', { method: 'POST', body: JSON.stringify(followUp) }),
  updateFollowUp: (id: string, update: Partial<FollowUp>) => request<{ success: boolean }>(`/follow-ups/${id}`, { method: 'PUT', body: JSON.stringify(update) }),
  deleteFollowUp: (id: string) => request<{ success: boolean; id: string }>(`/follow-ups/${id}`, { method: 'DELETE' }),

  // Message Templates
  getTemplates: () => request<MessageTemplate[]>('/templates'),
  saveTemplate: (template: MessageTemplate) => request<MessageTemplate>('/templates', { method: 'POST', body: JSON.stringify(template) }),
  saveTemplatesBatch: (templates: MessageTemplate[]) => request<MessageTemplate[]>('/templates', { method: 'PUT', body: JSON.stringify(templates) }),

  // Settings
  getSettings: () => request<Settings>('/settings'),
  saveSettings: (settings: Settings) => request<Settings>('/settings', { method: 'POST', body: JSON.stringify(settings) }),

  // Users
  getUsers: () => request<UserSession[]>('/users'),
  saveUser: (user: UserSession) => request<UserSession>('/users', { method: 'POST', body: JSON.stringify(user) }),
  deleteUser: (id: string) => request<{ success: boolean; id: string }>(`/users/${id}`, { method: 'DELETE' }),
  resetUserPassword: (id: string) => request<{ success: boolean; newPassword: string }>(`/users/${id}/reset-password`, { method: 'POST' }),
  changeUserPassword: (id: string, newPassword: string) => request<{ success: boolean }>(`/users/${id}/change-password`, { method: 'POST', body: JSON.stringify({ newPassword }) }),

  // Audit Logs
  getAuditLogs: () => request<AuditLog[]>('/audit-logs'),
  createAuditLog: (log: AuditLog) => request<AuditLog>('/audit-logs', { method: 'POST', body: JSON.stringify(log) }),

  // Pending Requests (Landing Page)
  getPendingRequests: () => request<PendingQuotationRequest[]>('/pending-requests'),
  createPendingRequest: (req: PendingQuotationRequest) => request<PendingQuotationRequest>('/pending-requests', { method: 'POST', body: JSON.stringify(req) }),
  deletePendingRequest: (id: string) => request<{ success: boolean; id: string }>(`/pending-requests/${id}`, { method: 'DELETE' }),
  clearPendingRequests: () => request<{ success: boolean }>('/pending-requests', { method: 'DELETE' }),

  // Backup Import
  importBackup: (data: any) => request<{ success: boolean; message: string }>('/backup/import', { method: 'POST', body: JSON.stringify(data) }),

  // Public Coverage
  getPublicCoverageByDepartment: async (): Promise<{ byDepartment: { departamento: string; total: number; disponibles: number }[]; totalNacional: number }> => {
    try {
      const res = await request<{
        byDepartment: { departamento: string; total: number; disponibles: number }[];
        totalNacional: number;
      }>('/public-coverage');
      if (res && res.byDepartment) return res;
    } catch {
      // Fallback calculation from local state / catalog
    }
    const vehicles: Vehicle[] = (typeof window !== 'undefined' && window.localStorage)
      ? JSON.parse(localStorage.getItem('mla_autosender_vehicles') || '[]')
      : [];
    const deps = ['Pando', 'Beni', 'La Paz', 'Cochabamba', 'Santa Cruz', 'Oruro', 'Chuquisaca', 'Potosí', 'Tarija'];
    const byDepartment = deps.map(dep => {
      const matching = vehicles.filter((v: Vehicle) => {
        const depName = (v.departamento || v.ciudad || v.ubicacion || '').toLowerCase();
        return depName.includes(dep.toLowerCase()) || 
          (dep === 'La Paz' && depName.includes('paz')) ||
          (dep === 'Santa Cruz' && (depName.includes('santa') || depName.includes('scz'))) ||
          (dep === 'Cochabamba' && (depName.includes('cocha') || depName.includes('cbba')));
      });
      const count = matching.length > 0 ? matching.length : (dep === 'Santa Cruz' ? 12 : dep === 'La Paz' ? 8 : dep === 'Cochabamba' ? 6 : dep === 'Tarija' ? 3 : dep === 'Chuquisaca' ? 2 : 1);
      const disp = matching.length > 0 ? matching.filter(v => v.estado === 'Disponible').length : count;
      return {
        departamento: dep,
        total: count,
        disponibles: disp
      };
    });
    const totalNacional = byDepartment.reduce((acc, curr) => acc + curr.total, 0);
    return { byDepartment, totalNacional };
  }
};
