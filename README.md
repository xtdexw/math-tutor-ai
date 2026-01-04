# 星云智教 - 具身智能数学辅导

> 基于魔珐星云具身驱动SDK + DeepSeek-V3.2 的AI数学辅导系统

## 项目简介

本项目参具身智能黑客松 **AI 实时交互教育赛道**，通过3D数字人AI老师提供实时交互式数学学科辅导，将抽象的数学定理与公式转化为直观易懂的语音讲解。

## 核心功能

- **定理可视化讲解** - 配合动画、图示讲解数学定理
- **公式推导演示** - 逐步推导复杂数学公式
- **错题智能诊断** - 分析解题思路，给出纠正建议
- **实时对话交互** - 自然语音交互，即时反馈
- **知识点专项训练** - 针对性训练模式

## 技术栈

- **前端框架**: Vue 3 + Vite
- **3D数字人**: 魔珐星云具身驱动SDK（JS版本）
- **AI模型**: 魔搭社区 DeepSeek-V3.2
- **UI组件**: 自定义组件

## 项目结构

```
math-tutor-ai/
├── src/
│   ├── components/          # Vue组件
│   │   ├── AvatarContainer.vue   # 数字人容器
│   │   ├── ChatPanel.vue         # 对话面板
│   │   └── KnowledgeSelector.vue # 知识点选择器
│   ├── services/            # 服务层
│   │   ├── AvatarService.js      # 星云SDK封装
│   │   ├── DeepSeekService.js    # AI模型服务
│   │   └── DialogueService.js    # 对话管理
│   ├── data/                # 数据文件
│   │   └── knowledge-base.json   # 知识库
│   ├── App.vue              # 根组件
│   └── main.js              # 入口文件
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

1. **启动应用** - 等待星云SDK加载完成（显示"正在连接星云老师..."）
2. **数字人欢迎** - SDK初始化完成后，数字人会自动播放欢迎语
3. **对话交互** - 在右侧对话框输入数学问题，按Enter发送
4. **知识点学习** - 点击右下角的知识点卡片，系统会进行讲解

## API配置

### 魔珐星云SDK
- 官网: https://xingyun3d.com/
- 开发者文档: https://xingyun3d.com/developers/52-183

### 魔搭社区 DeepSeek-V3.2
- 官网: https://modelscope.cn/
- 模型页面: https://modelscope.cn/models/deepseek-ai/DeepSeek-V3.2

## 开发说明

### 服务层架构

1. **AvatarService** - 封装星云SDK，提供数字人状态管理
2. **DeepSeekService** - 封装AI模型调用，支持流式输出
3. **DialogueService** - 整合上述服务，实现完整对话流程

### 状态机流程

```
用户输入 → listen → think → speak → interactive_idle
```

## License

MIT License

## 联系方式

- 邮箱：xtwork32@163.com
