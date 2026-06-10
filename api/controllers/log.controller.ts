import { Request, Response } from 'express';
import { success, error, badRequest } from '../utils/response';
import logService from '../services/log.service';
import logger from '../config/logger';

class LogController {
  async findAll(req: Request, res: Response) {
    try {
      const { userId, module, startDate, endDate, keyword, limit } = req.query;
      let logs;

      if (keyword) {
        logs = await logService.search(keyword as string, parseInt(limit as string) || 100);
      } else if (userId) {
        logs = await logService.findByUserId(parseInt(userId as string), parseInt(limit as string) || 100);
      } else if (module) {
        logs = await logService.findByModule(module as string, parseInt(limit as string) || 100);
      } else if (startDate && endDate) {
        logs = await logService.findByDateRange(startDate as string, endDate as string);
      } else {
        logs = await logService.findRecent(parseInt(limit as string) || 50);
      }

      return res.json(success(logs, '获取日志列表成功'));
    } catch (err) {
      logger.error('获取日志列表失败:', err);
      return res.status(500).json(error(500, '获取日志列表失败'));
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const log = await logService.findById(id);

      if (!log) {
        return res.status(404).json(success(null, '日志不存在'));
      }

      return res.json(success(log, '获取日志信息成功'));
    } catch (err) {
      logger.error('获取日志信息失败:', err);
      return res.status(500).json(error(500, '获取日志信息失败'));
    }
  }

  async findByUserId(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      const { limit } = req.query;

      if (!userId) {
        return res.status(400).json(badRequest('用户ID不能为空'));
      }

      const logs = await logService.findByUserId(userId, parseInt(limit as string) || 100);

      return res.json(success(logs, '获取用户操作日志成功'));
    } catch (err) {
      logger.error('获取用户操作日志失败:', err);
      return res.status(500).json(error(500, '获取用户操作日志失败'));
    }
  }

  async findByModule(req: Request, res: Response) {
    try {
      const module = req.params.module;
      const { limit } = req.query;

      if (!module) {
        return res.status(400).json(badRequest('模块名不能为空'));
      }

      const logs = await logService.findByModule(module, parseInt(limit as string) || 100);

      return res.json(success(logs, '获取模块操作日志成功'));
    } catch (err) {
      logger.error('获取模块操作日志失败:', err);
      return res.status(500).json(error(500, '获取模块操作日志失败'));
    }
  }

  async findRecent(req: Request, res: Response) {
    try {
      const { limit } = req.query;
      const logs = await logService.findRecent(parseInt(limit as string) || 50);

      return res.json(success(logs, '获取最近操作日志成功'));
    } catch (err) {
      logger.error('获取最近操作日志失败:', err);
      return res.status(500).json(error(500, '获取最近操作日志失败'));
    }
  }
}

export const logController = new LogController();
export default logController;
