
import { VM, VMFormData, LoginData, User } from '../types/vm';

// Use the current machine's IP where the backend is running
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.41:5000';

console.log('API_BASE_URL configured as:', API_BASE_URL);
console.log('Environment variables:', import.meta.env);

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
    console.log('Request config:', config);
    console.log('Current window location:', window.location.href);

    try {
      const response = await fetch(url, config);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
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
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('Network error - possible causes:');
        console.error('1. Server not running on', API_BASE_URL);
        console.error('2. CORS not properly configured');
        console.error('3. Network connectivity issues');
        console.error('4. Firewall blocking the connection');
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
