import { create } from 'zustand';

const useToastStore = create((set) => ({
  visible: false,
  message: '',
  type: 'info', // 'success', 'error', 'info'
  show: (message, type = 'info') => {
    set({ message, type, visible: true });
    setTimeout(() => {
      set({ visible: false });
    }, 3000);
  },
  hide: () => set({ visible: false }),
}));

export default useToastStore;
