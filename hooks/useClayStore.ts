import { create } from 'zustand';
import type { Card, BlueprintData, EvaluatorResults, AppStatus } from '@/types';

interface ClayStore {
  // State
  cards: Card[];
  query: string;
  blueprintData: BlueprintData | null;
  evaluatorResults: EvaluatorResults | null;
  status: AppStatus;
  isDemo: boolean;
  overlapHighlighted: boolean;

  // Card mutations
  addCard: (card: Card) => void;
  clearCards: () => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  removeCard: (id: string) => void;

  // Blueprint
  setBlueprintData: (data: BlueprintData | null) => void;

  // Evaluator
  setEvaluatorResults: (results: EvaluatorResults | null) => void;

  // App state
  setStatus: (status: AppStatus) => void;
  setQuery: (query: string) => void;
  setIsDemo: (isDemo: boolean) => void;
  setOverlapHighlighted: (v: boolean) => void;
}

export const useClayStore = create<ClayStore>((set) => ({
  cards: [],
  query: '',
  blueprintData: null,
  evaluatorResults: null,
  status: { type: 'idle' },
  isDemo: false,
  overlapHighlighted: false,

  addCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
  clearCards: () => set({ cards: [], evaluatorResults: null }),
  updateCard: (id, updates) =>
    set((state) => ({
      cards: state.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeCard: (id) =>
    set((state) => ({
      cards: state.cards.filter((c) => c.id !== id),
    })),

  setBlueprintData: (data) => set({ blueprintData: data }),
  setEvaluatorResults: (results) => set({ evaluatorResults: results }),
  setStatus: (status) => set({ status }),
  setQuery: (query) => set({ query }),
  setIsDemo: (isDemo) => set({ isDemo }),
  setOverlapHighlighted: (v) => set({ overlapHighlighted: v }),
}));
