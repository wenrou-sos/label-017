import { Schedule, ConflictInfo, CreateScheduleRequest } from '../../shared/types';
import scheduleRepository from '../repositories/schedule.repository';
import orderRepository from '../repositories/order.repository';
import machineRepository from '../repositories/machine.repository';
import { transaction } from '../config/database';
import logger from '../config/logger';
import { formatDateTimeForMySQL } from '../utils/datetime';

class ScheduleService {
  async findAll(): Promise<Schedule[]> {
    return scheduleRepository.findAllWithDetails();
  }

  async findById(id: number): Promise<Schedule | null> {
    return scheduleRepository.findByIdWithDetails(id);
  }

  async findByMachineId(machineId: number): Promise<Schedule[]> {
    return scheduleRepository.findByMachineId(machineId);
  }

  async findByOrderId(orderId: number): Promise<Schedule[]> {
    return scheduleRepository.findByOrderId(orderId);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Schedule[]> {
    return scheduleRepository.findByDateRange(startDate, endDate);
  }

  async findByStatus(status: string): Promise<Schedule[]> {
    return scheduleRepository.findByStatus(status);
  }

  async checkConflict(
    machineId: number,
    startTime: string,
    endTime: string,
    excludeScheduleId?: number
  ): Promise<ConflictInfo> {
    return transaction(async (connection) => {
      const startTimeFormatted = formatDateTimeForMySQL(startTime);
      const endTimeFormatted = formatDateTimeForMySQL(endTime);

      const conflicts = await scheduleRepository.findConflictsWithLock(
        machineId,
        startTimeFormatted,
        endTimeFormatted,
        excludeScheduleId,
        connection
      );

      const conflictDetails = conflicts.map((conflict) => {
        const start1 = new Date(startTime).getTime();
        const end1 = new Date(endTime).getTime();
        const start2 = new Date(conflict.startTime).getTime();
        const end2 = new Date(conflict.endTime).getTime();

        const overlapStart = Math.max(start1, start2);
        const overlapEnd = Math.min(end1, end2);
        const overlapMinutes = Math.max(0, Math.floor((overlapEnd - overlapStart) / (1000 * 60)));

        return {
          scheduleId: conflict.scheduleId,
          orderNo: conflict.orderNo,
          productName: conflict.productName,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          overlapMinutes,
        };
      });

      return {
        hasConflict: conflicts.length > 0,
        conflicts: conflictDetails,
      };
    });
  }

  async createSchedule(
    data: CreateScheduleRequest,
    createdBy: number
  ): Promise<number> {
    return transaction(async (connection) => {
      const order = await orderRepository.findById(data.orderId);
      if (!order) {
        throw new Error('订单不存在');
      }

      const machine = await machineRepository.findById(data.machineId);
      if (!machine) {
        throw new Error('机器不存在');
      }

      if (machine.status === 'maintenance' || machine.status === 'broken') {
        throw new Error('机器处于维护或故障状态，无法排程');
      }

      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      if (start >= end) {
        throw new Error('开始时间必须早于结束时间');
      }

      const actualHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      const startTimeFormatted = formatDateTimeForMySQL(data.startTime);
      const endTimeFormatted = formatDateTimeForMySQL(data.endTime);

      const conflictInfo = await scheduleRepository.findConflictsWithLock(
        data.machineId,
        startTimeFormatted,
        endTimeFormatted,
        undefined,
        connection
      );

      if (conflictInfo.length > 0) {
        const conflictDetails = conflictInfo
          .map((c) => `${c.orderNo} (${c.startTime} - ${c.endTime})`)
          .join(', ');
        throw new Error(`排程冲突：与以下排程重叠 - ${conflictDetails}`);
      }

      const scheduleData: Partial<Schedule> = {
        orderId: data.orderId,
        machineId: data.machineId,
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
        actualHours,
        status: 'scheduled',
        createdBy,
        version: 0,
      };

      const scheduleId = await scheduleRepository.create(scheduleData, connection);

      if (order.status === 'pending') {
        await orderRepository.updateStatus(order.id, 'scheduled', connection);
      }

      logger.info(
        `创建排程成功: ID ${scheduleId}, 订单: ${order.orderNo}, 机器: ${machine.machineCode}, 时间: ${data.startTime} - ${data.endTime}`
      );

      return scheduleId;
    });
  }

  async updateSchedule(
    id: number,
    data: Partial<CreateScheduleRequest>
  ): Promise<boolean> {
    return transaction(async (connection) => {
      const existing = await scheduleRepository.findById(id);
      if (!existing) {
        throw new Error('排程不存在');
      }

      if (existing.status === 'completed') {
        throw new Error('已完成的排程无法修改');
      }

      const machineId = data.machineId || existing.machineId;
      const startTime = data.startTime || existing.startTime;
      const endTime = data.endTime || existing.endTime;

      const machine = await machineRepository.findById(machineId);
      if (!machine) {
        throw new Error('机器不存在');
      }

      if (machine.status === 'maintenance' || machine.status === 'broken') {
        throw new Error('机器处于维护或故障状态，无法排程');
      }

      const start = new Date(startTime);
      const end = new Date(endTime);
      if (start >= end) {
        throw new Error('开始时间必须早于结束时间');
      }

      const startTimeFormatted = formatDateTimeForMySQL(startTime);
      const endTimeFormatted = formatDateTimeForMySQL(endTime);

      const conflictInfo = await scheduleRepository.findConflictsWithLock(
        machineId,
        startTimeFormatted,
        endTimeFormatted,
        id,
        connection
      );

      if (conflictInfo.length > 0) {
        const conflictDetails = conflictInfo
          .map((c) => `${c.orderNo} (${c.startTime} - ${c.endTime})`)
          .join(', ');
        throw new Error(`排程冲突：与以下排程重叠 - ${conflictDetails}`);
      }

      const actualHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      const updateData: Partial<Schedule> = {
        ...data,
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
        actualHours,
        version: existing.version + 1,
      };

      const success = await scheduleRepository.update(id, updateData, connection);

      if (success) {
        logger.info(`更新排程成功: ID ${id}`);
      }

      return success;
    });
  }

  async deleteSchedule(id: number): Promise<boolean> {
    return transaction(async (connection) => {
      const existing = await scheduleRepository.findById(id);
      if (!existing) {
        throw new Error('排程不存在');
      }

      if (existing.status === 'in_progress') {
        throw new Error('进行中的排程无法删除');
      }

      const orderId = existing.orderId;

      const success = await scheduleRepository.delete(id, connection);

      if (success) {
        const remainingSchedules = await scheduleRepository.findByOrderId(orderId);
        if (remainingSchedules.length === 0) {
          const order = await orderRepository.findById(orderId);
          if (order && order.status === 'scheduled') {
            await orderRepository.updateStatus(orderId, 'pending', connection);
          }
        }

        logger.info(`删除排程成功: ID ${id}`);
      }

      return success;
    });
  }

  async updateStatus(id: number, status: string): Promise<boolean> {
    const existing = await scheduleRepository.findById(id);
    if (!existing) {
      throw new Error('排程不存在');
    }

    const success = await scheduleRepository.update(id, { status } as Partial<Schedule>);
    if (success) {
      logger.info(`更新排程状态成功: ID ${id}, 状态: ${status}`);

      if (status === 'completed') {
        const schedules = await scheduleRepository.findByOrderId(existing.orderId);
        const allCompleted = schedules.every((s) => s.status === 'completed');
        if (allCompleted) {
          await orderRepository.updateStatus(existing.orderId, 'completed');
        }
      }
    }
    return success;
  }

  async countByStatus(status?: string): Promise<number> {
    return scheduleRepository.countByStatus(status);
  }

  async countByDate(date: string): Promise<number> {
    return scheduleRepository.countByDate(date);
  }

  async getMachineLoad(startDate: string, endDate: string): Promise<any[]> {
    const loads = await scheduleRepository.getMachineLoad(startDate, endDate);
    const totalHours = 24 * 7;

    return loads.map((load) => ({
      ...load,
      totalHours,
      loadRate: totalHours > 0 ? Math.min(100, (load.loadHours / totalHours) * 100) : 0,
    }));
  }
}

export const scheduleService = new ScheduleService();
export default scheduleService;
