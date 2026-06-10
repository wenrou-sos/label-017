import { DashboardStats, MachineLoad, OperationLog } from '../../shared/types';
import orderRepository from '../repositories/order.repository';
import machineRepository from '../repositories/machine.repository';
import scheduleRepository from '../repositories/schedule.repository';
import operationLogRepository from '../repositories/operation-log.repository';
import scheduleService from './schedule.service';

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const [
      totalOrders,
      pendingOrders,
      scheduledOrders,
      completedOrders,
      totalMachines,
      runningMachines,
    ] = await Promise.all([
      orderRepository.countByStatus(),
      orderRepository.countByStatus('pending'),
      orderRepository.countByStatus('scheduled'),
      orderRepository.countByStatus('completed'),
      machineRepository.executeScalar('SELECT COUNT(*) FROM machines', []),
      machineRepository.executeScalar("SELECT COUNT(*) FROM machines WHERE status = 'running'", []),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const todaySchedules = await scheduleRepository.countByDate(today);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const machineLoads = await scheduleService.getMachineLoad(
      weekStart.toISOString(),
      weekEnd.toISOString()
    );

    const totalLoadRate =
      machineLoads.length > 0
        ? machineLoads.reduce((sum, m) => sum + m.loadRate, 0) / machineLoads.length
        : 0;

    return {
      totalOrders,
      pendingOrders,
      scheduledOrders,
      completedOrders,
      totalMachines,
      runningMachines,
      todaySchedules,
      totalLoadRate: Math.round(totalLoadRate * 100) / 100,
    };
  }

  async getMachineLoads(): Promise<MachineLoad[]> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return scheduleService.getMachineLoad(
      weekStart.toISOString(),
      weekEnd.toISOString()
    );
  }

  async getOrderStatusDistribution(): Promise<Array<{ status: string; count: number }>> {
    const statuses = ['pending', 'scheduled', 'producing', 'completed', 'cancelled'];
    const result = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await orderRepository.countByStatus(status),
      }))
    );
    return result;
  }

  async getMachineStatusDistribution(): Promise<Array<{ status: string; count: number }>> {
    const statuses = ['running', 'idle', 'maintenance', 'broken'];
    const result = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await machineRepository.executeScalar(
          'SELECT COUNT(*) FROM machines WHERE status = ?',
          [status]
        ),
      }))
    );
    return result;
  }

  async getRecentSchedules(limit: number = 10): Promise<any[]> {
    const connection = await scheduleRepository['getConnection']();
    const limitVal = parseInt(String(limit));
    try {
      const [rows] = await connection.execute<any[]>(
        `SELECT s.*,
                o.order_no,
                p.product_name,
                m.machine_name
         FROM schedules s
         LEFT JOIN orders o ON s.order_id = o.id
         LEFT JOIN products p ON o.product_id = p.id
         LEFT JOIN machines m ON s.machine_id = m.id
         ORDER BY s.created_at DESC
         LIMIT ${limitVal}`
      );
      return rows.map((row: any) => ({
        id: row.id,
        orderNo: row.order_no,
        productName: row.product_name,
        machineName: row.machine_name,
        startTime: row.start_time,
        endTime: row.end_time,
        status: row.status,
      }));
    } finally {
      connection.release();
    }
  }

  async getUpcomingSchedules(limit: number = 10): Promise<any[]> {
    const now = new Date().toISOString();
    const connection = await scheduleRepository['getConnection']();
    const limitVal = parseInt(String(limit));
    try {
      const [rows] = await connection.execute<any[]>(
        `SELECT s.*,
                o.order_no,
                p.product_name,
                m.machine_name
         FROM schedules s
         LEFT JOIN orders o ON s.order_id = o.id
         LEFT JOIN products p ON o.product_id = p.id
         LEFT JOIN machines m ON s.machine_id = m.id
         WHERE s.start_time >= ?
           AND s.status != 'completed'
         ORDER BY s.start_time ASC
         LIMIT ${limitVal}`,
        [now]
      );
      return rows.map((row: any) => ({
        id: row.id,
        orderNo: row.order_no,
        productName: row.product_name,
        machineName: row.machine_name,
        startTime: row.start_time,
        endTime: row.end_time,
        status: row.status,
      }));
    } finally {
      connection.release();
    }
  }

  async getRecentLogs(limit: number = 10): Promise<OperationLog[]> {
    return operationLogRepository.findRecent(limit);
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
