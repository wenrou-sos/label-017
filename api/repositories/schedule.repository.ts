import { Schedule } from '../../shared/types';
import { BaseRepositoryImpl } from './base.repository';
import { RowDataPacket, PoolConnection } from 'mysql2/promise';

class ScheduleRepository extends BaseRepositoryImpl<Schedule> {
  constructor() {
    super('schedules');
  }

  protected toEntity(row: RowDataPacket): Schedule {
    const schedule = super.toEntity(row);
    if (row.order_id) {
      (schedule as any).order = {
        id: row.order_id,
        orderNo: row.order_no,
        productId: row.order_product_id,
        quantity: row.order_quantity,
        estimatedHours: row.order_estimated_hours,
        deliveryDate: row.order_delivery_date,
        status: row.order_status,
        priority: row.order_priority,
        product: row.product_id ? {
          id: row.product_id,
          productCode: row.product_code,
          productName: row.product_name,
          processHours: row.process_hours,
          unit: row.product_unit,
        } : undefined,
      };
    }
    if (row.machine_id) {
      (schedule as any).machine = {
        id: row.machine_id,
        machineCode: row.machine_code,
        machineName: row.machine_name,
        type: row.machine_type,
        status: row.machine_status,
        capacity: row.machine_capacity,
      };
    }
    if (row.created_by) {
      (schedule as any).createdByUser = {
        id: row.created_by,
        username: row.created_username,
        realName: row.created_real_name,
      };
    }
    return schedule;
  }

