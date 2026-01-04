<template>
  <div class="config-panel">
    <div class="config-container">
      <div class="config-header">
        <h1>⚙️ 系统配置</h1>
        <p class="subtitle">请配置星云SDK和AI模型的密钥信息</p>
      </div>

      <form @submit.prevent="handleSave" class="config-form">
        <!-- 星云SDK配置 -->
        <div class="config-section">
          <h2>
            <span class="icon">🤖</span>
            星云SDK配置
          </h2>

          <div class="form-group">
            <label for="xingyun-appid">
              App ID <span class="required">*</span>
            </label>
            <input
              id="xingyun-appid"
              v-model="config.xingyun.appId"
              type="text"
              placeholder="请输入星云SDK的App ID"
              required
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="xingyun-secret">
              App Secret <span class="required">*</span>
            </label>
            <input
              id="xingyun-secret"
              v-model="config.xingyun.appSecret"
              type="password"
              placeholder="请输入星云SDK的App Secret"
              required
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="xingyun-gateway">
              Gateway Server
            </label>
            <input
              id="xingyun-gateway"
              v-model="config.xingyun.gatewayServer"
              type="text"
              placeholder="https://nebula-agent.xingyun3d.com/user/v1/ttsa/session"
              class="form-input"
            />
            <small class="form-hint">留空使用默认地址</small>
          </div>
        </div>

        <!-- DeepSeek配置 -->
        <div class="config-section">
          <h2>
            <span class="icon">🧠</span>
            DeepSeek-V3.2 配置
          </h2>

          <div class="form-group">
            <label for="deepseek-key">
              API Key <span class="required">*</span>
            </label>
            <input
              id="deepseek-key"
              v-model="config.deepseek.apiKey"
              type="password"
              placeholder="请输入魔搭社区API Key"
              required
              class="form-input"
            />
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '保存配置' }}
          </button>
          <button
            type="button"
            @click="handleUseTestConfig"
            class="btn btn-test"
          >
            使用测试配置
          </button>
          <button
            v-if="hasConfig"
            type="button"
            @click="handleClear"
            class="btn btn-secondary"
          >
            清除配置
          </button>
        </div>

        <!-- 提示信息 -->
        <div class="config-tips">
          <p>💡 <strong>提示：</strong></p>
          <ul>
            <li>点击"使用测试配置"可快速体验系统（无需填写密钥）</li>
            <li>配置信息将安全存储在浏览器的本地存储中</li>
            <li>您可以随时点击右上角⚙️按钮返回此页面修改配置</li>
            <li>测试配置仅供体验，正式使用请配置您自己的密钥</li>
          </ul>
        </div>
      </form>

      <!-- 成功提示 -->
      <div v-if="showSuccess" class="success-toast">
        ✓ 配置保存成功！
      </div>
    </div>

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
            {{ confirmOptions.cancelText }}
          </button>
          <button @click="confirmAction" class="modal-btn modal-btn-confirm">
            {{ confirmOptions.confirmText }}
          </button>
        </div>
      </div>
    </div>

    <!-- 自定义提示弹窗 -->
    <div v-if="showAlert" class="modal-overlay" @click.self="closeAlert">
      <div class="modal-container modal-small">
        <div class="modal-header">
          <h3>{{ alertOptions.title }}</h3>
        </div>
        <div class="modal-body">
          <p>{{ alertOptions.message }}</p>
        </div>
        <div class="modal-footer">
          <button @click="closeAlert" class="modal-btn modal-btn-confirm">
            我知道了
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 默认测试配置（隐藏的，用户无法查看）
const TEST_CONFIG = {
  xingyun: {
    appId: 'd635f1454a2146aa90b7b7fdd9f82a67',
    appSecret: 'bc94fd8cfbd647b2859ca26d3ad79428',
    gatewayServer: 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session'
  },
  deepseek: {
    apiKey: 'ms-110b80f9-ae5a-4590-91d4-08bc8e54603a'
  }
}

const config = ref({
  xingyun: {
    appId: '',
    appSecret: '',
    gatewayServer: 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session'
  },
  deepseek: {
    apiKey: ''
  }
})

const isSaving = ref(false)
const showSuccess = ref(false)
const hasConfig = ref(false)

// 自定义弹窗状态
const showConfirm = ref(false)
const showAlert = ref(false)
const confirmOptions = ref({
  title: '',
  message: '',
  confirmText: '确定',
  cancelText: '取消',
  onConfirm: () => {}
})
const alertOptions = ref({
  title: '',
  message: ''
})

