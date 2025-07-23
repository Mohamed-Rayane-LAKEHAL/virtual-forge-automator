
import { VM, VMFormData, LoginData, User } from '../types/vm';

// Allow configuration through environment variables with a fallback mechanism
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.41:5000';

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
      mode: 'cors' as RequestMode,
      ...options,
    };

    console.log(`Making ${config.method || 'GET'} request to: ${url}`);

    try {
      const response = await fetch(url, config);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (parseError) {
          console.log('Could not parse error response as JSON:', parseError);
        }
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('API Response:', data);
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Server is currently unavailable. Please try again later.');
      }
      
      // Re-throw other errors
      throw error;
    }
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
