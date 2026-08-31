// ==================== 配置 ====================
const ULTRA_UNLOCK = 10000000;
const APP_VERSION = '1.2.0';

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
  { value: 10000000,   title: '千万富豪',   msg: '1000 万！这条街已经装不下你的野心了。解锁高价值物品：钻石、古董、航天器，以及稀世收藏热潮、太空竞赛事件。' },
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
  },
  energyCrisis: {
    name: '能源危机',
    goods: ['oil', 'coal', 'copper', 'chip', 'phone'],
    announce: { title: '国际新闻', desc: '国际能源供给中断，石油、煤炭、铜、芯片、手机价格可能出现剧烈波动。' },
    A: [
      {
        news: '能源供给中断加剧，油价煤价飙升，制造业承压。',
        mults: { oil: 1.6, coal: 1.5, copper: 1.2, chip: 0.8, phone: 0.7 },
        B: [
          { news: '主要产油国停产，能源价格失控。', mults: { oil: 2.2, coal: 2.0, copper: 1.5, chip: 0.6, phone: 0.5 }, C: [
            { news: '全球能源危机爆发，石油暴涨，电子产品崩盘。', mults: { oil: 4.0, coal: 3.5, copper: 2.5, chip: 0.3, phone: 0.2 }, super: true },
            { news: '各国紧急增产，能源回落，制造业修复。', mults: { oil: 1.5, coal: 1.6, copper: 1.3, chip: 1.1, phone: 1.0 } },
            { news: '能源高位震荡，铜受益，手机低迷。', mults: { oil: 2.0, coal: 1.9, copper: 1.8, chip: 0.8, phone: 0.7 } }
          ]},
          { news: '运输受阻，供应链进一步恶化。', mults: { oil: 2.0, coal: 1.8, copper: 1.6, chip: 0.5, phone: 0.4 }, C: [
            { news: '供应链断裂，能源与铜暴涨，科技崩盘。', mults: { oil: 3.5, coal: 3.0, copper: 2.8, chip: 0.2, phone: 0.15 }, super: true },
            { news: '临时通道恢复，价格回落。', mults: { oil: 1.4, coal: 1.4, copper: 1.3, chip: 1.0, phone: 0.9 } },
            { news: '运费高企，商品分化。', mults: { oil: 2.4, coal: 2.1, copper: 2.0, chip: 0.7, phone: 0.6 } }
          ]},
          { news: '各国释放战略储备，能源价格承压。', mults: { oil: 0.8, coal: 0.85, copper: 1.0, chip: 1.1, phone: 1.1 }, C: [
            { news: '储备释放成功，能源大跌，制造业反弹。', mults: { oil: 0.5, coal: 0.55, copper: 1.2, chip: 1.5, phone: 1.4 } },
            { news: '储备不足，能源再度上涨。', mults: { oil: 1.8, coal: 1.7, copper: 1.2, chip: 0.8, phone: 0.7 } },
            { news: '市场情绪反复，震荡收场。', mults: { oil: 1.2, coal: 1.2, copper: 1.1, chip: 1.0, phone: 1.0 } }
          ]}
        ]
      },
      {
        news: '各国释放储备，能源价格短期回落。',
        mults: { oil: 0.8, coal: 0.85, copper: 1.0, chip: 1.1, phone: 1.1 },
        B: [
          { news: '储备释放超预期，能源继续下行。', mults: { oil: 0.6, coal: 0.65, copper: 1.1, chip: 1.3, phone: 1.3 }, C: [
            { news: '能源价格崩盘，制造业狂欢。', mults: { oil: 0.3, coal: 0.35, copper: 1.5, chip: 1.8, phone: 1.7 }, super: true },
            { news: '回落趋缓，市场企稳。', mults: { oil: 0.7, coal: 0.75, copper: 1.2, chip: 1.2, phone: 1.2 } },
            { news: '政策反复，能源反弹。', mults: { oil: 1.4, coal: 1.3, copper: 1.1, chip: 0.9, phone: 0.9 } }
          ]},
          { news: '释放力度不足，市场失望。', mults: { oil: 1.2, coal: 1.2, copper: 1.0, chip: 0.9, phone: 0.9 }, C: [
            { news: '能源重新暴涨，制造业再受挫。', mults: { oil: 2.8, coal: 2.5, copper: 1.5, chip: 0.5, phone: 0.4 } },
            { news: '再度释放储备，价格回落。', mults: { oil: 1.0, coal: 1.0, copper: 1.1, chip: 1.1, phone: 1.1 } },
            { news: '高位拉锯，铜价受益。', mults: { oil: 1.6, coal: 1.5, copper: 1.8, chip: 0.8, phone: 0.7 } }
          ]},
          { news: '地缘局势缓和，能源价格平稳。', mults: { oil: 0.9, coal: 0.95, copper: 1.0, chip: 1.0, phone: 1.0 }, C: [
            { news: '和平协议达成，市场全面回暖。', mults: { oil: 0.6, coal: 0.7, copper: 1.3, chip: 1.4, phone: 1.4 } },
            { news: '局势反复，能源小幅反弹。', mults: { oil: 1.3, coal: 1.2, copper: 1.1, chip: 0.9, phone: 0.9 } },
            { news: '恢复缓慢，商品分化。', mults: { oil: 1.1, coal: 1.1, copper: 1.2, chip: 1.0, phone: 1.0 } }
          ]}
        ]
      },
      {
        news: '地缘冲突升级，能源恐慌性上涨。',
        mults: { oil: 1.8, coal: 1.6, copper: 1.3, chip: 0.7, phone: 0.6 },
        B: [
          { news: '冲突扩大，能源供给告急。', mults: { oil: 2.5, coal: 2.2, copper: 1.6, chip: 0.5, phone: 0.4 }, C: [
            { news: '全面战争风险，能源暴涨，科技崩盘。', mults: { oil: 5.0, coal: 4.5, copper: 3.0, chip: 0.2, phone: 0.15 }, super: true },
            { news: '国际调停，能源回落。', mults: { oil: 1.5, coal: 1.5, copper: 1.3, chip: 1.0, phone: 0.9 } },
            { news: '长期对峙，能源高位，铜价坚挺。', mults: { oil: 2.2, coal: 2.0, copper: 2.2, chip: 0.6, phone: 0.5 } }
          ]},
          { news: '能源设施遭袭，价格剧烈波动。', mults: { oil: 2.3, coal: 2.0, copper: 1.5, chip: 0.6, phone: 0.5 }, C: [
            { news: '设施损毁严重，能源失控。', mults: { oil: 4.5, coal: 4.0, copper: 2.5, chip: 0.3, phone: 0.2 }, super: true },
            { news: '快速修复，价格回归。', mults: { oil: 1.3, coal: 1.3, copper: 1.2, chip: 1.0, phone: 1.0 } },
            { news: '修复缓慢，高位震荡。', mults: { oil: 2.0, coal: 1.8, copper: 1.8, chip: 0.7, phone: 0.6 } }
          ]},
          { news: '冲突引发避险，黄金同涨。', mults: { oil: 1.6, coal: 1.4, copper: 1.2, chip: 0.7, phone: 0.6 }, C: [
            { news: '避险情绪退潮，能源回落。', mults: { oil: 1.0, coal: 1.0, copper: 1.1, chip: 1.0, phone: 1.0 } },
            { news: '避险持续，能源高位。', mults: { oil: 2.0, coal: 1.7, copper: 1.4, chip: 0.6, phone: 0.5 } },
            { news: '局势缓和，市场回暖。', mults: { oil: 0.8, coal: 0.85, copper: 1.2, chip: 1.3, phone: 1.3 } }
          ]}
        ]
      }
    ]
  },
  techBoom: {
    name: '科技热潮',
    goods: ['chip', 'phone', 'copper', 'gold', 'coffee'],
    announce: { title: '国际新闻', desc: '全球科技产业迎来革命性突破，芯片、手机、铜、黄金、咖啡价格可能出现剧烈波动。' },
    A: [
      {
        news: '芯片需求爆发，科技股狂欢。',
        mults: { chip: 1.7, phone: 1.5, copper: 1.4, gold: 0.9, coffee: 1.1 },
        B: [
          { news: 'AI 算力需求井喷。', mults: { chip: 2.2, phone: 1.8, copper: 1.7, gold: 0.8, coffee: 1.2 }, C: [
            { news: '科技超级周期，芯片暴涨。', mults: { chip: 5.0, phone: 3.5, copper: 3.0, gold: 0.6, coffee: 1.5 }, super: true },
            { news: '产能跟上，价格回落。', mults: { chip: 1.5, phone: 1.4, copper: 1.4, gold: 1.0, coffee: 1.1 } },
            { news: '需求持续，高位运行。', mults: { chip: 2.5, phone: 2.0, copper: 1.9, gold: 0.9, coffee: 1.2 } }
          ]},
          { news: '手机换机潮来袭。', mults: { chip: 1.6, phone: 2.0, copper: 1.5, gold: 0.9, coffee: 1.1 }, C: [
            { news: '换机潮超预期，手机暴涨。', mults: { chip: 2.0, phone: 4.0, copper: 1.8, gold: 0.8, coffee: 1.2 }, super: true },
            { news: '热度降温，价格回落。', mults: { chip: 1.2, phone: 1.3, copper: 1.2, gold: 1.0, coffee: 1.0 } },
            { news: '持续热销，高位震荡。', mults: { chip: 1.7, phone: 2.2, copper: 1.5, gold: 0.9, coffee: 1.1 } }
          ]},
          { news: '铜矿供应紧张。', mults: { chip: 1.5, phone: 1.4, copper: 1.8, gold: 1.0, coffee: 1.0 }, C: [
            { news: '铜价暴涨，科技成本承压。', mults: { chip: 1.8, phone: 1.5, copper: 3.5, gold: 1.1, coffee: 1.0 }, super: true },
            { news: '新矿投产，铜价回落。', mults: { chip: 1.3, phone: 1.3, copper: 1.4, gold: 1.0, coffee: 1.0 } },
            { news: '铜价高位，科技分化。', mults: { chip: 1.6, phone: 1.4, copper: 2.2, gold: 1.0, coffee: 1.1 } }
          ]}
        ]
      },
      {
        news: '资本过热，科技泡沫初现。',
        mults: { chip: 1.4, phone: 1.3, copper: 1.2, gold: 1.5, coffee: 1.0 },
        B: [
          { news: '投机资金疯狂涌入。', mults: { chip: 1.8, phone: 1.6, copper: 1.4, gold: 1.8, coffee: 1.0 }, C: [
            { news: '泡沫破裂，科技崩盘。', mults: { chip: 0.3, phone: 0.3, copper: 0.6, gold: 2.5, coffee: 0.9 }, super: true },
            { news: '监管介入，市场降温。', mults: { chip: 1.0, phone: 1.0, copper: 1.1, gold: 1.3, coffee: 1.0 } },
            { news: '泡沫持续，高位狂欢。', mults: { chip: 2.0, phone: 1.8, copper: 1.5, gold: 2.0, coffee: 1.1 } }
          ]},
          { news: '黄金避险需求上升。', mults: { chip: 1.2, phone: 1.1, copper: 1.1, gold: 2.0, coffee: 1.0 }, C: [
            { news: '避险狂潮，黄金暴涨。', mults: { chip: 1.0, phone: 1.0, copper: 1.2, gold: 4.0, coffee: 1.0 }, super: true },
            { news: '风险偏好回升，黄金回落。', mults: { chip: 1.4, phone: 1.3, copper: 1.3, gold: 1.3, coffee: 1.0 } },
            { news: '避险与科技拉锯。', mults: { chip: 1.3, phone: 1.2, copper: 1.2, gold: 1.8, coffee: 1.0 } }
          ]},
          { news: '咖啡消费意外走强。', mults: { chip: 1.3, phone: 1.2, copper: 1.1, gold: 1.4, coffee: 1.6 }, C: [
            { news: '咖啡热潮，价格暴涨。', mults: { chip: 1.5, phone: 1.4, copper: 1.3, gold: 1.5, coffee: 3.5 }, super: true },
            { news: '热度消退，咖啡回落。', mults: { chip: 1.2, phone: 1.2, copper: 1.1, gold: 1.3, coffee: 1.2 } },
            { news: '消费稳健，咖啡走高。', mults: { chip: 1.3, phone: 1.3, copper: 1.2, gold: 1.4, coffee: 2.0 } }
          ]}
        ]
      },
      {
        news: '监管降温，科技板块承压。',
        mults: { chip: 0.8, phone: 0.85, copper: 0.9, gold: 1.2, coffee: 1.0 },
        B: [
          { news: '反垄断调查启动。', mults: { chip: 0.6, phone: 0.65, copper: 0.8, gold: 1.4, coffee: 1.0 }, C: [
            { news: '巨额罚款，科技重挫。', mults: { chip: 0.3, phone: 0.3, copper: 0.6, gold: 2.0, coffee: 0.9 }, super: true },
            { news: '调查无果，市场回暖。', mults: { chip: 1.2, phone: 1.2, copper: 1.1, gold: 1.1, coffee: 1.0 } },
            { news: '监管长期化，科技低迷。', mults: { chip: 0.7, phone: 0.75, copper: 0.9, gold: 1.5, coffee: 1.0 } }
          ]},
          { news: '补贴退坡，成本上升。', mults: { chip: 0.7, phone: 0.7, copper: 0.9, gold: 1.3, coffee: 1.0 }, C: [
            { news: '成本压力爆发，科技大跌。', mults: { chip: 0.4, phone: 0.4, copper: 0.7, gold: 1.8, coffee: 1.0 } },
            { news: '企业消化成本，价格企稳。', mults: { chip: 1.0, phone: 1.0, copper: 1.0, gold: 1.2, coffee: 1.0 } },
            { news: '部分企业转型，铜受益。', mults: { chip: 0.9, phone: 0.9, copper: 1.5, gold: 1.3, coffee: 1.0 } }
          ]},
          { news: '消费者信心下滑。', mults: { chip: 0.8, phone: 0.8, copper: 0.9, gold: 1.4, coffee: 1.0 }, C: [
            { news: '消费寒冬，科技与咖啡齐跌。', mults: { chip: 0.5, phone: 0.5, copper: 0.7, gold: 1.6, coffee: 0.6 }, super: true },
            { news: '刺激政策出台，市场回暖。', mults: { chip: 1.2, phone: 1.2, copper: 1.1, gold: 1.1, coffee: 1.1 } },
            { news: '缓慢复苏，分化明显。', mults: { chip: 1.0, phone: 1.0, copper: 1.0, gold: 1.3, coffee: 0.9 } }
          ]}
        ]
      }
    ]
  },
  financialStorm: {
    name: '金融风暴',
    goods: ['gold', 'copper', 'oil', 'wheat', 'coffee'],
    announce: { title: '国际新闻', desc: '全球金融市场出现剧烈动荡，黄金、铜、石油、小麦、咖啡价格可能出现剧烈波动。' },
    A: [
      {
        news: '恐慌情绪蔓延，资金涌入黄金。',
        mults: { gold: 1.6, copper: 0.7, oil: 0.8, wheat: 1.2, coffee: 1.1 },
        B: [
          { news: '股市崩盘，避险情绪极端。', mults: { gold: 2.0, copper: 0.5, oil: 0.6, wheat: 1.4, coffee: 1.2 }, C: [
            { news: '金融海啸，黄金暴涨，商品崩盘。', mults: { gold: 4.5, copper: 0.3, oil: 0.3, wheat: 1.8, coffee: 1.4 }, super: true },
            { news: '央行紧急救市，市场企稳。', mults: { gold: 1.5, copper: 0.9, oil: 0.9, wheat: 1.2, coffee: 1.1 } },
            { news: '恐慌持续，黄金高位。', mults: { gold: 2.2, copper: 0.6, oil: 0.7, wheat: 1.4, coffee: 1.2 } }
          ]},
          { news: '大宗商品遭抛售。', mults: { gold: 1.7, copper: 0.4, oil: 0.5, wheat: 1.3, coffee: 1.1 }, C: [
            { news: '商品崩盘，黄金独涨。', mults: { gold: 3.5, copper: 0.2, oil: 0.2, wheat: 1.5, coffee: 1.2 }, super: true },
            { news: '超跌反弹，商品修复。', mults: { gold: 1.4, copper: 1.0, oil: 1.0, wheat: 1.1, coffee: 1.0 } },
            { news: '抛售持续，分化加剧。', mults: { gold: 2.0, copper: 0.5, oil: 0.6, wheat: 1.3, coffee: 1.1 } }
          ]},
          { news: '农产品成避风港。', mults: { gold: 1.5, copper: 0.7, oil: 0.8, wheat: 1.6, coffee: 1.5 }, C: [
            { news: '粮食危机担忧，农产品暴涨。', mults: { gold: 1.8, copper: 0.6, oil: 0.7, wheat: 3.5, coffee: 3.0 }, super: true },
            { news: '情绪缓和，农产品回落。', mults: { gold: 1.3, copper: 0.9, oil: 0.9, wheat: 1.2, coffee: 1.2 } },
            { news: '避险持续，农产品走强。', mults: { gold: 1.6, copper: 0.7, oil: 0.8, wheat: 2.0, coffee: 1.8 } }
          ]}
        ]
      },
      {
        news: '央行救市，市场暂时企稳。',
        mults: { gold: 1.2, copper: 1.1, oil: 1.0, wheat: 1.0, coffee: 1.0 },
        B: [
          { news: '降息预期升温。', mults: { gold: 1.5, copper: 1.2, oil: 1.1, wheat: 1.0, coffee: 1.0 }, C: [
            { news: '流动性泛滥，黄金铜齐涨。', mults: { gold: 2.5, copper: 2.0, oil: 1.3, wheat: 1.1, coffee: 1.1 }, super: true },
            { news: '预期落空，市场回落。', mults: { gold: 1.0, copper: 0.9, oil: 0.9, wheat: 1.0, coffee: 1.0 } },
            { news: '宽松持续，商品温和上涨。', mults: { gold: 1.6, copper: 1.4, oil: 1.2, wheat: 1.1, coffee: 1.1 } }
          ]},
          { news: '财政刺激出台。', mults: { gold: 1.1, copper: 1.3, oil: 1.2, wheat: 1.1, coffee: 1.0 }, C: [
            { news: '基建拉动，铜油大涨。', mults: { gold: 1.2, copper: 2.8, oil: 2.2, wheat: 1.2, coffee: 1.1 }, super: true },
            { news: '刺激不及预期，商品回落。', mults: { gold: 1.0, copper: 1.0, oil: 1.0, wheat: 1.0, coffee: 1.0 } },
            { news: '经济复苏，商品普涨。', mults: { gold: 1.3, copper: 1.8, oil: 1.5, wheat: 1.2, coffee: 1.1 } }
          ]},
          { news: '银行危机隐现。', mults: { gold: 1.6, copper: 0.8, oil: 0.8, wheat: 1.1, coffee: 1.0 }, C: [
            { news: '银行倒闭潮，黄金暴涨。', mults: { gold: 3.5, copper: 0.4, oil: 0.5, wheat: 1.4, coffee: 1.1 }, super: true },
            { news: '政府担保，危机缓解。', mults: { gold: 1.2, copper: 1.0, oil: 1.0, wheat: 1.0, coffee: 1.0 } },
            { news: '危机反复，黄金走强。', mults: { gold: 2.0, copper: 0.7, oil: 0.8, wheat: 1.2, coffee: 1.1 } }
          ]}
        ]
      },
      {
        news: '信用危机爆发，市场剧烈分化。',
        mults: { gold: 1.8, copper: 0.6, oil: 0.7, wheat: 1.3, coffee: 1.2 },
        B: [
          { news: '债务违约潮。', mults: { gold: 2.2, copper: 0.4, oil: 0.5, wheat: 1.5, coffee: 1.3 }, C: [
            { news: '全面违约，黄金暴涨，商品崩盘。', mults: { gold: 5.0, copper: 0.2, oil: 0.2, wheat: 1.8, coffee: 1.5 }, super: true },
            { news: '国际援助，市场恢复。', mults: { gold: 1.4, copper: 0.9, oil: 0.9, wheat: 1.2, coffee: 1.1 } },
            { news: '违约持续，黄金高位。', mults: { gold: 2.5, copper: 0.5, oil: 0.6, wheat: 1.5, coffee: 1.3 } }
          ]},
          { news: '货币贬值担忧。', mults: { gold: 2.0, copper: 0.7, oil: 0.8, wheat: 1.4, coffee: 1.2 }, C: [
            { news: '恶性通胀，黄金与粮食暴涨。', mults: { gold: 4.0, copper: 0.8, oil: 1.2, wheat: 3.0, coffee: 2.5 }, super: true },
            { news: '汇率稳定，市场回稳。', mults: { gold: 1.3, copper: 1.0, oil: 1.0, wheat: 1.1, coffee: 1.1 } },
            { news: '贬值持续，黄金走强。', mults: { gold: 2.4, copper: 0.7, oil: 0.9, wheat: 1.6, coffee: 1.4 } }
          ]},
          { news: '新兴市场遭重创。', mults: { gold: 1.7, copper: 0.5, oil: 0.6, wheat: 1.3, coffee: 1.2 }, C: [
            { news: '新兴市场崩盘，黄金独涨。', mults: { gold: 3.8, copper: 0.3, oil: 0.4, wheat: 1.6, coffee: 1.4 }, super: true },
            { news: '救助计划出台，市场反弹。', mults: { gold: 1.3, copper: 0.9, oil: 0.9, wheat: 1.1, coffee: 1.0 } },
            { news: '危机蔓延，分化加剧。', mults: { gold: 2.2, copper: 0.5, oil: 0.6, wheat: 1.4, coffee: 1.2 } }
          ]}
        ]
      }
    ]
  },
  supplyChain: {
    name: '供应链断裂',
    goods: ['chip', 'phone', 'wood', 'coffee', 'oil'],
    announce: { title: '国际新闻', desc: '全球供应链遭遇严重中断，芯片、手机、木材、咖啡、石油价格可能出现剧烈波动。' },
    A: [
      {
        news: '港口停摆，物流全面受阻。',
        mults: { chip: 1.5, phone: 1.4, wood: 1.3, coffee: 1.2, oil: 1.4 },
        B: [
          { news: '主要港口持续关闭。', mults: { chip: 1.8, phone: 1.7, wood: 1.6, coffee: 1.4, oil: 1.7 }, C: [
            { news: '供应链崩溃，商品暴涨。', mults: { chip: 3.5, phone: 3.0, wood: 3.0, coffee: 2.5, oil: 3.0 }, super: true },
            { news: '部分港口恢复，价格回落。', mults: { chip: 1.2, phone: 1.2, wood: 1.2, coffee: 1.1, oil: 1.2 } },
            { news: '停摆持续，高位运行。', mults: { chip: 2.0, phone: 1.9, wood: 1.8, coffee: 1.5, oil: 1.8 } }
          ]},
          { news: '卡车司机罢工。', mults: { chip: 1.4, phone: 1.3, wood: 1.5, coffee: 1.3, oil: 1.5 }, C: [
            { news: '罢工蔓延，运输瘫痪。', mults: { chip: 2.2, phone: 2.0, wood: 2.8, coffee: 2.0, oil: 2.5 }, super: true },
            { news: '工资协议达成，运输恢复。', mults: { chip: 1.0, phone: 1.0, wood: 1.0, coffee: 1.0, oil: 1.0 } },
            { news: '谈判僵持，价格走高。', mults: { chip: 1.6, phone: 1.5, wood: 1.8, coffee: 1.4, oil: 1.7 } }
          ]},
          { news: '集装箱严重短缺。', mults: { chip: 1.6, phone: 1.5, wood: 1.4, coffee: 1.3, oil: 1.4 }, C: [
            { news: '一箱难求，运费暴涨。', mults: { chip: 2.5, phone: 2.2, wood: 2.0, coffee: 1.8, oil: 1.8 }, super: true },
            { news: '新箱投放，压力缓解。', mults: { chip: 1.1, phone: 1.1, wood: 1.1, coffee: 1.1, oil: 1.1 } },
            { news: '短缺持续，高位震荡。', mults: { chip: 1.8, phone: 1.6, wood: 1.5, coffee: 1.4, oil: 1.5 } }
          ]}
        ]
      },
      {
        news: '物流逐步恢复，价格开始回落。',
        mults: { chip: 0.9, phone: 0.95, wood: 0.9, coffee: 1.0, oil: 0.9 },
        B: [
          { news: '港口复工顺利。', mults: { chip: 0.8, phone: 0.85, wood: 0.8, coffee: 0.9, oil: 0.8 }, C: [
            { news: '供应恢复，商品大跌。', mults: { chip: 0.5, phone: 0.5, wood: 0.5, coffee: 0.6, oil: 0.5 }, super: true },
            { news: '恢复缓慢，价格企稳。', mults: { chip: 0.9, phone: 0.95, wood: 0.9, coffee: 0.95, oil: 0.9 } },
            { news: '需求强劲，价格反弹。', mults: { chip: 1.3, phone: 1.2, wood: 1.1, coffee: 1.1, oil: 1.1 } }
          ]},
          { news: '运费回落。', mults: { chip: 0.85, phone: 0.9, wood: 0.85, coffee: 0.95, oil: 0.85 }, C: [
            { news: '运费崩盘，商品成本大降。', mults: { chip: 0.6, phone: 0.6, wood: 0.6, coffee: 0.7, oil: 0.6 }, super: true },
            { news: '运费企稳，市场平稳。', mults: { chip: 1.0, phone: 1.0, wood: 1.0, coffee: 1.0, oil: 1.0 } },
            { news: '需求回升，商品走强。', mults: { chip: 1.2, phone: 1.2, wood: 1.1, coffee: 1.1, oil: 1.1 } }
          ]},
          { news: '新航线开通。', mults: { chip: 0.9, phone: 0.95, wood: 0.9, coffee: 0.95, oil: 0.9 }, C: [
            { news: '运力大增，商品回落。', mults: { chip: 0.7, phone: 0.75, wood: 0.7, coffee: 0.8, oil: 0.7 } },
            { news: '新航线遇阻，价格反弹。', mults: { chip: 1.3, phone: 1.2, wood: 1.2, coffee: 1.1, oil: 1.2 } },
            { news: '平稳运行，小幅波动。', mults: { chip: 1.0, phone: 1.0, wood: 1.0, coffee: 1.0, oil: 1.0 } }
          ]}
        ]
      },
      {
        news: '运费暴涨，成本推动价格上行。',
        mults: { chip: 1.3, phone: 1.2, wood: 1.5, coffee: 1.1, oil: 1.6 },
        B: [
          { news: '燃油价格大涨。', mults: { chip: 1.4, phone: 1.3, wood: 1.6, coffee: 1.2, oil: 2.0 }, C: [
            { news: '能源与运输双重危机。', mults: { chip: 2.2, phone: 2.0, wood: 2.8, coffee: 1.8, oil: 4.0 }, super: true },
            { news: '油价回落，运输成本下降。', mults: { chip: 1.0, phone: 1.0, wood: 1.2, coffee: 1.0, oil: 1.1 } },
            { news: '成本高位，商品分化。', mults: { chip: 1.5, phone: 1.4, wood: 1.8, coffee: 1.3, oil: 2.2 } }
          ]},
          { news: '港口拥堵加剧。', mults: { chip: 1.5, phone: 1.4, wood: 1.7, coffee: 1.3, oil: 1.5 }, C: [
            { news: '拥堵失控，商品暴涨。', mults: { chip: 2.8, phone: 2.5, wood: 3.0, coffee: 2.0, oil: 2.5 }, super: true },
            { news: '拥堵缓解，价格回落。', mults: { chip: 1.0, phone: 1.0, wood: 1.2, coffee: 1.0, oil: 1.1 } },
            { news: '持续拥堵，高位运行。', mults: { chip: 1.8, phone: 1.6, wood: 2.0, coffee: 1.4, oil: 1.7 } }
          ]},
          { news: '空运替代增加。', mults: { chip: 1.3, phone: 1.3, wood: 1.4, coffee: 1.2, oil: 1.4 }, C: [
            { news: '空运成本高企，商品继续涨。', mults: { chip: 2.0, phone: 1.9, wood: 2.0, coffee: 1.6, oil: 1.8 } },
            { news: '海运恢复，空运退潮。', mults: { chip: 1.0, phone: 1.0, wood: 1.1, coffee: 1.0, oil: 1.1 } },
            { news: '混合运输，价格温和。', mults: { chip: 1.4, phone: 1.3, wood: 1.5, coffee: 1.2, oil: 1.4 } }
          ]}
        ]
      }
    ]
  },
  collectorCraze: {
    name: '稀世收藏热潮',
    unlock: 10000000,
    goods: ['antique', 'diamond', 'gold', 'phone', 'coffee'],
    announce: { title: '国际新闻', desc: '全球富豪涌入收藏品市场，古董、钻石、黄金、手机、咖啡价格可能出现剧烈波动。' },
    A: [
      {
        news: '顶级拍卖行成交价屡创新高，收藏品热度升温。',
        mults: { antique: 1.5, diamond: 1.4, gold: 1.2, phone: 0.8, coffee: 0.9 },
        B: [
          { news: '亚洲买家疯狂扫货，古董钻石暴涨。', mults: { antique: 2.5, diamond: 2.2, gold: 1.4, phone: 0.6, coffee: 0.8 }, C: [
            { news: '收藏品超级牛市，古董钻石史诗级暴涨。', mults: { antique: 8.0, diamond: 7.0, gold: 2.0, phone: 0.4, coffee: 0.7 }, super: true },
            { news: '热度回落，收藏品高位震荡。', mults: { antique: 1.8, diamond: 1.7, gold: 1.2, phone: 0.9, coffee: 1.0 } },
            { news: '泡沫破裂，古董钻石崩盘。', mults: { antique: 0.3, diamond: 0.35, gold: 1.1, phone: 1.2, coffee: 1.1 }, super: true }
          ]},
          { news: '市场传言有假货，收藏品遭抛售。', mults: { antique: 0.7, diamond: 0.75, gold: 1.1, phone: 1.1, coffee: 1.0 }, C: [
            { news: '假货风波持续，古董钻石大跌。', mults: { antique: 0.3, diamond: 0.35, gold: 1.2, phone: 1.2, coffee: 1.0 } },
            { news: '鉴定澄清，价格修复。', mults: { antique: 1.2, diamond: 1.2, gold: 1.1, phone: 1.0, coffee: 1.0 } },
            { news: '恐慌蔓延，收藏品长期低迷。', mults: { antique: 0.4, diamond: 0.45, gold: 1.3, phone: 1.1, coffee: 1.0 } }
          ]},
          { news: '高净值人群资产配置转向收藏品。', mults: { antique: 2.0, diamond: 1.8, gold: 1.3, phone: 0.7, coffee: 0.9 }, C: [
            { news: '配置需求爆发，古董钻石大涨。', mults: { antique: 5.0, diamond: 4.5, gold: 1.8, phone: 0.6, coffee: 0.8 }, super: true },
            { news: '配置趋缓，价格平稳。', mults: { antique: 1.4, diamond: 1.4, gold: 1.2, phone: 0.9, coffee: 1.0 } },
            { news: '资金撤离，收藏品回落。', mults: { antique: 0.6, diamond: 0.65, gold: 1.0, phone: 1.1, coffee: 1.1 } }
          ]}
        ]
      },
      {
        news: '拍卖行供应增加，市场开始降温。',
        mults: { antique: 0.8, diamond: 0.85, gold: 1.0, phone: 1.1, coffee: 1.0 },
        B: [
          { news: '大量藏品涌入市场。', mults: { antique: 0.6, diamond: 0.65, gold: 0.9, phone: 1.2, coffee: 1.1 }, C: [
            { news: '供过于求，古董钻石大跌。', mults: { antique: 0.3, diamond: 0.35, gold: 0.8, phone: 1.3, coffee: 1.2 }, super: true },
            { news: '部分精品仍受追捧。', mults: { antique: 1.1, diamond: 1.0, gold: 1.0, phone: 1.1, coffee: 1.0 } },
            { news: '市场长期低迷，收藏品阴跌。', mults: { antique: 0.4, diamond: 0.45, gold: 0.9, phone: 1.2, coffee: 1.1 } }
          ]},
          { news: '经济下行，奢侈品消费萎缩。', mults: { antique: 0.5, diamond: 0.55, gold: 1.2, phone: 0.8, coffee: 0.9 }, C: [
            { news: '消费寒冬，古董钻石崩盘。', mults: { antique: 0.2, diamond: 0.25, gold: 1.5, phone: 0.6, coffee: 0.8 }, super: true },
            { news: '刺激政策出台，消费回暖。', mults: { antique: 1.0, diamond: 1.0, gold: 1.1, phone: 1.1, coffee: 1.1 } },
            { news: '缓慢恢复，收藏品仍弱。', mults: { antique: 0.6, diamond: 0.65, gold: 1.2, phone: 0.9, coffee: 1.0 } }
          ]},
          { news: '投机资金退潮。', mults: { antique: 0.7, diamond: 0.75, gold: 1.1, phone: 1.0, coffee: 1.0 }, C: [
            { news: '资金撤离，收藏品大跌。', mults: { antique: 0.35, diamond: 0.4, gold: 1.2, phone: 1.0, coffee: 1.0 } },
            { news: '长线资金接盘，价格企稳。', mults: { antique: 1.2, diamond: 1.2, gold: 1.1, phone: 1.0, coffee: 1.0 } },
            { news: '市场冷清，阴跌不止。', mults: { antique: 0.5, diamond: 0.55, gold: 1.1, phone: 1.0, coffee: 1.0 } }
          ]}
        ]
      },
      {
        news: '监管关注收藏品市场，政策风险上升。',
        mults: { antique: 0.9, diamond: 0.9, gold: 1.3, phone: 1.0, coffee: 1.0 },
        B: [
          { news: '拟征收收藏品交易税。', mults: { antique: 0.6, diamond: 0.65, gold: 1.4, phone: 1.0, coffee: 1.0 }, C: [
            { news: '重税落地，古董钻石崩盘。', mults: { antique: 0.2, diamond: 0.25, gold: 1.6, phone: 1.0, coffee: 1.0 }, super: true },
            { news: '税率低于预期，市场回暖。', mults: { antique: 1.3, diamond: 1.3, gold: 1.2, phone: 1.0, coffee: 1.0 } },
            { news: '政策悬而未决，市场低迷。', mults: { antique: 0.5, diamond: 0.55, gold: 1.3, phone: 1.0, coffee: 1.0 } }
          ]},
          { news: '反洗钱调查波及拍卖行。', mults: { antique: 0.7, diamond: 0.75, gold: 1.4, phone: 0.9, coffee: 0.9 }, C: [
            { news: '调查扩大，收藏品重挫。', mults: { antique: 0.3, diamond: 0.35, gold: 1.5, phone: 0.8, coffee: 0.9 } },
            { news: '调查结束，市场恢复。', mults: { antique: 1.2, diamond: 1.2, gold: 1.2, phone: 1.0, coffee: 1.0 } },
            { news: '监管常态化，收藏品承压。', mults: { antique: 0.5, diamond: 0.55, gold: 1.3, phone: 0.9, coffee: 1.0 } }
          ]},
          { news: '央行提示收藏品泡沫风险。', mults: { antique: 0.8, diamond: 0.85, gold: 1.3, phone: 1.0, coffee: 1.0 }, C: [
            { news: '警告引发抛售，古董钻石大跌。', mults: { antique: 0.35, diamond: 0.4, gold: 1.5, phone: 1.0, coffee: 1.0 } },
            { news: '市场无视警告，继续上涨。', mults: { antique: 2.2, diamond: 2.0, gold: 1.4, phone: 0.9, coffee: 1.0 } },
            { news: '情绪谨慎，高位震荡。', mults: { antique: 1.0, diamond: 1.0, gold: 1.2, phone: 1.0, coffee: 1.0 } }
          ]}
        ]
      }
    ]
  },
  spaceRace: {
    name: '太空竞赛',
    unlock: 10000000,
    goods: ['spacecraft', 'chip', 'copper', 'oil', 'gold'],
    announce: { title: '国际新闻', desc: '大国重启太空竞赛，航天器、芯片、铜、石油、黄金价格可能出现剧烈波动。' },
    A: [
      {
        news: '多国宣布载人登月计划，航天需求爆发。',
        mults: { spacecraft: 1.6, chip: 1.4, copper: 1.3, oil: 1.2, gold: 1.1 },
        B: [
          { news: '订单量超预期，航天器暴涨。', mults: { spacecraft: 3.0, chip: 1.8, copper: 1.6, oil: 1.3, gold: 1.2 }, C: [
            { news: '太空竞赛白热化，航天器史诗级暴涨。', mults: { spacecraft: 12.0, chip: 3.5, copper: 3.0, oil: 2.0, gold: 1.5 }, super: true },
            { news: '订单落地缓慢，价格回落。', mults: { spacecraft: 1.5, chip: 1.3, copper: 1.3, oil: 1.1, gold: 1.1 } },
            { news: '多国竞争持续，高位震荡。', mults: { spacecraft: 2.5, chip: 1.6, copper: 1.5, oil: 1.2, gold: 1.2 } }
          ]},
          { news: '火箭发射失败，市场恐慌。', mults: { spacecraft: 0.7, chip: 0.9, copper: 1.0, oil: 1.1, gold: 1.4 }, C: [
            { news: '连续失败，航天器崩盘。', mults: { spacecraft: 0.2, chip: 0.7, copper: 0.8, oil: 1.2, gold: 1.8 }, super: true },
            { news: '技术修复，市场回暖。', mults: { spacecraft: 1.4, chip: 1.2, copper: 1.2, oil: 1.1, gold: 1.2 } },
            { news: '进度延期，航天器阴跌。', mults: { spacecraft: 0.5, chip: 0.9, copper: 1.0, oil: 1.1, gold: 1.3 } }
          ]},
          { news: '私营航天公司崛起。', mults: { spacecraft: 2.0, chip: 1.5, copper: 1.4, oil: 1.2, gold: 1.0 }, C: [
            { news: '私营资本涌入，航天器暴涨。', mults: { spacecraft: 6.0, chip: 2.2, copper: 2.0, oil: 1.4, gold: 1.1 }, super: true },
            { news: '竞争加剧，价格分化。', mults: { spacecraft: 1.8, chip: 1.4, copper: 1.4, oil: 1.1, gold: 1.0 } },
            { news: '资本退潮，航天器回落。', mults: { spacecraft: 0.8, chip: 1.0, copper: 1.1, oil: 1.0, gold: 1.1 } }
          ]}
        ]
      },
      {
        news: '预算削减，太空项目降温。',
        mults: { spacecraft: 0.7, chip: 0.9, copper: 0.9, oil: 0.9, gold: 1.2 },
        B: [
          { news: '多国取消部分计划。', mults: { spacecraft: 0.4, chip: 0.7, copper: 0.8, oil: 0.8, gold: 1.4 }, C: [
            { news: '项目大规模取消，航天器崩盘。', mults: { spacecraft: 0.15, chip: 0.5, copper: 0.6, oil: 0.7, gold: 1.8 }, super: true },
            { news: '保留核心计划，价格企稳。', mults: { spacecraft: 1.0, chip: 0.9, copper: 0.9, oil: 0.9, gold: 1.2 } },
            { news: '持续削减，长期低迷。', mults: { spacecraft: 0.4, chip: 0.7, copper: 0.7, oil: 0.8, gold: 1.4 } }
          ]},
          { news: '芯片出口管制加剧。', mults: { spacecraft: 0.6, chip: 0.5, copper: 0.8, oil: 0.9, gold: 1.5 }, C: [
            { news: '管制升级，航天器与芯片双崩。', mults: { spacecraft: 0.2, chip: 0.2, copper: 0.6, oil: 0.8, gold: 2.0 }, super: true },
            { news: '管制缓和，市场修复。', mults: { spacecraft: 1.2, chip: 1.2, copper: 1.1, oil: 1.0, gold: 1.2 } },
            { news: '长期限制，航天承压。', mults: { spacecraft: 0.5, chip: 0.5, copper: 0.8, oil: 0.9, gold: 1.5 } }
          ]},
          { news: '经济衰退影响航天投入。', mults: { spacecraft: 0.6, chip: 0.7, copper: 0.7, oil: 0.7, gold: 1.4 }, C: [
            { news: '衰退加深，航天器大跌。', mults: { spacecraft: 0.25, chip: 0.5, copper: 0.5, oil: 0.6, gold: 1.8 } },
            { news: '财政刺激，项目重启。', mults: { spacecraft: 1.5, chip: 1.2, copper: 1.2, oil: 1.1, gold: 1.1 } },
            { news: '复苏缓慢，低位徘徊。', mults: { spacecraft: 0.7, chip: 0.8, copper: 0.8, oil: 0.8, gold: 1.3 } }
          ]}
        ]
      },
      {
        news: '技术突破，太空经济进入新阶段。',
        mults: { spacecraft: 1.8, chip: 1.6, copper: 1.5, oil: 1.3, gold: 1.2 },
        B: [
          { news: '可回收火箭成本大降。', mults: { spacecraft: 2.5, chip: 1.8, copper: 1.7, oil: 1.3, gold: 1.1 }, C: [
            { news: '成本革命，航天器暴涨。', mults: { spacecraft: 8.0, chip: 2.5, copper: 2.2, oil: 1.5, gold: 1.2 }, super: true },
            { news: '技术扩散，价格回落。', mults: { spacecraft: 1.5, chip: 1.4, copper: 1.4, oil: 1.1, gold: 1.1 } },
            { news: '竞争加剧，高位震荡。', mults: { spacecraft: 2.2, chip: 1.6, copper: 1.5, oil: 1.2, gold: 1.1 } }
          ]},
          { news: '太空采矿概念升温。', mults: { spacecraft: 2.0, chip: 1.5, copper: 2.0, oil: 1.2, gold: 1.3 }, C: [
            { news: '采矿预期爆发，航天器与铜暴涨。', mults: { spacecraft: 7.0, chip: 2.0, copper: 4.5, oil: 1.5, gold: 1.5 }, super: true },
            { news: '预期降温，价格回落。', mults: { spacecraft: 1.2, chip: 1.2, copper: 1.8, oil: 1.1, gold: 1.2 } },
            { news: '长期故事，高位运行。', mults: { spacecraft: 2.5, chip: 1.5, copper: 2.5, oil: 1.2, gold: 1.3 } }
          ]},
          { news: '国际竞争引发黄金避险。', mults: { spacecraft: 1.6, chip: 1.4, copper: 1.4, oil: 1.2, gold: 2.0 }, C: [
            { news: '地缘紧张，黄金暴涨，航天分化。', mults: { spacecraft: 2.0, chip: 1.5, copper: 1.5, oil: 1.4, gold: 6.0 }, super: true },
            { news: '局势缓和，黄金回落。', mults: { spacecraft: 1.4, chip: 1.3, copper: 1.3, oil: 1.1, gold: 1.3 } },
            { news: '长期博弈，多品高位。', mults: { spacecraft: 1.8, chip: 1.4, copper: 1.4, oil: 1.2, gold: 2.5 } }
          ]}
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
  { id: 'gold',   name: '黄金',  icon: '🪙', base: 6000, vol: 0.02, tier: 'high' },
  // 超高价值：后期解锁，跌多涨少，一涨很夸张
  { id: 'diamond', name: '钻石', icon: '💎', base: 30000, vol: 0.015, tier: 'ultra' },
  { id: 'antique', name: '古董', icon: '🏺', base: 120000, vol: 0.012, tier: 'ultra' },
  { id: 'spacecraft', name: '航天器', icon: '🚀', base: 500000, vol: 0.010, tier: 'ultra' }
];

