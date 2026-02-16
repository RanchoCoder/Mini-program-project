const API_BASE = 'http://127.0.0.1:5000'

Page({
  data: {
    q: '',
    results: [],
    loading: false,
    page: 1,
    page_size: 20,
    total: 0
  },

  onInput(e){
    const q = e.detail.value
    this.setData({ q })
  },

  search(){
    const { q, page, page_size } = this.data
    if(!q){
      this.setData({ results: [], total: 0 })
      return
    }
    this.setData({ loading: true })
    wx.request({
      url: `${API_BASE}/api/search`,
      method: 'GET',
      data: { q, page, page_size },
      success: (res) => {
        if(res.statusCode === 200){
          this.setData({ results: res.data.data, total: res.data.total })
        } else {
          wx.showToast({ title: '查询失败', icon: 'none' })
        }
      },
      fail: () => wx.showToast({ title: '网络请求失败', icon: 'none' }),
      complete: () => this.setData({ loading: false })
    })
  }
})
