# 项目文档

## 当前维护资料

当前正式版本为 **v1.17.1**，现行玩法包括首日一涨一跌的开局突发行情、五个默认职业、每局 3 次的通商令、六个固定经营费账期、开市资金结算、两档库存清算、20 种特质商品、6 种常规上架商品、7 种生态行情上架商品、10 组完整生态事件，以及基于真实交易利润的局内成就反馈。道具卡与奇货铺已退出现行玩法。

突发新闻统一采用双基准方向冲击：当天先生成无事件行情，再让利好高于昨日实际价与无事件价、利空低于两者。该规则同时覆盖开局事件、自然突发、职业后续和赶集事件。

- [生意人纯交易量化框架](BALANCE_FRAMEWORK.md)
- [生意人纯交易基准报告 v1](balance/useless-trader-v1.md)
- [v1.4 稳定性设计](maintenance/v1.4-stability-design.md)
- [v1.4 稳定性实施记录](maintenance/v1.4-stability-plan.md)
- [GitHub 仓库维护设计](maintenance/github-maintenance-design.md)
- [GitHub 仓库维护实施记录](maintenance/github-maintenance-plan.md)

## 历史资料

`archive/` 中的内容用于保留早期设计和数据来源，可能与当前 v1.4.1 行为不完全一致：

- [早期架构文档](archive/architecture-v1.3.md)
- [旧版改动路线](archive/legacy-roadmap.md)
- [生态事件原始数据](archive/eco-event-data.txt)

