// ==================== 配置 ====================
const CONFIG = {
  DAYS_LIMIT: 90,
  TARGET: 1000000,
  START_CASH: 5000,
  MARKET_SIZE: 5,
  STORAGE_FEE_PER_UNIT: 0.05,
  LOAN_INTEREST_RATE: 0.005,
  SAVE_KEY: 'trader-tycoon-save-v11'
};

const CAPACITY_LEVELS = [
  { cap: 1000, cost: 0 },
  { cap: 1600, cost: 5000 },
  { cap: 2500, cost: 20000 },
  { cap: 4000, cost: 60000 },
  { cap: 6500, cost: 150000 },
  { cap: 10000, cost: 400000 },
  { cap: 16000, cost: 1000000 }
];

// 财富里程碑：每多一个 0 提升一次评级
const MILESTONES = [
  { value: 10000,      title: '万元户',     msg: '恭喜！你的总资产突破了 1 万，已经是个像样的小商贩了。' },
  { value: 100000,     title: '小老板',     msg: '10 万！你已经有了经营一家小铺子的实力。' },
  { value: 1000000,    title: '百万富翁',   msg: '100 万！你已经迈入百万俱乐部，街上的人都开始叫你老板。' },
  { value: 10000000,   title: '千万富豪',   msg: '1000 万！这条街已经装不下你的野心了。' },
  { value: 100000000,  title: '亿万大亨',   msg: '1 亿！你的名字开始出现在商业报纸的头条。' },
  { value: 1000000000, title: '十亿巨鳄',   msg: '10 亿！你已经是传说级商人，商界开始流传你的故事。' },
  { value: 10000000000,title: '商业神话',   msg: '100 亿！这已经不是生意，这是一段传奇。' }
];

