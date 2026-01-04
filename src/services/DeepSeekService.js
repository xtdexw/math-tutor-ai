/**
 * DeepSeek-V3.2 模型服务
 * 魔搭社区 API: https://api-inference.modelscope.cn/v1
 */

const SYSTEM_PROMPT = `你是一位专业的数学老师，名字叫"星云老师"。你的特点是：

1. 教学风格：
   - 语言通俗易懂，善于用生活中的例子解释抽象概念
   - 循序渐进，不直接给答案，而是引导学生思考
   - 鼓励为主，即使学生答错了也要给予正面反馈

2. 回答结构：
   - 先简单总结问题的核心
   - 然后逐步展开讲解
   - 最后给出总结和记忆技巧

3. 特殊指令：
   - 当讲解定理时，会提示"可以看图"（触发Widget展示）
   - 当讲解公式时，会逐步推导，每一步都说明理由
   - 当学生做错题时，先肯定正确的部分，再指出错误

4. 格式要求：
   - 使用自然口语化表达
   - 适当使用停顿和语气词（如"嗯"、"好的"、"呢"）
   - 避免大段文字，分段讲解
   - **严禁使用任何表情符号（emoji）或特殊符号**
   - 只使用中文标点符号（，。！？、；：）
   - 不使用markdown格式（如**加粗**、#标题等）

请以专业、亲切、耐心的语气回答学生的问题。记住：你的回答会被转换为语音，所以不要包含任何表情符号或特殊字符。`

/**
 * 清理文本，移除表情符号和非法字符
 * @param {string} text - 原始文本
 * @returns {string} - 清理后的文本
 */
function cleanText(text) {
  if (!text) return ''

  // 移除emoji表情符号
  let cleaned = text.replace(/[\u{1F600}-\u{1F64F}]/gu, '')  // 表情符号
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')  // 符号和图标
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')  // 交通和地图
    .replace(/[\u{1F700}-\u{1F77F}]/gu, '')  // 炼金术符号
    .replace(/[\u{1F780}-\u{1F7FF}]/gu, '')  // 几何符号
    .replace(/[\u{1F800}-\u{1F8FF}]/gu, '')  // 补充符号
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')  // 补充符号和图标
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')  // 扩展符号
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')  // 符号和图标
    .replace(/[\u{2600}-\u{26FF}]/gu, '')    // 杂项符号
    .replace(/[\u{2700}-\u{27BF}]/gu, '')    // 装饰符号
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')    // 变体选择器
    .replace(/[\u{1F018}-\u{1F0F5}]/gu, '') // 扑克牌
    .replace(/[\u{1F200}-\u{1F2FF}]/gu, '') // 表情符号

  // 移除markdown格式
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1')  // 移除加粗
    .replace(/\*(.+?)\*/g, '$1')      // 移除斜体
    .replace(/__(.+?)__/g, '$1')      // 移除加粗
    .replace(/_(.+?)_/g, '$1')        // 移除斜体
    .replace(/~~(.+?)~~/g, '$1')      // 移除删除线
    .replace(/`(.+?)`/g, '$1')        // 移除代码
    .replace(/```[\s\S]*?```/g, '')   // 移除代码块

  // 只保留中文、英文、数字和常用中文标点
  cleaned = cleaned.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s，。！？、；：""''（）《》\-\+\=\/\(\)\[\]\{\}\<\>]/g, '')

  // 移除多余的空格
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  return cleaned
}

class DeepSeekService {
  constructor() {
    this.baseURL = 'https://api-inference.modelscope.cn/v1'
    this.apiKey = this._loadApiKey()
    this.model = 'deepseek-ai/DeepSeek-V3.2'
    this.conversationHistory = []
  }

  /**
   * 从localStorage加载API Key
   */
  _loadApiKey() {
    try {
      const savedConfig = localStorage.getItem('app_config')
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig)
        return parsed.deepseek?.apiKey || ''
      }
    } catch (e) {
      console.error('Failed to load API key:', e)
    }
    return ''
  }

  /**
   * 检查配置是否有效
   */
  hasValidConfig() {
    return !!this.apiKey
  }

  /**
   * 流式调用DeepSeek-V3.2
   * @param {string} userMessage - 用户消息
   * @param {Function} onThinking - 思考过程回调 (reasoning_content)
   * @param {Function} onContent - 内容输出回调 (content)
   * @param {Function} onDone - 完成回调
   * @param {Function} onError - 错误回调
   */
  async chatStream(userMessage, onThinking, onContent, onDone, onError) {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...this.conversationHistory,
      { role: 'user', content: userMessage }
    ]

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          stream: true,
          extra_body: {
            enable_thinking: true
          }
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let doneThinking = false
      let fullThinking = ''
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') {
              continue
            }

            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta

              if (delta) {
                // 思考过程
                if (delta.reasoning_content) {
                  fullThinking += delta.reasoning_content
                  onThinking?.(delta.reasoning_content)
                }
                // 最终答案
                else if (delta.content) {
                  if (!doneThinking) {
                    doneThinking = true
                  }
                  // 清理文本，移除表情符号和非法字符
                  const cleanedContent = cleanText(delta.content)
                  fullContent += cleanedContent
                  onContent?.(cleanedContent)
                }
              }
            } catch (e) {
              // 忽略解析错误，继续处理下一行
            }
          }
        }
      }

      // 保存对话历史
      this.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: fullContent }
      )

      // 限制历史记录长度
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20)
      }

      onDone?.({ thinking: fullThinking, content: fullContent })

    } catch (error) {
      console.error('DeepSeek API Error:', error)
      onError?.(error)
    }
  }

  /**
   * 非流式调用（用于后台处理）
   */
  async chat(userMessage) {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...this.conversationHistory,
      { role: 'user', content: userMessage }
    ]

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          stream: false,
          extra_body: {
            enable_thinking: true
          }
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''

      // 保存对话历史
      this.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: content }
      )

      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20)
      }

      return data
    } catch (error) {
      console.error('DeepSeek API Error:', error)
      throw error
    }
  }

  /**
   * 清空对话历史
   */
  clearHistory() {
    this.conversationHistory = []
  }

  /**
   * 获取对话历史
   */
  getHistory() {
    return this.conversationHistory
  }
}

// 导出单例
export default new DeepSeekService()
