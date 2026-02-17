import sqlite3
import os

DB = os.path.join(os.path.dirname(__file__), 'cars.db')

def check_database():
    try:
        conn = sqlite3.connect(DB)
        cursor = conn.cursor()
        
        # 检查表是否存在
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='cars'")
        table_exists = cursor.fetchone()
        
        if table_exists:
            print("✓ cars表存在")
            
            # 检查表结构
            cursor.execute("PRAGMA table_info(cars)")
            columns = cursor.fetchall()
            print("表结构:")
            for col in columns:
                print(f"  {col[1]} ({col[2]})")
            
            # 检查数据
            cursor.execute("SELECT COUNT(*) FROM cars")
            count = cursor.fetchone()[0]
            print(f"数据行数: {count}")
            
            if count > 0:
                cursor.execute("SELECT * FROM cars LIMIT 5")
                rows = cursor.fetchall()
                print("前5行数据:")
                for row in rows:
                    print(f"  {row}")
        else:
            print("✗ cars表不存在")
            
        conn.close()
        return True
        
    except Exception as e:
        print(f"数据库连接错误: {e}")
        return False

if __name__ == "__main__":
    check_database()