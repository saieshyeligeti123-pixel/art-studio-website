import {
  User,
  Painting,
  PaintingOrder,
  WallBooking,
  PotteryRequest,
  PotteryItemSpec,
  PotteryGlazeSpec,
} from '../types';

const TOKEN_KEY = 'artstudio_jwt_token';

class ApiClient {
  private token: string | null = null;

  constructor() {
    try {
      this.token = localStorage.getItem(TOKEN_KEY);
    } catch {
      // Ignore if localStorage unavailable
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // Ignore
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg) as Error & { status: number; code?: string };
      err.status = response.status;
      err.code = data.code;
      throw err;
    }

    return data as T;
  }

  // Auth APIs
  auth = {
    login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
      const res = await this.request<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      this.setToken(res.token);
      return res;
    },

    register: async (data: { email: string; password: string; name: string; phone?: string }): Promise<{ user: User; token: string }> => {
      const res = await this.request<{ user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      this.setToken(res.token);
      return res;
    },

    me: async (): Promise<{ user: User }> => {
      return this.request<{ user: User }>('/api/auth/me');
    },

    logout: () => {
      this.setToken(null);
    },
  };

  // Paintings & Orders APIs
  paintings = {
    list: async (): Promise<Painting[]> => {
      const res = await this.request<{ paintings: Painting[] }>('/api/paintings');
      return res.paintings;
    },

    get: async (id: string): Promise<Painting> => {
      const res = await this.request<{ painting: Painting }>(`/api/paintings/${id}`);
      return res.painting;
    },

    create: async (data: Omit<Painting, 'id' | 'status'>): Promise<Painting> => {
      const res = await this.request<{ painting: Painting }>('/api/paintings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.painting;
    },

    edit: async (id: string, updates: Partial<Painting>): Promise<Painting> => {
      const res = await this.request<{ painting: Painting }>(`/api/paintings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return res.painting;
    },

    purchase: async (id: string, shippingAddress: string): Promise<{ order: PaintingOrder }> => {
      return this.request<{ order: PaintingOrder }>(`/api/paintings/${id}/purchase`, {
        method: 'POST',
        body: JSON.stringify({ shippingAddress }),
      });
    },
  };

  orders = {
    list: async (): Promise<PaintingOrder[]> => {
      const res = await this.request<{ orders: PaintingOrder[] }>('/api/orders');
      return res.orders;
    },

    cancel: async (id: string): Promise<{ success: boolean; message: string }> => {
      return this.request<{ success: boolean; message: string }>(`/api/orders/${id}/cancel`, {
        method: 'POST',
      });
    },
  };

  // Mural Bookings APIs
  murals = {
    list: async (): Promise<WallBooking[]> => {
      const res = await this.request<{ bookings: WallBooking[] }>('/api/murals');
      return res.bookings;
    },

    create: async (data: {
      scheduledDate: string;
      wallSizeSqFt: number;
      address: string;
      city: string;
      stateZip: string;
      stylePreference: string;
      notes?: string;
    }): Promise<WallBooking> => {
      const res = await this.request<{ booking: WallBooking }>('/api/murals', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.booking;
    },

    cancel: async (id: string): Promise<{ success: boolean; message: string }> => {
      return this.request<{ success: boolean; message: string }>(`/api/murals/${id}/cancel`, {
        method: 'POST',
      });
    },

    updateStatus: async (
      id: string,
      status: 'confirmed' | 'declined',
      adminNote?: string
    ): Promise<{ success: boolean; status: string }> => {
      return this.request<{ success: boolean; status: string }>(`/api/murals/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, adminNote }),
      });
    },
  };

  // Pottery APIs
  pottery = {
    getCatalog: async (): Promise<{
      items: PotteryItemSpec[];
      glazes: PotteryGlazeSpec[];
      wallMuralRate: number;
    }> => {
      return this.request<{
        items: PotteryItemSpec[];
        glazes: PotteryGlazeSpec[];
        wallMuralRate: number;
      }>('/api/pottery/catalog');
    },

    list: async (): Promise<PotteryRequest[]> => {
      const res = await this.request<{ requests: PotteryRequest[] }>('/api/pottery');
      return res.requests;
    },

    create: async (data: {
      itemId: string;
      glazeId: string;
      quantity: number;
      requiredDate: string;
      specialNotes?: string;
    }): Promise<PotteryRequest> => {
      const res = await this.request<{ request: PotteryRequest }>('/api/pottery', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.request;
    },

    edit: async (
      id: string,
      data: {
        itemId: string;
        glazeId: string;
        quantity: number;
        requiredDate: string;
        specialNotes?: string;
      }
    ): Promise<PotteryRequest> => {
      const res = await this.request<{ request: PotteryRequest }>(`/api/pottery/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.request;
    },

    cancel: async (id: string): Promise<{ success: boolean; message: string }> => {
      return this.request<{ success: boolean; message: string }>(`/api/pottery/${id}/cancel`, {
        method: 'POST',
      });
    },

    updateStatus: async (
      id: string,
      status: 'accepted' | 'declined',
      adminNote?: string
    ): Promise<{ success: boolean; status: string }> => {
      return this.request<{ success: boolean; status: string }>(`/api/pottery/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, adminNote }),
      });
    },
  };

  // Admin and Seed Management
  admin = {
    getSeedStatus: async () => {
      return this.request<any>('/api/seed/status');
    },

    resetSeed: async () => {
      return this.request<any>('/api/admin/reset-seed', {
        method: 'POST',
      });
    },
  };
}

export const api = new ApiClient();
