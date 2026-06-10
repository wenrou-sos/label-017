import { create } from 'zustand';
import type { Schedule, ConflictInfo, CreateScheduleRequest } from 'shared/types';
import { scheduleApi } from '@/api/scheduleApi';

interface ScheduleState {
  schedules: Schedule[];
  selectedSchedule: Schedule | null;
  conflictInfo: ConflictInfo | null;
  isLoading: boolean;
  error: string | null;
  fetchSchedules: (params?: { startDate?: string; endDate?: string; machineId?: number }) => Promise<void>;
  selectSchedule: (schedule: Schedule | null) => void;
  createSchedule: (data: CreateScheduleRequest) => Promise<Schedule>;
  updateSchedule: (id: number, data: Partial<CreateScheduleRequest>) => Promise<Schedule>;
  deleteSchedule: (id: number) => Promise<void>;
  checkConflict: (data: { scheduleId?: number; machineId: number; startTime: string; endTime: string }) => Promise<ConflictInfo>;
  clearConflict: () => void;
  clearError: () => void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: [],
  selectedSchedule: null,
  conflictInfo: null,
  isLoading: false,
  error: null,

  fetchSchedules: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await scheduleApi.getList(params);
      set({
        schedules: response.data,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取排程数据失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  selectSchedule: (schedule) => {
    set({ selectedSchedule: schedule });
  },

  createSchedule: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await scheduleApi.create(data);
      const newSchedule = response.data;
      set((state) => ({
        schedules: [...state.schedules, newSchedule],
        isLoading: false,
      }));
      return newSchedule;
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建排程失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateSchedule: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await scheduleApi.update(id, data);
      const updatedSchedule = response.data;
      set((state) => ({
        schedules: state.schedules.map((s) => (s.id === id ? updatedSchedule : s)),
        selectedSchedule: state.selectedSchedule?.id === id ? updatedSchedule : state.selectedSchedule,
        isLoading: false,
      }));
      return updatedSchedule;
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新排程失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteSchedule: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await scheduleApi.remove(id);
      set((state) => ({
        schedules: state.schedules.filter((s) => s.id !== id),
        selectedSchedule: state.selectedSchedule?.id === id ? null : state.selectedSchedule,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除排程失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  checkConflict: async (data) => {
    set({ error: null });
    try {
      const response = await scheduleApi.checkConflict(data);
      const conflictInfo = response.data;
      set({ conflictInfo });
      return conflictInfo;
    } catch (error) {
      const message = error instanceof Error ? error.message : '冲突检测失败';
      set({ error: message });
      throw error;
    }
  },

  clearConflict: () => {
    set({ conflictInfo: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useScheduleStore;
