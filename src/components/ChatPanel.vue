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
          <!-- 如果消息有图片，先显示图片 -->
          <img v-if="msg.image" :src="msg.image" class="message-image" alt="上传的图片" />
          <!-- 用户消息使用简单文本，助手消息使用格式化文本 -->
          <div v-if="msg.role === 'user'" class="message-text">{{ msg.content }}</div>
          <MessageText v-else :content="msg.content" />
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
          <MessageText :content="currentResponse" />
        </div>
      </div>
    </div>

    <div class="input-area">
      <div class="input-main">
        <!-- 图片上传区域 -->
        <div class="image-upload-area">
          <div class="upload-options">
            <button @click="triggerFileUpload" :disabled="isProcessing" class="upload-btn" title="上传图片">
              📷 上传
            </button>
            <button @click="showUrlInput = !showUrlInput" :disabled="isProcessing" class="url-btn" title="输入图片链接">
              🔗 链接
            </button>
          </div>

          <!-- URL 输入框（条件显示） -->
          <div v-if="showUrlInput" class="url-input-container">
            <input
              v-model="imageUrlInput"
              @keydown.enter.exact.prevent="sendMessageWithUrl"
              placeholder="输入图片 URL..."
              class="url-input"
              :disabled="isProcessing"
            />
            <button @click="sendMessageWithUrl" :disabled="!imageUrlInput.trim() || isProcessing" class="url-confirm-btn">
              确定
            </button>
          </div>
        </div>

        <!-- 图片预览 -->
        <div v-if="imagePreview" class="image-preview-container">
          <div class="image-preview">
            <img :src="imagePreview" alt="预览" />
            <button @click="clearImage" class="clear-image-btn" :disabled="isProcessing">✕</button>
          </div>
        </div>

        <!-- 隐藏的文件输入 -->
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleFileSelect"
        />
      </div>

      <textarea
        v-model="inputText"
        @keydown.enter.exact.prevent="sendMessage"
        @keydown.enter.shift.exact="inputText += '\n'"
        :placeholder="imagePreview ? '请描述图片中的问题，按 Enter 发送...' : '输入你的数学问题，按 Enter 发送...'"
        class="chat-input"
        rows="3"
        :disabled="isProcessing"
      ></textarea>
      <button
        @click="sendMessage"
        :disabled="(!inputText.trim() && !imagePreview) || isProcessing"
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
import MessageText from './MessageText.vue'

// 注入全局消息状态
const messages = inject('chatMessages')
const addMessage = inject('addMessage')

const inputText = ref('')
const isProcessing = ref(false)
const isThinking = ref(false)
const currentResponse = ref('')
const messagesContainer = ref(null)

// 图片相关状态
const imageFile = ref(null)
const imagePreview = ref(null)
const imageUrlInput = ref('')
const showUrlInput = ref(false)
const fileInputRef = ref(null)

// 格式化时间
const formatTime = (time) => {
  const date = new Date(time)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 触发文件选择
const triggerFileUpload = () => {
  fileInputRef.value?.click()
}

// 处理文件选择
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    alert('请上传图片文件')
    return
  }

  // 验证文件大小（5MB）
  if (file.size > 5 * 1024 * 1024) {
    alert('图片大小不能超过5MB')
    return
  }

  imageFile.value = file

  // 创建预览（使用 data URL）
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

// 清除图片
const clearImage = () => {
  imageFile.value = null
  imagePreview.value = null
  imageUrlInput.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 发送消息（支持图片）
const sendMessage = async () => {
  const text = inputText.value.trim() || (imagePreview.value ? '请帮我解答这道数学题' : '')
  if (!text || isProcessing.value) return

  // 获取图片 URL（如果有）
  const imageUrl = imagePreview.value || null

  // 添加用户消息（包含图片）
  addMessage('user', text, imageUrl)

  inputText.value = ''
  isProcessing.value = true
  isThinking.value = true
  currentResponse.value = ''
  scrollToBottom()

  await DialogueService.handleUserInput(text, imageUrl, {
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

  // 清除图片预览
  clearImage()
}

// 发送带图片 URL 的消息
const sendMessageWithUrl = async () => {
  const url = imageUrlInput.value.trim()
  if (!url || isProcessing.value) return

  const text = inputText.value.trim() || '请帮我解答这道数学题'

  // 添加用户消息（包含图片 URL）
  addMessage('user', text, url)

  inputText.value = ''
  imageUrlInput.value = ''
  showUrlInput.value = false
  isProcessing.value = true
  isThinking.value = true
  currentResponse.value = ''
  scrollToBottom()

  await DialogueService.handleUserInput(text, url, {
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
  height: 100%;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex-shrink: 0;
}

.chat-header h3 {
  font-size: 15px;
  font-weight: 600;
}

.clear-btn {
  padding: 5px 12px;
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
  min-height: 0;
  overflow-y: auto;
  padding: 16px 20px;
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
  padding: 14px 18px;
  border-radius: 12px;
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
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px 16px 16px;
  background: white;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
  margin-top: auto;
}

.input-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-upload-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-options {
  display: flex;
  gap: 8px;
}

.upload-btn, .url-btn {
  padding: 8px 16px;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-btn:hover:not(:disabled), .url-btn:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
}

.upload-btn:disabled, .url-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.url-input-container {
  display: flex;
  gap: 8px;
  width: 100%;
}

.url-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}

.url-input:focus {
  outline: none;
  border-color: #667eea;
}

.url-confirm-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s;
}

.url-confirm-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.url-confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.image-preview-container {
  display: flex;
  justify-content: flex-start;
}

.image-preview {
  position: relative;
  max-width: 150px;
}

.image-preview img {
  width: 100%;
  max-height: 120px;
  object-fit: contain;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  display: block;
}

.clear-image-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.clear-image-btn:hover:not(:disabled) {
  transform: scale(1.1);
}

.clear-image-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.message-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin-bottom: 8px;
  display: block;
}

.chat-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  font-family: inherit;
  box-sizing: border-box;
  min-height: 60px;
  max-height: 120px;
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
  padding: 10px 24px;
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
