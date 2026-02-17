// 项目配置文件
module.exports = {
  // 后端API基础地址（替换为你的局域网IP）
  API_BASE: 'http://192.168.31.137:5000',
  // 分页配置
  PAGE_SIZE: 10,
  // 品牌列表
  BRANDS: ['全部', '宝马', '奔驰', '大众', '丰田', '本田'],
  // 年份范围
  MIN_YEAR: 2010,
  MAX_YEAR: new Date().getFullYear(),
  // 防抖延迟（毫秒）
  DEBOUNCE_DELAY: 500,
  // 小程序AppID（和后端一致）
  APPID: 'wxd18848e6830ff127'
}