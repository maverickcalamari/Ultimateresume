import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token: string, user: User) => {
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },
      updateUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

// API helper with authentication
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  requireAuth = false
): Promise<Response> {
  const { token } = useAuth.getState();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (requireAuth) {
    throw new Error('Authentication required');
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (res.status === 401) {
    // Token expired or invalid
    useAuth.getState().logout();
    throw new Error('Authentication expired');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorData.message || `HTTP ${res.status}`);
  }

  return res;
}