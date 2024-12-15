<template>
	<view class="container">
		<!-- #ifdef H5 -->
		<view v-if="isWidescreen" class="header">大模王</view>
		<!-- #endif -->
		<view class="noData" v-if="msgList.length === 0">欢迎使用大模王</view>
		<view class="noData" v-if="msgList.length === 0">右下角菜单可以切换大模型</view>
		<scroll-view :scroll-into-view="scrollIntoView" scroll-y="true" class="msg-list" :enable-flex="true">
			<uni-ai-msg ref="msg" v-for="(msg,index) in msgList" :key="index" :msg="msg" @changeAnswer="changeAnswer"
				:show-cursor="index == msgList.length - 1 && msgList.length%2 === 0 && sseIndex"
				:isLastMsg="index == msgList.length - 1" @removeMsg="removeMsg(index)"></uni-ai-msg>
			<template v-if="msgList.length%2 !== 0">
				<view v-if="requestState == -100" class="retries-box">
					<text>消息发送失败</text>
					<uni-icons @click="send" color="#d22" type="refresh-filled" class="retries-icon"></uni-icons>
				</view>
				<view class="tip-ai-ing" v-else-if="msgList.length">
					<text>大模王生成中...</text>
				</view>
			</template>
			<view v-if="adpid" class="open-ad-btn-box">
				<text style="color: red;">
					默认不启用广告组件(被注释)，如需使用，请"去掉注释"(“重新运行”后生效)
					位置：/pages/chat/chat.vue 第30行，或全局搜索 uni-ad-rewarded-video
				</text>
				<!-- <uni-ad-rewarded-video v-show="insufficientScore" :adpid="adpid" @onAdClose="onAdClose"></uni-ad-rewarded-video> -->
			</view>
			<view @click="closeOutput" class="stop-responding" v-if="sseIndex"> ▣ 停止生成</view>
			<view id="last-msg-item" style="height: 1px;"></view>
		</scroll-view>

		<view class="foot-box" :style="{'padding-bottom':footBoxPaddingBottom}">
			<!-- #ifdef H5 -->
			<view class="pc-menu" v-if="isWidescreen">
				<view class="pc-trash pc-menu-item" @click="clearAllMsg" title="删除">
					<uni-icons type="trash" size="24"></uni-icons>
				</view>
				<view class="settings pc-menu-item" @click="setLLMmodel" title="设置">
					<uni-icons color="#555" size="20px" type="bars"></uni-icons>
				</view>
			</view>
			<!-- #endif -->
			<view class="foot-box-content">
				<view v-if="!isWidescreen" class="menu">
					<uni-icons class="menu-item" @click="clearAllMsg" type="trash" size="24" color="#888"></uni-icons>
					<uni-icons class="menu-item" @click="setLLMmodel" color="#555" size="20px" type="bars"></uni-icons>
				</view>
				<view class="textarea-box">
					<textarea v-model="content" :cursor-spacing="15" class="textarea" :auto-height="!isWidescreen"
						placeholder="请输入要发给大模王的内容" :maxlength="-1" :adjust-position="false"
						:disable-default-padding="false" placeholder-class="input-placeholder"></textarea>
				</view>
				<view class="send-btn-box" :title="(msgList.length && msgList.length%2 !== 0) ? 'ai正在回复中不能发送':''">
					<!-- #ifdef H5 -->
					<text v-if="isWidescreen" class="send-btn-tip">↵ 发送 / shift + ↵ 换行</text>
					<!-- #endif -->
					<!-- <button @click="beforeSend" :disabled="inputBoxDisabled || !content" class="send"
						type="primary">发送</button> -->
					<!-- 使用 uni-icons 组件来创建图标按钮 -->
					<view @click="beforeSend" :class="{'send': true, 'disabled': inputBoxDisabled || !content}"
						class="icon-send">
						<uni-icons v-if="inputBoxDisabled || !content" color="#ccc" type="paperplane"
							size="24"></uni-icons>
						<uni-icons v-else color="#ff5100" type="paperplane-filled" size="24"></uni-icons>
					</view>
				</view>
			</view>
		</view>
		<llm-config ref="llm-config"></llm-config>
	</view>
</template>

