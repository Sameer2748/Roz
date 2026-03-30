import { create } from 'zustand';

const useLogStore = create((set) => ({
  todayLogs: { breakfast: [], lunch: [], dinner: [], snack: [] },
  todayTotals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0 },
  waterToday: 0,
  isAnalyzing: false,
  analysisResult: null,
  pendingLogs: [], // Array of { id, image_uri, meal_type, started_at }

  setTodayLogs: (meals, totals) => set({ todayLogs: meals, todayTotals: totals }),
  setWaterToday: (ml) => set({ waterToday: ml }),
  setAnalyzing: (val) => set({ isAnalyzing: val }),
  setAnalysisResult: (result) => set({ analysisResult: result }),
  clearAnalysis: () => set({ analysisResult: null, isAnalyzing: false }),

  addPendingLog: (log) => set((state) => ({ 
    pendingLogs: [log, ...state.pendingLogs] 
  })),
  removePendingLog: (id) => set((state) => ({ 
    pendingLogs: state.pendingLogs.filter(p => p.id !== id) 
  })),

  addWater: (ml) => set((state) => ({ waterToday: state.waterToday + ml })),

  fetchTodayLogs: async (api) => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await api.get(`/logs/day?tz=${tz}`);
      set({ 
        todayLogs: res.data.data.meals, 
        todayTotals: res.data.data.totals 
      });
      return res.data.data;
    } catch (err) {
      console.error('Store fetchTodayLogs error:', err.message);
    }
  }
}));

export default useLogStore;
