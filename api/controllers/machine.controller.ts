import { Request, Response } from 'express';
import { success, error, notFound, badRequest, conflict } from '../utils/response';
import machineService from '../services/machine.service';
import logService from '../services/log.service';
import { Machine } from '../../shared/types';
import logger from '../config/logger';

class MachineController {
  async findAll(req: Request, res: Response) {
    try {
      const { keyword, status, type } = req.query;
      let machines: Machine[];

      if (keyword) {
        machines = await machineService.search(keyword as string);
      } else if (status) {
        machines = await machineService.findByStatus(status as string);
      } else if (type) {
        machines = await machineService.findByType(type as string);
      } else {
        machines = await machineService.findAll();
      }

      return res.json(success(machines, '获取机器列表成功'));
    } catch (err) {
      logger.error('获取机器列表失败:', err);
      return res.status(500).json(error(500, '获取机器列表失败'));
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const machine = await machineService.findById(id);

      if (!machine) {
        return res.status(404).json(notFound('机器不存在'));
      }

      return res.json(success(machine, '获取机器信息成功'));
    } catch (err) {
      logger.error('获取机器信息失败:', err);
      return res.status(500).json(error(500, '获取机器信息失败'));
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = req.body as Partial<Machine>;

      if (!data.machineCode || !data.machineName || !data.type) {
        return res.status(400).json(badRequest('机器编码、名称和类型不能为空'));
      }

      const id = await machineService.create(data);

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '创建',
        '机器',
        id,
        `创建机器: ${data.machineName}`,
        ip
      );

      return res.status(201).json(success({ id }, '创建机器成功'));
    } catch (err: any) {
      logger.error('创建机器失败:', err);
      if (err.message === '机器编码已存在') {
        return res.status(409).json(conflict(err.message));
      }
      return res.status(500).json(error(500, err.message || '创建机器失败'));
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = req.body as Partial<Machine>;

      const success_ = await machineService.update(id, data);

      if (!success_) {
        return res.status(404).json(notFound('机器不存在'));
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '更新',
        '机器',
        id,
        `更新机器信息`,
        ip
      );

      return res.json(success(null, '更新机器成功'));
    } catch (err: any) {
      logger.error('更新机器失败:', err);
      if (err.message === '机器不存在') {
        return res.status(404).json(notFound(err.message));
      }
      if (err.message === '机器编码已存在') {
        return res.status(409).json(conflict(err.message));
      }
      return res.status(500).json(error(500, err.message || '更新机器失败'));
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      const success_ = await machineService.delete(id);

      if (!success_) {
        return res.status(404).json(notFound('机器不存在'));
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '删除',
        '机器',
        id,
        `删除机器`,
        ip
      );

      return res.json(success(null, '删除机器成功'));
    } catch (err: any) {
      logger.error('删除机器失败:', err);
      if (err.message === '机器不存在') {
        return res.status(404).json(notFound(err.message));
      }
      return res.status(500).json(error(500, err.message || '删除机器失败'));
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json(badRequest('状态不能为空'));
      }

      const success_ = await machineService.updateStatus(id, status);

      if (!success_) {
        return res.status(404).json(notFound('机器不存在'));
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '更新状态',
        '机器',
        id,
        `更新机器状态为: ${status}`,
        ip
      );

      return res.json(success(null, '更新机器状态成功'));
    } catch (err) {
      logger.error('更新机器状态失败:', err);
      return res.status(500).json(error(500, '更新机器状态失败'));
    }
  }
}

export const machineController = new MachineController();
export default machineController;
