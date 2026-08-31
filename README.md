# 倒卖大亨 - 模块化架构版

## 运行方式

直接用浏览器打开 `index.html` 即可，无需构建、无需服务器。

## 目录结构

```
trade-game-v2/
├── index.html          # 入口页面（只负责结构）
├── css/
│   └── style.css       # 全部样式
├── js/
│   ├── config.js       # 配置、商品、里程碑、生态事件数据
│   ├── utils.js        # 工具函数
│   ├── state.js        # 游戏状态与基础查询
│   ├── eco.js          # 生态事件辅助逻辑
│   ├── events.js       # 突发事件 + 价格更新
│   ├── trading.js      # 买卖、贷款
│   ├── game.js         # 推进日期、结算、里程碑
│   ├── save.js         # 存档/读档
│   ├── ui.js           # 渲染、弹窗、走势图、历史
│   └── main.js         # 初始化、全局交互
└── test-run.html       # 自动化冒烟测试页（可删）
```

## 模块加载顺序

```
config → utils → eco → state → events → trading → game → save → ui → main
```

- 数据与逻辑分离
- 渲染与业务分离
- 事件系统独立分块
- 所有 JS 使用经典 script 加载，支持直接 file:// 打开

## 测试

已用无头 Chrome 执行冒烟测试：
- 开始新游戏
- 连续推进 7 天
- 第 8 天成功触发生态事件 `globalDrought`
- 事件历史记录正常生成
