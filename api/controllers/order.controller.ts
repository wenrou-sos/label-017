import { Request, Response } from 'express';
import { success, error, notFound, badRequest, conflict } from '../utils/response';
import orderService from '../services/order.service';
import logService from '../services/log.service';
import { Order, CreateOrderRequest } from '../../shared/types';
import logger from '../config/logger';

class OrderController {
  async findAll(req: Request, res: Response) {
    try {
      const { keyword, status, priority, page, pageSize } = req.query;
      
      if (keyword) {
        const orders = await orderService.search(keyword as string);
        return res.json(success({ list: orders, total: orders.length }, '获取订单列表成功'));
      } else if (status) {
        const orders = await orderService.findByStatus(status as string);
        return res.json(success({ list: orders, total: orders.length }, '获取订单列表成功'));
      } else if (priority) {
        const orders = await orderService.findByPriority(priority as string);
        return res.json(success({ list: orders, total: orders.length }, '获取订单列表成功'));
      } else {
        const p = parseInt(page as string) || 1;
        const ps = parseInt(pageSize as string) || 10;
        const result = await orderService.findAllPaginated(p, ps);
        return res.json(success(result, '获取订单列表成功'));
      }
    } catch (err) {
      logger.error('获取订单列表失败:', err);
      return res.status(500).json(error(500, '获取订单列表失败'));
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const order = await orderService.findById(id);

      if (!order) {
        return res.status(404).json(notFound('订单不存在'));
      }

      return res.json(success(order, '获取订单信息成功'));
    } catch (err) {
      logger.error('获取订单信息失败:', err);
      return res.status(500).json(error(500, '获取订单信息失败'));
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = req.body as CreateOrderRequest;

      if (!data.orderNo || !data.productId || !data.quantity || !data.deliveryDate) {
        return res.status(400).json(badRequest('订单编号、产品ID、数量和交货日期不能为空'));
      }

      const id = await orderService.create(data);

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '创建',
        '订单',
        id,
        `创建订单: ${data.orderNo}`,
        ip
      );

      return res.status(201).json(success({ id }, '创建订单成功'));
    } catch (err: any) {
      logger.error('创建订单失败:', err);
      if (err.message === '订单编号已存在' || err.message === '产品不存在') {
        return res.status(400).json(badRequest(err.message));
      }
      return res.status(500).json(error(500, err.message || '创建订单失败'));
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = req.body as Partial<Order>;

      const success_ = await orderService.update(id, data);

      if (!success_) {
        return res.status(404).json(notFound('订单不存在'));
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '更新',
        '订单',
        id,
        `更新订单信息`,
        ip
      );

      return res.json(success(null, '更新订单成功'));
    } catch (err: any) {
      logger.error('更新订单失败:', err);
      if (err.message === '订单不存在' || err.message === '产品不存在') {
        return res.status(404).json(notFound(err.message));
      }
      if (err.message === '订单编号已存在') {
        return res.status(409).json(conflict(err.message));
      }
      return res.status(500).json(error(500, err.message || '更新订单失败'));
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      const success_ = await orderService.delete(id);

      if (!success_) {
        return res.status(404).json(notFound('订单不存在'));
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '删除',
        '订单',
        id,
        `删除订单`,
        ip
      );

      return res.json(success(null, '删除订单成功'));
    } catch (err: any) {
      logger.error('删除订单失败:', err);
      if (err.message === '订单不存在') {
        return res.status(404).json(notFound(err.message));
      }
      if (err.message === '只能删除待处理状态的订单') {
        return res.status(400).json(badRequest(err.message));
      }
      return res.status(500).json(error(500, err.message || '删除订单失败'));
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json(badRequest('状态不能为空'));
      }

      const success_ = await orderService.updateStatus(id, status);

      if (!success_) {
        return res.status(404).json(notFound('订单不存在'));
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '更新状态',
        '订单',
        id,
        `更新订单状态为: ${status}`,
        ip
      );

      return res.json(success(null, '更新订单状态成功'));
    } catch (err: any) {
      logger.error('更新订单状态失败:', err);
      if (err.message === '订单不存在') {
        return res.status(404).json(notFound(err.message));
      }
      return res.status(500).json(error(500, err.message || '更新订单状态失败'));
    }
  }
}

export const orderController = new OrderController();
export default orderController;