  async findAllWithDetails(): Promise<Schedule[]> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT s.*,
                o.order_no, o.product_id as order_product_id, o.quantity as order_quantity,
                o.estimated_hours as order_estimated_hours, o.delivery_date as order_delivery_date,
                o.status as order_status, o.priority as order_priority,
                p.product_code, p.product_name, p.process_hours, p.unit as product_unit,
                m.machine_code, m.machine_name, m.type as machine_type, 
                m.status as machine_status, m.capacity as machine_capacity,
                u.username as created_username, u.real_name as created_real_name
         FROM schedules s
         LEFT JOIN orders o ON s.order_id = o.id
         LEFT JOIN products p ON o.product_id = p.id
         LEFT JOIN machines m ON s.machine_id = m.id
         LEFT JOIN users u ON s.created_by = u.id
         ORDER BY s.start_time DESC`
      );
      return rows.map(row => this.toEntity(row));
    } finally {
      connection.release();
    }
  }

  async findByIdWithDetails(id: number): Promise<Schedule | null> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT s.*,
                o.order_no, o.product_id as order_product_id, o.quantity as order_quantity,
                o.estimated_hours as order_estimated_hours, o.delivery_date as order_delivery_date,
                o.status as order_status, o.priority as order_priority,
                p.product_code, p.product_name, p.process_hours, p.unit as product_unit,
                m.machine_code, m.machine_name, m.type as machine_type, 
                m.status as machine_status, m.capacity as machine_capacity,
                u.username as created_username, u.real_name as created_real_name
         FROM schedules s
         LEFT JOIN orders o ON s.order_id = o.id
         LEFT JOIN products p ON o.product_id = p.id
         LEFT JOIN machines m ON s.machine_id = m.id
         LEFT JOIN users u ON s.created_by = u.id
         WHERE s.id = ?`,
        [id]
      );
      return rows.length > 0 ? this.toEntity(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  async findByMachineId(machineId: number): Promise<Schedule[]> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT s.*,
                o.order_no, o.product_id as order_product_id, o.quantity as order_quantity,
                o.estimated_hours as order_estimated_hours, o.delivery_date as order_delivery_date,
                o.status as order_status, o.priority as order_priority,
                p.product_code, p.product_name, p.process_hours, p.unit as product_unit,
                m.machine_code, m.machine_name, m.type as machine_type, 
                m.status as machine_status, m.capacity as machine_capacity
         FROM schedules s
         LEFT JOIN orders o ON s.order_id = o.id
         LEFT JOIN products p ON o.product_id = p.id
         LEFT JOIN machines m ON s.machine_id = m.id
         WHERE s.machine_id = ?
         ORDER BY s.start_time`,
        [machineId]
      );
      return rows.map(row => this.toEntity(row));
    } finally {
      connection.release();
    }
  }

  async findByOrderId(orderId: number): Promise<Schedule[]> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT s.*,
                o.order_no,
                m.machine_code, m.machine_name, m.type as machine_type
         FROM schedules s
         LEFT JOIN orders o ON s.order_id = o.id
         LEFT JOIN machines m ON s.machine_id = m.id
         WHERE s.order_id = ?
         ORDER BY s.start_time`,
        [orderId]
      );
      return rows.map(row => this.toEntity(row));
    } finally {
      connection.release();
    }
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Schedule[]> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT s.*,
                o.order_no, o.priority as order_priority,
                p.product_name,
                m.machine_code, m.machine_name
         FROM schedules s
         LEFT JOIN orders o ON s.order_id = o.id
         LEFT JOIN products p ON o.product_id = p.id
         LEFT JOIN machines m ON s.machine_id = m.id
         WHERE s.start_time >= ? AND s.end_time <= ?
         ORDER BY s.start_time`,
        [startDate, endDate]
      );
      return rows.map(row => this.toEntity(row));
    } finally {
      connection.release();
    }
  }

  async findConflictsWithLock(
    machineId: number,
    startTime: string,
    endTime: string,
    excludeScheduleId?: number,
    connection?: PoolConnection
  ): Promise<any[]> {
    const conn = connection || (await this.getConnection());
    const needRelease = !connection;

    try {
      let sql = `SELECT s.*,
                        o.order_no,
                        p.product_name
                 FROM schedules s
                 LEFT JOIN orders o ON s.order_id = o.id
                 LEFT JOIN products p ON o.product_id = p.id
                 WHERE s.machine_id = ?
                   AND s.start_time < ?
                   AND s.end_time > ?
                   AND s.status IN ('scheduled', 'in_progress')`;
      const params: any[] = [machineId, endTime, startTime];

      if (excludeScheduleId) {
        sql += ' AND s.id != ?';
        params.push(excludeScheduleId);
      }

      sql += ' FOR UPDATE';

      const [rows] = await conn.execute<RowDataPacket[]>(sql, params);
      return rows.map(row => ({
        scheduleId: row.id,
        orderNo: row.order_no,
        productName: row.product_name,
        startTime: row.start_time,
        endTime: row.end_time,
      }));
    } finally {
      if (needRelease) conn.release();
    }
  }

  async countByStatus(status?: string): Promise<number> {
    const sql = status
      ? 'SELECT COUNT(*) as count FROM schedules WHERE status = ?'
      : 'SELECT COUNT(*) as count FROM schedules';
    const params = status ? [status] : [];
    return await this.executeScalar(sql, params);
  }

  async countByDate(date: string): Promise<number> {
    return await this.executeScalar(
      'SELECT COUNT(*) as count FROM schedules WHERE DATE(start_time) = ?',
      [date]
    );
  }

  async getMachineLoad(startDate: string, endDate: string): Promise<any[]> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT m.id as machine_id, m.machine_name,
                COALESCE(SUM(TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time)) / 60, 0) as load_hours
         FROM machines m
         LEFT JOIN schedules s ON m.id = s.machine_id
           AND s.start_time >= ? AND s.end_time <= ?
           AND s.status != 'completed'
         GROUP BY m.id, m.machine_name`,
        [startDate, endDate]
      );
      return rows.map(row => ({
        machineId: row.machine_id,
        machineName: row.machine_name,
        loadHours: parseFloat(row.load_hours) || 0,
      }));
    } finally {
      connection.release();
    }
  }

  async findByStatus(status: string): Promise<Schedule[]> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT s.*,
                o.order_no,
                p.product_name,
                m.machine_name
         FROM schedules s
         LEFT JOIN orders o ON s.order_id = o.id
         LEFT JOIN products p ON o.product_id = p.id
         LEFT JOIN machines m ON s.machine_id = m.id
         WHERE s.status = ?
         ORDER BY s.start_time`,
        [status]
      );
      return rows.map(row => this.toEntity(row));
    } finally {
      connection.release();
    }
  }
}

export const scheduleRepository = new ScheduleRepository();
export default scheduleRepository;
