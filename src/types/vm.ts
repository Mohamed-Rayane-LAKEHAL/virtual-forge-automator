export interface VM {
  id: number;
  vmName: string;
  esxiHost: string;
  datastore: string;
  network: string;
  cpuCount: number;
  memoryGB: number;
  diskGB: number;
  isoPath: string;
  guestOS: string;
  vcenter: string;
  created_at: string;
  result?: string;
  status: 'pending' | 'success' | 'error';
}

export interface VMFormData {
  vmName: string;
  esxiHost: string;
  datastore: string;
  network: string;
  cpuCount: number;
  memoryGB: number;
  diskGB: number;
  isoPath: string;
  guestOS: string;
  vcenter: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface User {
  username: string;
}

export interface BatchVMData extends Omit<VMFormData, 'vmName'> {
  vmNames: string[];
}
