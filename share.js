export default {
  created() {
    //#ifdef MP-WEIXIN
    wx.showShareMenu({
      withShareTicket: true,
      menus: ["shareAppMessage", "shareTimeline"],
    });
    //#endif
  },
  onShareAppMessage(res) {
    // 发送给朋友
    return {
      title: "大模王", 
      imageUrl: "/static/logo.png"
    };
  },
  onShareTimeline(res) {
    // 分享到朋友圈
    return {
      title: "大模王", 
      imageUrl: "/static/logo.png"
    };
  },
};