// 确认弹窗方法
const showConfirmDialog = (title, message, onConfirm, confirmText = '确定', cancelText = '取消') => {
  return new Promise((resolve) => {
    confirmOptions.value = {
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirm()
        resolve(true)
      }
    }
    showConfirm.value = true
  })
}

const confirmAction = () => {
  confirmOptions.value.onConfirm()
  showConfirm.value = false
}

const cancelConfirm = () => {
  showConfirm.value = false
}

// 提示弹窗方法
const showAlertDialog = (title, message) => {
  alertOptions.value = { title, message }
  showAlert.value = true
}

const closeAlert = () => {
  showAlert.value = false
}

// 从localStorage加载配置
onMounted(() => {
  // 允许页面滚动
  document.body.style.overflow = 'auto'
  document.body.style.height = 'auto'

  const savedConfig = localStorage.getItem('app_config')
  if (savedConfig) {
    try {
      const parsed = JSON.parse(savedConfig)
      config.value = parsed
      hasConfig.value = true
    } catch (e) {
      console.error('Failed to parse saved config:', e)
    }
  }
})

onUnmounted(() => {
  // 恢复原始样式
  document.body.style.overflow = 'hidden'
  document.body.style.height = '100vh'
})

// 保存配置
const handleSave = async () => {
  isSaving.value = true

  try {
    // 验证必填字段
    if (!config.value.xingyun.appId || !config.value.xingyun.appSecret) {
      showAlertDialog('配置不完整', '请填写完整的星云SDK配置（App ID 和 App Secret）')
      return
    }

    if (!config.value.deepseek.apiKey) {
      showAlertDialog('配置不完整', '请填写 DeepSeek API Key')
      return
    }

    // 保存到localStorage
    localStorage.setItem('app_config', JSON.stringify(config.value))
    hasConfig.value = true

    // 显示成功提示
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 2000)

    // 延迟跳转到主页
    setTimeout(() => {
      window.location.reload()
    }, 1000)

  } catch (error) {
    console.error('Save config error:', error)
    showAlertDialog('保存失败', '配置保存失败：' + error.message)
  } finally {
    isSaving.value = false
  }
}

// 使用测试配置
const handleUseTestConfig = async () => {
  await showConfirmDialog(
    '使用测试配置',
    '使用内置测试配置可以快速体验系统功能\n\n⚠️ 注意：测试配置仅供体验使用，实际使用时请配置您自己的密钥。',
    () => {
      // 直接使用测试配置，不显示在输入框中
      localStorage.setItem('app_config', JSON.stringify(TEST_CONFIG))
      hasConfig.value = true

      showAlertDialog('配置已加载', '测试配置已加载成功！页面即将刷新...')
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    },
    '开始体验',
    '再想想'
  )
}

// 清除配置
const handleClear = async () => {
  await showConfirmDialog(
    '清除配置',
    '确定要清除所有配置吗？\n\n清除后需要重新配置才能使用系统。',
    () => {
      localStorage.removeItem('app_config')
      config.value = {
        xingyun: {
          appId: '',
          appSecret: '',
          gatewayServer: 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session'
        },
        deepseek: {
          apiKey: ''
        }
      }
      hasConfig.value = false
      showAlertDialog('清除成功', '配置已成功清除')
    },
    '确认清除',
    '取消'
  )
}
</script>

<style scoped>
.config-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 40px 20px 80px 20px;
  display: block;
}

.config-container {
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
  padding: 40px;
  padding-bottom: 60px;
}

.config-header {
  text-align: center;
  margin-bottom: 40px;
}

.config-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.config-section {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
}

.config-section h2 {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-section h2 .icon {
  font-size: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 8px;
}

.required {
  color: #e53e3e;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #2d3748;
  transition: all 0.3s;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input::placeholder {
  color: #a0aec0;
}

.form-hint {
  display: block;
  font-size: 12px;
  color: #a0aec0;
  margin-top: 6px;
}

.form-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f7fafc;
  color: #718096;
  border: 2px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
}

.btn-test {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

.btn-test:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(72, 187, 120, 0.4);
}

.config-tips {
  background: #f7fafc;
  border-radius: 8px;
  padding: 16px;
  font-size: 13px;
  color: #4a5568;
}

.config-tips p {
  margin: 0 0 8px 0;
  font-weight: 500;
}

.config-tips ul {
  margin: 0;
  padding-left: 20px;
}

.config-tips li {
  margin-bottom: 4px;
}

.success-toast {
  position: fixed;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: #48bb78;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
  animation: slideDown 0.3s ease;
  z-index: 1000;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
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

.modal-small {
  max-width: 320px;
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
