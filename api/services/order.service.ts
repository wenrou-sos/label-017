import { Order, CreateOrderRequest } from '../../shared/types';
import orderRepository from '../repositories/order.repository';
import productRepository from '../repositories/product.repository';
import logger from '../config/logger';

class OrderService {
  async findAll(): Promise<Order[]> {
    return orderRepository.findAllWithProduct();
  }

  async findById(id: number): Promise<Order | null> {
    return orderRepository.findByIdWithProduct(id);
  }

  async findByOrderNo(orderNo: string): Promise<Order | null> {
    return orderRepository.findByOrderNo(orderNo);
  }

  async findByStatus(status: string): Promise<Order[]> {
    return orderRepository.findByStatus(status);
  }

  async findByPriority(priority: string): Promise<Order[]> {
    return orderRepository.findByPriority(priority);
  }

  async search(keyword: string): Promise<Order[]> {
    return orderRepository.search(keyword);
  }

  async create(data: CreateOrderRequest): Promise<number> {
    if (await orderRepository.existsByOrderNo(data.orderNo)) {
      throw new Error('订单编号已存在');
    }

    const product = await productRepository.findById(data.productId);
    if (!product) {
      throw new Error('产品不存在');
    }

    const estimatedHours = data.quantity * product.processHours;

    const orderData: Partial<Order> = {
      ...data,
      estimatedHours,
      status: 'pending',
    };

    const id = await orderRepository.create(orderData);
    logger.info(`创建订单成功: ${data.orderNo}, ID: ${id}, 预估工时: ${estimatedHours}小时`);
    return id;
  }

  async update(id: number, data: Partial<Order>): Promise<boolean> {
    const existing = await orderRepository.findById(id);
    if (!existing) {
      throw new Error('订单不存在');
    }
    if (data.orderNo && data.orderNo !== existing.orderNo) {
      if (await orderRepository.existsByOrderNo(data.orderNo, id)) {
        throw new Error('订单编号已存在');
      }
    }

    let estimatedHours = existing.estimatedHours;
    if (data.productId || data.quantity) {
      const productId = data.productId || existing.productId;
      const quantity = data.quantity || existing.quantity;
      const product = await productRepository.findById(productId);
      if (!product) {
        throw new Error('产品不存在');
      }
      estimatedHours = quantity * product.processHours;
    }

    const updateData = {
      ...data,
      estimatedHours,
    };

    const success = await orderRepository.update(id, updateData);
    if (success) {
      logger.info(`更新订单成功: ID ${id}`);
    }
    return success;
  }

  async delete(id: number): Promise<boolean> {
    const existing = await orderRepository.findById(id);
    if (!existing) {
      throw new Error('订单不存在');
    }

    if (existing.status !== 'pending') {
      throw new Error('只能删除待处理状态的订单');
    }

    const success = await orderRepository.delete(id);
    if (success) {
      logger.info(`删除订单成功: ID ${id}`);
    }
    return success;
  }

  async updateStatus(id: number, status: string): Promise<boolean> {
    const existing = await orderRepository.findById(id);
    if (!existing) {
      throw new Error('订单不存在');
    }
    const success = await orderRepository.updateStatus(id, status);
    if (success) {
      logger.info(`更新订单状态成功: ID ${id}, 状态: ${status}`);
    }
    return success;
  }

  async countByStatus(status?: string): Promise<number> {
    return orderRepository.countByStatus(status);
  }

  async findAllPaginated(page: number = 1, pageSize: number = 10): Promise<{ list: Order[]; total: number }> {
    return orderRepository.findAllWithProductPaginated(page, pageSize);
  }
}

export const orderService = new OrderService();
export default orderService;
