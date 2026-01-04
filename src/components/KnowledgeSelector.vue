<template>
  <div class="knowledge-selector">
    <div class="category-tabs">
      <button
        v-for="category in categories"
        :key="category.id"
        @click="activeCategory = category.id"
        class="category-tab"
        :class="{ active: activeCategory === category.id }"
      >
        {{ category.name }}
      </button>
    </div>

    <div class="knowledge-list">
      <div
        v-for="item in filteredKnowledge"
        :key="item.id"
        @click="selectKnowledge(item)"
        class="knowledge-item"
        :class="{ selected: selectedKnowledge?.id === item.id }"
      >
        <div class="knowledge-name">{{ item.name }}</div>
        <div class="knowledge-meta">
          <span class="difficulty" :class="`diff-${item.difficulty}`">
            {{ difficultyLabels[item.difficulty] }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="selectedKnowledge" class="knowledge-detail">
      <h4>{{ selectedKnowledge.name }}</h4>
      <p class="definition">{{ selectedKnowledge.content.definition }}</p>
      <div v-if="selectedKnowledge.content.formula" class="formula">
        公式：{{ selectedKnowledge.content.formula }}
      </div>
      <button @click="learnKnowledge" class="learn-btn" :disabled="learningState !== 'idle'">
        {{ learningStateText }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, computed, onMounted } from 'vue'
import DialogueService from '../services/DialogueService.js'

// 注入全局消息状态
const addMessage = inject('addMessage')
const updateLearningHistory = inject('updateLearningHistory')

const categories = [
  { id: 'all', name: '全部' },
  { id: 'plane', name: '平面几何' },
  { id: 'solid', name: '立体几何' },
  { id: 'function', name: '函数' },
  { id: 'calculus', name: '微积分' }
]

const difficultyLabels = {
  basic: '基础',
  medium: '中等',
  advanced: '进阶'
}

const activeCategory = ref('all')
const selectedKnowledge = ref(null)

// 学习状态: idle(空闲) / listening(倾听中) / thinking(思考中) / speaking(讲解中)
const learningState = ref('idle')

// 按钮文本
const learningStateText = computed(() => {
  switch (learningState.value) {
    case 'listening': return '倾听中...'
    case 'thinking': return '思考中...'
    case 'speaking': return '思考中...'
    default: return '开始学习'
  }
})

// 知识库数据
const knowledgeBase = ref([])

// 过滤后的知识点
const filteredKnowledge = computed(() => {
  if (activeCategory.value === 'all') {
    return knowledgeBase.value
  }
  return knowledgeBase.value.filter(item => item.categoryId === activeCategory.value)
})

// 选择知识点
const selectKnowledge = (item) => {
  selectedKnowledge.value = item
}

// 学习知识点
const learnKnowledge = async () => {
  if (!selectedKnowledge.value || learningState.value !== 'idle') return

  learningState.value = 'listening'

  // 添加用户问题到对话记录
  const { name, content } = selectedKnowledge.value
  const { definition, formula } = content || {}
  let userQuestion = `请帮我讲解一下${name}`
  if (definition) userQuestion += `，定义是：${definition}`
  if (formula) userQuestion += `，公式是：${formula}`
  addMessage('user', userQuestion)

  try {
    await DialogueService.explainKnowledge(selectedKnowledge.value, {
      onListening: () => {
        learningState.value = 'listening'
      },
      onThinking: () => {
        learningState.value = 'thinking'
      },
      onResponding: (content) => {
        learningState.value = 'speaking'
      },
      onDone: ({ content }) => {
        // 添加AI回复到对话记录
        addMessage('assistant', content)
        // 更新学习历史
        updateLearningHistory(selectedKnowledge.value)
        learningState.value = 'idle'
      },
      onError: (error) => {
        addMessage('assistant', '抱歉，我遇到了一些问题：' + error.message)
        console.error('知识点学习：错误', error)
        learningState.value = 'idle'
      }
    })
  } catch (error) {
    console.error('Learn knowledge error:', error)
    learningState.value = 'idle'
  }
}

// 加载知识库
onMounted(async () => {
  try {
    const response = await fetch('/data/knowledge-base.json')

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    knowledgeBase.value = data.knowledge_points || []
  } catch (error) {
    console.error('❌ 加载知识库失败:', error)
    // 使用默认数据
    knowledgeBase.value = [
      {
        id: 'pythagorean_theorem',
        name: '勾股定理',
        categoryId: 'plane',
        difficulty: 'basic',
        content: {
          definition: '直角三角形两直角边的平方和等于斜边的平方',
          formula: 'a² + b² = c²'
        }
      }
    ]
  }
})
</script>

<style scoped>
.knowledge-selector {
  flex: 1;  /* 平分可用空间 */
  min-height: 0;  /* 允许flex子元素缩小 */
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.category-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
}

.category-tab {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s;
}

.category-tab:hover {
  background: #f1f5f9;
}

.category-tab.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.knowledge-list {
  max-height: 250px;
  overflow-y: auto;
  padding: 12px;
}

.knowledge-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: #f8fafc;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.knowledge-item:hover {
  background: #f1f5f9;
}

.knowledge-item.selected {
  background: #e0e7ff;
  border: 1px solid #667eea;
}

.knowledge-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a202c;
}

.knowledge-meta {
  display: flex;
  gap: 8px;
}

.difficulty {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.diff-basic {
  background: #dcfce7;
  color: #166534;
}

.diff-medium {
  background: #fef3c7;
  color: #92400e;
}

.diff-advanced {
  background: #fecaca;
  color: #991b1b;
}

.knowledge-detail {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  border-top: 1px solid #e2e8f0;
}

.knowledge-detail h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 12px;
}

.definition {
  font-size: 14px;
  color: #4a5568;
  line-height: 1.6;
  margin-bottom: 12px;
}

.formula {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #667eea;
  margin-bottom: 16px;
}

.learn-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.learn-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.learn-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
