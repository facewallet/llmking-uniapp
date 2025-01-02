"use strict";
const common_vendor = require("../../common/vendor.js");
const config = require("../../config.js");
const {
  adpid
} = config.config;
const _sfc_main = {
  data() {
    return {
      // 使聊天窗口滚动到指定元素id的值
      scrollIntoView: "",
      // 消息列表数据
      msgList: [],
      // 通讯请求状态
      requestState: 0,
      //0发送中 100发送成功 -100发送失败
      // 本地对话是否因积分不足而终止
      insufficientScore: false,
      // 输入框的消息内容
      content: "",
      // 记录流式响应次数
      sseIndex: 0,
      // 是否启用流式响应模式
      enableStream: true,
      // 当前屏幕是否为宽屏
      isWidescreen: false,
      // 广告位id
      adpid,
      llmModel: "glm-4-flash",
      keyboardHeight: 0,
      responseText: "",
      userInput: "",
      messages: [
        {
          "role": "system",
          "content": "You are a helpful assistant."
        },
        {
          "role": "user",
          "content": "你是谁"
        }
      ],
      shouldStopStream: false
      // 新增用于控制流停止的标志变量
    };
  },
  computed: {
    // 输入框是否禁用
    inputBoxDisabled() {
      if (this.sseIndex !== 0) {
        return true;
      }
      return !!(this.msgList.length && this.msgList.length % 2 !== 0);
    },
    // 获取当前环境
    NODE_ENV() {
      return "development";
    },
    footBoxPaddingBottom() {
      return (this.keyboardHeight || 10) + "px";
    }
  },
  // 监听msgList变化，将其存储到本地缓存中
  watch: {
    msgList: {
      handler(msgList) {
        common_vendor.index.setStorage({
          "key": "uni-ai-msg",
          "data": msgList
        });
      },
      // 深度监听msgList变化
      deep: true
    },
    insufficientScore(insufficientScore) {
      common_vendor.index.setStorage({
        "key": "uni-ai-chat-insufficientScore",
        "data": insufficientScore
      });
    },
    llmModel(llmModel) {
      common_vendor.index.setStorageSync({
        key: "uni-ai-chat-llmModel",
        data: llmModel
      });
    }
  },
  beforeMount() {
  },
  async mounted() {
    if (this.adpid && common_vendor.Zs.getCurrentUserInfo().tokenExpired > Date.now()) {
      let db = common_vendor.Zs.databaseForJQL();
      let res = await db.collection("uni-id-users").where({
        // 当前用户id
        "_id": common_vendor.Zs.getCurrentUserInfo().uid
      }).field("score").get();
      console.log("当前用户有多少积分:", res.data[0] && res.data[0].score);
    }
    this.msgList = common_vendor.index.getStorageSync("uni-ai-msg") || [];
    if (common_vendor.index.getStorageSync("uni-ai-chat-llmModel")) {
      this.llmModel = common_vendor.index.getStorageSync("uni-ai-chat-llmModel");
    }
    this.insufficientScore = common_vendor.index.getStorageSync("uni-ai-chat-insufficientScore") || false;
    let length = this.msgList.length;
    if (length) {
      let lastMsg = this.msgList[length - 1];
      if (!lastMsg.isAi) {
        this.send();
      }
    }
    this.$nextTick(() => {
      this.showLastMsg();
    });
    common_vendor.index.onKeyboardHeightChange((e) => {
      this.keyboardHeight = e.height;
      this.$nextTick(() => {
        this.showLastMsg();
      });
    });
  },
  methods: {
    getHttpHost() {
      const systemInfo = common_vendor.index.getSystemInfoSync();
      const isPCBrowser = systemInfo.uniPlatform === "web" && !/(iPhone|iPod|iPad|Android|Mobile)/i.test(
        navigator.userAgent
      );
      return isPCBrowser ? "https://www.llmking.com" : "https://m.llmking.com";
    },
    setLLMmodel() {
      this.$refs["llm-config"].open((model) => {
        console.log("model", model);
        this.llmModel = model;
        common_vendor.index.setStorageSync({
          key: "uni-ai-chat-llmModel",
          data: this.llmModel
        });
      });
    },
    async sendChatRequestOpenAI(send_message) {
      try {
        const APIKEY = common_vendor.index.getStorageSync("APIKEY");
        console.log("APIKEY", APIKEY);
        const openai = new common_vendor.OpenAI({
          apiKey: APIKEY,
          // todo 要改 baseURL: 'http://localhost:8086/api/pub',
          // baseURL: 'http://localhost:3000/v1',
          baseURL: this.getHttpHost() + "/v1",
          dangerouslyAllowBrowser: true
        });
        this.shouldStopStream = false;
        this.llmModel = common_vendor.index.getStorageSync("uni-ai-chat-llmModel");
        const stream = await openai.chat.completions.create({
          model: this.llmModel,
          messages: send_message,
          prompt: "请回答",
          stream: true
        });
        this.responseText = "";
        let ai_result = {
          content: "",
          isAi: true
        };
        this.msgList.push(ai_result);
        console.log("stream", stream);
        for await (const part of stream.iterator()) {
          if (this.shouldStopStream) {
            break;
          }
          this.sseIndex++;
          if (part.choices[0].delta.content) {
            console.log(part.choices[0].delta.content);
            this.responseText += part.choices[0].delta.content;
            console.log(this.responseText);
            this.updateLastMsg({
              content: this.responseText,
              isAi: true
            }, true);
            this.showLastMsg();
          }
        }
        this.sseIndex = 0;
        this.requestState = 100;
      } catch (error) {
        this.sseIndex = 0;
        this.requestState = -100;
        console.error("出现错误: ", error);
      }
    },
    async sendChatRequestUniapp(send_message) {
      try {
        const APIKEY = common_vendor.index.getStorageSync("APIKEY");
        this.responseText = "";
        let ai_result = {
          content: "",
          isAi: true
        };
        this.msgList.push(ai_result);
        const url = `${this.getHttpHost()}/v1/chat/completions`;
        const headers = {
          "Authorization": `Bearer ${APIKEY}`,
          "Content-Type": "application/json",
          "Accept": "text/event-stream"
        };
        const data = {
          model: "glm-4-flash",
          messages: send_message,
          prompt: "请回答",
          stream: true
        };
        const response = await this.uniFetch(url, {
          method: "POST",
          headers,
          data: JSON.stringify(data)
        });
        if (response.statusCode === 200) {
          this.startPolling(url, headers);
        } else {
          throw new Error("Failed to fetch data from OpenAI API");
        }
      } catch (error) {
        console.error("出现错误: ", error);
      }
    },
    uniFetch(url, options) {
      return new Promise((resolve, reject) => {
        console.log(options);
        common_vendor.index.request({
          url,
          method: "POST",
          header: options.headers,
          data: options.data,
          success: (res) => {
            resolve(res);
          },
          fail: (err) => {
            reject(err);
          }
        });
      });
    },
    startPolling(url, headers) {
      this.pollInterval = setInterval(async () => {
        const response = await this.uniFetch(url, {
          method: "POST",
          header: headers
        });
        if (response.statusCode === 200) {
          this.handlePollingResponse(response.data);
        } else {
          clearInterval(this.pollInterval);
          throw new Error("Failed to fetch data from OpenAI API");
        }
      }, 1e3);
    },
    handlePollingResponse(data) {
      const dataArray = data.trim().split("\n\n");
      dataArray.forEach((item) => {
        if (!item.includes("data: [DONE]")) {
          const dataObject = JSON.parse(item.replace("data:", ""));
          this.handleSingleData(dataObject);
        } else {
          clearInterval(this.pollInterval);
        }
      });
    },
    handleSingleData(singleData) {
      if (singleData.choices && singleData.choices[0].delta && singleData.choices[0].delta.content) {
        this.responseText += singleData.choices[0].delta.content;
        this.updateLastMsg({
          content: this.responseText,
          isAi: true
        }, true);
      }
    },
    closeOutput() {
      this.sseIndex = 0;
      this.shouldStopStream = true;
    },
    // 更新最后一条消息
    updateLastMsg(param) {
      let length = this.msgList.length;
      if (length === 0) {
        return;
      }
      let lastMsg = this.msgList[length - 1];
      if (typeof param == "function") {
        let callback = param;
        callback(lastMsg);
      } else {
        const [data, cover = false] = arguments;
        if (cover) {
          lastMsg = data;
        } else {
          lastMsg = Object.assign(lastMsg, data);
        }
      }
      this.msgList.splice(length - 1, 1, lastMsg);
    },
    // 广告关闭事件
    onAdClose(e) {
      console.log("onAdClose e.detail.isEnded", e.detail.isEnded);
      if (e.detail.isEnded) {
        let i = 0;
        common_vendor.index.showLoading({
          mask: true
        });
        let myIntive = setInterval(async (e2) => {
          i++;
          const db = common_vendor.Zs.database();
          let res = await db.collection("uni-id-users").where('"_id" == $cloudEnv_uid').field("score").get();
          let {
            score
          } = res.result.data[0] || {};
          console.log("score", score);
          if (score > 0 || i > 5) {
            clearInterval(myIntive);
            common_vendor.index.hideLoading();
            if (score > 0) {
              this.insufficientScore = false;
              this.msgList.pop();
              this.$nextTick(() => {
                this.send();
                common_vendor.index.showToast({
                  title: "积分余额:" + score,
                  icon: "none"
                });
              });
            }
          }
        }, 2e3);
      }
    },
    // 换一个答案
    async changeAnswer() {
      this.msgList.pop();
      this.updateLastMsg({
        // 防止 偶发答案涉及敏感，重复回答时。提问内容 被卡掉无法重新问
        illegal: false
      });
      this.send();
    },
    removeMsg(index) {
      if (this.msgList[index].isAi) {
        index -= 1;
      }
      if (this.sseIndex && index == this.msgList.length - 2)
        ;
      this.msgList.splice(index, 2);
    },
    async beforeSend() {
      if (this.inputBoxDisabled) {
        return common_vendor.index.showToast({
          title: "ai正在回复中不能发送",
          icon: "none"
        });
      }
      if (this.adpid) {
        let token = common_vendor.index.getStorageSync("uni_id_token");
        if (!token) {
          return common_vendor.index.showModal({
            // 提示内容
            content: "启用激励视频，客户端需登录并启用安全网络",
            // 不显示取消按钮
            showCancel: false,
            // 确认按钮文本
            confirmText: "查看详情",
            // 弹框关闭后执行的回调函数
            complete() {
              let url = "https://uniapp.dcloud.net.cn/uniCloud/uni-ai-chat.html#ad";
              common_vendor.index.setClipboardData({
                // 复制的内容
                data: url,
                // 不显示提示框
                showToast: false,
                // 复制成功后的回调函数
                success() {
                  common_vendor.index.showToast({
                    // 提示内容
                    title: "已复制文档链接，请到浏览器粘贴浏览",
                    // 不显示图标
                    icon: "none",
                    // 提示框持续时间
                    duration: 5e3
                  });
                }
              });
            }
          });
        }
      }
      if (!this.content) {
        return common_vendor.index.showToast({
          // 提示内容
          title: "内容不能为空",
          // 不显示图标
          icon: "none"
        });
      }
      this.msgList.push({
        // 标记为非人工智能机器人，即：为用户发送的消息
        isAi: false,
        // 消息内容
        content: this.content,
        // 消息创建时间
        create_time: Date.now()
      });
      this.showLastMsg();
      this.$nextTick(() => {
        this.content = "";
      });
      this.send();
    },
    async send() {
      let messages = [];
      let msgs = JSON.parse(JSON.stringify(this.msgList));
      msgs = msgs.splice(-3);
      messages = msgs.map((item) => {
        let role = "user";
        if (item.isAi) {
          role = item.summarize ? "system" : "assistant";
        }
        return {
          content: item.content,
          role
        };
      });
      this.sendChatRequestUniapp(messages);
    },
    // 滚动窗口以显示最新的一条消息
    showLastMsg() {
      this.$nextTick(() => {
        this.scrollIntoView = "last-msg-item";
        this.$nextTick(() => {
          this.scrollIntoView = "";
        });
      });
    },
    // 清空消息列表
    clearAllMsg(e) {
      common_vendor.index.showModal({
        title: "确认要清空聊天记录？",
        content: "本操作不可撤销",
        complete: (e2) => {
          if (e2.confirm) {
            this.msgList.splice(0, this.msgList.length);
          }
        }
      });
    }
  }
};
if (!Array) {
  const _easycom_uni_ai_msg2 = common_vendor.resolveComponent("uni-ai-msg");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_llm_config2 = common_vendor.resolveComponent("llm-config");
  (_easycom_uni_ai_msg2 + _easycom_uni_icons2 + _easycom_llm_config2)();
}
const _easycom_uni_ai_msg = () => "../../components/uni-ai-msg/uni-ai-msg.js";
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_llm_config = () => "../../components/llm-config/llm-config.js";
if (!Math) {
  (_easycom_uni_ai_msg + _easycom_uni_icons + _easycom_llm_config)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.msgList.length === 0
  }, $data.msgList.length === 0 ? {} : {}, {
    b: $data.msgList.length === 0
  }, $data.msgList.length === 0 ? {} : {}, {
    c: common_vendor.f($data.msgList, (msg, index, i0) => {
      return {
        a: common_vendor.sr("msg", "1cec48c2-0-" + i0, {
          "f": 1
        }),
        b: index,
        c: common_vendor.o($options.changeAnswer, index),
        d: common_vendor.o(($event) => $options.removeMsg(index), index),
        e: "1cec48c2-0-" + i0,
        f: common_vendor.p({
          msg,
          ["show-cursor"]: index == $data.msgList.length - 1 && $data.msgList.length % 2 === 0 && $data.sseIndex,
          isLastMsg: index == $data.msgList.length - 1
        })
      };
    }),
    d: $data.msgList.length % 2 !== 0
  }, $data.msgList.length % 2 !== 0 ? common_vendor.e({
    e: $data.requestState == -100
  }, $data.requestState == -100 ? {
    f: common_vendor.o($options.send),
    g: common_vendor.p({
      color: "#d22",
      type: "refresh-filled"
    })
  } : $data.msgList.length ? {} : {}, {
    h: $data.msgList.length
  }) : {}, {
    i: $data.adpid
  }, $data.adpid ? {} : {}, {
    j: $data.sseIndex
  }, $data.sseIndex ? {
    k: common_vendor.o((...args) => $options.closeOutput && $options.closeOutput(...args))
  } : {}, {
    l: $data.scrollIntoView,
    m: !$data.isWidescreen
  }, !$data.isWidescreen ? {
    n: common_vendor.o($options.clearAllMsg),
    o: common_vendor.p({
      type: "trash",
      size: "24",
      color: "#888"
    }),
    p: common_vendor.o($options.setLLMmodel),
    q: common_vendor.p({
      color: "#555",
      size: "20px",
      type: "bars"
    })
  } : {}, {
    r: !$data.isWidescreen,
    s: -1,
    t: $data.content,
    v: common_vendor.o(($event) => $data.content = $event.detail.value),
    w: $options.inputBoxDisabled || !$data.content
  }, $options.inputBoxDisabled || !$data.content ? {
    x: common_vendor.p({
      color: "#ccc",
      type: "paperplane",
      size: "24"
    })
  } : {
    y: common_vendor.p({
      color: "#ff5100",
      type: "paperplane-filled",
      size: "24"
    })
  }, {
    z: common_vendor.o((...args) => $options.beforeSend && $options.beforeSend(...args)),
    A: $options.inputBoxDisabled || !$data.content ? 1 : "",
    B: $data.msgList.length && $data.msgList.length % 2 !== 0 ? "ai正在回复中不能发送" : "",
    C: $options.footBoxPaddingBottom,
    D: common_vendor.sr("llm-config", "1cec48c2-6")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
