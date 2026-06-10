import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '../config/database';
import logger from '../config/logger';

export interface BaseRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  create(data: Partial<T>, connection?: PoolConnection): Promise<number>;
  update(id: number, data: Partial<T>, connection?: PoolConnection): Promise<boolean>;
  delete(id: number, connection?: PoolConnection): Promise<boolean>;
}

export abstract class BaseRepositoryImpl<T extends { id?: number }> implements BaseRepository<T> {
  protected tableName: string;
  protected idColumn: string = 'id';

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  protected getConnection(): Promise<PoolConnection> {
    return pool.getConnection();
  }

  protected toRow(data: Partial<T>): Record<string, any> {
    const row: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const column = this.toSnakeCase(key);
      row[column] = value === undefined ? null : value;
    }
    return row;
  }

  protected toEntity(row: RowDataPacket): T {
    const entity: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      const prop = this.toCamelCase(key);
      entity[prop] = value;
    }
    return entity as T;
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
  }

  async findAll(): Promise<T[]> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM ${this.tableName} ORDER BY ${this.idColumn} DESC`
      );
      return rows.map(row => this.toEntity(row));
    } finally {
      connection.release();
    }
  }

  async findById(id: number): Promise<T | null> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM ${this.tableName} WHERE ${this.idColumn} = ?`,
        [id]
      );
      return rows.length > 0 ? this.toEntity(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  async create(data: Partial<T>, connection?: PoolConnection): Promise<number> {
    const conn = connection || (await this.getConnection());
    const needRelease = !connection;
    
    try {
      const row = this.toRow(data);
      const columns = Object.keys(row);
      const placeholders = columns.map(() => '?').join(', ');
      const values = Object.values(row);
      
      const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
      logger.debug(`SQL: ${sql}, params: ${JSON.stringify(values)}`);
      
      const [result] = await conn.execute<ResultSetHeader>(sql, values);
      return result.insertId;
    } finally {
      if (needRelease) conn.release();
    }
  }

  async update(id: number, data: Partial<T>, connection?: PoolConnection): Promise<boolean> {
    const conn = connection || (await this.getConnection());
    const needRelease = !connection;
    
    try {
      const row = this.toRow(data);
      delete row[this.idColumn];
      const updates = Object.keys(row).map(col => `${col} = ?`).join(', ');
      const values = [...Object.values(row), id];
      
      const [result] = await conn.execute<ResultSetHeader>(
        `UPDATE ${this.tableName} SET ${updates} WHERE ${this.idColumn} = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } finally {
      if (needRelease) conn.release();
    }
  }

  async delete(id: number, connection?: PoolConnection): Promise<boolean> {
    const conn = connection || (await this.getConnection());
    const needRelease = !connection;
    
    try {
      const [result] = await conn.execute<ResultSetHeader>(
        `DELETE FROM ${this.tableName} WHERE ${this.idColumn} = ?`,
        [id]
      );
      return result.affectedRows > 0;
    } finally {
      if (needRelease) conn.release();
    }
  }

  async executeQuery(sql: string, params: any[], connection?: PoolConnection): Promise<any[]> {
    const conn = connection || (await this.getConnection());
    const needRelease = !connection;
    
    try {
      logger.debug(`SQL: ${sql}, params: ${JSON.stringify(params)}`);
      const [rows] = await conn.execute<RowDataPacket[]>(sql, params);
      return rows.map(row => this.toEntity(row));
    } finally {
      if (needRelease) conn.release();
    }
  }

  async executeScalar(sql: string, params: any[], connection?: PoolConnection): Promise<any> {
    const conn = connection || (await this.getConnection());
    const needRelease = !connection;
    
    try {
      logger.debug(`SQL: ${sql}, params: ${JSON.stringify(params)}`);
      const [rows] = await conn.execute<RowDataPacket[]>(sql, params);
      return rows.length > 0 ? Object.values(rows[0])[0] : null;
    } finally {
      if (needRelease) conn.release();
    }
  }
}