// 生态事件：全球干旱（测试期第 8 天必定触发）
const ECO_EVENTS = {
  globalDrought: {
    name: '全球干旱',
    goods: ['wheat', 'coffee', 'tea', 'wood', 'coal'],
    announce: {
      title: '国际新闻',
      desc: '全球干旱预警：主要农作物产区降雨量骤降，未来数日小麦、咖啡、茶叶、木材、煤炭价格可能出现剧烈波动。'
    },
    A: [
      {
        news: '干旱快速扩散，农作物减产预期升温，工业限电导致煤炭需求走弱。',
        mults: { wheat: 1.8, coffee: 1.7, tea: 1.6, wood: 1.4, coal: 0.6 },
        B: [
          {
            news: '虫灾爆发，农作物进一步受损，煤炭继续承压。',
            mults: { wheat: 2.8, coffee: 2.5, tea: 2.3, wood: 1.9, coal: 0.5 },
            C: [
              { news: '全球粮食危机，粮价暴涨，煤炭崩盘。', mults: { wheat: 10.0, coffee: 8.0, tea: 7.0, wood: 5.5, coal: 0.15 }, super: true },
              { news: '抢购潮后市场崩盘，农产品暴跌，煤炭反而大涨。', mults: { wheat: 0.10, coffee: 0.15, tea: 0.18, wood: 0.25, coal: 3.5 }, super: true },
              { news: '市场高位震荡，农产品维持强势，煤炭低位徘徊。', mults: { wheat: 4.5, coffee: 4.0, tea: 3.8, wood: 3.2, coal: 0.8 } }
            ]
          },
          {
            news: '水库见底，旱情彻底失控，煤炭需求进一步下滑。',
            mults: { wheat: 3.2, coffee: 2.8, tea: 2.5, wood: 2.1, coal: 0.4 },
            C: [
              { news: '粮食价格完全失控，小麦史诗级暴涨，煤炭崩盘。', mults: { wheat: 12.0, coffee: 10.0, tea: 8.5, wood: 6.5, coal: 0.10 }, super: true },
              { news: '政府紧急放水，农产品降温，煤炭小幅修复。', mults: { wheat: 4.0, coffee: 3.8, tea: 3.5, wood: 3.0, coal: 1.1 } },
              { news: '局部绝收，粮价继续走高，煤炭低迷。', mults: { wheat: 5.5, coffee: 5.0, tea: 4.5, wood: 3.8, coal: 0.4 } }
            ]
          },
          {
            news: '国际粮价联动，全球资本涌入农产品，煤炭被冷落。',
            mults: { wheat: 2.5, coffee: 2.3, tea: 2.1, wood: 1.8, coal: 0.7 },
            C: [
              { news: '全球抢粮，农产品全面暴涨，煤炭弱势。', mults: { wheat: 6.0, coffee: 5.5, tea: 5.0, wood: 4.0, coal: 0.5 } },
              { news: '国际援助到达，农产品回落，煤炭企稳。', mults: { wheat: 3.5, coffee: 3.5, tea: 3.2, wood: 2.8, coal: 1.3 } },
              { news: '多国实施贸易保护，粮价走高，煤炭受拖累。', mults: { wheat: 5.0, coffee: 4.5, tea: 4.2, wood: 3.5, coal: 0.6 } }
            ]
          }
        ]
      },
      {
        news: '局部降雨缓解旱情，农作物预期回落，木材煤炭获得喘息。',
        mults: { wheat: 0.7, coffee: 0.75, tea: 0.8, wood: 1.2, coal: 1.3 },
        B: [
          {
            news: '降雨持续，旱情基本解除，农产品大跌，煤炭走强。',
            mults: { wheat: 0.5, coffee: 0.55, tea: 0.6, wood: 0.8, coal: 1.1 },
            C: [
              { news: '旱情完全解除，农产品崩盘，煤炭大涨。', mults: { wheat: 0.10, coffee: 0.15, tea: 0.18, wood: 0.25, coal: 4.0 }, super: true },
              { news: '恢复不及预期，农产品低位震荡，煤炭维持强势。', mults: { wheat: 0.30, coffee: 0.35, tea: 0.40, wood: 0.45, coal: 2.5 } },
              { news: '天气反复，农产品重新抬头，煤炭回落。', mults: { wheat: 3.5, coffee: 3.5, tea: 3.2, wood: 2.8, coal: 0.7 } }
            ]
          },
          {
            news: '降雨短暂，旱情可能卷土重来，市场情绪反复。',
            mults: { wheat: 1.5, coffee: 1.4, tea: 1.3, wood: 0.7, coal: 1.2 },
            C: [
              { news: '干旱卷土重来，农产品暴涨，煤炭承压。', mults: { wheat: 8.0, coffee: 7.0, tea: 6.0, wood: 4.5, coal: 0.20 }, super: true },
              { news: '市场情绪反复，农产品偏强，煤炭平稳。', mults: { wheat: 4.0, coffee: 3.8, tea: 3.5, wood: 3.0, coal: 1.0 } },
              { news: '最终缓和，农产品回落，煤炭走强。', mults: { wheat: 2.5, coffee: 2.8, tea: 2.8, wood: 2.5, coal: 1.4 } }
            ]
          },
          {
            news: '降雨转为洪涝，农产品与木材受灾，煤炭需求下滑。',
            mults: { wheat: 2.0, coffee: 1.8, tea: 1.7, wood: 2.2, coal: 0.6 },
            C: [
              { news: '农产品再受重创，粮价暴涨，煤炭低迷。', mults: { wheat: 6.0, coffee: 5.5, tea: 5.0, wood: 4.5, coal: 0.3 } },
              { news: '灾后重建需求拉动木材煤炭，农产品高位。', mults: { wheat: 4.5, coffee: 4.0, tea: 4.0, wood: 6.0, coal: 2.0 } },
              { news: '市场混乱，各品种剧烈分化。', mults: { wheat: 3.0, coffee: 3.0, tea: 2.8, wood: 3.2, coal: 0.9 } }
            ]
          }
        ]
      },
      {
        news: '政府宣布关注旱情，市场预期政策干预，农产品承压，煤炭走强。',
        mults: { wheat: 1.2, coffee: 0.8, tea: 1.1, wood: 0.9, coal: 1.3 },
        B: [
          {
            news: '国家开始抛储，农产品价格被打压，煤炭受益。',
            mults: { wheat: 0.5, coffee: 0.6, tea: 0.65, wood: 0.7, coal: 1.4 },
            C: [
              { news: '价格被打压，农产品崩盘，煤炭大涨。', mults: { wheat: 0.10, coffee: 0.18, tea: 0.20, wood: 0.30, coal: 4.5 }, super: true },
              { news: '抛储力度不够，农产品反弹，煤炭回落。', mults: { wheat: 4.0, coffee: 3.8, tea: 3.5, wood: 3.0, coal: 0.9 } },
              { news: '抛储引发恐慌抢购，农产品暴涨，煤炭小涨。', mults: { wheat: 5.0, coffee: 4.5, tea: 4.2, wood: 3.5, coal: 1.2 } }
            ]
          },
          {
            news: '政府补贴农民，供给预期恢复，农产品走弱，煤炭平稳。',
            mults: { wheat: 0.9, coffee: 0.95, tea: 0.95, wood: 0.8, coal: 1.2 },
            C: [
              { news: '供给恢复，农产品回落，煤炭走强。', mults: { wheat: 0.35, coffee: 0.40, tea: 0.42, wood: 0.45, coal: 3.0 } },
              { news: '补贴不及预期，农产品偏强，煤炭回落。', mults: { wheat: 3.5, coffee: 3.5, tea: 3.2, wood: 2.8, coal: 0.8 } },
              { news: '补贴刺激种植，农产品平稳，煤炭小涨。', mults: { wheat: 2.8, coffee: 3.0, tea: 3.0, wood: 2.8, coal: 1.5 } }
            ]
          },
          {
            news: '政府考虑实施出口禁令，农产品预期走强，煤炭受拖累。',
            mults: { wheat: 2.2, coffee: 2.0, tea: 1.9, wood: 0.6, coal: 1.5 },
            C: [
              { news: '出口禁令落地，国内短缺，农产品暴涨，煤炭大跌。', mults: { wheat: 9.0, coffee: 8.0, tea: 7.0, wood: 5.0, coal: 0.20 }, super: true },
              { news: '国际抗议升级，农产品高位，煤炭修复。', mults: { wheat: 5.0, coffee: 4.5, tea: 4.2, wood: 3.5, coal: 1.0 } },
              { news: '禁令取消，农产品回落，煤炭走强。', mults: { wheat: 2.2, coffee: 2.5, tea: 2.5, wood: 2.3, coal: 2.8 } }
            ]
          }
        ]
      }
    ]
  }
};

