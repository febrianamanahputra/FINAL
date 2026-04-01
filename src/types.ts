export interface Profile {
  name: string;
  role: string;
  avatar: string | null;
}

export interface Location {
  id: string;
  name: string;
}

export interface Area {
  nama: string;
  kategori: string;
}

export interface LocData {
  reports: any[];
  materials: any[];
  dana: any[];
  catatan: any[];
  links: any[];
  areas: Area[];
  pekerjaan: any[];
  coverPhoto?: string;
  waNumber?: string;
  waProyek?: string;
  danaNoSeri?: number;
  danaDrafts?: Record<number, any>;
  pendingRequests?: any[];
  stock?: Record<string, any>;
  ironCalcs?: any[];
}

export interface AppState {
  profile: Profile;
  locations: Location[];
  activeLoc: string | null;
  locData: Record<string, LocData>;
  globalCatatan?: any[];
  globalLinks?: any[];
  theme?: string;
}

export const defaultState: AppState = {
  profile: { name: 'Nama Pengguna', role: 'Jabatan', avatar: null },
  locations: [],
  activeLoc: null,
  locData: {},
  globalCatatan: [],
  globalLinks: [],
  theme: 'default'
};
