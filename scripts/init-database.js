import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  multipleStatements: true,
};

const dbName = process.env.DB_NAME || 'production_scheduling';

async function initDatabase() {
  console.log('🚀 开始初始化数据库...\n');
  
  let connection;
  
  try {
    console.log('📡 连接到 MySQL 服务器...');
    connection = await mysql.createConnection(config);
    console.log('✅ MySQL 连接成功\n');
    
    console.log('📦 重新创建数据库...');
    await connection.execute(`DROP DATABASE IF EXISTS ${dbName}`);
    await connection.execute(`CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ 数据库 ${dbName} 已创建\n`);
    
    await connection.query(`USE ${dbName}`);
    
    console.log('📄 执行数据库初始化脚本...');
    const sqlPath = path.join(__dirname, '../migrations/001_init_database.sql');
    let sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    sqlContent = sqlContent.replace(/DELIMITER\s+[^;]+/g, '');
    
    await connection.query(sqlContent);
    console.log('✅ 数据库表创建完成\n');
    
    console.log('🔍 验证初始数据...');
    
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [products] = await connection.query('SELECT COUNT(*) as count FROM products');
    const [machines] = await connection.query('SELECT COUNT(*) as count FROM machines');
    const [orders] = await connection.query('SELECT COUNT(*) as count FROM orders');
    
    console.log(`   用户表: ${users[0].count} 条记录`);
    console.log(`   产品表: ${products[0].count} 条记录`);
    console.log(`   机器表: ${machines[0].count} 条记录`);
    console.log(`   订单表: ${orders[0].count} 条记录\n`);
    
    console.log('✅ 数据库初始化完成！\n');
    console.log('📋 默认账号:');
    console.log('   管理员: admin / password');
    console.log('   计划员: planner1 / password');
    console.log('   计划员: planner2 / password');
    console.log('   查看者: viewer1 / password\n');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
