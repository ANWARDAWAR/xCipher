import { create } from 'zustand';

interface NavState {
  activeCategorySlug: string | null;
  setActiveCategorySlug: (slug: string | null) => void;
}

export const useNavStore = create<NavState>((set) => ({
  activeCategorySlug: null,
  setActiveCategorySlug: (slug) => set({ activeCategorySlug: slug }),
}));
