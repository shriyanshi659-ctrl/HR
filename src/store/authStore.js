import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (userObj) => {
        set({ 
          isAuthenticated: true, 
          user: userObj 
        });
      },
      logout: () => {
        set({ isAuthenticated: false, user: null });
      },
    }),
    {
      name: 'hr-fms-auth-storage', // persists in localStorage
    }
  )
);

export default useAuthStore;
