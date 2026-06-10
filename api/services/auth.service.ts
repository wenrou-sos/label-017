import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, LoginResponse } from '../../shared/types';
import userRepository from '../repositories/user.repository';
import logger from '../config/logger';

class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'secret';
  private readonly jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      this.jwtSecret as jwt.Secret,
      { expiresIn: this.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
    );
  }

  verifyToken(token: string): any {
    return jwt.verify(token, this.jwtSecret);
  }

  async login(username: string, password: string): Promise<LoginResponse | null> {
    const userWithPassword = await userRepository.findByUsernameWithPassword(username);
    
    if (!userWithPassword) {
      logger.warn(`登录失败：用户不存在 - ${username}`);
      return null;
    }

    if (userWithPassword.status === 'disabled') {
      logger.warn(`登录失败：用户已禁用 - ${username}`);
      return null;
    }

    const isValid = await this.comparePassword(password, userWithPassword.passwordHash || '');
    if (!isValid) {
      logger.warn(`登录失败：密码错误 - ${username}`);
      return null;
    }

    const { passwordHash, ...user } = userWithPassword;
    const token = this.generateToken(user as User);

    logger.info(`用户登录成功 - ${username}`);

    return {
      token,
      user: user as User,
    };
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
    const userWithPassword = await userRepository.findById(userId) as any;
    if (!userWithPassword) {
      return false;
    }

    const isValid = await this.comparePassword(oldPassword, userWithPassword.passwordHash || '');
    if (!isValid) {
      return false;
    }

    const newPasswordHash = await this.hashPassword(newPassword);
    return userRepository.update(userId, { passwordHash: newPasswordHash } as any);
  }
}

export const authService = new AuthService();
export default authService;
