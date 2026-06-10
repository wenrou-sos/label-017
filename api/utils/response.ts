import { ApiResponse } from '../../shared/types';

export const success = <T>(data: T, message: string = 'success'): ApiResponse<T> => {
  return {
    code: 200,
    message,
    data,
    timestamp: Date.now(),
  };
};

export const error = (code: number, message: string): ApiResponse<null> => {
  return {
    code,
    message,
    data: null,
    timestamp: Date.now(),
  };
};

export const conflict = (message: string): ApiResponse<null> => {
  return error(409, message);
};

export const unauthorized = (message: string = '未授权访问'): ApiResponse<null> => {
  return error(401, message);
};

export const forbidden = (message: string = '权限不足'): ApiResponse<null> => {
  return error(403, message);
};

export const notFound = (message: string = '资源不存在'): ApiResponse<null> => {
  return error(404, message);
};

export const badRequest = (message: string = '请求参数错误'): ApiResponse<null> => {
  return error(400, message);
};

export const serverError = (message: string = '服务器内部错误'): ApiResponse<null> => {
  return error(500, message);
};
