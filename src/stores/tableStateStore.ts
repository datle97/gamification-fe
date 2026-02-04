import type { ColumnFiltersMap } from '@/lib/column-filters'
import type { SortingState, VisibilityState } from '@tanstack/react-table'
import { create, type StateCreator } from 'zustand'
import { createJSONStorage, persist, type PersistOptions } from 'zustand/middleware'

interface TableState {
  sorting: SortingState
  columnVisibility: VisibilityState
  columnFilters: ColumnFiltersMap
}

interface TableStateStore {
  tables: Record<string, TableState>

  // Actions
  setSorting: (tableId: string, sorting: SortingState) => void
  setColumnVisibility: (tableId: string, visibility: VisibilityState) => void
  setColumnFilters: (tableId: string, filters: ColumnFiltersMap) => void
  getTableState: (tableId: string) => TableState | undefined
  clearTableState: (tableId: string) => void
}

type TableStatePersistedState = Pick<TableStateStore, 'tables'>

const persistOptions: PersistOptions<TableStateStore, TableStatePersistedState> = {
  name: 'gamification-table-state',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    tables: state.tables,
  }),
}

const storeCreator: StateCreator<TableStateStore> = (set, get) => ({
  tables: {},

  setSorting: (tableId, sorting) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [tableId]: {
          ...state.tables[tableId],
          sorting,
          columnVisibility: state.tables[tableId]?.columnVisibility ?? {},
          columnFilters: state.tables[tableId]?.columnFilters ?? {},
        },
      },
    })),

  setColumnVisibility: (tableId, visibility) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [tableId]: {
          ...state.tables[tableId],
          sorting: state.tables[tableId]?.sorting ?? [],
          columnVisibility: visibility,
          columnFilters: state.tables[tableId]?.columnFilters ?? {},
        },
      },
    })),

  setColumnFilters: (tableId, filters) =>
    set((state) => ({
      tables: {
        ...state.tables,
        [tableId]: {
          ...state.tables[tableId],
          sorting: state.tables[tableId]?.sorting ?? [],
          columnVisibility: state.tables[tableId]?.columnVisibility ?? {},
          columnFilters: filters,
        },
      },
    })),

  getTableState: (tableId) => get().tables[tableId],

  clearTableState: (tableId) =>
    set((state) => {
      const { [tableId]: _, ...rest } = state.tables
      return { tables: rest }
    }),
})

export const useTableStateStore = create<TableStateStore>()(
  persist(storeCreator, persistOptions) as StateCreator<TableStateStore>
)

// Selector hooks for convenience
export const useTableSorting = (tableId: string | undefined) =>
  useTableStateStore((state) => (tableId ? state.tables[tableId]?.sorting : undefined))

export const useTableColumnVisibility = (tableId: string | undefined) =>
  useTableStateStore((state) => (tableId ? state.tables[tableId]?.columnVisibility : undefined))

export const useTableColumnFilters = (tableId: string | undefined) =>
  useTableStateStore((state) => (tableId ? state.tables[tableId]?.columnFilters : undefined))

export const useSetTableSorting = () => useTableStateStore((state) => state.setSorting)

export const useSetTableColumnVisibility = () =>
  useTableStateStore((state) => state.setColumnVisibility)

export const useSetTableColumnFilters = () =>
  useTableStateStore((state) => state.setColumnFilters)
