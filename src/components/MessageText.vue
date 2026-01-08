<template>
  <div class="message-text-formatted" v-html="formattedContent"></div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  content: {
    type: String,
    required: true
  }
})

// 格式化内容
const formattedContent = computed(() => {
  if (!props.content) return ''

  let text = props.content

  // 1. 转义HTML字符（防止XSS）
  text = escapeHtml(text)

  // 2. 识别并格式化数学公式
  text = formatMathFormulas(text)

  // 3. 识别重点标记（**加粗**）
  text = formatBold(text)

  // 4. 识别标题（## 标题）
  text = formatHeadings(text)

  // 5. 识别列表（1. 或 - 开头）
  text = formatLists(text)

  // 6. 自动分段（按句号、问号、感叹号分段）
  text = formatParagraphs(text)

  return text
})

// 转义HTML字符
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// 格式化数学公式
function formatMathFormulas(text) {
  // 识别简单的数学公式：a² + b² = c²
  // 只匹配常见的变量名模式
  text = text.replace(/([a-zA-Z]+\s*[²³¹ⁿⁱ⁰]+\s*[\+\-\×÷=<>≤≥]\s*[a-zA-Z]+\s*[²³¹ⁿⁱ⁰]+(?:\s*[\+\-\×÷=<>≤≥]\s*[a-zA-Z]+\s*[²³¹ⁿⁱ⁰]+)*)/g,
    '<span class="math-formula">$&</span>')

  // 识别简单的等式：x = 5 或 y = 3.14
  text = text.replace(/([a-zA-Z])\s*=\s*([0-9.]+)/g, '<span class="math-equation">$1 = $2</span>')

  return text
}

// 格式化加粗
function formatBold(text) {
  // 识别 **加粗**
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  return text
}

// 格式化标题
function formatHeadings(text) {
  // 识别 ### 标题
  text = text.replace(/^###\s+(.+)$/gm, '<h4>$1</h4>')
  // 识别 ## 标题
  text = text.replace(/^##\s+(.+)$/gm, '<h3>$1</h3>')
  return text
}

// 格式化列表
function formatLists(text) {
  const lines = text.split('\n')
  let inList = false
  let result = []

  for (let line of lines) {
    // 检查是否是列表项
    const listMatch = line.match(/^[\d]+\.\s+(.+)$/)
    const bulletMatch = line.match(/^[-•]\s+(.+)$/)

    if (listMatch || bulletMatch) {
      if (!inList) {
        result.push('<ul class="message-list">')
        inList = true
      }
      const itemText = listMatch ? listMatch[1] : bulletMatch[1]
      result.push(`<li>${itemText}</li>`)
    } else {
      if (inList) {
        result.push('</ul>')
        inList = false
      }
      result.push(line)
    }
  }

  if (inList) {
    result.push('</ul>')
  }

  return result.join('\n')
}

// 自动分段
function formatParagraphs(text) {
  // 先按列表分割（不破坏列表）
  const parts = text.split(/(<ul class="message-list">[\s\S]*?<\/ul>)/g)

  let result = []

  for (let part of parts) {
    if (part.startsWith('<ul')) {
      // 是列表，保持原样
      result.push(part)
    } else {
      // 不是列表，进行分段处理
      // 按句子分割（。！？）
      const sentences = part.split(/([。！？])/)
      let currentParagraph = []

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i]

        if (!sentence) continue

        currentParagraph.push(sentence)

        // 如果是句子结束符号，或者已经积累了几句
        if (sentence === '。' || sentence === '！' || sentence === '？' ||
            (currentParagraph.length >= 2 && i < sentences.length - 1 && sentences[i + 1]?.trim())) {
          const paragraph = currentParagraph.join('').trim()
          if (paragraph) {
            result.push(`<p>${paragraph}</p>`)
          }
          currentParagraph = []
        }
      }

      // 处理剩余内容
      const remaining = currentParagraph.join('').trim()
      if (remaining) {
        result.push(`<p>${remaining}</p>`)
      }
    }
  }

  return result.join('\n')
}
</script>

<style scoped>
.message-text-formatted {
  line-height: 1.9;
  color: #1a202c;
  font-size: 15px;
}

/* 段落样式 */
.message-text-formatted p {
  margin: 0 0 10px 0;
  text-indent: 0;
}

.message-text-formatted p:last-child {
  margin-bottom: 0;
}

/* 标题样式 */
.message-text-formatted h3 {
  font-size: 17px;
  font-weight: 600;
  color: #2d3748;
  margin: 12px 0 8px 0;
  padding-bottom: 4px;
  border-bottom: 2px solid #667eea;
}

.message-text-formatted h4 {
  font-size: 16px;
  font-weight: 600;
  color: #4a5568;
  margin: 10px 0 6px 0;
}

/* 列表样式 */
.message-text-formatted .message-list {
  margin: 10px 0;
  padding-left: 20px;
  list-style: none;
}

.message-text-formatted .message-list li {
  position: relative;
  padding: 4px 0 4px 20px;
  margin-bottom: 2px;
  line-height: 1.7;
}

.message-text-formatted .message-list li:before {
  content: '•';
  position: absolute;
  left: 4px;
  color: #667eea;
  font-weight: bold;
  font-size: 16px;
  line-height: 1.4;
}

/* 数学公式样式 */
.message-text-formatted .math-formula {
  display: inline-block;
  padding: 3px 8px;
  margin: 0 2px;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f0ff 100%);
  border-radius: 6px;
  font-family: 'Times New Roman', serif;
  font-size: 16px;
  color: #667eea;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.message-text-formatted .math-equation {
  display: inline-block;
  padding: 2px 8px;
  background: #f0f4ff;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #667eea;
  font-weight: 600;
}

/* 加粗样式 */
.message-text-formatted strong {
  color: #667eea;
  font-weight: 600;
  background: linear-gradient(180deg, transparent 50%, rgba(102, 126, 234, 0.15) 50%);
  padding: 0 2px;
}

/* 强调标记 */
.message-text-formatted em {
  color: #e53e3e;
  font-style: normal;
  font-weight: 500;
}

/* 代码样式（如果有） */
.message-text-formatted code {
  padding: 2px 8px;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #667eea;
}
</style>
