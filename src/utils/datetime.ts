import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.locale('zh-cn');
dayjs.extend(duration);
dayjs.extend(relativeTime);

export const formatDate = (date: string | Date | number, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date | number, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  return dayjs(date).format(format);
};

export const formatTime = (date: string | Date | number, format: string = 'HH:mm:ss'): string => {
  return dayjs(date).format(format);
};

export const formatRelativeTime = (date: string | Date | number): string => {
  return dayjs(date).fromNow();
};

export const getDuration = (start: string | Date | number, end: string | Date | number): {
  days: number;
  hours: number;
  minutes: number;
  totalHours: number;
  totalMinutes: number;
} => {
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  const diff = endDate.diff(startDate);
  const dur = dayjs.duration(diff);

  return {
    days: Math.floor(dur.asDays()),
    hours: dur.hours(),
    minutes: dur.minutes(),
    totalHours: Math.round(dur.asHours() * 100) / 100,
    totalMinutes: Math.round(dur.asMinutes()),
  };
};

export const getDurationText = (start: string | Date | number, end: string | Date | number): string => {
  const { days, hours, minutes, totalHours } = getDuration(start, end);
  const parts: string[] = [];

  if (days > 0) parts.push(`${days}天`);
  if (hours > 0 || days > 0) parts.push(`${hours}小时`);
  if (minutes > 0 || (days === 0 && hours === 0)) parts.push(`${minutes}分钟`);

  if (parts.length === 0) return '0分钟';
  return parts.join(' ');
};

export const getDurationHours = (start: string | Date | number, end: string | Date | number): number => {
  return getDuration(start, end).totalHours;
};

export const addHours = (date: string | Date | number, hours: number): Date => {
  return dayjs(date).add(hours, 'hour').toDate();
};

export const addMinutes = (date: string | Date | number, minutes: number): Date => {
  return dayjs(date).add(minutes, 'minute').toDate();
};

export const startOfDay = (date: string | Date | number): Date => {
  return dayjs(date).startOf('day').toDate();
};

export const endOfDay = (date: string | Date | number): Date => {
  return dayjs(date).endOf('day').toDate();
};

export const startOfWeek = (date: string | Date | number): Date => {
  return dayjs(date).startOf('week').toDate();
};

export const endOfWeek = (date: string | Date | number): Date => {
  return dayjs(date).endOf('week').toDate();
};

export const isSameDay = (date1: string | Date | number, date2: string | Date | number): boolean => {
  return dayjs(date1).isSame(date2, 'day');
};

export const isBetween = (
  target: string | Date | number,
  start: string | Date | number,
  end: string | Date | number
): boolean => {
  const targetDate = dayjs(target);
  return targetDate.isAfter(start) && targetDate.isBefore(end);
};

export const isOverlap = (
  start1: string | Date | number,
  end1: string | Date | number,
  start2: string | Date | number,
  end2: string | Date | number
): boolean => {
  const s1 = dayjs(start1).valueOf();
  const e1 = dayjs(end1).valueOf();
  const s2 = dayjs(start2).valueOf();
  const e2 = dayjs(end2).valueOf();

  return s1 < e2 && s2 < e1;
};

export const getOverlapMinutes = (
  start1: string | Date | number,
  end1: string | Date | number,
  start2: string | Date | number,
  end2: string | Date | number
): number => {
  const s1 = dayjs(start1).valueOf();
  const e1 = dayjs(end1).valueOf();
  const s2 = dayjs(start2).valueOf();
  const e2 = dayjs(end2).valueOf();

  if (!isOverlap(start1, end1, start2, end2)) return 0;

  const overlapStart = Math.max(s1, s2);
  const overlapEnd = Math.min(e1, e2);
  const diffMs = overlapEnd - overlapStart;

  return Math.round(diffMs / (1000 * 60));
};

export default dayjs;
