import { Product } from '../../shared/types';
import { BaseRepositoryImpl } from './base.repository';

class ProductRepository extends BaseRepositoryImpl<Product> {
  constructor() {
    super('products');
  }

  async findByProductCode(productCode: string): Promise<Product | null> {
    const results = await this.executeQuery(
      'SELECT * FROM products WHERE product_code = ?',
      [productCode]
    );
    return results.length > 0 ? results[0] : null;
  }

  async search(keyword: string): Promise<Product[]> {
    return this.executeQuery(
      'SELECT * FROM products WHERE product_code LIKE ? OR product_name LIKE ? ORDER BY id DESC',
      [`%${keyword}%`, `%${keyword}%`]
    );
  }

  async existsByProductCode(productCode: string, excludeId?: number): Promise<boolean> {
    const sql = excludeId
      ? 'SELECT COUNT(*) as count FROM products WHERE product_code = ? AND id != ?'
      : 'SELECT COUNT(*) as count FROM products WHERE product_code = ?';
    const params = excludeId ? [productCode, excludeId] : [productCode];
    const count = await this.executeScalar(sql, params);
    return count > 0;
  }
}

export const productRepository = new ProductRepository();
export default productRepository;
