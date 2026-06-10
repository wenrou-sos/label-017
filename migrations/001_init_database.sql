-- 数据库初始化脚本
CREATE DATABASE IF NOT EXISTS production_scheduling
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE production_scheduling;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'planner', 'viewer') NOT NULL DEFAULT 'viewer',
    status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 产品表
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_code VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(200) NOT NULL,
    process_hours DECIMAL(10,2) NOT NULL COMMENT '单位产品加工工时（小时）',
    unit VARCHAR(20) NOT NULL DEFAULT '件',
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_product_code (product_code),
    INDEX idx_product_name (product_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 机器表
CREATE TABLE IF NOT EXISTS machines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    machine_code VARCHAR(50) NOT NULL UNIQUE,
    machine_name VARCHAR(200) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status ENUM('running', 'idle', 'maintenance', 'broken') NOT NULL DEFAULT 'idle',
    capacity DECIMAL(10,2) NOT NULL DEFAULT 1.0 COMMENT '机器产能系数',
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_machine_code (machine_code),
    INDEX idx_status (status),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(50) NOT NULL UNIQUE,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    estimated_hours DECIMAL(10,2) NOT NULL COMMENT '预估生产工时 = 数量 * 产品工时 / 机器产能',
    delivery_date DATE NOT NULL,
    status ENUM('pending', 'scheduled', 'producing', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_order_no (order_no),
    INDEX idx_status (status),
    INDEX idx_delivery_date (delivery_date),
    INDEX idx_product_id (product_id),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 排程表（核心表）
CREATE TABLE IF NOT EXISTS schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    machine_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    actual_hours DECIMAL(10,2) NOT NULL,
    status ENUM('scheduled', 'in_progress', 'completed') NOT NULL DEFAULT 'scheduled',
    version INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (machine_id) REFERENCES machines(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_machine_time (machine_id, start_time, end_time),
    INDEX idx_order_id (order_id),
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_status (status),
    INDEX idx_machine_status (machine_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    username VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    target_id INT,
    details TEXT,
    ip VARCHAR(50),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_module (module),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始数据：管理员账号 (密码: password)
INSERT INTO users (username, password_hash, real_name, role, status) VALUES
('admin', '$2b$10$oXlBlwHRAS7Q8X6S.S8J4eS1x3TzPpHhJzfZOg9ysbaQY2WODeOaC', '系统管理员', 'admin', 'active'),
('planner1', '$2b$10$oXlBlwHRAS7Q8X6S.S8J4eS1x3TzPpHhJzfZOg9ysbaQY2WODeOaC', '计划员A', 'planner', 'active'),
('planner2', '$2b$10$oXlBlwHRAS7Q8X6S.S8J4eS1x3TzPpHhJzfZOg9ysbaQY2WODeOaC', '计划员B', 'planner', 'active'),
('viewer1', '$2b$10$oXlBlwHRAS7Q8X6S.S8J4eS1x3TzPpHhJzfZOg9ysbaQY2WODeOaC', '查看员', 'viewer', 'active');

-- 初始数据：产品
INSERT INTO products (product_code, product_name, process_hours, unit, description) VALUES
('PRD-001', '精密齿轮A-001', 0.5, '件', '高精度传动齿轮，材料20CrMnTi'),
('PRD-002', '精密齿轮B-002', 0.8, '件', '重载传动齿轮，材料40CrNiMo'),
('PRD-003', '轴承座C-003', 1.2, '件', '大型轴承座，铸铁件'),
('PRD-004', '传动轴D-004', 0.6, '件', '精密传动轴，材料45钢'),
('PRD-005', '壳体E-005', 2.5, '件', '铝合金壳体，五轴加工');

-- 初始数据：机器设备
INSERT INTO machines (machine_code, machine_name, type, status, capacity, description) VALUES
('MCH-001', '数控车床CK6150', '数控车床', 'running', 1.0, '沈阳机床，最大切削直径500mm'),
('MCH-002', '数控车床CK6180', '数控车床', 'running', 1.2, '沈阳机床，最大切削直径800mm'),
('MCH-003', '加工中心VMC850', '立式加工中心', 'running', 1.0, '台湾友佳，三轴联动'),
('MCH-004', '加工中心VMC1060', '立式加工中心', 'idle', 1.3, '德国DMG，五轴联动'),
('MCH-005', '外圆磨床M1332', '磨床', 'running', 0.8, '上海机床，最大磨削直径320mm'),
('MCH-006', '滚齿机Y3180', '齿轮加工', 'maintenance', 1.0, '重庆机床，最大模数12mm');

-- 初始数据：测试订单
INSERT INTO orders (order_no, product_id, quantity, estimated_hours, delivery_date, status, priority, description) VALUES
('ORD-2024-0001', 1, 100, 50.00, '2024-06-20', 'pending', 'high', '客户A订单，急单'),
('ORD-2024-0002', 2, 50, 40.00, '2024-06-25', 'pending', 'medium', '客户B常规订单'),
('ORD-2024-0003', 3, 20, 24.00, '2024-06-18', 'pending', 'urgent', '客户C加急订单'),
('ORD-2024-0004', 4, 80, 48.00, '2024-06-30', 'pending', 'low', '客户D备货订单'),
('ORD-2024-0005', 5, 10, 25.00, '2024-07-05', 'pending', 'medium', '客户E新品订单');
