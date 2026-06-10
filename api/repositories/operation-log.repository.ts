import { OperationLog } from '../../shared/types';
import { BaseRepositoryImpl } from './base.repository';
import { PoolConnection } from 'mysql2/promise';

class OperationLogRepository extends BaseRepositoryImpl<OperationLog> {
  constructor() {
    super('operation_logs');
  }

  async findByUserId(userId: number, limit: number = 100): Promise<OperationLog[]> {
    const limitVal = parseInt(String(limit));
    return this.executeQuery(
      `SELECT * FROM operation_logs WHERE user_id = ? ORDER BY id DESC LIMIT ${limitVal}`,
      [userId]
    );
  }

  async findByModule(module: string, limit: number = 100): Promise<OperationLog[]> {
    const limitVal = parseInt(String(limit));
    return this.executeQuery(
      `SELECT * FROM operation_logs WHERE module = ? ORDER BY id DESC LIMIT ${limitVal}`,
      [module]
    );
  }

  async findByDateRange(startDate: string, endDate: string): Promise<OperationLog[]> {
    return this.executeQuery(
      'SELECT * FROM operation_logs WHERE DATE(created_at) BETWEEN ? AND ? ORDER BY id DESC',
      [startDate, endDate]
    );
  }

  async search(keyword: string, limit: number = 100): Promise<OperationLog[]> {
    const limitVal = parseInt(String(limit));
    return this.executeQuery(
      `SELECT * FROM operation_logs WHERE username LIKE ? OR action LIKE ? OR module LIKE ? OR details LIKE ? ORDER BY id DESC LIMIT ${limitVal}`,
      [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
    );
  }

  async findRecent(limit: number = 50): Promise<OperationLog[]> {
    const limitVal = parseInt(String(limit));
    return this.executeQuery(
      `SELECT * FROM operation_logs ORDER BY id DESC LIMIT ${limitVal}`,
      []
    );
  }

  async createLog(
    userId: number,
    username: string,
    action: string,
    module: string,
    targetId: number | null,
    details: string,
    ip: string,
    connection?: PoolConnection
  ): Promise<number> {
    return this.create({
      userId,
      username,
      action,
      module,
      targetId,
      details,
      ip,
    } as Partial<OperationLog>, connection);
  }
}

export const operationLogRepository = new OperationLogRepository();
export default operationLogRepository;
