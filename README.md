# 星云智教 - 具身智能数学辅导

> 基于魔珐星云具身驱动SDK + Qwen3-VL多模态模型的AI数学辅导系统

## 项目简介

本项目参具身智能黑客松 **AI 实时交互教育赛道**，通过3D数字人AI老师提供实时交互式数学学科辅导，将抽象的数学定理与公式转化为直观易懂的语音讲解。

**核心创新：**让AI拥有"老师的身体与对话能力"，支持文字对话、图片题目上传、知识点学习等多种交互方式。

## 核心功能

- **📷 图片题目解答** - 支持上传数学题图片或输入图片URL，AI自动识别并讲解
- **💬 自然对话交互** - 文字输入，AI实时流式回复并语音讲解
- **📚 知识点学习** - 16个预置知识点，系统化专项训练
- **🎨 智能排版** - 自动分段、公式高亮、列表识别，阅读体验优秀
- **📊 学习历史追踪** - 记录学习次数，智能排序推荐

## 技术栈

- **前端框架**: Vue 3 + Vite
- **3D数字人**: 魔珐星云具身驱动SDK（JS版本）
- **AI模型**: 魔搭社区 Qwen3-VL-235B-A22B-Instruct（多模态，支持图片分析）
- **Markdown渲染**: marked（用于消息格式化）
- **UI组件**: 自定义组件

## 项目结构

```
math-tutor-ai/
├── src/
│   ├── components/          # Vue组件
│   │   ├── AvatarContainer.vue   # 数字人容器
│   │   ├── ChatPanel.vue         # 对话面板
│   │   ├── TabPanel.vue          # 标签面板（对话/知识点切换）
│   │   ├── KnowledgeSelector.vue # 知识点选择器
│   │   ├── ConfigPanel.vue       # 配置面板
│   │   └── MessageText.vue       # 消息格式化组件
│   ├── services/            # 服务层
│   │   ├── AvatarService.js      # 星云SDK封装
│   │   ├── QwenVLService.js      # Qwen3-VL多模态AI服务
│   │   └── DialogueService.js    # 对话管理
│   ├── data/                # 数据文件
│   │   └── knowledge-base.json   # 知识库（16个知识点）
│   ├── App.vue              # 根组件
│   └── main.js              # 入口文件
├── public/
│   └── data/
│       └── knowledge-base.json  # 知识库数据
├── .env                     # 环境变量
├── index.html
├── package.json
└── vite.config.js
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

`.env` 文件已配置好魔珐星云和魔搭社区的API密钥。

如需使用自己的密钥，访问配置面板：
- 星云SDK配置：App ID、App Secret
- Qwen3-VL配置：ModelScope API Key

### 3. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`

### 4. 构建生产版本

```bash
npm run build
```

## 使用说明

### 对话模式
1. **连接数字人** - 点击"连接星云老师"按钮
2. **文字提问** - 在右侧对话框输入数学问题，按Enter发送
3. **图片题目** - 点击"📷 上传"选择图片，或点击"🔗 链接"输入图片URL
4. **实时讲解** - AI会实时流式回复并语音讲解

### 知识点学习
1. **切换标签** - 点击顶部"知识点"标签
2. **选择分类** - 平面几何、立体几何、函数、微积分
3. **选择知识点** - 点击列表中的知识点
4. **开始学习** - 点击"开始学习"按钮

### 布局特点
- **左侧 40%** - 数字人区域（最小宽度 500px），突出具身智能体验
- **右侧 60%** - 对话交互区域，包含标签栏、消息列表、输入区
- **自适应高度** - 主内容区使用 `calc(100vh - 120px)` 占满可用空间

## API配置

### 魔珐星云SDK
- 官网: https://xingyun3d.com/
- 开发者文档: https://xingyun3d.com/developers/52-183

### 魔搭社区 Qwen3-VL
- 官网: https://modelscope.cn/
- 模型页面: https://modelscope.cn/models/Qwen/Qwen3-VL-235B-A22B-Instruct

## 最新更新

### v2.0.0 - 多模态升级（2025-01）
- ✅ AI模型切换至 **Qwen3-VL-235B-A22B-Instruct**
- ✅ 新增图片上传功能（本地上传 + URL输入）
- ✅ 新增消息智能格式化显示（自动分段、公式高亮、列表识别）
- ✅ 优化布局比例（40%/60%）
- ✅ 修复知识点学习功能
- ✅ 紧凑化界面设计（间距16px，优化padding）

### v1.0.0 - 初始版本
- ✅ DeepSeek-V3.2 流式对话
- ✅ 星云SDK 3D数字人驱动
- ✅ 16个预置数学知识点
- ✅ 学习历史追踪

## 开发说明

### 服务层架构

1. **AvatarService** - 封装星云SDK，提供数字人状态管理
2. **QwenVLService** - 封装Qwen3-VL多模态模型调用，支持图片和流式输出
3. **DialogueService** - 整合上述服务，实现完整对话流程

### 状态机流程

```
用户输入 → listen（倾听）→ think（思考）→ speak（讲解）→ interactive_idle（待机）
```

### 消息格式化

MessageText组件自动处理：
- 自动分段（按句子符号）
- 数学公式高亮（紫色渐变背景）
- 标题识别（`## 标题`）
- 列表识别（`1.` 或 `-` 开头）
- 加粗强调（`**加粗**`）

## License

MIT License

## 联系方式

- 邮箱：xtwork32@163.com
