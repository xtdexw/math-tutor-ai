<template>
  <ConfigPanel v-if="!hasConfig" />
  <div v-else class="app">
    <header class="app-header">
      <h1>星云智教 - AI数学实时辅导系统</h1>
      <p class="subtitle">让AI拥有"老师的身体与对话能力"</p>
      <button @click="handleReconfigure" class="config-btn" title="重新配置">
        ⚙️
      </button>
    </header>

    <main class="app-main">
      <div class="avatar-section">
        <AvatarContainer />
      </div>

      <div class="interaction-section">
        <TabPanel />
      </div>
    </main>

    <footer class="app-footer">
      <p>基于魔珐星云具身驱动SDK + DeepSeek-V3.2</p>
    </footer>

    <!-- 自定义确认弹窗 -->
    <div v-if="showConfirm" class="modal-overlay" @click.self="cancelConfirm">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ confirmOptions.title }}</h3>
        </div>
        <div class="modal-body">
          <p>{{ confirmOptions.message }}</p>
        </div>
        <div class="modal-footer">
          <button @click="cancelConfirm" class="modal-btn modal-btn-cancel">
            取消
          </button>
          <button @click="confirmOptions.onConfirm" class="modal-btn modal-btn-confirm">
            确定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, provide, onMounted } from 'vue'
import AvatarContainer from './components/AvatarContainer.vue'
import TabPanel from './components/TabPanel.vue'
import ConfigPanel from './components/ConfigPanel.vue'

// 全局消息状态
const messages = ref([])
const hasConfig = ref(false)

// 检查配置
const checkConfig = () => {
  const config = localStorage.getItem('app_config')
  hasConfig.value = !!config
}

// 自定义弹窗状态
const showConfirm = ref(false)
const confirmOptions = ref({
  title: '',
  message: '',
  onConfirm: () => {}
})

// 确认弹窗方法
const showConfirmDialog = (title, message, onConfirm) => {
  confirmOptions.value = {
    title,
    message,
    onConfirm: () => {
      onConfirm()
      showConfirm.value = false
    }
  }
  showConfirm.value = true
}

const cancelConfirm = () => {
  showConfirm.value = false
}

// 重新配置
const handleReconfigure = () => {
  showConfirmDialog(
    '重新配置',
    '确定要重新配置吗？这将清除当前配置，您需要重新填写密钥信息。',
    () => {
      localStorage.removeItem('app_config')
      hasConfig.value = false
    }
  )
}

// 添加消息的方法
const addMessage = (role, content) => {
  messages.value.push({
    role,
    content,
    time: Date.now()
  })
}

// 提供给子组件使用
provide('chatMessages', messages)
provide('addMessage', addMessage)

onMounted(() => {
  checkConfig()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  height: 100vh;
  overflow: hidden;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-header {
  text-align: center;
  padding: 12px 20px;
  color: white;
  flex-shrink: 0;
  position: relative;
}

.config-btn {
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.config-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-50%) scale(1.1);
}

.app-header h1 {
  font-size: 22px;
  margin-bottom: 4px;
}

.app-header .subtitle {
  font-size: 13px;
  opacity: 0.9;
}

.app-main {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 20px;
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  overflow: hidden;
  min-height: 0;
}

.avatar-section {
  display: flex;
  align-items: stretch;
  justify-content: center;
  overflow: hidden;
  min-height: 0;
}

.avatar-section > * {
  width: 100%;
  height: 100%;
}

.interaction-section {
  display: flex;
  align-items: stretch;
  overflow: hidden;
  min-height: 0;
}

.app-footer {
  text-align: center;
  padding: 10px;
  color: white;
  font-size: 11px;
  opacity: 0.8;
  flex-shrink: 0;
}

@media (max-width: 1024px) {
  .app-main {
    grid-template-columns: 1fr;
  }

  .avatar-section {
    min-height: 400px;
  }
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Modal Container */
.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Modal Header */
.modal-header {
  padding: 20px 24px 12px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
}

/* Modal Body */
.modal-body {
  padding: 20px 24px;
}

.modal-body p {
  margin: 0;
  font-size: 14px;
  color: #4a5568;
  line-height: 1.6;
  white-space: pre-line;
}

/* Modal Footer */
.modal-footer {
  padding: 12px 24px 20px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Modal Buttons */
.modal-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
}

.modal-btn-cancel {
  background: #f7fafc;
  color: #718096;
  border: 2px solid #e2e8f0;
}

.modal-btn-cancel:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
}

.modal-btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.modal-btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}
</style>
