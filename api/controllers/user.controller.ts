import { Request, Response } from 'express';
import { success, error, notFound, badRequest, conflict, forbidden } from '../utils/response';
import userRepository from '../repositories/user.repository';
import authService from '../services/auth.service';
import logService from '../services/log.service';
import { User } from '../../shared/types';
import logger from '../config/logger';

class UserController {
  async findAll(req: Request, res: Response) {
    try {
      const { role } = req.query;
      let users: User[];

      if (role) {
        users = await userRepository.findByRole(role as string);
      } else {
        users = await userRepository.findAll();
      }

      const usersWithoutPassword = users.map((user) => {
        const { passwordHash, ...rest } = user as any;
        return rest as User;
      });

      return res.json(success(usersWithoutPassword, '获取用户列表成功'));
    } catch (err) {
      logger.error('获取用户列表失败:', err);
      return res.status(500).json(error(500, '获取用户列表失败'));
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const user = await userRepository.findById(id);

      if (!user) {
        return res.status(404).json(notFound('用户不存在'));
      }

      const { passwordHash, ...userWithoutPassword } = user as any;

      return res.json(success(userWithoutPassword, '获取用户信息成功'));
    } catch (err) {
      logger.error('获取用户信息失败:', err);
      return res.status(500).json(error(500, '获取用户信息失败'));
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = req.body as Partial<User> & { password?: string };

      if (!data.username || !data.realName || !data.role || !data.password) {
        return res.status(400).json(badRequest('用户名、姓名、角色和密码不能为空'));
      }

      if (data.password.length < 6) {
        return res.status(400).json(badRequest('密码长度不能少于6位'));
      }

      if (await userRepository.existsByUsername(data.username)) {
        return res.status(409).json(conflict('用户名已存在'));
      }

      const passwordHash = await authService.hashPassword(data.password);
      const userData = {
        username: data.username,
        realName: data.realName,
        role: data.role,
        status: data.status || 'active',
        passwordHash,
      };

      const id = await userRepository.create(userData as any);

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '创建',
        '用户',
        id,
        `创建用户: ${data.username}`,
        ip
      );

      return res.status(201).json(success({ id }, '创建用户成功'));
    } catch (err: any) {
      logger.error('创建用户失败:', err);
      return res.status(500).json(error(500, err.message || '创建用户失败'));
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = req.body as Partial<User>;

      const existing = await userRepository.findById(id);
      if (!existing) {
        return res.status(404).json(notFound('用户不存在'));
      }

      if (data.username && data.username !== existing.username) {
        if (await userRepository.existsByUsername(data.username, id)) {
          return res.status(409).json(conflict('用户名已存在'));
        }
      }

      const { passwordHash, ...updateData } = data as any;
      const success_ = await userRepository.update(id, updateData);

      if (!success_) {
        return res.status(404).json(notFound('用户不存在'));
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '更新',
        '用户',
        id,
        `更新用户信息`,
        ip
      );

      return res.json(success(null, '更新用户成功'));
    } catch (err: any) {
      logger.error('更新用户失败:', err);
      if (err.message === '用户不存在') {
        return res.status(404).json(notFound(err.message));
      }
      return res.status(500).json(error(500, err.message || '更新用户失败'));
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (id === req.user!.id) {
        return res.status(400).json(badRequest('不能删除自己'));
      }

      const existing = await userRepository.findById(id);
      if (!existing) {
        return res.status(404).json(notFound('用户不存在'));
      }

      const success_ = await userRepository.delete(id);

      if (!success_) {
        return res.status(404).json(notFound('用户不存在'));
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '删除',
        '用户',
        id,
        `删除用户: ${existing.username}`,
        ip
      );

      return res.json(success(null, '删除用户成功'));
    } catch (err: any) {
      logger.error('删除用户失败:', err);
      if (err.message === '用户不存在') {
        return res.status(404).json(notFound(err.message));
      }
      return res.status(500).json(error(500, err.message || '删除用户失败'));
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json(badRequest('状态不能为空'));
      }

      if (id === req.user!.id) {
        return res.status(400).json(badRequest('不能禁用自己'));
      }

      const existing = await userRepository.findById(id);
      if (!existing) {
        return res.status(404).json(notFound('用户不存在'));
      }

      const success_ = await userRepository.update(id, { status } as Partial<User>);

      if (!success_) {
        return res.status(404).json(notFound('用户不存在'));
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '更新状态',
        '用户',
        id,
        `更新用户状态为: ${status}`,
        ip
      );

      return res.json(success(null, '更新用户状态成功'));
    } catch (err: any) {
      logger.error('更新用户状态失败:', err);
      if (err.message === '用户不存在') {
        return res.status(404).json(notFound(err.message));
      }
      return res.status(500).json(error(500, err.message || '更新用户状态失败'));
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { password } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json(badRequest('密码不能为空且长度不能少于6位'));
      }

      const existing = await userRepository.findById(id);
      if (!existing) {
        return res.status(404).json(notFound('用户不存在'));
      }

      const passwordHash = await authService.hashPassword(password);
      const success_ = await userRepository.update(id, { passwordHash } as any);

      if (!success_) {
        return res.status(404).json(notFound('用户不存在'));
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        req.user!.id,
        req.user!.username,
        '重置密码',
        '用户',
        id,
        `重置用户密码`,
        ip
      );

      return res.json(success(null, '重置密码成功'));
    } catch (err: any) {
      logger.error('重置密码失败:', err);
      if (err.message === '用户不存在') {
        return res.status(404).json(notFound(err.message));
      }
      return res.status(500).json(error(500, err.message || '重置密码失败'));
    }
  }
}

export const userController = new UserController();
export default userController;
