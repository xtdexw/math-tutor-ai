/**
 * 星云SDK服务封装
 * 提供数字人驱动能力
 */

class AvatarService {
  constructor() {
    this.sdk = null
    this.isInitialized = false
    this.currentState = 'offline'
    this.speakBuffer = ''
    this.speakTimer = null

    // 从localStorage加载配置
    this.config = this._loadConfig()
  }

  /**
   * 从localStorage加载配置
   */
  _loadConfig() {
    try {
      const savedConfig = localStorage.getItem('app_config')
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig)
        return {
          containerId: '#avatar-container',
          appId: parsed.xingyun?.appId || '',
          appSecret: parsed.xingyun?.appSecret || '',
          gatewayServer: parsed.xingyun?.gatewayServer || 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session'
        }
      }
    } catch (e) {
      console.error('Failed to load config:', e)
    }

    // 返回默认配置
    return {
      containerId: '#avatar-container',
      appId: '',
      appSecret: '',
      gatewayServer: 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session'
    }
  }

  /**
   * 检查配置是否有效
   */
  hasValidConfig() {
    return !!(this.config.appId && this.config.appSecret)
  }

  /**
   * 初始化SDK
   */
  async init(onDownloadProgress) {
    if (this.isInitialized) {
      return true
    }

    if (typeof XmovAvatar === 'undefined') {
      console.error('XmovAvatar SDK not loaded')
      return false
    }

    try {
      // containerId 需要传入带 # 的 CSS 选择器格式
      this.sdk = new XmovAvatar({
        containerId: this.config.containerId,
        appId: this.config.appId,
        appSecret: this.config.appSecret,
        gatewayServer: this.config.gatewayServer,

        onStateChange: (state) => {
          this.currentState = state
          this._emitEvent('stateChange', state)
        },

        onStatusChange: (status) => {
          this._emitEvent('statusChange', status)
        },

        onVoiceStateChange: (status) => {
          this._emitEvent('voiceStateChange', status)
        },

        onMessage: (message) => {
          this._emitEvent('message', message)
        },

        onNetworkInfo: (networkInfo) => {
          this._emitEvent('networkInfo', networkInfo)
        },

        enableLogger: true
      })

      await this.sdk.init({ onDownloadProgress })
      this.isInitialized = true
      return true

    } catch (error) {
      console.error('Failed to initialize Avatar SDK:', error)
      return false
    }
  }

  /**
   * 离线模式（不消耗积分）
   */
  offlineMode() {
    if (!this.sdk) return
    this.sdk.offlineMode()
    this.currentState = 'offline'
  }

  /**
   * 在线模式
   */
  onlineMode() {
    if (!this.sdk) return
    this.sdk.onlineMode()
  }

  /**
   * 待机等待状态
   */
  async idle() {
    if (!this.sdk) return
    await this.sdk.idle()
    this.currentState = 'idle'
  }

  /**
   * 待机互动状态
   */
  async interactiveIdle() {
    if (!this.sdk) return
    await this.sdk.interactiveidle()
    this.currentState = 'interactive_idle'
  }

  /**
   * 倾听状态
   */
  async listen() {
    if (!this.sdk) return
    await this.sdk.listen()
    this.currentState = 'listen'
  }

  /**
   * 思考状态
   */
  async think() {
    if (!this.sdk) return
    await this.sdk.think()
    this.currentState = 'think'
  }

  /**
   * 说话
   * @param {string} text - 说话内容
   * @param {boolean} isStart - 是否开始
   * @param {boolean} isEnd - 是否结束
   */
  async speak(text, isStart = true, isEnd = true) {
    if (!this.sdk) return

    try {
      // 清空之前的缓冲
      if (isStart) {
        clearTimeout(this.speakTimer)
        this.speakBuffer = ''
      }

      // 添加到缓冲
      this.speakBuffer += text

      // 立即输出
      await this.sdk.speak(this.speakBuffer, isStart, isEnd)

      if (isEnd) {
        this.currentState = 'speak'
        this.speakBuffer = ''
      }
    } catch (error) {
      console.error('Speak error:', error)
    }
  }

  /**
   * 使用SSML格式说话
   * @param {string} ssml - SSML格式的内容
   * @param {boolean} isStart - 是否开始
   * @param {boolean} isEnd - 是否结束
   */
  async speakSSML(ssml, isStart = true, isEnd = true) {
    if (!this.sdk) return
    await this.sdk.speak(ssml, isStart, isEnd)
    if (isEnd) {
      this.currentState = 'speak'
    }
  }

  /**
   * 触发Widget事件（展示图片/视频等）
   * @param {string} type - Widget类型
   * @param {object} data - Widget数据
   */
  triggerWidget(type, data) {
    if (!this.sdk) return
    this.sdk.triggerWidget?.(type, data)
    this._emitEvent('widget', { type, data })
  }

  /**
   * 设置音量
   * @param {number} volume - 音量 (0-1)
   */
  setVolume(volume) {
    if (!this.sdk) return
    this.sdk.setVolume(volume)
  }

  /**
   * 显示调试信息
   */
  showDebugInfo() {
    if (!this.sdk) return
    this.sdk.showDebugInfo()
  }

  /**
   * 隐藏调试信息
   */
  hideDebugInfo() {
    if (!this.sdk) return
    this.sdk.hideDebugInfo()
  }

  /**
   * 销毁SDK
   */
  destroy() {
    if (this.sdk) {
      this.sdk.destroy()
      this.sdk = null
      this.isInitialized = false
      this.currentState = 'offline'
    }
  }

  /**
   * 获取当前状态
   */
  getState() {
    return this.currentState
  }

  /**
   * 检查是否已初始化
   */
  isReady() {
    return this.isInitialized && this.sdk !== null
  }

  /**
   * 事件监听器
   */
  _listeners = {}

  on(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = []
    }
    this._listeners[event].push(callback)
  }

  off(event, callback) {
    if (!this._listeners[event]) return
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback)
  }

  _emitEvent(event, data) {
    if (!this._listeners[event]) return
    this._listeners[event].forEach(callback => callback(data))
  }
}

// 导出单例
export default new AvatarService()
