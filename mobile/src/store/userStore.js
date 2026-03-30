import { create } from 'zustand';

const useUserStore = create((set) => ({
  profile: null,
  dailyTarget: null,
  streak: { current_streak: 0, longest_streak: 0 },
  onboardingData: {},

  setProfile: (profile) => set({ profile }),
  setDailyTarget: (target) => set({ dailyTarget: target }),
  setStreak: (streak) => set({ streak }),

  updateOnboardingData: (data) =>
    set((state) => ({
      onboardingData: { ...state.onboardingData, ...data },
    })),

  clearOnboardingData: () => set({ onboardingData: {} }),
}));

export default useUserStore;
