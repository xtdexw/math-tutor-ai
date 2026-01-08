<template>
  <div class="tab-panel">
    <div class="tab-header">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="tab-button"
        :class="{ active: activeTab === tab.id }"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-name">{{ tab.name }}</span>
        <button
          v-if="tab.id === 'knowledge'"
          @click.stop="showHistory = true"
          class="history-mini-btn"
          title="学习记录"
        >
          📊
        </button>
      </button>
    </div>

    <div class="tab-content">
      <!-- 对话面板 -->
      <div v-show="activeTab === 'chat'" class="tab-pane panel-content">
        <ChatPanel />
      </div>

      <!-- 知识点选择器 -->
      <div v-show="activeTab === 'knowledge'" class="tab-pane panel-content">
        <KnowledgeSelector />
      </div>
    </div>

    <!-- 学习历史对话框 -->
    <div v-if="showHistory" class="history-modal" @click.self="showHistory = false">
      <div class="history-content">
        <div class="history-header">
          <h3>学习历史</h3>
          <button @click="showHistory = false" class="close-btn">×</button>
        </div>
        <div class="history-list">
          <div v-if="learningHistory.length === 0" class="history-empty">
            暂无学习记录
          </div>
          <div
            v-for="item in learningHistory"
            :key="item.id"
            class="history-item"
          >
            <div class="history-item-name">{{ item.name }}</div>
            <div class="history-item-count">学习 {{ item.count }} 次</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, provide, onMounted } from 'vue'
import ChatPanel from './ChatPanel.vue'
import KnowledgeSelector from './KnowledgeSelector.vue'

const tabs = [
  { id: 'chat', name: '对话', icon: '💬' },
  { id: 'knowledge', name: '知识点', icon: '📚' }
]

const activeTab = ref('chat')
const showHistory = ref(false)

// 学习历史记录
const learningHistory = ref([])

// 从 localStorage 加载学习历史
const loadLearningHistory = () => {
  const saved = localStorage.getItem('learningHistory')
  if (saved) {
    learningHistory.value = JSON.parse(saved)
  }
}

// 更新学习历史
const updateLearningHistory = (knowledge) => {
  const existingIndex = learningHistory.value.findIndex(item => item.id === knowledge.id)
  if (existingIndex >= 0) {
    learningHistory.value[existingIndex].count++
    learningHistory.value[existingIndex].lastStudyTime = Date.now()
  } else {
    learningHistory.value.push({
      id: knowledge.id,
      name: knowledge.name,
      count: 1,
      lastStudyTime: Date.now()
    })
  }
  // 按学习次数降序排序
  learningHistory.value.sort((a, b) => b.count - a.count)
  // 保存到 localStorage
  localStorage.setItem('learningHistory', JSON.stringify(learningHistory.value))
}

// 提供给子组件使用
provide('updateLearningHistory', updateLearningHistory)

onMounted(() => {
  loadLearningHistory()
})
</script>

<style scoped>
/* ========================================
   TabPanel 容器 - 固定高度
   ======================================== */
.tab-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.tab-header {
  flex-shrink: 0;
  display: flex;
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 3px solid transparent;
  position: relative;
}

.tab-button:last-child {
  border-right: none;
}

.tab-button:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.tab-button.active {
  color: white;
  background: rgba(255, 255, 255, 0.15);
  border-bottom-color: white;
}

.tab-icon {
  font-size: 18px;
}

.history-mini-btn {
  position: absolute;
  right: 12px;
  width: 28px;
  height: 28px;
  padding: 0;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-mini-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

/* ========================================
   Tab Content - 固定高度容器
   ======================================== */
.tab-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.tab-pane {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
}

/* ========================================
   Panel Content - 统一的面板内容样式
   ======================================== */
.panel-content {
  /* 移除子组件的外层样式，让它们填充容器 */
}

.panel-content :deep(.chat-panel),
.panel-content :deep(.knowledge-selector) {
  height: 100%;
  border-radius: 0;
  box-shadow: none;
  margin: 0;
}

.panel-content :deep(.chat-panel .chat-header),
.panel-content :deep(.knowledge-selector .selector-header) {
  display: none;
}

.panel-content :deep(.chat-panel) {
  background: transparent;
}

.panel-content :deep(.knowledge-selector) {
  background: transparent;
}

/* ========================================
   学习历史对话框
   ======================================== */
.history-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.history-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.history-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f1f5f9;
  border-radius: 50%;
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #1a202c;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.history-empty {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
  font-size: 14px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: background 0.2s;
}

.history-item:hover {
  background: #f1f5f9;
}

.history-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a202c;
}

.history-item-count {
  font-size: 13px;
  color: #667eea;
  font-weight: 600;
}
</style>
