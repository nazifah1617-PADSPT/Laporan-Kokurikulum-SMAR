
export interface Report {
  id?: string;
  nama: string;
  tarikh: string;
  hari: string;
  tempat: string;
  masa: string;
  objektif: string;
  aktiviti: string;
  imej: string[];
  timestamp: string;
}

export type ViewState = 'dashboard' | 'admin';
export type ConnectionStatus = 'online' | 'offline' | 'pending';
