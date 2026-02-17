import sqlite3
import os

DB = os.path.join(os.path.dirname(__file__), 'cars.db')

DATA = [
    ("Toyota", "Corolla", 2015, 60000, 50000, "丰田 卡罗拉 2015年 自动挡 保养良好", "保养良好，无事故，自动挡，省油"),
    ("Honda", "Civic", 2016, 70000, 60000, "本田 思域 2016年 手自一体", "车况优良，原厂漆，定期保养"),
    ("Volkswagen", "Golf", 2014, 50000, 90000, "大众 高尔夫 2014年", "家用车，舒适，手动挡"),
    ("BMW", "320", 2017, 180000, 40000, "宝马 320 2017年 豪华型", "单主要车，内饰完整，动力好"),
    ("Audi", "A4", 2018, 200000, 30000, "奥迪 A4 2018年 低里程", "保养记录齐全，无事故"),
    ("Toyota", "Camry", 2013, 80000, 120000, "丰田 凯美瑞 2013年 舒适家用", "车况稳定，适合家庭使用"),
    ("Nissan", "Teana", 2015, 65000, 80000, "日产 天籁 2015年 舒适版", "空间大，乘坐舒适"),
    ("Ford", "Focus", 2012, 30000, 150000, "福特 福克斯 2012年 经济型", "省油，维护简单"),
    ("Chevrolet", "Cruze", 2014, 35000, 110000, "雪佛兰 科鲁兹 2014年", "性价比高，适合通勤"),
    ("Hyundai", "Elantra", 2016, 40000, 70000, "现代 伊兰特 2016年", "行驶平顺，保养良好")
]


def init_db():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    cur.execute('''
    CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        make TEXT,
        model TEXT,
        year INTEGER,
        price INTEGER,
        mileage INTEGER,
        title TEXT,
        description TEXT
    )
    ''')
    cur.execute('DELETE FROM cars')
    cur.executemany('INSERT INTO cars (make, model, year, price, mileage, title, description) VALUES (?,?,?,?,?,?,?)', DATA)
    conn.commit()
    conn.close()


if __name__ == '__main__':
    init_db()
    print('Initialized', DB)