<script>
	import OpenAI from 'openai';
	// 引入配置文件
	import config from '@/config.js';

	// 导入 将多个字消息文本，分割成单个字 分批插入到最末尾的消息中 的类
	import SliceMsgToLastMsg from './SliceMsgToLastMsg.js';


	// 获取广告id
	const {
		adpid
	} = config
	// 初始化sse通道
	let sseChannel = false;

	// 键盘的shift键是否被按下
	let shiftKeyPressed = false

	export default {
		data() {
			return {
				// 使聊天窗口滚动到指定元素id的值
				scrollIntoView: "",
				// 消息列表数据
				msgList: [],
				// 通讯请求状态
				requestState: 0, //0发送中 100发送成功 -100发送失败
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
				llmModel: 'glm-4-flash',
				keyboardHeight: 0,
				responseText: '',
				userInput: '',
				messages: [{
						"role": "system",
						"content": "You are a helpful assistant."
					},
					{
						"role": "user",
						"content": "你是谁"
					}
				],
				shouldStopStream: false // 新增用于控制流停止的标志变量
			}
		},
		computed: {
			// 输入框是否禁用
			inputBoxDisabled() {
				// 如果正在等待流式响应，则禁用输入框
				if (this.sseIndex !== 0) {
					return true
				}
				// 如果消息列表长度为奇数，则禁用输入框
				return !!(this.msgList.length && this.msgList.length % 2 !== 0)
			},
			// 获取当前环境
			NODE_ENV() {
				return process.env.NODE_ENV
			},
			footBoxPaddingBottom() {
				return (this.keyboardHeight || 10) + 'px'
			}
		},
		// 监听msgList变化，将其存储到本地缓存中
		watch: {
			msgList: {
				handler(msgList) {
					// 将msgList存储到本地缓存中
					uni.setStorage({
						"key": "uni-ai-msg",
						"data": msgList
					})
				},
				// 深度监听msgList变化
				deep: true
			},
			insufficientScore(insufficientScore) {
				uni.setStorage({
					"key": "uni-ai-chat-insufficientScore",
					"data": insufficientScore
				})
			},
			llmModel(llmModel) {
				let title = '大模王'
				if (llmModel) {
					title += ` (${llmModel})`
				}
				// uni.setNavigationBarTitle({title})
				// #ifdef H5
				if (this.isWidescreen) {
					document.querySelector('.header').innerText = title
				}
				// #endif
				uni.setStorage({
					key: 'uni-ai-chat-llmModel',
					data: llmModel
				})
			}
		},
		beforeMount() {
			// #ifdef H5
			// 监听屏幕宽度变化，判断是否为宽屏 并设置isWidescreen的值
			uni.createMediaQueryObserver(this).observe({
				minWidth: 650,
			}, matches => {
				this.isWidescreen = matches;
			})
			// #endif
		},
		async mounted() {
			// 如果存在广告位id且用户token未过期
			if (this.adpid && uniCloud.getCurrentUserInfo().tokenExpired > Date.now()) {
				// 查询当前用户的积分
				// 获取数据库对象
				let db = uniCloud.databaseForJQL();
				// 获取uni-id-users集合
				let res = await db.collection("uni-id-users")
					// 查询条件
					.where({
						// 当前用户id
						"_id": uniCloud.getCurrentUserInfo().uid
					})
					// 返回score字段
					.field('score')
					// 执行查询
					.get()
				// 输出当前用户积分
				console.log('当前用户有多少积分:', res.data[0] && res.data[0].score);
			}

			// for (let i = 0; i < 15; i++) {
			// 	this.msgList.push({
			// 		isAi: i % 2 == true,
			// 		content: "1-" + i
			// 	})
			// }

			// 获得历史对话记录
			this.msgList = uni.getStorageSync('uni-ai-msg') || [];

			// 获得之前设置的llmModel
			if (uni.getStorageSync('uni-ai-chat-llmModel')) {
				this.llmModel = uni.getStorageSync('uni-ai-chat-llmModel')
			} 
			// this.llmModel = uni.getStorageSync('uni-ai-chat-llmModel')

			// 获得之前设置的uni-ai-chat-insufficientScore
			this.insufficientScore = uni.getStorageSync('uni-ai-chat-insufficientScore') || false

			// 如果上一次对话中 最后一条消息ai未回复。则一启动就自动重发。
			let length = this.msgList.length
			if (length) {
				let lastMsg = this.msgList[length - 1]
				if (!lastMsg.isAi) {
					this.send()
				}
			}

			// this.msgList.pop()
			// console.log('this.msgList', this.msgList);

			// 在dom渲染完毕后 使聊天窗口滚动到最后一条消息
			this.$nextTick(() => {
				this.showLastMsg()
			})

			// #ifdef H5
			//获得消息输入框对象
			let adjunctKeydown = false
			const textareaDom = document.querySelector('.textarea-box textarea');
			if (textareaDom) {
				//键盘按下时
				textareaDom.onkeydown = e => {
					// console.log('onkeydown', e.keyCode)
					if ([16, 17, 18, 93].includes(e.keyCode)) {
						//按下了shift ctrl alt windows键
						adjunctKeydown = true;
					}
					if (e.keyCode == 13 && !adjunctKeydown) {
						e.preventDefault()
						// 执行发送
						setTimeout(() => {
							this.beforeSend();
						}, 300)
					}
				};
				textareaDom.onkeyup = e => {
					//松开adjunct键
					if ([16, 17, 18, 93].includes(e.keyCode)) {
						adjunctKeydown = false;
					}
				};

				// 可视窗口高
				let initialInnerHeight = window.innerHeight;
				if (uni.getSystemInfoSync().platform == "ios") {
					textareaDom.addEventListener('focus', () => {
						let interval = setInterval(function() {
							if (window.innerHeight !== initialInnerHeight) {
								clearInterval(interval)
								// 触发相应的回调函数
								document.querySelector('.container').style.height = window
									.innerHeight + 'px'
								window.scrollTo(0, 0);
								this.showLastMsg()
							}
						}, 1);
					})
					textareaDom.addEventListener('blur', () => {
						document.querySelector('.container').style.height = initialInnerHeight + 'px'
					})
				} else {
					window.addEventListener('resize', (e) => {
						this.showLastMsg()
					})
				}
			}
			// #endif

			// #ifndef H5
			uni.onKeyboardHeightChange(e => {
				this.keyboardHeight = e.height
				// 在dom渲染完毕后 使聊天窗口滚动到最后一条消息
				this.$nextTick(() => {
					this.showLastMsg()
				})
			})
			// #endif
		},
		methods: {
			setLLMmodel() {
				this.$refs['llm-config'].open(model => {
					console.log('model', model);
					this.llmModel = model
				})
			},
			async sendChatRequest(send_message) {
				try {
					// const env = uni.getEnvConfig();
					console.log(process.env)
					const openai = new OpenAI({
						apiKey: process.env.OPENAI_API_KEY,
						baseURL: 'http://localhost:3000/v1',
						dangerouslyAllowBrowser: true
					});
					this.shouldStopStream = false; // 重置标志变量为false，以便可以接收新的流数据

					// this.messages[1].content = this.userInput;
					const stream = await openai.chat.completions.create({
						model: this.llmModel,
						messages: send_message,
						prompt: "请回答",
						stream: true
					});
					// try {
						//todo 这是生成的，好像是对的
						if(this.sseIndex === 0){
							this.responseText = '';
							
							let ai_result = {
								content: '',
								isAi: true
							};
							this.msgList.push(ai_result);
						}

						// console.log('stream', stream);
						for await (const part of stream.iterator()) {
							if (this.shouldStopStream) { // 检查标志变量，若为true则跳出循环
								break;
							}
							this.sseIndex++;
							if (part.choices[0].delta.content) {
								// console.log(part.choices[0].delta.content)
								this.responseText += part.choices[0].delta.content;
								this.updateLastMsg({
									content: this.responseText,
									isAi: true
								}, true);
								this.showLastMsg();
								// ai_result.content += part.choices[0].delta.content;
							}
						}
						this.sseIndex = 0;
						this.requestState = 100;
					// } catch (error) {
					// 	console.error("调用OpenAI API出现错误: ", error);
					// }
				} catch (error) {
					this.sseIndex = 0;
					this.requestState = -100;
					// todo 报异常的时候是否弹出
					console.error("出现错误: ", error);
				}
			},
			closeOutput() {
				this.sseIndex = 0;
				this.shouldStopStream = true; // 设置标志变量为true，以停止流数据接收
				// this.responseText = '';
			},
			// 更新最后一条消息
			updateLastMsg(param) {
				let length = this.msgList.length
				if (length === 0) {
					return
				}
				let lastMsg = this.msgList[length - 1]

				// 如果param是函数，则将最后一条消息作为参数传入该函数
				if (typeof param == 'function') {
					let callback = param;
					callback(lastMsg)
				} else {
					// 否则，将参数解构为data和cover两个变量
					const [data, cover = false] = arguments
					if (cover) {
						lastMsg = data
					} else {
						lastMsg = Object.assign(lastMsg, data)
					}
				}
				this.msgList.splice(length - 1, 1, lastMsg)
			},
			// 广告关闭事件
			onAdClose(e) {
				console.log('onAdClose e.detail.isEnded', e.detail.isEnded);
				if (e.detail.isEnded) {
					//5次轮训查结果
					let i = 0;
					uni.showLoading({
						mask: true
					})
					let myIntive = setInterval(async e => {
						i++;
						// 获取云数据库实例
						const db = uniCloud.database();
						// 获取uni-id-users集合
						let res = await db.collection("uni-id-users")
							// 查询条件为_id等于当前用户id
							.where('"_id" == $cloudEnv_uid')
							// 只返回score字段
							.field('score')
							// 执行查询
							.get()
						// 解构出score字段的值，如果没有则默认为undefined
						let {
							score
						} = res.result.data[0] || {}
						console.log('score', score);
						if (score > 0 || i > 5) {
							// 清除轮询定时器
							clearInterval(myIntive)
							// 隐藏加载提示
							uni.hideLoading()
							if (score > 0) {
								this.insufficientScore = false
								// 移除最后一条消息
								this.msgList.pop()
								this.$nextTick(() => {
									// 重发消息
									this.send()
									uni.showToast({
										title: '积分余额:' + score,
										icon: 'none'
									});
								})
							}
						}
					}, 2000);
				}
			},
			// 换一个答案
			async changeAnswer() {
				// 如果问题还在回答中需要先关闭
				//删除旧的回答
				this.msgList.pop()
				this.updateLastMsg({
					// 防止 偶发答案涉及敏感，重复回答时。提问内容 被卡掉无法重新问
					illegal: false
				})
				// 多设备登录时其他设备看广告后点击重新回答，insufficientScore应当设置为 false
				// this.insufficientScore = false
				this.send()
			},
			removeMsg(index) {
				// 成对删除，如果点中的是 ai 回答的内容，index -= 1
				if (this.msgList[index].isAi) {
					index -= 1
				}

				// 如果删除的就是正在问的，且问题还在回答中需要先关闭
				if (this.sseIndex && index == this.msgList.length - 2) {
					// this.closeSseChannel()
				}

				this.msgList.splice(index, 2)
			},
			async beforeSend() {
				if (this.inputBoxDisabled) {
					return uni.showToast({
						title: 'ai正在回复中不能发送',
						icon: 'none'
					});
				}
				// 如果开启了广告位需要登录
				if (this.adpid) {
					// 获取本地缓存的token
					let token = uni.getStorageSync('uni_id_token')
					// 如果token不存在
					if (!token) {
						// 弹出提示框
						return uni.showModal({
							// 提示内容
							content: '启用激励视频，客户端需登录并启用安全网络',
							// 不显示取消按钮
							showCancel: false,
							// 确认按钮文本
							confirmText: "查看详情",
							// 弹框关闭后执行的回调函数
							complete() {
								// 文档链接
								let url = "https://uniapp.dcloud.net.cn/uniCloud/uni-ai-chat.html#ad"
								// #ifndef H5
								// 将文档链接复制到剪贴板
								uni.setClipboardData({
									// 复制的内容
									data: url,
									// 不显示提示框
									showToast: false,
									// 复制成功后的回调函数
									success() {
										// 弹出提示框
										uni.showToast({
											// 提示内容
											title: '已复制文档链接，请到浏览器粘贴浏览',
											// 不显示图标
											icon: 'none',
											// 提示框持续时间
											duration: 5000
										});
									}
								})
								// #endif

								// #ifdef H5
								// 在新窗口打开文档链接
								window.open(url)
								// #endif
							}
						});
					}
				}

				// 如果内容为空
				if (!this.content) {
					// 弹出提示框
					return uni.showToast({
						// 提示内容
						title: '内容不能为空',
						// 不显示图标
						icon: 'none'
					});
				}

				// 将用户输入的消息添加到消息列表中
				this.msgList.push({
					// 标记为非人工智能机器人，即：为用户发送的消息
					isAi: false,
					// 消息内容
					content: this.content,
					// 消息创建时间
					create_time: Date.now()
				})

				// 展示最后一条消息
				this.showLastMsg()
				// dom加载完成后 清空文本内容
				this.$nextTick(() => {
					this.content = ''
				})
				this.send() // 发送消息
			},
			async send() {

				let messages = []
				// 复制一份，消息列表数据
				let msgs = JSON.parse(JSON.stringify(this.msgList))
				msgs = msgs.splice(-3)

				messages = msgs.map(item => {
					// 角色默认为用户
					let role = "user"
					// 如果是ai再根据 是否有总结 来设置角色为 system 还是 assistant
					if (item.isAi) {
						role = item.summarize ? 'system' : 'assistant'
					}
					return {
						content: item.content,
						role
					}
				})

				// 在控制台输出 向ai机器人发送的完整消息内容
				// console.log('send to ai messages:', messages);
				this.sendChatRequest(messages);

			},
			// 滚动窗口以显示最新的一条消息
			showLastMsg() {
				// 等待DOM更新
				this.$nextTick(() => {
					// 将scrollIntoView属性设置为"last-msg-item"，以便滚动窗口到最后一条消息
					this.scrollIntoView = "last-msg-item"
					// 等待DOM更新，即：滚动完成
					this.$nextTick(() => {
						// 将scrollIntoView属性设置为空，以便下次设置滚动条位置可被监听
						this.scrollIntoView = ""
					})
				})
			},
			// 清空消息列表
			clearAllMsg(e) {
				// 弹出确认清空聊天记录的提示框
				uni.showModal({
					title: "确认要清空聊天记录？",
					content: '本操作不可撤销',
					complete: (e) => {
						// 如果用户确认清空聊天记录
						if (e.confirm) {
							// 将消息列表清空 
							this.msgList.splice(0, this.msgList.length);
						}
					}
				});
			}
		}
	}
