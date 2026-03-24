import { create } from 'zustand';

export type TaskTab = 'tasks' | 'templates';
export type ViewMode = 'list' | 'calendar';
export type FilterStatus = 'all' | 'todo' | 'completed' | 'skipped';

interface TaskPageState {
  // Active tab
  activeTab: TaskTab;
  setActiveTab: (tab: TaskTab) => void;

  // View mode (list / calendar) — only for tasks tab
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Status filter
  statusFilter: FilterStatus;
  setStatusFilter: (filter: FilterStatus) => void;

  // Occurrences pagination
  page: number;
  setPage: (page: number) => void;

  // Templates pagination
  templatePage: number;
  setTemplatePage: (page: number) => void;

  // Selected occurrence for detail modal
  selectedOccurrenceId: string | null;
  setSelectedOccurrenceId: (id: string | null) => void;

  // Calendar selected date
  selectedCalendarDate: string | null;
  setSelectedCalendarDate: (date: string | null) => void;

  // Create / edit template dialog
  isCreateDialogOpen: boolean;
  setIsCreateDialogOpen: (open: boolean) => void;

  editingTemplate: Record<string, unknown> | null;
  setEditingTemplate: (template: Record<string, unknown> | null) => void;
  openEditDialog: (template: Record<string, unknown>) => void;
  closeEditDialog: () => void;

  // Delete confirmation
  deletingTemplateId: string | null;
  setDeletingTemplateId: (id: string | null) => void;
}

export const useTaskStore = create<TaskPageState>()((set) => ({
  activeTab: 'tasks',
  setActiveTab: (tab) => set({ activeTab: tab }),

  viewMode: 'list',
  setViewMode: (mode) => set({ viewMode: mode }),

  statusFilter: 'all',
  setStatusFilter: (filter) => set({ statusFilter: filter, page: 1 }),

  page: 1,
  setPage: (page) => set({ page }),

  templatePage: 1,
  setTemplatePage: (templatePage) => set({ templatePage }),

  selectedOccurrenceId: null,
  setSelectedOccurrenceId: (id) => set({ selectedOccurrenceId: id }),

  selectedCalendarDate: null,
  setSelectedCalendarDate: (date) => set({ selectedCalendarDate: date }),

  isCreateDialogOpen: false,
  setIsCreateDialogOpen: (open) =>
    set({ isCreateDialogOpen: open, editingTemplate: open ? null : null }),

  editingTemplate: null,
  setEditingTemplate: (template) => set({ editingTemplate: template }),
  openEditDialog: (template) =>
    set({ editingTemplate: template, isCreateDialogOpen: true }),
  closeEditDialog: () =>
    set({ editingTemplate: null, isCreateDialogOpen: false }),

  deletingTemplateId: null,
  setDeletingTemplateId: (id) => set({ deletingTemplateId: id }),
}));
