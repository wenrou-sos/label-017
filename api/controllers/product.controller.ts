import { Request, Response } from 'express';
import { success, error, notFound, badRequest, conflict } from '../utils/response';
import productService from '../services/product.service';
import logService from '../services/log.service';
import { Product } from '../../shared/types';
import logger from '../config/logger';

class ProductController {
  async findAll(req: Request, res: Response) {
    try {
      const { keyword } = req.query;
      let products: Product[];

      if (keyword) {
        products = await productService.search(keyword as string);
      } else {
        products = await productService.findAll();
      }

      return res.json(success(products, '获取产品列表成功'));
    } catch (err) {
      logger.error('获取产品列表失败:', err);
      return res.status(500).json(error(500, '获取产品列表失败'));
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const product = await productService.findById(id);

      if (!product) {
        return res.status(404).json(notFound('产品不存在'));
      }

      return res.json(success(product, '获取产品信息成功'));
    } catch (err) {
      logger.error('获取产品信息失败:', err);
      return res.status(500).json(error(500, '获取产品信息失败'));
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = req.body as Partial<Product>;

      if (!data.productCode || !data.productName || !data.processHours) {
        return res.status(400).json(badRequest('产品编码、名称和工时不能为空'));
      }

      const id = await productService.create(data);

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '创建',
        '产品',
        id,
        `创建产品: ${data.productName}`,
        ip
      );

      return res.status(201).json(success({ id }, '创建产品成功'));
    } catch (err: any) {
      logger.error('创建产品失败:', err);
      if (err.message === '产品编码已存在') {
        return res.status(409).json(conflict(err.message));
      }
      return res.status(500).json(error(500, err.message || '创建产品失败'));
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = req.body as Partial<Product>;

      const success_ = await productService.update(id, data);

      if (!success_) {
        return res.status(404).json(notFound('产品不存在'));
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '更新',
        '产品',
        id,
        `更新产品信息`,
        ip
      );

      return res.json(success(null, '更新产品成功'));
    } catch (err: any) {
      logger.error('更新产品失败:', err);
      if (err.message === '产品不存在') {
        return res.status(404).json(notFound(err.message));
      }
      if (err.message === '产品编码已存在') {
        return res.status(409).json(conflict(err.message));
      }
      return res.status(500).json(error(500, err.message || '更新产品失败'));
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      const success_ = await productService.delete(id);

      if (!success_) {
        return res.status(404).json(notFound('产品不存在'));
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '删除',
        '产品',
        id,
        `删除产品`,
        ip
      );

      return res.json(success(null, '删除产品成功'));
    } catch (err: any) {
      logger.error('删除产品失败:', err);
      if (err.message === '产品不存在') {
        return res.status(404).json(notFound(err.message));
      }
      return res.status(500).json(error(500, err.message || '删除产品失败'));
    }
  }
}

export const productController = new ProductController();
export default productController;
