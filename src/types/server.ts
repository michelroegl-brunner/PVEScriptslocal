export interface Server {
  id: number;
  name: string;
  ip: string;
  user: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface CreateServerData {
  name: string;
  ip: string;
  user: string;
  password: string;
}

export interface UpdateServerData extends CreateServerData {
  id: number;
}

