import { Request, Response, NextFunction } from 'express';
import { serverError } from '../utils/response';
import logger from '../config/logger';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`请求错误: ${req.method} ${req.path}`, error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      message: '数据验证失败',
      data: error.errors,
      timestamp: Date.now(),
    });
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      code: 401,
      message: '未授权访问',
      data: null,
      timestamp: Date.now(),
    });
  }
  
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      code: 409,
      message: '数据已存在',
      data: null,
      timestamp: Date.now(),
    });
  }
  
  res.status(500).json(serverError(error.message || '服务器内部错误'));
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    code: 404,
    message: `请求的路由不存在: ${req.method} ${req.path}`,
    data: null,
    timestamp: Date.now(),
  });
};
