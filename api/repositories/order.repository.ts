import { Order } from '../../shared/types';
import { BaseRepositoryImpl } from './base.repository';
import { RowDataPacket } from 'mysql2/promise';
import { PoolConnection } from 'mysql2/promise';

class OrderRepository extends BaseRepositoryImpl<Order> {
  constructor() {
    super('orders');
  }

  protected toEntity(row: RowDataPacket): Order {
    const order = super.toEntity(row);
    if (row.product_id) {
      (order as any).product = {
        id: row.product_id,
        productCode: row.product_code,
        productName: row.product_name,
        processHours: row.process_hours,
        unit: row.product_unit,
        description: row.product_description,
      };
    }
    return order;
  }

  async findAllWithProduct(): Promise<Order[]> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT o.*, 
                p.product_code, p.product_name, p.process_hours, 
                p.unit as product_unit, p.description as product_description
         FROM orders o
         LEFT JOIN products p ON o.product_id = p.id
         ORDER BY o.id DESC`
      );
      return rows.map(row => this.toEntity(row));
    } finally {
      connection.release();
    }
  }

  async findByIdWithProduct(id: number): Promise<Order | null> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT o.*, 
                p.product_code, p.product_name, p.process_hours, 
                p.unit as product_unit, p.description as product_description
         FROM orders o
         LEFT JOIN products p ON o.product_id = p.id
         WHERE o.id = ?`,
        [id]
      );
      return rows.length > 0 ? this.toEntity(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  async findByStatus(status: string): Promise<Order[]> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT o.*, 
                p.product_code, p.product_name, p.process_hours, 
                p.unit as product_unit, p.description as product_description
         FROM orders o
         LEFT JOIN products p ON o.product_id = p.id
         WHERE o.status = ?
         ORDER BY o.id DESC`,
        [status]
      );
      return rows.map(row => this.toEntity(row));
    } finally {
      connection.release();
    }
  }

  async findByOrderNo(orderNo: string): Promise<Order | null> {
    const results = await this.executeQuery(
      'SELECT * FROM orders WHERE order_no = ?',
      [orderNo]
    );
    return results.length > 0 ? results[0] : null;
  }

  async findByPriority(priority: string): Promise<Order[]> {
    return this.executeQuery(
      'SELECT * FROM orders WHERE priority = ? ORDER BY id DESC',
      [priority]
    );
  }

  async search(keyword: string): Promise<Order[]> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT o.*, 
                p.product_code, p.product_name, p.process_hours, 
                p.unit as product_unit, p.description as product_description
         FROM orders o
         LEFT JOIN products p ON o.product_id = p.id
         WHERE o.order_no LIKE ? OR p.product_name LIKE ?
         ORDER BY o.id DESC`,
        [`%${keyword}%`, `%${keyword}%`]
      );
      return rows.map(row => this.toEntity(row));
    } finally {
      connection.release();
    }
  }

  async updateStatus(id: number, status: string, connection?: PoolConnection): Promise<boolean> {
    const conn = connection || (await this.getConnection());
    const needRelease = !connection;
    
    try {
      const [result] = await conn.execute<RowDataPacket[]>(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, id]
      );
      return (result as any).affectedRows > 0;
    } finally {
      if (needRelease) conn.release();
    }
  }

  async existsByOrderNo(orderNo: string, excludeId?: number): Promise<boolean> {
    const sql = excludeId
      ? 'SELECT COUNT(*) as count FROM orders WHERE order_no = ? AND id != ?'
      : 'SELECT COUNT(*) as count FROM orders WHERE order_no = ?';
    const params = excludeId ? [orderNo, excludeId] : [orderNo];
    const count = await this.executeScalar(sql, params);
    return count > 0;
  }

  async countByStatus(status?: string): Promise<number> {
    const sql = status
      ? 'SELECT COUNT(*) as count FROM orders WHERE status = ?'
      : 'SELECT COUNT(*) as count FROM orders';
    const params = status ? [status] : [];
    return await this.executeScalar(sql, params);
  }

  async findAllWithProductPaginated(page: number = 1, pageSize: number = 10): Promise<{ list: Order[]; total: number }> {
    const connection = await this.getConnection();
    try {
      const offset = parseInt(String((page - 1) * pageSize));
      const limit = parseInt(String(pageSize));
      
      const [countRows] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as total FROM orders'
      );
      const total = countRows[0].total;
      
      const sql = `SELECT o.*, 
                p.product_code, p.product_name, p.process_hours, 
                p.unit as product_unit, p.description as product_description
         FROM orders o
         LEFT JOIN products p ON o.product_id = p.id
         ORDER BY o.id DESC
         LIMIT ${limit} OFFSET ${offset}`;
      
      const [rows] = await connection.execute<RowDataPacket[]>(sql);
      
      return {
        list: rows.map(row => this.toEntity(row)),
        total,
      };
    } finally {
      connection.release();
    }
  }
}

export const orderRepository = new OrderRepository();
export default orderRepository;
