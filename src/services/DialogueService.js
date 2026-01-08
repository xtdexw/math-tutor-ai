/**
 * 对话管理服务
 * 整合 QwenVLService 和 AvatarService，实现完整的对话流程（支持图片）
 */

import QwenVLService from './QwenVLService.js'
import AvatarService from './AvatarService.js'

class DialogueService {
  constructor() {
    this.isProcessing = false
    this.fullResponse = ''  // 存储完整响应
    this.lastSpokenIndex = 0  // 上次说话到的位置
    this.speakTimer = null
    this.speakInterval = 300  // 每300ms输出一次
  }

  /**
   * 处理用户输入并驱动数字人响应（支持图片）
   * @param {string} userInput - 用户输入
   * @param {string} imageUrl - 图片 URL（可选）
   * @param {object} callbacks - 回调函数集合
   */
  async handleUserInput(userInput, imageUrl = null, callbacks = {}) {
    if (this.isProcessing) {
      return
    }

    this.isProcessing = true
    this.fullResponse = ''  // 重置
    this.lastSpokenIndex = 0
    let isFirstSpeak = true

    const {
      onListening = () => {},
      onThinking = () => {},
      onResponding = () => {},
      onDone = () => {},
      onError = () => {}
    } = callbacks

    // 定期输出函数
    const speakPeriodically = async () => {
      const unspokenPart = this.fullResponse.slice(this.lastSpokenIndex)
      if (unspokenPart.length > 0) {
        await AvatarService.speak(unspokenPart, isFirstSpeak, false)
        this.lastSpokenIndex = this.fullResponse.length
        isFirstSpeak = false
      }
    }

    try {
      // 1. 数字人进入倾听状态
      onListening()
      await AvatarService.listen()

      // 2. 数字人进入思考状态
      onThinking()
      await AvatarService.think()

      // 3. 调用 QwenVL 获取回复（流式，支持图片）
      await QwenVLService.chatStream(
        userInput,
        imageUrl,  // 图片 URL

        // 思考过程回调（QwenVL 不支持，保留兼容）
        (thinkingContent) => {
          // QwenVL 不返回思考过程，此回调保留接口兼容性
        },

        // 内容输出回调 - 驱动数字人说话
        async (content) => {
          onResponding(content)
          this.fullResponse += content
        },

        // 完成回调
        async ({ content }) => {  // QwenVL 只返回 content，不返回 thinking
          // 清除定时器
          if (this.speakTimer) {
            clearTimeout(this.speakTimer)
            this.speakTimer = null
          }

          // 输出剩余所有内容
          if (this.lastSpokenIndex < this.fullResponse.length) {
            const remainingContent = this.fullResponse.slice(this.lastSpokenIndex)
            await AvatarService.speak(remainingContent, isFirstSpeak, true)
            this.lastSpokenIndex = this.fullResponse.length
          }

          // 回到待机状态
          await AvatarService.interactiveIdle()

          onDone({ content })  // 只传递 content
          this.isProcessing = false
        },

        // 错误回调
        async (error) => {
          // 清除定时器
          if (this.speakTimer) {
            clearTimeout(this.speakTimer)
            this.speakTimer = null
          }

          console.error('Dialogue error:', error)
          await AvatarService.interactiveIdle()
          onError(error)
          this.isProcessing = false
        }
      )

    } catch (error) {
      console.error('Handle user input error:', error)
      await AvatarService.interactiveIdle()
      onError(error)
      this.isProcessing = false
    }
  }

  /**
   * 使用SSML格式说话（支持Widget展示）
   * @param {string} text - 说话内容
   * @param {object} options - 选项 { widgetType, widgetData }
   */
  async speakWithWidget(text, options = {}) {
    if (!AvatarService.isReady()) return

    const { widgetType, widgetData } = options

    let ssml = `<speak>${text}`

    // 如果有Widget，添加Widget事件
    if (widgetType && widgetData) {
      ssml += `
        <ue4event>
          <type>${widgetType}</type>
          <data>${JSON.stringify(widgetData)}</data>
        </ue4event>
      `
    }

    ssml += `</speak>`

    await AvatarService.speakSSML(ssml, true, true)
  }

  /**
   * 播放欢迎语
   */
  async welcome() {
    if (!AvatarService.isReady()) return

    const welcomeText = `
      <speak>
        <ue4event>
          <type>ka_intent</type>
          <data><ka_intent>Welcome</ka_intent></data>
        </ue4event>
        同学你好，我是星云老师。很高兴能陪你一起学习数学！
        有什么不懂的问题，尽管问我，我们一起解决。
      </speak>
    `

    await AvatarService.speakSSML(welcomeText, true, true)
  }

  /**
   * 讲解知识点
   * @param {object} knowledge - 知识点对象
   * @param {object} callbacks - 回调函数集合（与handleUserInput相同）
   */
  async explainKnowledge(knowledge, callbacks = {}) {
    const { name, content } = knowledge
    const { definition, formula, explanation } = content || {}

    // 组织成自然的用户问题
    let userQuestion = `请帮我讲解一下${name}`

    if (definition) {
      userQuestion += `，定义是：${definition}`
    }

    if (formula) {
      userQuestion += `，公式是：${formula}`
    }

    if (explanation) {
      userQuestion += `，${explanation}`
    }

    // 直接调用 handleUserInput，把知识点作为用户输入
    // 注意：参数顺序是 userInput, imageUrl, callbacks
    await this.handleUserInput(userQuestion, null, callbacks)
  }

  /**
   * 取消当前处理
   */
  cancel() {
    if (this.speakTimer) {
      clearTimeout(this.speakTimer)
      this.speakTimer = null
    }
    this.isProcessing = false
    this.fullResponse = ''
    this.lastSpokenIndex = 0
  }

  /**
   * 检查是否正在处理
   */
  getProcessingStatus() {
    return this.isProcessing
  }
}

// 导出单例
export default new DialogueService()