</script>

<style lang="scss">
	/* #ifdef VUE3 && APP-PLUS */
	@import "@/components/uni-ai-msg/uni-ai-msg.scss";
	/* #endif */

	/* #ifndef APP-NVUE */
	page,
	/* #ifdef H5 */
	.container *,
	/* #endif */
	view,
	textarea,
	button {
		display: flex;
		box-sizing: border-box;
	}

	page {
		height: 100%;
		width: 100%;
	}

	/* #endif */

	.stop-responding {
		font-size: 14px;
		border-radius: 3px;
		margin-bottom: 15px;
		background-color: #f0b00a;
		color: #FFF;
		width: 90px;
		height: 30px;
		line-height: 30px;
		margin: 0 auto;
		justify-content: center;
		margin-bottom: 15px;
		/* #ifdef H5 */
		cursor: pointer;
		/* #endif */
	}

	.stop-responding:hover {
		box-shadow: 0 0 10px #aaa;
	}

	.container {
		height: 100%;
		background-color: #FAFAFA;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		// border: 1px solid blue;
	}

	.foot-box {
		width: 750rpx;
		display: flex;
		flex-direction: column;
		padding: 10px 0px;
		background-color: #FFF;
	}

	.foot-box-content {
		justify-content: space-around;
	}

	.textarea-box {
		padding: 8px 10px;
		background-color: #f9f9f9;
		border-radius: 5px;
	}

	.textarea-box .textarea {
		max-height: 120px;
		font-size: 14px;
		/* #ifndef APP-NVUE */
		overflow: auto;
		/* #endif */
		width: 450rpx;
		font-size: 14px;
	}

	/* #ifdef H5 */
	/*隐藏滚动条*/
	.textarea-box .textarea::-webkit-scrollbar {
		width: 0;
	}

	/* #endif */

	.input-placeholder {
		color: #bbb;
		line-height: 18px;
	}

	.trash,
	.send {
		width: 50px;
		height: 30px;
		justify-content: center;
		align-items: center;
		flex-shrink: 0;
	}

	.trash {
		width: 30rpx;
		margin-left: 10rpx;
	}

	.menu {
		justify-content: center;
		align-items: center;
		flex-shrink: 0;
	}

	.menu-item {
		width: 30rpx;
		margin: 0 10rpx;
	}

	.send {
		color: #FFF;
		border-radius: 4px;
		display: flex;
		margin: 0;
		padding: 0;
		font-size: 14px;
		margin-right: 20rpx;
	}

	/* #ifndef APP-NVUE */
	.send::after {
		display: none;
	}

	/* #endif */


	.msg-list {
		height: 0; //不可省略，先设置为0 再由flex: 1;撑开才是一个滚动容器
		flex: 1;
		width: 750rpx;
		// border: 1px solid red;
	}

	.noData {
		margin-top: 15px;
		text-align: center;
		width: 750rpx;
		color: #aaa;
		font-size: 14px;
		justify-content: center;
	}

	.open-ad-btn-box {
		justify-content: center;
		margin: 10px 0;
	}

	.tip-ai-ing {
		align-items: center;
		flex-direction: column;
		font-size: 14px;
		color: #919396;
		padding: 15px 0;
	}

	.uni-link {
		margin-left: 5px;
		line-height: 20px;
	}

	/* #ifdef H5 */
	@media screen and (min-width:650px) {
		.foot-box {
			border-top: solid 1px #dde0e2;
		}

		.container,
		.container * {
			max-width: 950px;
		}

		.container {
			box-shadow: 0 0 5px #e0e1e7;
			height: calc(100vh - 44px);
			margin: 22px auto;
			border-radius: 10px;
			overflow: hidden;
			background-color: #FAFAFA;
		}

		page {
			background-color: #efefef;
		}

		.container .header {
			height: 44px;
			line-height: 44px;
			color: #ff5100;
			border-bottom: 1px solid #F0F0F0;
			width: 100vw;
			justify-content: center;
			font-weight: 900;
		}

		.content {
			background-color: #f9f9f9;
			position: relative;
			max-width: 90%;
		}

		// .copy {
		// 	color: #888888;
		// 	position: absolute;
		// 	right: 8px;
		// 	top: 8px;
		// 	font-size: 12px;
		// 	cursor:pointer;
		// }
		// .copy :hover{
		// 	color: #4b9e5f;
		// }

		.foot-box,
		.foot-box-content,
		.msg-list,
		.msg-item,
		// .create_time,
		.noData,
		.textarea-box,
		.textarea,
		textarea-box {
			width: 100% !important;
		}

		.textarea-box,
		.textarea,
		textarea,
		textarea-box {
			height: 120px;
		}

		.foot-box,
		.textarea-box {
			background-color: #FFF;
		}

		.foot-box-content {
			flex-direction: column;
			justify-content: center;
			align-items: flex-end;
			padding-bottom: 0;
		}

		.pc-menu {
			padding: 0 10px;
		}

		.pc-menu-item {
			height: 20px;
			justify-content: center;
			align-items: center;
			align-content: center;
			display: flex;
			margin-right: 10px;
			cursor: pointer;
		}

		.pc-trash {
			opacity: 0.8;
		}

		.pc-trash image {
			height: 15px;
		}


		.textarea-box,
		.textarea-box * {
			// border: 1px solid #000;
		}

		.send-btn-box .send-btn-tip {
			color: #919396;
			margin-right: 8px;
			font-size: 12px;
			line-height: 28px;
		}
	}

	/* #endif */
	.retries-box {
		justify-content: center;
		align-items: center;
		font-size: 12px;
		color: #d2071b;
	}

	.retries-icon {
		margin-top: 1px;
		margin-left: 5px;
	}
</style>