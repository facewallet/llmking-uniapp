<template>
	<uni-popup ref="popup" type="top">
		<view class="box">
			<text class="title">请选择大模型</text>
			<radio-group @change="radioChange" class="radio-group">
				<label class="item" v-for="(item, index) in models" :key="item.value">
					<radio :value="item.value" :checked="currentModel === item.value" class="radio" />
					<view class="item-title">{{item.name}}</view>
				</label>
			</radio-group>
			<view class="btn-box">
				<view @click="cancel" class="btn cancel">取消</view>
				<view @click="confirm" class="btn confirm">确认</view>
			</view>
		</view>
	</uni-popup>
</template>

<script>
	let confirmCallback = ()=>{}
	export default {
		name: "llm-config",
		data() {
			return {
				models: [
					{
						name:"GLM-4",
						value:"glm-4-flash"
					}
				],
				currentModel:''
			};
		},
		mounted() {
			this.fetchChannel()
		},
		methods: {
			fetchChannel() {
				uni.request({
					url: this.getHttpHost() + '/api/pub/llmking/channel/list',
					method: 'GET',
					header: {
					        'Cache-Control': 'no-cache' // 禁用缓存
					    },
					// url: 'http://localhost:8086/api/pub/dialogue/channel',
					success: (res) => {
						console.log(res)
						if (res.data.meta.code === 0) {
							const data = res.data.data;
							this.models = data.channelList;
						}
					},
					fail: (err) => {
						console.error(err);
					}
				});
			},
			getHttpHost() {
				// 获取系统信息
				const systemInfo = uni.getSystemInfoSync();
				// 判断是否为PC浏览器且未模拟手机
				const isPCBrowser = systemInfo.uniPlatform === 'web' && !/(iPhone|iPod|iPad|Android|Mobile)/i.test(navigator.userAgent);
					// console.log('getHttpHost')
					// console.log(systemInfo.platform)
					// console.log(systemInfo.userAgent)
				// return isPCBrowser ? 'https://www.llmking.com' : 'https://m.llmking.com';
				return 'http://localhost:8086';
			},
			open(callback){
				this.currentModel = uni.getStorageSync('uni-ai-chat-llmModel')
				confirmCallback = callback
				this.$refs.popup.open('center')
			},
			radioChange(event) {
				console.log('event',event.detail.value)
				this.currentModel = event.detail.value
			},
			cancel(){
				this.$refs.popup.close()
			},
			confirm(){
				// console.log(this.models[this.current]);
				confirmCallback(this.currentModel)
				this.$refs.popup.close()
			},
		}
	}
</script>

<style>
	/* #ifndef APP-NVUE */
	.box,
	/* #ifdef H5 */
	.box *,
	/* #endif */
	radio-group,
	label
	{
		display: flex;
		box-sizing: border-box;
	}
	/* #endif */
	.box,.title,.btn-box {
		width: 250px;
	}
	
	.box {
		background-color: #fff;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding-bottom: 0;
		border-radius: 5px;
	}
	.title {
		font-size: 16px;
		padding: 10px 0;
		padding-bottom: 5px;
		font-weight: 400;
		flex: 1;
		text-align: center;
		/* #ifndef APP-NVUE */
		display: inline-block;
		/* #endif */
	}
	.radio-group {
		flex-direction: column;
		padding: 0 15px;
	}
	.radio {
		transform: scale(0.7);
	}
	.item {
		flex-direction: row;
		margin-bottom: 5px;
		position: relative;
	}
	.item-title {
		font-size: 14px;
		color: #555;
	}
	.btn-box{
		/* #ifdef APP-NVUE */
		border-top:solid 1px #ccc;
		/* #endif */
		height: 48px;
		position: relative;
	}
	/* #ifndef APP-NVUE */
	.btn-box:after {
	    content: " ";
	    position: absolute;
	    left: 0;
	    top: 0;
	    right: 0;
	    height: 1px;
	    border-top: 1px solid #d5d5d6;
	    color: #d5d5d6;
	    transform-origin: 0 0;
	    transform: scaleY(.5);
	}
	/* #endif */
	
	.btn{
		justify-content: center;
		align-items: center;
		width: 150px;
		/* #ifdef H5 */
		cursor: pointer;
		/* #endif */
	}
	
	.confirm {
		color: #007aff;
		position: relative;
		/* #ifdef APP-NVUE */
		border-left:solid 1px #ccc;
		/* #endif */
	}
	
	/* #ifndef APP-NVUE */
	.confirm::before {
	    content: "";
	    position: absolute;
	    left: 0;
	    top: 0;
	    right: 0;
		background-color: #d5d5d6;
	    height: 48px;
		width: 1px;
	    /* border-top: 1px solid #d5d5d6; */
	    /* color: #d5d5d6; */
	    /* transform-origin: 0 0; */
	    transform: scaleX(.5);
	}
	/* #endif */
</style>