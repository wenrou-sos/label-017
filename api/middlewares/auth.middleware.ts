import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { unauthorized, forbidden } from '../utils/response';
import logger from '../config/logger';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: 'admin' | 'planner' | 'viewer';
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(unauthorized('缺少认证令牌'));
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };
    next();
  } catch (error) {
    logger.error('JWT验证失败:', error);
    return res.status(401).json(unauthorized('认证令牌无效或已过期'));
  }
};

export const requireRole = (...roles: Array<'admin' | 'planner' | 'viewer'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(unauthorized());
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn(`用户 ${req.user.username} 尝试访问无权限资源`);
      return res.status(403).json(forbidden());
    }
    
    next();
  };
};

export const requirePlannerOrAdmin = requireRole('admin', 'planner');
export const requireAdmin = requireRole('admin');
