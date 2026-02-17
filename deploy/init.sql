-- 二手车搜索系统 - 数据库初始化脚本
-- 用于Docker部署时自动初始化MySQL数据库

-- 创建cars表
CREATE TABLE IF NOT EXISTS cars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    make VARCHAR(100) NOT NULL COMMENT '品牌',
    model VARCHAR(100) NOT NULL COMMENT '车型',
    year INT NOT NULL COMMENT '年份',
    price INT NOT NULL COMMENT '价格（元）',
    mileage INT NOT NULL COMMENT '里程（公里）',
    title VARCHAR(255) NOT NULL COMMENT '标题',
    description TEXT COMMENT '描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_make (make),
    INDEX idx_year (year),
    INDEX idx_price (price),
    FULLTEXT INDEX idx_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='车辆信息表';

-- 插入示例数据
INSERT INTO cars (make, model, year, price, mileage, title, description) VALUES
('Toyota', 'Corolla', 2015, 60000, 50000, '丰田 卡罗拉 2015年 自动挡 保养良好', '保养良好，无事故，自动挡，省油'),
('Honda', 'Civic', 2016, 70000, 60000, '本田 思域 2016年 手自一体', '车况优良，原厂漆，定期保养'),
('Volkswagen', 'Golf', 2014, 50000, 90000, '大众 高尔夫 2014年', '家用车，舒适，手动挡'),
('BMW', '320', 2017, 180000, 40000, '宝马 320 2017年 豪华型', '单主要车，内饰完整，动力好'),
('Audi', 'A4', 2018, 200000, 30000, '奥迪 A4 2018年 低里程', '保养记录齐全，无事故'),
('Toyota', 'Camry', 2013, 80000, 120000, '丰田 凯美瑞 2013年 舒适家用', '车况稳定，适合家庭使用'),
('Nissan', 'Teana', 2015, 65000, 80000, '日产 天籁 2015年 舒适版', '空间大，乘坐舒适'),
('Ford', 'Focus', 2012, 30000, 150000, '福特 福克斯 2012年 经济型', '省油，维护简单'),
('Chevrolet', 'Cruze', 2014, 35000, 110000, '雪佛兰 科鲁兹 2014年', '性价比高，适合通勤'),
('Hyundai', 'Elantra', 2016, 40000, 70000, '现代 伊兰特 2016年', '行驶平顺，保养良好');

-- 创建用户表（用于微信登录）
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    openid VARCHAR(100) NOT NULL UNIQUE COMMENT '微信openid',
    unionid VARCHAR(100) COMMENT '微信unionid',
    nickname VARCHAR(100) COMMENT '昵称',
    avatar_url VARCHAR(500) COMMENT '头像URL',
    session_key VARCHAR(100) COMMENT '微信session_key',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户信息表';

-- 创建收藏表
CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    car_id INT NOT NULL COMMENT '车辆ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_car (user_id, car_id),
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收藏表';