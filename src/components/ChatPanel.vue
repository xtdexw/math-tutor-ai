<template>
  <div class="chat-panel">
    <div class="chat-header">
      <h3>对话记录</h3>
      <button @click="clearHistory" class="clear-btn">清空</button>
    </div>

    <div ref="messagesContainer" class="messages-container">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message"
        :class="`message-${msg.role}`"
      >
        <div class="message-avatar">
          <span v-if="msg.role === 'user'">👤</span>
          <span v-else>👨‍🏫</span>
        </div>
        <div class="message-content">
          <div class="message-text">{{ msg.content }}</div>
          <div class="message-time">{{ formatTime(msg.time) }}</div>
        </div>
      </div>

      <div v-if="isThinking" class="message message-assistant">
        <div class="message-avatar">👨‍🏫</div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <div v-if="currentResponse" class="message message-assistant streaming">
        <div class="message-avatar">👨‍🏫</div>
        <div class="message-content">
          <div class="message-text">{{ currentResponse }}</div>
        </div>
      </div>
    </div>

    <div class="input-area">
      <textarea
        v-model="inputText"
        @keydown.enter.exact.prevent="sendMessage"
        @keydown.enter.shift.exact="inputText += '\n'"
        placeholder="输入你的数学问题，按 Enter 发送..."
        class="chat-input"
        rows="3"
        :disabled="isProcessing"
      ></textarea>
      <button
        @click="sendMessage"
        :disabled="!inputText.trim() || isProcessing"
        class="send-btn"
      >
        {{ isProcessing ? '思考中...' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, nextTick, onMounted, onUnmounted } from 'vue'
import DialogueService from '../services/DialogueService.js'

// 注入全局消息状态
const messages = inject('chatMessages')
const addMessage = inject('addMessage')

const inputText = ref('')
const isProcessing = ref(false)
const isThinking = ref(false)
const currentResponse = ref('')
const messagesContainer = ref(null)

// 格式化时间
const formatTime = (time) => {
  const date = new Date(time)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 发送消息
const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || isProcessing.value) return

  // 添加用户消息
  addMessage('user', text)

  inputText.value = ''
  isProcessing.value = true
  isThinking.value = true
  currentResponse.value = ''
  scrollToBottom()

  await DialogueService.handleUserInput(text, {
    onListening: () => {
      // 倾听状态
    },
    onThinking: () => {
      isThinking.value = true
      scrollToBottom()
    },
    onResponding: (content) => {
      isThinking.value = false
      currentResponse.value += content
      scrollToBottom()
    },
    onDone: ({ content }) => {
      // 添加完整回复到消息列表
      addMessage('assistant', content)

      isProcessing.value = false
      isThinking.value = false
      currentResponse.value = ''
      scrollToBottom()
    },
    onError: (error) => {
      addMessage('assistant', '抱歉，我遇到了一些问题：' + error.message)

      isProcessing.value = false
      isThinking.value = false
      currentResponse.value = ''
      scrollToBottom()
    }
  })
}

// 清空历史
const clearHistory = () => {
  if (confirm('确定要清空对话记录吗？')) {
    messages.value = []
  }
}

onMounted(() => {
  // 添加欢迎消息
  addMessage('assistant', '你好！我是星云老师，有什么数学问题可以帮你解答吗？')
})

onUnmounted(() => {
  // 取消正在进行的对话
  if (isProcessing.value) {
    DialogueService.cancel()
  }
})
</script>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  flex: 1;  /* 平分可用空间 */
  min-height: 0;  /* 允许flex子元素缩小 */
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.chat-header h3 {
  font-size: 16px;
  font-weight: 600;
}

.clear-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.3s;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8fafc;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-content {
  flex: 1;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-user .message-text {
  background: #667eea;
  color: white;
  border-bottom-right-radius: 4px;
}

.message-assistant .message-text {
  background: white;
  color: #1a202c;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.message.streaming .message-text {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.message-time {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
  padding: 0 4px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  width: fit-content;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #cbd5e0;
  animation: typing 1.4s ease-in-out infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.input-area {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.chat-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  font-family: inherit;
}

.chat-input:focus {
  outline: none;
  border-color: #667eea;
}

.chat-input:disabled {
  background: #f8fafc;
  cursor: not-allowed;
}

.send-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
