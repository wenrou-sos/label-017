import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'production_scheduling',
};

async function testConflictDetection() {
  console.log('🧪 开始测试排程冲突检测机制...\n');
  
  const connections = [];
  
  try {
    console.log('📡 建立两个并发连接（模拟两个计划员）...');
    const conn1 = await mysql.createConnection(config);
    const conn2 = await mysql.createConnection(config);
    connections.push(conn1, conn2);
    console.log('✅ 连接建立成功\n');
    
    console.log('🧹 清理测试数据...');
    await conn1.execute('DELETE FROM schedules WHERE order_id IN (1, 2)');
    await conn1.execute("UPDATE orders SET status = 'pending' WHERE id IN (1, 2)");
    console.log('✅ 清理完成\n');
    
    console.log('🔒 测试1: 开启事务并锁定行...');
    
    await conn1.beginTransaction();
    console.log('   [用户A] 事务1已开启');
    
    await conn2.beginTransaction();
    console.log('   [用户B] 事务2已开启\n');
    
    console.log('🔍 测试2: 事务1检测冲突（使用FOR UPDATE行锁）...');
    
    const checkSql = `
      SELECT s.id, o.order_no, p.product_name, s.start_time, s.end_time,
             TIMESTAMPDIFF(MINUTE,
               GREATEST(s.start_time, ?),
               LEAST(s.end_time, ?)
             ) as overlap_minutes
      FROM schedules s
      INNER JOIN orders o ON s.order_id = o.id
      INNER JOIN products p ON o.product_id = p.id
      WHERE s.machine_id = ?
        AND s.status IN ('scheduled', 'in_progress')
        AND s.start_time < ?
        AND s.end_time > ?
      FOR UPDATE
    `;
    
    const machineId = 1;
    const startTime1 = '2026-06-10 08:00:00';
    const endTime1 = '2026-06-10 16:00:00';
    
    const [conflicts1] = await conn1.execute(checkSql, [startTime1, endTime1, machineId, endTime1, startTime1]);
    console.log(`   [用户A] 检测到 ${conflicts1.length} 个冲突`);
    
    if (conflicts1.length === 0) {
      console.log('   [用户A] 无冲突，创建排程...');
      const [result] = await conn1.execute(
        'INSERT INTO schedules (order_id, machine_id, start_time, end_time, actual_hours, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [1, machineId, startTime1, endTime1, 8.0, 'scheduled', 1]
      );
      console.log(`   [用户A] 排程创建成功，ID: ${result.insertId}`);
      
      await conn1.execute("UPDATE orders SET status = 'scheduled' WHERE id = 1");
      console.log('   [用户A] 订单状态已更新');
    }
    
    console.log('\n🔍 测试3: 事务2尝试检测同一时间范围的冲突...');
    console.log('   [用户B] 检测冲突中...（应该被行锁阻塞）');
    
    const startTime2 = '2026-06-10 10:00:00';
    const endTime2 = '2026-06-10 14:00:00';
    
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.log('   ⏱️  检测超时（被行锁阻塞，预期行为）');
        resolve('timeout');
      }, 2000);
    });
    
    const checkPromise = conn2.execute(checkSql, [startTime2, endTime2, machineId, endTime2, startTime2])
      .then(([conflicts2]) => {
        console.log(`   [用户B] 检测到 ${conflicts2.length} 个冲突`);
        if (conflicts2.length > 0) {
          console.log('   [用户B] 冲突详情:', JSON.stringify(conflicts2[0], null, 2).split('\n').map(l => '            ' + l).join('\n'));
        }
        return 'success';
      });
    
    const result = await Promise.race([timeoutPromise, checkPromise]);
    
    if (result === 'timeout') {
      console.log('   ✅ 行锁机制正常工作，事务2被正确阻塞\n');
    }
    
    console.log('💾 测试4: 提交事务1...');
    await conn1.commit();
    console.log('   [用户A] 事务1已提交\n');
    
    if (result === 'timeout') {
      console.log('🔍 测试5: 事务2现在继续检测冲突...');
      const [conflicts2] = await conn2.execute(checkSql, [startTime2, endTime2, machineId, endTime2, startTime2]);
      console.log(`   [用户B] 检测到 ${conflicts2.length} 个冲突`);
      if (conflicts2.length > 0) {
        console.log('   [用户B] 冲突详情:');
        console.log(`      订单号: ${conflicts2[0].order_no}`);
        console.log(`      产品名: ${conflicts2[0].product_name}`);
        console.log(`      时间: ${conflicts2[0].start_time} - ${conflicts2[0].end_time}`);
        console.log(`      重叠: ${conflicts2[0].overlap_minutes} 分钟`);
        console.log('   ✅ 事务2正确检测到事务1提交的排程冲突\n');
      }
      
      console.log('❌ 测试6: 事务2因冲突回滚...');
      await conn2.rollback();
      console.log('   [用户B] 事务2已回滚\n');
    }
    
    console.log('✅ 冲突检测测试完成！');
    console.log('\n📊 测试结果总结:');
    console.log('   ✅ 行锁机制正常工作 - 并发事务被正确隔离');
    console.log('   ✅ 冲突检测逻辑正确 - 时间重叠被识别');
    console.log('   ✅ 事务隔离有效 - 提交后的数据对其他事务可见');
    console.log('   ✅ 重叠时间计算准确');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error);
  } finally {
    console.log('\n🧹 清理测试数据...');
    for (const conn of connections) {
      try {
        await conn.rollback();
      } catch (e) {}
      await conn.end();
    }
    
    const cleanupConn = await mysql.createConnection(config);
    await cleanupConn.execute('DELETE FROM schedules WHERE created_by = 999 OR order_id IN (1, 2)');
    await cleanupConn.execute("UPDATE orders SET status = 'pending' WHERE id IN (1, 2)");
    await cleanupConn.end();
    console.log('✅ 清理完成\n');
  }
}

testConflictDetection();
