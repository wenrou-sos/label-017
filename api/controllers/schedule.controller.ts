import { Request, Response } from 'express';
import { success, error, notFound, badRequest, conflict } from '../utils/response';
import scheduleService from '../services/schedule.service';
import logService from '../services/log.service';
import { CreateScheduleRequest, CheckConflictRequest } from '../../shared/types';
import logger from '../config/logger';

class ScheduleController {
  async findAll(req: Request, res: Response) {
    try {
      const { machineId, orderId, status, startDate, endDate } = req.query;
      let schedules;

      if (machineId) {
        schedules = await scheduleService.findByMachineId(parseInt(machineId as string));
      } else if (orderId) {
        schedules = await scheduleService.findByOrderId(parseInt(orderId as string));
      } else if (status) {
        schedules = await scheduleService.findByStatus(status as string);
      } else if (startDate && endDate) {
        schedules = await scheduleService.findByDateRange(startDate as string, endDate as string);
      } else {
        schedules = await scheduleService.findAll();
      }

      return res.json(success(schedules, '获取排程列表成功'));
    } catch (err) {
      logger.error('获取排程列表失败:', err);
      return res.status(500).json(error(500, '获取排程列表失败'));
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const schedule = await scheduleService.findById(id);

      if (!schedule) {
        return res.status(404).json(notFound('排程不存在'));
      }

      return res.json(success(schedule, '获取排程信息成功'));
    } catch (err) {
      logger.error('获取排程信息失败:', err);
      return res.status(500).json(error(500, '获取排程信息失败'));
    }
  }

  async checkConflict(req: Request, res: Response) {
    try {
      const { machineId, startTime, endTime, scheduleId } = req.body as CheckConflictRequest;

      if (!machineId || !startTime || !endTime) {
        return res.status(400).json(badRequest('机器ID、开始时间和结束时间不能为空'));
      }

      const conflictInfo = await scheduleService.checkConflict(
        machineId,
        startTime,
        endTime,
        scheduleId
      );

      return res.json(success(conflictInfo, '冲突检测完成'));
    } catch (err) {
      logger.error('冲突检测失败:', err);
      return res.status(500).json(error(500, '冲突检测失败'));
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = req.body as CreateScheduleRequest;

      if (!data.orderId || !data.machineId || !data.startTime || !data.endTime) {
        return res.status(400).json(badRequest('订单ID、机器ID、开始时间和结束时间不能为空'));
      }

      const createdBy = req.user!.id;
      const id = await scheduleService.createSchedule(data, createdBy);

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '创建',
        '排程',
        id,
        `创建排程: ${data.startTime} - ${data.endTime}`,
        ip
      );

      return res.status(201).json(success({ id }, '创建排程成功'));
    } catch (err: any) {
      logger.error('创建排程失败:', err);
      if (err.message.includes('排程冲突')) {
        return res.status(409).json(conflict(err.message));
      }
      if (
        err.message === '订单不存在' ||
        err.message === '机器不存在' ||
        err.message === '开始时间必须早于结束时间' ||
        err.message.includes('机器处于维护或故障状态')
      ) {
        return res.status(400).json(badRequest(err.message));
      }
      return res.status(500).json(error(500, err.message || '创建排程失败'));
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = req.body as Partial<CreateScheduleRequest>;

      const success_ = await scheduleService.updateSchedule(id, data);

      if (!success_) {
        return res.status(404).json(notFound('排程不存在'));
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '更新',
        '排程',
        id,
        `更新排程信息`,
        ip
      );

      return res.json(success(null, '更新排程成功'));
    } catch (err: any) {
      logger.error('更新排程失败:', err);
      if (err.message.includes('排程冲突')) {
        return res.status(409).json(conflict(err.message));
      }
      if (
        err.message === '排程不存在' ||
        err.message === '机器不存在' ||
        err.message === '开始时间必须早于结束时间' ||
        err.message === '已完成的排程无法修改' ||
        err.message.includes('机器处于维护或故障状态')
      ) {
        return res.status(400).json(badRequest(err.message));
      }
      return res.status(500).json(error(500, err.message || '更新排程失败'));
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      const success_ = await scheduleService.deleteSchedule(id);

      if (!success_) {
        return res.status(404).json(notFound('排程不存在'));
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '删除',
        '排程',
        id,
        `删除排程`,
        ip
      );

      return res.json(success(null, '删除排程成功'));
    } catch (err: any) {
      logger.error('删除排程失败:', err);
      if (err.message === '排程不存在') {
        return res.status(404).json(notFound(err.message));
      }
      if (err.message === '进行中的排程无法删除') {
        return res.status(400).json(badRequest(err.message));
      }
      return res.status(500).json(error(500, err.message || '删除排程失败'));
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json(badRequest('状态不能为空'));
      }

      const success_ = await scheduleService.updateStatus(id, status);

      if (!success_) {
        return res.status(404).json(notFound('排程不存在'));
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '更新状态',
        '排程',
        id,
        `更新排程状态为: ${status}`,
        ip
      );

      return res.json(success(null, '更新排程状态成功'));
    } catch (err: any) {
      logger.error('更新排程状态失败:', err);
      if (err.message === '排程不存在') {
        return res.status(404).json(notFound(err.message));
      }
      return res.status(500).json(error(500, err.message || '更新排程状态失败'));
    }
  }

  async getMachineLoad(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const loads = await scheduleService.getMachineLoad(
        (startDate as string) || new Date().toISOString(),
        (endDate as string) || new Date().toISOString()
      );

      return res.json(success(loads, '获取机器负载成功'));
    } catch (err) {
      logger.error('获取机器负载失败:', err);
      return res.status(500).json(error(500, '获取机器负载失败'));
    }
  }
}

export const scheduleController = new ScheduleController();
export default scheduleController;
