<template>
  <div class="avatar-wrapper">
    <div id="avatar-container" class="avatar-canvas" style="width: 100%; height: 100%;"></div>

    <div v-if="!isInitialized" class="avatar-loading">
      <div v-if="isConnecting" class="loading-spinner"></div>
      <div v-else class="idle-icon">👨‍🏫</div>
      <p>{{ isConnecting ? '正在连接星云老师...' : '点击下方按钮连接星云老师' }}</p>
      <div v-if="downloadProgress > 0" class="progress-bar">
        <div class="progress-fill" :style="{ width: downloadProgress + '%' }"></div>
      </div>
      <p v-if="downloadProgress > 0" class="progress-text">{{ downloadProgress }}%</p>
    </div>

    <div v-if="currentState" class="avatar-status">
      <span class="status-badge" :class="`status-${currentState}`">
        {{ stateLabels[currentState] || currentState }}
      </span>
    </div>

    <!-- 右上角断开连接按钮 -->
    <button
      v-if="isInitialized"
      @click="toggleConnection"
      class="disconnect-corner-btn"
      title="断开连接"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>

    <div class="avatar-controls" v-if="!isInitialized">
      <button
        @click="toggleConnection"
        class="control-btn connect-btn"
        :class="{ connecting: isConnecting }"
      >
        <span>{{ isConnecting ? '连接中...' : '连接星云老师' }}</span>
      </button>
    </div>

    <!-- 连接后只显示音量控制 -->
    <button v-if="isInitialized" @click="toggleMute" class="mute-btn-mini" :class="{ active: isMuted }" title="静音/音量">
      <svg v-if="!isMuted" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 4L3 7H1V9H3L6 12V4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 5C11.3333 6.33333 11.3333 9.66667 10 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M12 3C14.6667 5.66667 14.6667 10.3333 12 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 4L3 7H1V9H3L6 12V4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import AvatarService from '../services/AvatarService.js'
import DialogueService from '../services/DialogueService.js'

const isInitialized = ref(false)
const isConnecting = ref(false)
const currentState = ref('')
const downloadProgress = ref(0)
const isMuted = ref(false)

const stateLabels = {
  offline: '离线',
  online: '在线',
  idle: '待机',
  interactive_idle: '互动待机',
  listen: '倾听中',
  think: '思考中',
  speak: '讲解中'
}

// 监听状态变化
const handleStateChange = (state) => {
  currentState.value = state
}

const handleStatusChange = (status) => {
  // 状态变化处理（可以在这里添加逻辑）
}

const handleVoiceStateChange = (status) => {
  // 语音状态变化处理（可以在这里添加逻辑）
}

// 连接/断开星云老师
const toggleConnection = async () => {
  if (isInitialized.value) {
    // 断开连接
    AvatarService.destroy()
    isInitialized.value = false
    currentState.value = ''
    downloadProgress.value = 0
  } else {
    // 连接
    await connectToAvatar()
  }
}

// 初始化SDK
const connectToAvatar = async () => {
  if (isConnecting.value) return

  isConnecting.value = true

  // 等待DOM渲染完成
  await nextTick()

  // 再等待一小段时间确保容器完全就绪
  await new Promise(resolve => setTimeout(resolve, 100))

  try {
    const success = await AvatarService.init((progress) => {
      downloadProgress.value = progress
    })

    if (success) {
      isInitialized.value = true
      currentState.value = AvatarService.getState()

      // 监听事件
      AvatarService.on('stateChange', handleStateChange)
      AvatarService.on('statusChange', handleStatusChange)
      AvatarService.on('voiceStateChange', handleVoiceStateChange)

      // 播放欢迎语
      setTimeout(() => {
        DialogueService.welcome()
      }, 1000)
    } else {
      alert('SDK初始化失败，请查看控制台了解详情')
    }
  } catch (error) {
    console.error('Init SDK error:', error)
    alert('SDK初始化出错: ' + error.message)
  } finally {
    isConnecting.value = false
  }
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  AvatarService.setVolume(isMuted.value ? 0 : 1)
}

onMounted(() => {
  // 等待SDK加载（但不自动连接）
  const checkSDK = setInterval(() => {
    if (typeof XmovAvatar !== 'undefined') {
      clearInterval(checkSDK)
    }
  }, 100)

  // 超时检查
  setTimeout(() => {
    clearInterval(checkSDK)
    if (typeof XmovAvatar === 'undefined') {
      alert('SDK加载超时，请刷新页面重试')
    }
  }, 10000)
})

onUnmounted(() => {
  // 移除事件监听
  AvatarService.off('stateChange', handleStateChange)
  AvatarService.off('statusChange', handleStatusChange)
  AvatarService.off('voiceStateChange', handleVoiceStateChange)
})
</script>

<style scoped>
.avatar-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.avatar-canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.avatar-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
  z-index: 10;
}

.idle-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.8;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 20px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-bar {
  width: 200px;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  margin: 15px auto;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  opacity: 0.8;
}

.avatar-status {
  position: absolute;
  top: 15px;
  left: 15px;
  z-index: 10;
}

.status-badge {
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  font-size: 13px;
  color: white;
  font-weight: 500;
}

.status-listen {
  background: rgba(52, 211, 153, 0.3);
}

.status-think {
  background: rgba(251, 191, 36, 0.3);
}

.status-speak {
  background: rgba(139, 92, 246, 0.3);
}

/* 右上角断开按钮 */
.disconnect-corner-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 32px;
  height: 32px;
  padding: 0;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 999;
  pointer-events: auto;
}

/* 音量按钮 */
.mute-btn-mini {
  position: absolute;
  top: 15px;
  right: 55px;
  width: 32px;
  height: 32px;
  padding: 0;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 999;
}

.mute-btn-mini:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.mute-btn-mini.active {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
  color: white;
}

.disconnect-corner-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.4);
  color: rgba(255, 255, 255, 0.9);
  transform: scale(1.05);
}

.disconnect-corner-btn:active {
  transform: scale(0.95);
}

.avatar-controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  z-index: 10;
}

.control-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.connect-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-weight: 600;
}

.connect-btn.connected {
  background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
}

.connect-btn.connecting {
  opacity: 0.7;
  cursor: wait;
}

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn.active {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
}
</style>
