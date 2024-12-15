<template>
    <view class="chat-container">
        <text>大模型返回：{{responseText}}</text>
        <input placeholder="请输入内容" v-model="userInput" />
        <button @click="sendChatRequest">发送聊天请求</button>
        <button @click="closeOutput">关闭输出</button>
    </view>
</template>

<script>
    import OpenAI from 'openai';

    export default {
        data() {
            return {
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
            };
        },
        methods: {
            async sendChatRequest() {
                const openai = new OpenAI({
                    apiKey: 'sk-jVz1OhQjCIXzZ2ft9680B015F00e4444864d8f6dA1F0771b',
                    baseURL: 'http://localhost:3000/v1',
                    dangerouslyAllowBrowser: true
                });
				this.shouldStopStream = false; // 重置标志变量为false，以便可以接收新的流数据
                try {
                    this.messages[1].content = this.userInput;
                    const stream = await openai.chat.completions.create({
                        model: "glm-4-flash",
                        messages: this.messages,
                        prompt: "请回答",
                        stream: true
                    });
                    try {
                        for await (const part of stream.iterator()) {
                            if (this.shouldStopStream) { // 检查标志变量，若为true则跳出循环
                                break;
                            }
							console.log(part)
                            if (part.choices[0].delta.content) {
								console.log(part.choices[0].delta.content)
                                this.responseText += part.choices[0].delta.content;
                            }
                        }
                    } catch (error) {
                        console.error("调用OpenAI API出现错误: ", error);
                    }
                } catch (error) {
                    console.error("出现错误: ", error);
                }
            },
            closeOutput() {
                this.shouldStopStream = true; // 设置标志变量为true，以停止流数据接收
                // this.responseText = '';
            }
        }
    };
</script>

<style scoped>
  .chat-container {
        padding: 20px;
    }

    button {
        background-color: #007aff;
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
    }
</style>