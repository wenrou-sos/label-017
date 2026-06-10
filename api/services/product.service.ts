import { Product } from '../../shared/types';
import productRepository from '../repositories/product.repository';
import logger from '../config/logger';

class ProductService {
  async findAll(): Promise<Product[]> {
    return productRepository.findAll();
  }

  async findById(id: number): Promise<Product | null> {
    return productRepository.findById(id);
  }

  async findByProductCode(productCode: string): Promise<Product | null> {
    return productRepository.findByProductCode(productCode);
  }

  async search(keyword: string): Promise<Product[]> {
    return productRepository.search(keyword);
  }

  async create(data: Partial<Product>): Promise<number> {
    if (await productRepository.existsByProductCode(data.productCode!)) {
      throw new Error('产品编码已存在');
    }
    const id = await productRepository.create(data);
    logger.info(`创建产品成功: ${data.productCode}, ID: ${id}`);
    return id;
  }

  async update(id: number, data: Partial<Product>): Promise<boolean> {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new Error('产品不存在');
    }
    if (data.productCode && data.productCode !== existing.productCode) {
      if (await productRepository.existsByProductCode(data.productCode, id)) {
        throw new Error('产品编码已存在');
      }
    }
    const success = await productRepository.update(id, data);
    if (success) {
      logger.info(`更新产品成功: ID ${id}`);
    }
    return success;
  }

  async delete(id: number): Promise<boolean> {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new Error('产品不存在');
    }
    const success = await productRepository.delete(id);
    if (success) {
      logger.info(`删除产品成功: ID ${id}`);
    }
    return success;
  }
}

export const productService = new ProductService();
export default productService;
