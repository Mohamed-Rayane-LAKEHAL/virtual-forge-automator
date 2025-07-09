
import { VM, VMFormData, LoginData } from '../types/vm';

const API_BASE_URL = 'http://localhost:5000';

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

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'An error occurred' }));
      throw new Error(error.error || 'Network error');
    }

    return response.json();
  }

  async login(credentials: LoginData): Promise<{ message: string }> {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
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
}

export const apiService = new ApiService();
