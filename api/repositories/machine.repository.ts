import { Machine } from '../../shared/types';
import { BaseRepositoryImpl } from './base.repository';

class MachineRepository extends BaseRepositoryImpl<Machine> {
  constructor() {
    super('machines');
  }

  async findByMachineCode(machineCode: string): Promise<Machine | null> {
    const results = await this.executeQuery(
      'SELECT * FROM machines WHERE machine_code = ?',
      [machineCode]
    );
    return results.length > 0 ? results[0] : null;
  }

  async findByStatus(status: string): Promise<Machine[]> {
    return this.executeQuery(
      'SELECT * FROM machines WHERE status = ? ORDER BY id DESC',
      [status]
    );
  }

  async findByType(type: string): Promise<Machine[]> {
    return this.executeQuery(
      'SELECT * FROM machines WHERE type = ? ORDER BY id DESC',
      [type]
    );
  }

  async search(keyword: string): Promise<Machine[]> {
    return this.executeQuery(
      'SELECT * FROM machines WHERE machine_code LIKE ? OR machine_name LIKE ? OR type LIKE ? ORDER BY id DESC',
      [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
    );
  }

  async existsByMachineCode(machineCode: string, excludeId?: number): Promise<boolean> {
    const sql = excludeId
      ? 'SELECT COUNT(*) as count FROM machines WHERE machine_code = ? AND id != ?'
      : 'SELECT COUNT(*) as count FROM machines WHERE machine_code = ?';
    const params = excludeId ? [machineCode, excludeId] : [machineCode];
    const count = await this.executeScalar(sql, params);
    return count > 0;
  }
}

export const machineRepository = new MachineRepository();
export default machineRepository;
