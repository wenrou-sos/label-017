import { OperationLog } from '../../shared/types';
import operationLogRepository from '../repositories/operation-log.repository';
import { PoolConnection } from 'mysql2/promise';

class LogService {
  async findAll(limit: number = 100): Promise<OperationLog[]> {
    return operationLogRepository.findRecent(limit);
  }

  async findById(id: number): Promise<OperationLog | null> {
    return operationLogRepository.findById(id);
  }

  async findByUserId(userId: number, limit: number = 100): Promise<OperationLog[]> {
    return operationLogRepository.findByUserId(userId, limit);
  }

  async findByModule(module: string, limit: number = 100): Promise<OperationLog[]> {
    return operationLogRepository.findByModule(module, limit);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<OperationLog[]> {
    return operationLogRepository.findByDateRange(startDate, endDate);
  }

  async search(keyword: string, limit: number = 100): Promise<OperationLog[]> {
    return operationLogRepository.search(keyword, limit);
  }

  async findRecent(limit: number = 50): Promise<OperationLog[]> {
    return operationLogRepository.findRecent(limit);
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
    return operationLogRepository.createLog(
      userId,
      username,
      action,
      module,
      targetId,
      details,
      ip,
      connection
    );
  }

  async logOperation(
    userId: number,
    username: string,
    action: string,
    module: string,
    targetId: number | null = null,
    details: string = '',
    ip: string = '127.0.0.1',
    connection?: PoolConnection
  ): Promise<number> {
    return this.createLog(
      userId,
      username,
      action,
      module,
      targetId,
      details,
      ip,
      connection
    );
  }
}

export const logService = new LogService();
export default logService;
