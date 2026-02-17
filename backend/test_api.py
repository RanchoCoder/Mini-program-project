import requests
import json

BASE_URL = "http://127.0.0.1:5000/api"

def test_cars_api():
    """测试车辆列表接口"""
    print("=== 测试车辆列表接口 ===")
    
    # 测试获取所有车辆
    response = requests.get(f"{BASE_URL}/cars")
    print(f"获取所有车辆: 状态码 {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"响应: {json.dumps(data, ensure_ascii=False, indent=2)}")
    else:
        print(f"请求失败: {response.text}")
    
    print("\n=== 测试搜索功能 ===")
    # 测试搜索功能
    response = requests.get(f"{BASE_URL}/cars?q=丰田")
    print(f"搜索'丰田': 状态码 {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"搜索结果数量: {data['data']['total']}")
    
    print("\n=== 测试品牌筛选 ===")
    # 测试品牌筛选
    response = requests.get(f"{BASE_URL}/cars?brand=BMW")
    print(f"筛选BMW品牌: 状态码 {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"BMW车辆数量: {data['data']['total']}")

def test_car_detail_api():
    """测试车辆详情接口"""
    print("\n=== 测试车辆详情接口 ===")
    
    # 测试获取第一个车辆的详情
    response = requests.get(f"{BASE_URL}/cars/21")
    print(f"获取车辆ID=21的详情: 状态码 {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"车辆详情: {json.dumps(data, ensure_ascii=False, indent=2)}")
    else:
        print(f"请求失败: {response.text}")

if __name__ == "__main__":
    try:
        test_cars_api()
        test_car_detail_api()
        print("\n✅ 所有API测试完成！")
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        print("请确保Flask服务器正在运行 (http://127.0.0.1:5000)")