const GOODS = [
  // 低档：便宜、频繁翻倍，前期滚雪球主力
  { id: 'wheat',  name: '小麦',  icon: '🌾', base: 5,   vol: 0.10, tier: 'low' },
  { id: 'wood',   name: '木材',  icon: '🪵', base: 8,   vol: 0.09, tier: 'low' },
  { id: 'coal',   name: '煤炭',  icon: '⛏️', base: 12,  vol: 0.08, tier: 'low' },
  { id: 'tea',    name: '茶叶',  icon: '🍵', base: 18,  vol: 0.07, tier: 'low' },
  { id: 'coffee', name: '咖啡',  icon: '☕', base: 28,  vol: 0.06, tier: 'low' },
  // 中档：价格更高，机会中等
  { id: 'copper', name: '铜',    icon: '🔩', base: 80,  vol: 0.06, tier: 'mid' },
  { id: 'oil',    name: '石油',  icon: '🛢️', base: 160, vol: 0.05, tier: 'mid' },
  { id: 'chip',   name: '芯片',  icon: '🔲', base: 320, vol: 0.04, tier: 'mid' },
  // 高档：日常也涨跌，但暴击机会更少，适合后期大资金
  { id: 'phone',  name: '手机',  icon: '📱', base: 2000, vol: 0.03, tier: 'high' },
  { id: 'gold',   name: '黄金',  icon: '🪙', base: 6000, vol: 0.02, tier: 'high' }
];

