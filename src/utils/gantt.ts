import dayjs from 'dayjs';

export interface GanttConfig {
  startDate: string | Date;
  endDate: string | Date;
  columnWidth: number;
  unit: 'day' | 'hour';
  hoursPerDay?: number;
  workStartHour?: number;
  workEndHour?: number;
}

export interface GanttTimeRange {
  label: string;
  start: Date;
  end: Date;
  left: number;
  width: number;
}

export interface GanttBarPosition {
  left: number;
  width: number;
}

export const calculateGanttTimeRange = (config: GanttConfig): GanttTimeRange[] => {
  const { startDate, endDate, columnWidth, unit = 'hour' } = config;
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const ranges: GanttTimeRange[] = [];

  let current = start.clone();

  while (current.isBefore(end)) {
    const rangeStart = current.clone();
    const rangeEnd = unit === 'day'
      ? current.clone().add(1, 'day')
      : current.clone().add(1, 'hour');

    const totalDuration = end.valueOf() - start.valueOf();
    const rangeDuration = rangeEnd.valueOf() - rangeStart.valueOf();
    const left = ((rangeStart.valueOf() - start.valueOf()) / totalDuration) * 100;
    const width = (rangeDuration / totalDuration) * 100;

    ranges.push({
      label: unit === 'day'
        ? rangeStart.format('MM/DD')
        : rangeStart.format('HH:mm'),
      start: rangeStart.toDate(),
      end: rangeEnd.toDate(),
      left,
      width,
    });

    current = rangeEnd;
  }

  return ranges;
};

export const calculateBarPosition = (
  barStart: string | Date,
  barEnd: string | Date,
  timelineStart: string | Date,
  timelineEnd: string | Date
): GanttBarPosition => {
  const barStartDate = dayjs(barStart);
  const barEndDate = dayjs(barEnd);
  const timelineStartDate = dayjs(timelineStart);
  const timelineEndDate = dayjs(timelineEnd);

  const totalDuration = timelineEndDate.valueOf() - timelineStartDate.valueOf();
  const barDuration = barEndDate.valueOf() - barStartDate.valueOf();

  const left = Math.max(0, ((barStartDate.valueOf() - timelineStartDate.valueOf()) / totalDuration) * 100);
  const width = Math.min(100 - left, (barDuration / totalDuration) * 100);

  return {
    left: Math.round(left * 100) / 100,
    width: Math.round(width * 100) / 100,
  };
};

export const pixelToTime = (
  pixelX: number,
  containerWidth: number,
  timelineStart: string | Date,
  timelineEnd: string | Date
): Date => {
  const timelineStartDate = dayjs(timelineStart);
  const timelineEndDate = dayjs(timelineEnd);
  const totalDuration = timelineEndDate.valueOf() - timelineStartDate.valueOf();

  const ratio = pixelX / containerWidth;
  const timeMs = timelineStartDate.valueOf() + ratio * totalDuration;

  return dayjs(timeMs).toDate();
};

export const timeToPixel = (
  time: string | Date,
  containerWidth: number,
  timelineStart: string | Date,
  timelineEnd: string | Date
): number => {
  const timeDate = dayjs(time);
  const timelineStartDate = dayjs(timelineStart);
  const timelineEndDate = dayjs(timelineEnd);
  const totalDuration = timelineEndDate.valueOf() - timelineStartDate.valueOf();

  const ratio = (timeDate.valueOf() - timelineStartDate.valueOf()) / totalDuration;

  return Math.round(ratio * containerWidth);
};

export const snapToGrid = (
  time: string | Date,
  snapMinutes: number = 15
): Date => {
  const date = dayjs(time);
  const minutes = date.minute();
  const snappedMinutes = Math.round(minutes / snapMinutes) * snapMinutes;

  if (snappedMinutes >= 60) {
    return date
      .startOf('hour')
      .add(1, 'hour')
      .toDate();
  }

  return date
    .startOf('hour')
    .add(snappedMinutes, 'minute')
    .toDate();
};

export const getTimelineRange = (
  baseDate: string | Date,
  days: number = 7
): { start: Date; end: Date } => {
  const start = dayjs(baseDate).startOf('day');
  const end = start.clone().add(days, 'day');

  return {
    start: start.toDate(),
    end: end.toDate(),
  };
};

export const getWorkingHoursTimelineRange = (
  baseDate: string | Date,
  days: number = 7,
  workStartHour: number = 8,
  workEndHour: number = 20
): { start: Date; end: Date } => {
  const start = dayjs(baseDate).startOf('day').add(workStartHour, 'hour');
  const end = start.clone().add(days, 'day').subtract(workStartHour, 'hour').add(workEndHour, 'hour');

  return {
    start: start.toDate(),
    end: end.toDate(),
  };
};
