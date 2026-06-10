import { Machine } from '../../shared/types';
import machineRepository from '../repositories/machine.repository';
import logger from '../config/logger';

class MachineService {
  async findAll(): Promise<Machine[]> {
    return machineRepository.findAll();
  }

  async findById(id: number): Promise<Machine | null> {
    return machineRepository.findById(id);
  }

  async findByMachineCode(machineCode: string): Promise<Machine | null> {
    return machineRepository.findByMachineCode(machineCode);
  }

  async findByStatus(status: string): Promise<Machine[]> {
    return machineRepository.findByStatus(status);
  }

  async findByType(type: string): Promise<Machine[]> {
    return machineRepository.findByType(type);
  }

  async search(keyword: string): Promise<Machine[]> {
    return machineRepository.search(keyword);
  }

  async create(data: Partial<Machine>): Promise<number> {
    if (await machineRepository.existsByMachineCode(data.machineCode!)) {
      throw new Error('机器编码已存在');
    }
    const id = await machineRepository.create(data);
    logger.info(`创建机器成功: ${data.machineCode}, ID: ${id}`);
    return id;
  }

  async update(id: number, data: Partial<Machine>): Promise<boolean> {
    const existing = await machineRepository.findById(id);
    if (!existing) {
      throw new Error('机器不存在');
    }
    if (data.machineCode && data.machineCode !== existing.machineCode) {
      if (await machineRepository.existsByMachineCode(data.machineCode, id)) {
        throw new Error('机器编码已存在');
      }
    }
    const success = await machineRepository.update(id, data);
    if (success) {
      logger.info(`更新机器成功: ID ${id}`);
    }
    return success;
  }

  async delete(id: number): Promise<boolean> {
    const existing = await machineRepository.findById(id);
    if (!existing) {
      throw new Error('机器不存在');
    }
    const success = await machineRepository.delete(id);
    if (success) {
      logger.info(`删除机器成功: ID ${id}`);
    }
    return success;
  }

  async updateStatus(id: number, status: string): Promise<boolean> {
    return machineRepository.update(id, { status } as Partial<Machine>);
  }
}

export const machineService = new MachineService();
export default machineService;
