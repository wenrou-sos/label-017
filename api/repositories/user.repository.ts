import { User } from '../../shared/types';
import { BaseRepositoryImpl } from './base.repository';
import { RowDataPacket } from 'mysql2/promise';

class UserRepository extends BaseRepositoryImpl<User> {
  constructor() {
    super('users');
  }

  async findByUsername(username: string): Promise<User | null> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      return rows.length > 0 ? this.toEntity(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  async findByUsernameWithPassword(username: string): Promise<(User & { passwordHash?: string }) | null> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      if (rows.length === 0) return null;
      const row = rows[0];
      const user = this.toEntity(row) as User & { passwordHash?: string };
      user.passwordHash = row.password_hash;
      return user;
    } finally {
      connection.release();
    }
  }

  async findByRole(role: string): Promise<User[]> {
    return this.executeQuery(
      'SELECT * FROM users WHERE role = ? ORDER BY id DESC',
      [role]
    );
  }

  async existsByUsername(username: string, excludeId?: number): Promise<boolean> {
    const sql = excludeId
      ? 'SELECT COUNT(*) as count FROM users WHERE username = ? AND id != ?'
      : 'SELECT COUNT(*) as count FROM users WHERE username = ?';
    const params = excludeId ? [username, excludeId] : [username];
    const count = await this.executeScalar(sql, params);
    return count > 0;
  }
}

export const userRepository = new UserRepository();
export default userRepository;
