import { Request, Response } from 'express';
import { success, error, unauthorized, badRequest } from '../utils/response';
import authService from '../services/auth.service';
import logService from '../services/log.service';
import { LoginRequest } from '../../shared/types';
import logger from '../config/logger';

class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body as LoginRequest;

      if (!username || !password) {
        return res.status(400).json(badRequest('用户名和密码不能为空'));
      }

      const result = await authService.login(username, password);

      if (!result) {
        return res.status(401).json(unauthorized('用户名或密码错误'));
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        result.user.id,
        result.user.username,
        '登录',
        '认证',
        null,
        `用户登录系统`,
        ip
      );

      return res.json(success(result, '登录成功'));
    } catch (err) {
      logger.error('登录失败:', err);
      return res.status(500).json(error(500, '登录失败'));
    }
  }

  async logout(req: Request, res: Response) {
    try {
      if (req.user) {
        const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
        await logService.logOperation(
          req.user.id,
          req.user.username,
          '登出',
          '认证',
          null,
          `用户登出系统`,
          ip
        );
      }

      return res.json(success(null, '登出成功'));
    } catch (err) {
      logger.error('登出失败:', err);
      return res.status(500).json(error(500, '登出失败'));
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json(badRequest('旧密码和新密码不能为空'));
      }

      if (newPassword.length < 6) {
        return res.status(400).json(badRequest('新密码长度不能少于6位'));
      }

      const userId = req.user!.id;
      const success_ = await authService.changePassword(userId, oldPassword, newPassword);

      if (!success_) {
        return res.status(400).json(badRequest('旧密码错误'));
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      await logService.logOperation(
        userId,
        req.user!.username,
        '修改密码',
        '认证',
        userId,
        `用户修改密码`,
        ip
      );

      return res.json(success(null, '密码修改成功'));
    } catch (err) {
      logger.error('修改密码失败:', err);
      return res.status(500).json(error(500, '修改密码失败'));
    }
  }

  async getCurrentUser(req: Request, res: Response) {
    try {
      return res.json(success(req.user, '获取用户信息成功'));
    } catch (err) {
      logger.error('获取用户信息失败:', err);
      return res.status(500).json(error(500, '获取用户信息失败'));
    }
  }
}

export const authController = new AuthController();
export default authController;
