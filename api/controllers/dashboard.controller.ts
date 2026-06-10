import { Request, Response } from 'express';
import { success, error } from '../utils/response';
import dashboardService from '../services/dashboard.service';
import logger from '../config/logger';

class DashboardController {
  async getStats(req: Request, res: Response) {
    try {
      const stats = await dashboardService.getStats();
      return res.json(success(stats, '获取统计数据成功'));
    } catch (err) {
      logger.error('获取统计数据失败:', err);
      return res.status(500).json(error(500, '获取统计数据失败'));
    }
  }

  async getMachineLoads(req: Request, res: Response) {
    try {
      const loads = await dashboardService.getMachineLoads();
      return res.json(success(loads, '获取机器负载数据成功'));
    } catch (err) {
      logger.error('获取机器负载数据失败:', err);
      return res.status(500).json(error(500, '获取机器负载数据失败'));
    }
  }

  async getOrderStatusDistribution(req: Request, res: Response) {
    try {
      const distribution = await dashboardService.getOrderStatusDistribution();
      return res.json(success(distribution, '获取订单状态分布成功'));
    } catch (err) {
      logger.error('获取订单状态分布失败:', err);
      return res.status(500).json(error(500, '获取订单状态分布失败'));
    }
  }

  async getMachineStatusDistribution(req: Request, res: Response) {
    try {
      const distribution = await dashboardService.getMachineStatusDistribution();
      return res.json(success(distribution, '获取机器状态分布成功'));
    } catch (err) {
      logger.error('获取机器状态分布失败:', err);
      return res.status(500).json(error(500, '获取机器状态分布失败'));
    }
  }

  async getRecentSchedules(req: Request, res: Response) {
    try {
      const { limit } = req.query;
      const schedules = await dashboardService.getRecentSchedules(parseInt(limit as string) || 10);
      return res.json(success(schedules, '获取最近排程成功'));
    } catch (err) {
      logger.error('获取最近排程失败:', err);
      return res.status(500).json(error(500, '获取最近排程失败'));
    }
  }

  async getUpcomingSchedules(req: Request, res: Response) {
    try {
      const { limit } = req.query;
      const schedules = await dashboardService.getUpcomingSchedules(parseInt(limit as string) || 10);
      return res.json(success(schedules, '获取即将开始的排程成功'));
    } catch (err) {
      logger.error('获取即将开始的排程失败:', err);
      return res.status(500).json(error(500, '获取即将开始的排程失败'));
    }
  }

  async getRecentLogs(req: Request, res: Response) {
    try {
      const { limit } = req.query;
      const logs = await dashboardService.getRecentLogs(parseInt(limit as string) || 10);
      return res.json(success(logs, '获取最近操作日志成功'));
    } catch (err) {
      logger.error('获取最近操作日志失败:', err);
      return res.status(500).json(error(500, '获取最近操作日志失败'));
    }
  }
}

export const dashboardController = new DashboardController();
export default dashboardController;
