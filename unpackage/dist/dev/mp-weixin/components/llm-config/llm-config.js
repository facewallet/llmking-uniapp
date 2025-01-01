"use strict";
const common_vendor = require("../../common/vendor.js");
let confirmCallback = () => {
};
const _sfc_main = {
  name: "llm-config",
  data() {
    return {
      models: [{
        name: "GLM-4",
        value: "glm-4-flash"
      }],
      currentModel: ""
    };
  },
  beforeMount() {
    this.fetchChannel();
  },
  methods: {
    fetchChannel() {
      common_vendor.index.request({
        url: this.getHttpHost() + "/api/pub/llmking/channel/list",
        method: "GET",
        header: {
          "Cache-Control": "no-cache"
          // 禁用缓存
        },
        success: (res) => {
          if (res.data.meta.code === 0) {
            const data = res.data.data;
            this.models = data.channelList;
            this.currentModel = common_vendor.index.getStorageSync("uni-ai-chat-llmModel");
            if (!this.currentModel) {
              this.currentModel = data.currentChannel.value;
              common_vendor.index.setStorageSync("uni-ai-chat-llmModel", data.currentChannel.value);
            }
            common_vendor.index.setStorage({
              key: "APIKEY",
              data: data.APIKEY
            });
          }
        },
        fail: (err) => {
          console.error(err);
        }
      });
    },
    getHttpHost() {
      const systemInfo = common_vendor.index.getSystemInfoSync();
      const isPCBrowser = systemInfo.uniPlatform === "web" && !/(iPhone|iPod|iPad|Android|Mobile)/i.test(
        navigator.userAgent
      );
      return isPCBrowser ? "https://www.llmking.com" : "https://m.llmking.com";
    },
    open(callback) {
      this.currentModel = common_vendor.index.getStorageSync("uni-ai-chat-llmModel");
      confirmCallback = callback;
      this.$refs.popup.open("center");
    },
    radioChange(event) {
      console.log("event", event.detail.value);
      this.currentModel = event.detail.value;
    },
    cancel() {
      this.$refs.popup.close();
    },
    confirm() {
      confirmCallback(this.currentModel);
      this.$refs.popup.close();
    }
  }
};
if (!Array) {
  const _easycom_uni_popup2 = common_vendor.resolveComponent("uni-popup");
  _easycom_uni_popup2();
}
const _easycom_uni_popup = () => "../../uni_modules/uni-popup/components/uni-popup/uni-popup.js";
if (!Math) {
  _easycom_uni_popup();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.models, (item, index, i0) => {
      return {
        a: item.value,
        b: $data.currentModel === item.value,
        c: common_vendor.t(item.name),
        d: item.value
      };
    }),
    b: common_vendor.o((...args) => $options.radioChange && $options.radioChange(...args)),
    c: common_vendor.o((...args) => $options.cancel && $options.cancel(...args)),
    d: common_vendor.o((...args) => $options.confirm && $options.confirm(...args)),
    e: common_vendor.sr("popup", "582d800b-0"),
    f: common_vendor.p({
      type: "top"
    })
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
