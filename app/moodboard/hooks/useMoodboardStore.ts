"use client";

import { create } from 'zustand';
import type { Moodboard, MoodboardElement } from '@/app/moodboard/lib/moodboardTypes';

interface MoodboardState {
  elements: MoodboardElement[];
  selectedElementId: string | null;
  title: string;
  history: MoodboardElement[][];
  future: MoodboardElement[][];

  setTitle: (title: string) => void;
  addElement: (element: MoodboardElement) => void;
  updateElement: (id: string, partial: Partial<MoodboardElement>) => void;
  removeElement: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  lockElement: (id: string) => void;
  unlockElement: (id: string) => void;
  setSelectedElement: (id: string | null) => void;
  setFromServer: (moodboard: Moodboard) => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY = 50;

function withHistory(
  state: MoodboardState,
  nextElements: MoodboardElement[],
): Pick<MoodboardState, 'elements' | 'history' | 'future'> {
  const history = [...state.history, state.elements];
  if (history.length > MAX_HISTORY) history.shift();
  return { elements: nextElements, history, future: [] };
}

export const useMoodboardStore = create<MoodboardState>((set) => ({
  elements: [],
  selectedElementId: null,
  title: 'Nuevo moodboard',
  history: [],
  future: [],

  setTitle: (title) => set(() => ({ title })),

  addElement: (element) =>
    set((state) => {
      const next = [...state.elements, element];
      return { ...state, ...withHistory(state, next), selectedElementId: element.id };
    }),

  updateElement: (id, partial) =>
    set((state) => {
      const idx = state.elements.findIndex((e) => e.id === id);
      if (idx === -1) return state;
      const updated = [...state.elements];
      updated[idx] = { ...updated[idx], ...partial };
      return { ...state, ...withHistory(state, updated) };
    }),

  removeElement: (id) =>
    set((state) => {
      const next = state.elements.filter((e) => e.id !== id);
      const selectedElementId = state.selectedElementId === id ? null : state.selectedElementId;
      return { ...state, ...withHistory(state, next), selectedElementId };
    }),

  bringToFront: (id) =>
    set((state) => {
      const idx = state.elements.findIndex((e) => e.id === id);
      if (idx === -1) return state;
      const next = [...state.elements];
      const [el] = next.splice(idx, 1);
      next.push(el);
      return { ...state, ...withHistory(state, next) };
    }),

  sendToBack: (id) =>
    set((state) => {
      const idx = state.elements.findIndex((e) => e.id === id);
      if (idx === -1) return state;
      const next = [...state.elements];
      const [el] = next.splice(idx, 1);
      next.unshift(el);
      return { ...state, ...withHistory(state, next) };
    }),

  lockElement: (id) =>
    set((state) => {
      const next = state.elements.map((e) => (e.id === id ? { ...e, locked: true } : e));
      return { ...state, ...withHistory(state, next) };
    }),

  unlockElement: (id) =>
    set((state) => {
      const next = state.elements.map((e) => (e.id === id ? { ...e, locked: false } : e));
      return { ...state, ...withHistory(state, next) };
    }),

  setSelectedElement: (id) => set(() => ({ selectedElementId: id })),

  setFromServer: (moodboard) =>
    set(() => ({
      elements: moodboard.elements ?? [],
      title: moodboard.title,
      selectedElementId: null,
      history: [],
      future: [],
    })),

  reset: () =>
    set(() => ({
      elements: [],
      selectedElementId: null,
      title: 'Nuevo moodboard',
      history: [],
      future: [],
    })),

  undo: () =>
    set((state) => {
      if (!state.history.length) return state;
      const previous = state.history[state.history.length - 1];
      const history = state.history.slice(0, -1);
      const future = [state.elements, ...state.future];
      return { ...state, elements: previous, history, future, selectedElementId: null };
    }),

  redo: () =>
    set((state) => {
      if (!state.future.length) return state;
      const [next, ...rest] = state.future;
      const history = [...state.history, state.elements];
      return { ...state, elements: next, history, future: rest, selectedElementId: null };
    }),
}));

