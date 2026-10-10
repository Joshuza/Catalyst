import { create } from 'zustand';

export type TilePresentation = { expanded: boolean; dimmed: boolean };
export const initialPresentation: TilePresentation = {
  expanded: false,
  dimmed: false,
};

type CanvasState = {
  tiles: Partial<Record<string, TilePresentation>>;
  toggle: (id: string, key: keyof TilePresentation) => void;
  reset: () => void;
};

export const useCanvasStore = create<CanvasState>((set) => ({
  tiles: {},
  toggle: (id, key) =>
    set((state) => {
      const current = state.tiles[id] ?? initialPresentation;
      return {
        tiles: { ...state.tiles, [id]: { ...current, [key]: !current[key] } },
      };
    }),
  reset: () => set({ tiles: {} }),
}));
