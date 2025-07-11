import { VM, VMFormData, LoginData, User } from '../types/vm';

const API_BASE_URL = 'http://localhost:5000';

export interface BatchVMData extends Omit<VMFormData, 'vmName'> {
  vmNames: string[];
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include' as RequestCredentials,
      ...options,
    };

    console.log(`Making ${config.method || 'GET'} request to: ${url}`);

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error or server unavailable' }));
      console.error('API Error:', error);
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API Response:', data);
    return data;
  }

  async login(credentials: LoginData): Promise<{ message: string; user: User }> {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async checkAuth(): Promise<{ authenticated: boolean; user?: User }> {
    return this.request('/check-auth');
  }

  async logout(): Promise<{ message: string }> {
    return this.request('/logout', {
      method: 'POST',
    });
  }

  async getVMs(): Promise<VM[]> {
    return this.request('/vms');
  }

  async createVM(vmData: VMFormData): Promise<{ message: string }> {
    return this.request('/vms', {
      method: 'POST',
      body: JSON.stringify(vmData),
    });
  }

  async createBatchVMs(batchData: BatchVMData): Promise<{ message: string; vm_ids: number[] }> {
    return this.request('/vms/batch', {
      method: 'POST',
      body: JSON.stringify(batchData),
    });
  }
}

export const apiService = new ApiService();
