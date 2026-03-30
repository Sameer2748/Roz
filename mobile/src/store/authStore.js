import { create } from 'zustand';
import { getJSON, setItem, removeItem, StorageKeys } from '../services/storage';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  hydrate: async () => {
    try {
      const user = await getJSON(StorageKeys.USER);
      set({ user, isAuthenticated: !!user, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setUser: async (user) => {
    await setItem(StorageKeys.USER, user);
    set({ user, isAuthenticated: true });
  },

  updateUser: async (updates) => {
    set((state) => {
      const newUser = { ...state.user, ...updates };
      setItem(StorageKeys.USER, newUser); // Sync to storage
      return { user: newUser };
    });
  },

  clearUser: async () => {
    await removeItem(StorageKeys.USER);
    await removeItem(StorageKeys.ACCESS_TOKEN);
    await removeItem(StorageKeys.REFRESH_TOKEN);
    set({ user: null, isAuthenticated: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));

export default useAuthStore;
