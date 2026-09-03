// ==================== 配置 ====================
const ULTRA_UNLOCK = 10000000;
const APP_VERSION = '1.16.0';

const CONFIG = {
  DAYS_LIMIT: 90,
  TARGET: 1000000,
  START_CASH: 5000,
  MARKET_SIZE: 6,
  ECO_MARKET_SIZE: 7,
  SAVE_KEY: 'trader-tycoon-save-v17',
  PROFILE_SAVE_KEY: 'trader-tycoon-profile-v1'
};

// 纯交易规则的可校准参数；仓储费率保留 v1.8.0 的实际结算值。
const BALANCE_CONFIG = {
  OPERATING_COST_STAGES: Object.freeze([
    Object.freeze({ startDay: 1, endDay: 15, base: 80, growth: 1 }),
    Object.freeze({ startDay: 16, endDay: 30, base: 320, growth: 1 }),
    Object.freeze({ startDay: 31, endDay: 45, base: 1600, growth: 1 }),
    Object.freeze({ startDay: 46, endDay: 60, base: 8000, growth: 1 }),
    Object.freeze({ startDay: 61, endDay: 75, base: 32000, growth: 1 }),
    Object.freeze({ startDay: 76, endDay: 90, base: 115200, growth: 1 })
  ]),
  OPERATING_COST_TOTAL: 2358000,
  OPERATING_COST_MULTIPLIER: 1,
  STORAGE_FEE_RATE: 0.001,
  LIQUIDATION_RATE: 1,
  ALLOW_OFF_MARKET_LIQUIDATION: true,
  OFF_MARKET_LIQUIDATION_RATE: 0.20,
  ECO_EVENT_CHANCE: 0.20,
  NATURAL_VOLATILITY_SCALE: 1,
  SUDDEN_EVENT_SCALE: 1.30,
  ECO_EVENT_SCALE: 0.92
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
  "globalDrought": {
    "name": "全球干旱",
    "unlock": 0,
    "goods": [
      "wheat",
      "coffee",
      "tea",
      "coal"
    ],
    "announce": {
      "title": "国际新闻",
      "desc": "全球干旱预警：主要农作物产区降雨量骤降，未来数日小麦、咖啡、茶叶、煤炭价格可能出现剧烈波动。"
    },
    "A": [
      {
        "news": "干旱快速扩散，农作物减产预期升温，工业限电导致煤炭需求走弱。",
        "mults": {
          "wheat": 3.45,
          "coffee": 3.92,
          "tea": 3.23,
          "coal": 0.22
        },
        "B": [
          {
            "news": "虫灾爆发，农作物进一步受损，煤炭继续承压。",
            "mults": {
              "wheat": 5.84,
              "coffee": 6.21,
              "tea": 7.35,
              "coal": 0.13
            },
            "C": [
              {
                "news": "全球粮食危机，粮价暴涨，煤炭崩盘。",
                "super": true,
                "mults": {
                  "wheat": 22.21,
                  "coffee": 23.02,
                  "tea": 21.44,
                  "coal": 0.03
                }
              },
              {
                "news": "抢购潮后市场崩盘，农产品暴跌，煤炭反而大涨。",
                "super": true,
                "mults": {
                  "wheat": 0.07,
                  "coffee": 0.06,
                  "tea": 0.03,
                  "coal": 22.18
                }
              },
              {
                "news": "市场高位震荡，农产品维持强势，煤炭低位徘徊。",
                "super": false,
                "mults": {
                  "wheat": 14.57,
                  "coffee": 8.7,
                  "tea": 13.53,
                  "coal": 0.08
                }
              }
            ]
          },
          {
            "news": "水库见底，旱情彻底失控，煤炭需求进一步下滑。",
            "mults": {
              "wheat": 6.35,
              "coffee": 6.35,
              "tea": 6.55,
              "coal": 0.13
            },
            "C": [
              {
                "news": "粮食价格完全失控，小麦史诗级暴涨，煤炭崩盘。",
                "super": true,
                "mults": {
                  "wheat": 22.82,
                  "coffee": 16.07,
                  "tea": 18.77,
                  "coal": 0.05
                }
              },
              {
                "news": "政府紧急放水，农产品降温，煤炭小幅修复。",
                "super": false,
                "mults": {
                  "wheat": 12.39,
                  "coffee": 10.11,
                  "tea": 12.2,
                  "coal": 11.52
                }
              },
              {
                "news": "局部绝收，粮价继续走高，煤炭低迷。",
                "super": false,
                "mults": {
                  "wheat": 12.03,
                  "coffee": 8.72,
                  "tea": 9.81,
                  "coal": 0.07
                }
              }
            ]
          },
          {
            "news": "国际粮价联动，全球资本涌入农产品，煤炭被冷落。",
            "mults": {
              "wheat": 7.53,
              "coffee": 5.95,
              "tea": 6.95,
              "coal": 0.12
            },
            "C": [
              {
                "news": "全球抢粮，农产品全面暴涨，煤炭弱势。",
                "super": false,
                "mults": {
                  "wheat": 12.02,
                  "coffee": 10.63,
                  "tea": 10.9,
                  "coal": 0.08
                }
              },
              {
                "news": "国际援助到达，农产品回落，煤炭企稳。",
                "super": false,
                "mults": {
                  "wheat": 12.48,
                  "coffee": 10.12,
                  "tea": 12.79,
                  "coal": 11.72
                }
              },
              {
                "news": "多国实施贸易保护，粮价走高，煤炭受拖累。",
                "super": false,
                "mults": {
                  "wheat": 9.25,
                  "coffee": 14.87,
                  "tea": 13.43,
                  "coal": 0.06
                }
              }
            ]
          }
        ]
      },
      {
        "news": "局部降雨缓解旱情，农作物预期回落，木材煤炭获得喘息。",
        "mults": {
          "wheat": 0.28,
          "coffee": 0.22,
          "tea": 0.29,
          "coal": 3.08
        },
        "B": [
          {
            "news": "降雨持续，旱情基本解除，农产品大跌，煤炭走强。",
            "mults": {
              "wheat": 0.11,
              "coffee": 0.09,
              "tea": 0.09,
              "coal": 5.09
            },
            "C": [
              {
                "news": "旱情完全解除，农产品崩盘，煤炭大涨。",
                "super": true,
                "mults": {
                  "wheat": 0.03,
                  "coffee": 0.05,
                  "tea": 0.08,
                  "coal": 17.66
                }
              },
              {
                "news": "恢复不及预期，农产品低位震荡，煤炭维持强势。",
                "super": false,
                "mults": {
                  "wheat": 0.06,
                  "coffee": 0.06,
                  "tea": 0.1,
                  "coal": 10.28
                }
              },
              {
                "news": "天气反复，农产品重新抬头，煤炭回落。",
                "super": false,
                "mults": {
                  "wheat": 8.59,
                  "coffee": 10.6,
                  "tea": 14.11,
                  "coal": 0.07
                }
              }
            ]
          },
          {
            "news": "降雨短暂，旱情可能卷土重来，市场情绪反复。",
            "mults": {
              "wheat": 6.19,
              "coffee": 6.48,
              "tea": 5.18,
              "coal": 7.55
            },
            "C": [
              {
                "news": "干旱卷土重来，农产品暴涨，煤炭承压。",
                "super": true,
                "mults": {
                  "wheat": 16.97,
                  "coffee": 15.66,
                  "tea": 20.52,
                  "coal": 0.05
                }
              },
              {
                "news": "市场情绪反复，农产品偏强，煤炭平稳。",
                "super": false,
                "mults": {
                  "wheat": 10.48,
                  "coffee": 12.67,
                  "tea": 9.46,
                  "coal": 1
                }
              },
              {
                "news": "最终缓和，农产品回落，煤炭走强。",
                "super": false,
                "mults": {
                  "wheat": 10.86,
                  "coffee": 10.41,
                  "tea": 11.09,
                  "coal": 11.79
                }
              }
            ]
          },
          {
            "news": "降雨转为洪涝，农产品与木材受灾，煤炭需求下滑。",
            "mults": {
              "wheat": 7.92,
              "coffee": 5.97,
              "tea": 7.89,
              "coal": 0.14
            },
            "C": [
              {
                "news": "农产品再受重创，粮价暴涨，煤炭低迷。",
                "super": false,
                "mults": {
                  "wheat": 9.85,
                  "coffee": 10.57,
                  "tea": 11.39,
                  "coal": 0.06
                }
              },
              {
                "news": "灾后重建需求拉动木材煤炭，农产品高位。",
                "super": false,
                "mults": {
                  "wheat": 12.99,
                  "coffee": 8.34,
                  "tea": 12.58,
                  "coal": 14.03
                }
              },
              {
                "news": "市场混乱，各品种剧烈分化。",
                "super": false,
                "mults": {
                  "wheat": 14.79,
                  "coffee": 13.97,
                  "tea": 10.08,
                  "coal": 0.08
                }
              }
            ]
          }
        ]
      },
      {
        "news": "政府宣布关注旱情，市场预期政策干预，农产品承压，煤炭走强。",
        "mults": {
          "wheat": 3.57,
          "coffee": 0.27,
          "tea": 3.6,
          "coal": 4.94
        },
        "B": [
          {
            "news": "国家开始抛储，农产品价格被打压，煤炭受益。",
            "mults": {
              "wheat": 0.15,
              "coffee": 0.17,
              "tea": 0.1,
              "coal": 5.78
            },
            "C": [
              {
                "news": "价格被打压，农产品崩盘，煤炭大涨。",
                "super": true,
                "mults": {
                  "wheat": 0.05,
                  "coffee": 0.07,
                  "tea": 0.05,
                  "coal": 18.37
                }
              },
              {
                "news": "抛储力度不够，农产品反弹，煤炭回落。",
                "super": false,
                "mults": {
                  "wheat": 12.56,
                  "coffee": 9.44,
                  "tea": 9.95,
                  "coal": 0.08
                }
              },
              {
                "news": "抛储引发恐慌抢购，农产品暴涨，煤炭小涨。",
                "super": false,
                "mults": {
                  "wheat": 14.1,
                  "coffee": 11.23,
                  "tea": 8.42,
                  "coal": 8.78
                }
              }
            ]
          },
          {
            "news": "政府补贴农民，供给预期恢复，农产品走弱，煤炭平稳。",
            "mults": {
              "wheat": 0.15,
              "coffee": 0.09,
              "tea": 0.18,
              "coal": 5.84
            },
            "C": [
              {
                "news": "供给恢复，农产品回落，煤炭走强。",
                "super": false,
                "mults": {
                  "wheat": 0.08,
                  "coffee": 0.09,
                  "tea": 0.1,
                  "coal": 14.69
                }
              },
              {
                "news": "补贴不及预期，农产品偏强，煤炭回落。",
                "super": false,
                "mults": {
                  "wheat": 14.05,
                  "coffee": 8.39,
                  "tea": 13.17,
                  "coal": 0.11
                }
              },
              {
                "news": "补贴刺激种植，农产品平稳，煤炭小涨。",
                "super": false,
                "mults": {
                  "wheat": 13.67,
                  "coffee": 12.39,
                  "tea": 11.46,
                  "coal": 12.33
                }
              }
            ]
          },
          {
            "news": "政府考虑实施出口禁令，农产品预期走强，煤炭受拖累。",
            "mults": {
              "wheat": 6.15,
              "coffee": 7.08,
              "tea": 7.34,
              "coal": 7.87
            },
            "C": [
              {
                "news": "出口禁令落地，国内短缺，农产品暴涨，煤炭大跌。",
                "super": true,
                "mults": {
                  "wheat": 24.07,
                  "coffee": 21.94,
                  "tea": 24.04,
                  "coal": 0.06
                }
              },
              {
                "news": "国际抗议升级，农产品高位，煤炭修复。",
                "super": false,
                "mults": {
                  "wheat": 13.59,
                  "coffee": 13.9,
                  "tea": 14.39,
                  "coal": 1
                }
              },
              {
                "news": "禁令取消，农产品回落，煤炭走强。",
                "super": false,
                "mults": {
                  "wheat": 14.32,
                  "coffee": 13.15,
                  "tea": 8.13,
                  "coal": 14.87
                }
              }
            ]
          }
        ]
      }
    ]
  },
  "energyCrisis": {
    "name": "能源危机",
    "unlock": 0,
    "goods": [
      "oil",
      "coal",
      "chip",
      "phone"
    ],
    "announce": {
      "title": "国际新闻",
      "desc": "国际能源供给中断，石油、煤炭、芯片、手机价格可能出现剧烈波动。"
    },
    "A": [
      {
        "news": "能源供给中断加剧，油价煤价飙升，制造业承压。",
        "mults": {
          "oil": 3.08,
          "coal": 3.5,
          "chip": 0.23,
          "phone": 0.46
        },
        "B": [
          {
            "news": "主要产油国停产，能源价格失控。",
            "mults": {
              "oil": 5.22,
              "coal": 6.72,
              "chip": 0.24,
              "phone": 0.2
            },
            "C": [
              {
                "news": "全球能源危机爆发，石油暴涨，电子产品崩盘。",
                "super": true,
                "mults": {
                  "oil": 11.75,
                  "coal": 16.74,
                  "chip": 0.09,
                  "phone": 0.1
                }
              },
              {
                "news": "各国紧急增产，能源回落，制造业修复。",
                "super": false,
                "mults": {
                  "oil": 7.41,
                  "coal": 9.79,
                  "chip": 7.05,
                  "phone": 1
                }
              },
              {
                "news": "能源高位震荡，铜受益，手机低迷。",
                "super": false,
                "mults": {
                  "oil": 9.16,
                  "coal": 8.48,
                  "chip": 0.13,
                  "phone": 0.16
                }
              }
            ]
          },
          {
            "news": "运输受阻，供应链进一步恶化。",
            "mults": {
              "oil": 5.27,
              "coal": 7.84,
              "chip": 0.12,
              "phone": 0.21
            },
            "C": [
              {
                "news": "供应链断裂，能源与铜暴涨，科技崩盘。",
                "super": true,
                "mults": {
                  "oil": 16.59,
                  "coal": 23.05,
                  "chip": 0.08,
                  "phone": 0.1
                }
              },
              {
                "news": "临时通道恢复，价格回落。",
                "super": false,
                "mults": {
                  "oil": 7.62,
                  "coal": 14.82,
                  "chip": 1,
                  "phone": 0.13
                }
              },
              {
                "news": "运费高企，商品分化。",
                "super": false,
                "mults": {
                  "oil": 8.63,
                  "coal": 14.84,
                  "chip": 0.14,
                  "phone": 0.09
                }
              }
            ]
          },
          {
            "news": "各国释放战略储备，能源价格承压。",
            "mults": {
              "oil": 0.23,
              "coal": 0.19,
              "chip": 5.71,
              "phone": 4.74
            },
            "C": [
              {
                "news": "储备释放成功，能源大跌，制造业反弹。",
                "super": false,
                "mults": {
                  "oil": 0.1,
                  "coal": 0.11,
                  "chip": 8.44,
                  "phone": 5.03
                }
              },
              {
                "news": "储备不足，能源再度上涨。",
                "super": false,
                "mults": {
                  "oil": 7.56,
                  "coal": 14.22,
                  "chip": 0.08,
                  "phone": 0.13
                }
              },
              {
                "news": "市场情绪反复，震荡收场。",
                "super": false,
                "mults": {
                  "oil": 8.68,
                  "coal": 9.22,
                  "chip": 1,
                  "phone": 1
                }
              }
            ]
          }
        ]
      },
      {
        "news": "各国释放储备，能源价格短期回落。",
        "mults": {
          "oil": 0.24,
          "coal": 0.25,
          "chip": 2.57,
          "phone": 2.15
        },
        "B": [
          {
            "news": "储备释放超预期，能源继续下行。",
            "mults": {
              "oil": 0.18,
              "coal": 0.12,
              "chip": 5.14,
              "phone": 3.66
            },
            "C": [
              {
                "news": "能源价格崩盘，制造业狂欢。",
                "super": true,
                "mults": {
                  "oil": 0.1,
                  "coal": 0.05,
                  "chip": 17.26,
                  "phone": 10.86
                }
              },
              {
                "news": "回落趋缓，市场企稳。",
                "super": false,
                "mults": {
                  "oil": 0.09,
                  "coal": 0.09,
                  "chip": 9.63,
                  "phone": 6.62
                }
              },
              {
                "news": "政策反复，能源反弹。",
                "super": false,
                "mults": {
                  "oil": 6.96,
                  "coal": 11.62,
                  "chip": 0.08,
                  "phone": 0.12
                }
              }
            ]
          },
          {
            "news": "释放力度不足，市场失望。",
            "mults": {
              "oil": 5.33,
              "coal": 7.9,
              "chip": 0.14,
              "phone": 0.2
            },
            "C": [
              {
                "news": "能源重新暴涨，制造业再受挫。",
                "super": false,
                "mults": {
                  "oil": 7.85,
                  "coal": 10.34,
                  "chip": 0.13,
                  "phone": 0.15
                }
              },
              {
                "news": "再度释放储备，价格回落。",
                "super": false,
                "mults": {
                  "oil": 1,
                  "coal": 1,
                  "chip": 8.8,
                  "phone": 6.39
                }
              },
              {
                "news": "高位拉锯，铜价受益。",
                "super": false,
                "mults": {
                  "oil": 7.61,
                  "coal": 8.17,
                  "chip": 0.08,
                  "phone": 0.11
                }
              }
            ]
          },
          {
            "news": "地缘局势缓和，能源价格平稳。",
            "mults": {
              "oil": 0.21,
              "coal": 0.09,
              "chip": 1,
              "phone": 1
            },
            "C": [
              {
                "news": "和平协议达成，市场全面回暖。",
                "super": false,
                "mults": {
                  "oil": 0.09,
                  "coal": 0.1,
                  "chip": 8.98,
                  "phone": 6.67
                }
              },
              {
                "news": "局势反复，能源小幅反弹。",
                "super": false,
                "mults": {
                  "oil": 8.51,
                  "coal": 9.01,
                  "chip": 0.13,
                  "phone": 0.09
                }
              },
              {
                "news": "恢复缓慢，商品分化。",
                "super": false,
                "mults": {
                  "oil": 7.31,
                  "coal": 12.11,
                  "chip": 1,
                  "phone": 1
                }
              }
            ]
          }
        ]
      },
      {
        "news": "地缘冲突升级，能源恐慌性上涨。",
        "mults": {
          "oil": 3.64,
          "coal": 3.52,
          "chip": 0.25,
          "phone": 0.41
        },
        "B": [
          {
            "news": "冲突扩大，能源供给告急。",
            "mults": {
              "oil": 5.81,
              "coal": 5.68,
              "chip": 0.19,
              "phone": 0.18
            },
            "C": [
              {
                "news": "全面战争风险，能源暴涨，科技崩盘。",
                "super": true,
                "mults": {
                  "oil": 14.94,
                  "coal": 18.24,
                  "chip": 0.05,
                  "phone": 0.06
                }
              },
              {
                "news": "国际调停，能源回落。",
                "super": false,
                "mults": {
                  "oil": 8.26,
                  "coal": 14.7,
                  "chip": 1,
                  "phone": 0.11
                }
              },
              {
                "news": "长期对峙，能源高位，铜价坚挺。",
                "super": false,
                "mults": {
                  "oil": 9.99,
                  "coal": 13.56,
                  "chip": 0.07,
                  "phone": 0.15
                }
              }
            ]
          },
          {
            "news": "能源设施遭袭，价格剧烈波动。",
            "mults": {
              "oil": 4.44,
              "coal": 5.44,
              "chip": 0.13,
              "phone": 0.31
            },
            "C": [
              {
                "news": "设施损毁严重，能源失控。",
                "super": true,
                "mults": {
                  "oil": 15.58,
                  "coal": 17.71,
                  "chip": 0.08,
                  "phone": 0.1
                }
              },
              {
                "news": "快速修复，价格回归。",
                "super": false,
                "mults": {
                  "oil": 8.95,
                  "coal": 10.86,
                  "chip": 1,
                  "phone": 1
                }
              },
              {
                "news": "修复缓慢，高位震荡。",
                "super": false,
                "mults": {
                  "oil": 8.85,
                  "coal": 10.32,
                  "chip": 0.06,
                  "phone": 0.15
                }
              }
            ]
          },
          {
            "news": "冲突引发避险，黄金同涨。",
            "mults": {
              "oil": 4.67,
              "coal": 6.56,
              "chip": 0.25,
              "phone": 0.25
            },
            "C": [
              {
                "news": "避险情绪退潮，能源回落。",
                "super": false,
                "mults": {
                  "oil": 1,
                  "coal": 1,
                  "chip": 1,
                  "phone": 1
                }
              },
              {
                "news": "避险持续，能源高位。",
                "super": false,
                "mults": {
                  "oil": 8.66,
                  "coal": 10.72,
                  "chip": 0.09,
                  "phone": 0.17
                }
              },
              {
                "news": "局势缓和，市场回暖。",
                "super": false,
                "mults": {
                  "oil": 0.07,
                  "coal": 0.12,
                  "chip": 8.33,
                  "phone": 7.72
                }
              }
            ]
          }
        ]
      }
    ]
  },
  "techBoom": {
    "name": "科技热潮",
    "unlock": 0,
    "goods": [
      "chip",
      "phone",
      "copper",
      "gold"
    ],
    "announce": {
      "title": "国际新闻",
      "desc": "全球科技产业迎来革命性突破，芯片、手机、铜、黄金价格可能出现剧烈波动。"
    },
    "A": [
      {
        "news": "芯片需求爆发，科技股狂欢。",
        "mults": {
          "chip": 2.7,
          "phone": 2.46,
          "copper": 4,
          "gold": 0.3
        },
        "B": [
          {
            "news": "AI 算力需求井喷。",
            "mults": {
              "chip": 4.58,
              "phone": 3.56,
              "copper": 4.6,
              "gold": 0.16
            },
            "C": [
              {
                "news": "科技超级周期，芯片暴涨。",
                "super": true,
                "mults": {
                  "chip": 17.88,
                  "phone": 8.77,
                  "copper": 12.9,
                  "gold": 0.06
                }
              },
              {
                "news": "产能跟上，价格回落。",
                "super": false,
                "mults": {
                  "chip": 9.15,
                  "phone": 7.77,
                  "copper": 9.56,
                  "gold": 1
                }
              },
              {
                "news": "需求持续，高位运行。",
                "super": false,
                "mults": {
                  "chip": 7.36,
                  "phone": 6.43,
                  "copper": 7.68,
                  "gold": 0.17
                }
              }
            ]
          },
          {
            "news": "手机换机潮来袭。",
            "mults": {
              "chip": 5.64,
              "phone": 4.41,
              "copper": 5.21,
              "gold": 0.19
            },
            "C": [
              {
                "news": "换机潮超预期，手机暴涨。",
                "super": true,
                "mults": {
                  "chip": 17.09,
                  "phone": 8.97,
                  "copper": 12.5,
                  "gold": 0.09
                }
              },
              {
                "news": "热度降温，价格回落。",
                "super": false,
                "mults": {
                  "chip": 9.37,
                  "phone": 5.99,
                  "copper": 8,
                  "gold": 1
                }
              },
              {
                "news": "持续热销，高位震荡。",
                "super": false,
                "mults": {
                  "chip": 6.5,
                  "phone": 5.41,
                  "copper": 8.7,
                  "gold": 0.17
                }
              }
            ]
          },
          {
            "news": "铜矿供应紧张。",
            "mults": {
              "chip": 5.39,
              "phone": 3.44,
              "copper": 4.94,
              "gold": 1
            },
            "C": [
              {
                "news": "铜价暴涨，科技成本承压。",
                "super": true,
                "mults": {
                  "chip": 17.94,
                  "phone": 11.83,
                  "copper": 10.35,
                  "gold": 12.05
                }
              },
              {
                "news": "新矿投产，铜价回落。",
                "super": false,
                "mults": {
                  "chip": 8.15,
                  "phone": 5.12,
                  "copper": 9.68,
                  "gold": 1
                }
              },
              {
                "news": "铜价高位，科技分化。",
                "super": false,
                "mults": {
                  "chip": 9.15,
                  "phone": 5.15,
                  "copper": 7.98,
                  "gold": 1
                }
              }
            ]
          }
        ]
      },
      {
        "news": "资本过热，科技泡沫初现。",
        "mults": {
          "chip": 3.08,
          "phone": 2.41,
          "copper": 2.95,
          "gold": 2.73
        },
        "B": [
          {
            "news": "投机资金疯狂涌入。",
            "mults": {
              "chip": 5.05,
              "phone": 3.55,
              "copper": 6.27,
              "gold": 4.34
            },
            "C": [
              {
                "news": "泡沫破裂，科技崩盘。",
                "super": true,
                "mults": {
                  "chip": 0.09,
                  "phone": 0.1,
                  "copper": 0.07,
                  "gold": 13.46
                }
              },
              {
                "news": "监管介入，市场降温。",
                "super": false,
                "mults": {
                  "chip": 1,
                  "phone": 1,
                  "copper": 8.82,
                  "gold": 6.19
                }
              },
              {
                "news": "泡沫持续，高位狂欢。",
                "super": false,
                "mults": {
                  "chip": 9.03,
                  "phone": 5.8,
                  "copper": 8.62,
                  "gold": 7.81
                }
              }
            ]
          },
          {
            "news": "黄金避险需求上升。",
            "mults": {
              "chip": 6.22,
              "phone": 4.23,
              "copper": 5.43,
              "gold": 4.8
            },
            "C": [
              {
                "news": "避险狂潮，黄金暴涨。",
                "super": true,
                "mults": {
                  "chip": 1,
                  "phone": 1,
                  "copper": 10.4,
                  "gold": 12.27
                }
              },
              {
                "news": "风险偏好回升，黄金回落。",
                "super": false,
                "mults": {
                  "chip": 7.81,
                  "phone": 6.77,
                  "copper": 7.4,
                  "gold": 7.53
                }
              },
              {
                "news": "避险与科技拉锯。",
                "super": false,
                "mults": {
                  "chip": 8.93,
                  "phone": 6.87,
                  "copper": 7.77,
                  "gold": 6.93
                }
              }
            ]
          },
          {
            "news": "咖啡消费意外走强。",
            "mults": {
              "chip": 5.95,
              "phone": 3.31,
              "copper": 5.08,
              "gold": 4.07
            },
            "C": [
              {
                "news": "咖啡热潮，价格暴涨。",
                "super": true,
                "mults": {
                  "chip": 16.02,
                  "phone": 12.51,
                  "copper": 14.78,
                  "gold": 13.88
                }
              },
              {
                "news": "热度消退，咖啡回落。",
                "super": false,
                "mults": {
                  "chip": 8.63,
                  "phone": 6.16,
                  "copper": 9.79,
                  "gold": 6.09
                }
              },
              {
                "news": "消费稳健，咖啡走高。",
                "super": false,
                "mults": {
                  "chip": 9.15,
                  "phone": 5.56,
                  "copper": 7.59,
                  "gold": 7.55
                }
              }
            ]
          }
        ]
      },
      {
        "news": "监管降温，科技板块承压。",
        "mults": {
          "chip": 0.29,
          "phone": 0.37,
          "copper": 0.33,
          "gold": 2.11
        },
        "B": [
          {
            "news": "反垄断调查启动。",
            "mults": {
              "chip": 0.12,
              "phone": 0.34,
              "copper": 0.16,
              "gold": 3.56
            },
            "C": [
              {
                "news": "巨额罚款，科技重挫。",
                "super": true,
                "mults": {
                  "chip": 0.07,
                  "phone": 0.06,
                  "copper": 0.09,
                  "gold": 12.55
                }
              },
              {
                "news": "调查无果，市场回暖。",
                "super": false,
                "mults": {
                  "chip": 7.49,
                  "phone": 6.64,
                  "copper": 9.88,
                  "gold": 7.76
                }
              },
              {
                "news": "监管长期化，科技低迷。",
                "super": false,
                "mults": {
                  "chip": 0.06,
                  "phone": 0.1,
                  "copper": 0.09,
                  "gold": 5.5
                }
              }
            ]
          },
          {
            "news": "补贴退坡，成本上升。",
            "mults": {
              "chip": 0.18,
              "phone": 0.24,
              "copper": 0.11,
              "gold": 4.36
            },
            "C": [
              {
                "news": "成本压力爆发，科技大跌。",
                "super": false,
                "mults": {
                  "chip": 0.09,
                  "phone": 0.1,
                  "copper": 0.14,
                  "gold": 5.23
                }
              },
              {
                "news": "企业消化成本，价格企稳。",
                "super": false,
                "mults": {
                  "chip": 1,
                  "phone": 1,
                  "copper": 1,
                  "gold": 5.89
                }
              },
              {
                "news": "部分企业转型，铜受益。",
                "super": false,
                "mults": {
                  "chip": 0.14,
                  "phone": 0.17,
                  "copper": 6.67,
                  "gold": 7.93
                }
              }
            ]
          },
          {
            "news": "消费者信心下滑。",
            "mults": {
              "chip": 0.16,
              "phone": 0.18,
              "copper": 0.24,
              "gold": 4.48
            },
            "C": [
              {
                "news": "消费寒冬，科技与咖啡齐跌。",
                "super": true,
                "mults": {
                  "chip": 0.09,
                  "phone": 0.12,
                  "copper": 0.08,
                  "gold": 10.07
                }
              },
              {
                "news": "刺激政策出台，市场回暖。",
                "super": false,
                "mults": {
                  "chip": 9.17,
                  "phone": 6.46,
                  "copper": 7.9,
                  "gold": 5.61
                }
              },
              {
                "news": "缓慢复苏，分化明显。",
                "super": false,
                "mults": {
                  "chip": 1,
                  "phone": 1,
                  "copper": 1,
                  "gold": 6.96
                }
              }
            ]
          }
        ]
      }
    ]
  },
  "financialStorm": {
    "name": "金融风暴",
    "unlock": 0,
    "goods": [
      "gold",
      "copper",
      "oil",
      "wheat"
    ],
    "announce": {
      "title": "国际新闻",
      "desc": "全球金融市场出现剧烈动荡，黄金、铜、石油、小麦价格可能出现剧烈波动。"
    },
    "A": [
      {
        "news": "恐慌情绪蔓延，资金涌入黄金。",
        "mults": {
          "gold": 2.75,
          "copper": 0.27,
          "oil": 0.31,
          "wheat": 4.65
        },
        "B": [
          {
            "news": "股市崩盘，避险情绪极端。",
            "mults": {
              "gold": 3.48,
              "copper": 0.23,
              "oil": 0.2,
              "wheat": 5.84
            },
            "C": [
              {
                "news": "金融海啸，黄金暴涨，商品崩盘。",
                "super": true,
                "mults": {
                  "gold": 8.5,
                  "copper": 0.06,
                  "oil": 0.08,
                  "wheat": 24.93
                }
              },
              {
                "news": "央行紧急救市，市场企稳。",
                "super": false,
                "mults": {
                  "gold": 5.65,
                  "copper": 0.11,
                  "oil": 0.1,
                  "wheat": 12.07
                }
              },
              {
                "news": "恐慌持续，黄金高位。",
                "super": false,
                "mults": {
                  "gold": 7.33,
                  "copper": 0.09,
                  "oil": 0.1,
                  "wheat": 10.28
                }
              }
            ]
          },
          {
            "news": "大宗商品遭抛售。",
            "mults": {
              "gold": 4.88,
              "copper": 0.16,
              "oil": 0.14,
              "wheat": 5.87
            },
            "C": [
              {
                "news": "商品崩盘，黄金独涨。",
                "super": true,
                "mults": {
                  "gold": 10.49,
                  "copper": 0.05,
                  "oil": 0.07,
                  "wheat": 22.34
                }
              },
              {
                "news": "超跌反弹，商品修复。",
                "super": false,
                "mults": {
                  "gold": 7.18,
                  "copper": 1,
                  "oil": 1,
                  "wheat": 8.34
                }
              },
              {
                "news": "抛售持续，分化加剧。",
                "super": false,
                "mults": {
                  "gold": 7.77,
                  "copper": 0.12,
                  "oil": 0.1,
                  "wheat": 8
                }
              }
            ]
          },
          {
            "news": "农产品成避风港。",
            "mults": {
              "gold": 4.49,
              "copper": 0.2,
              "oil": 0.11,
              "wheat": 7.68
            },
            "C": [
              {
                "news": "粮食危机担忧，农产品暴涨。",
                "super": true,
                "mults": {
                  "gold": 12.84,
                  "copper": 0.09,
                  "oil": 0.07,
                  "wheat": 21.81
                }
              },
              {
                "news": "情绪缓和，农产品回落。",
                "super": false,
                "mults": {
                  "gold": 5.35,
                  "copper": 0.1,
                  "oil": 0.12,
                  "wheat": 10.02
                }
              },
              {
                "news": "避险持续，农产品走强。",
                "super": false,
                "mults": {
                  "gold": 6.49,
                  "copper": 0.13,
                  "oil": 0.08,
                  "wheat": 10.77
                }
              }
            ]
          }
        ]
      },
      {
        "news": "央行救市，市场暂时企稳。",
        "mults": {
          "gold": 2.75,
          "copper": 3.64,
          "oil": 1,
          "wheat": 1
        },
        "B": [
          {
            "news": "降息预期升温。",
            "mults": {
              "gold": 4.33,
              "copper": 4.36,
              "oil": 6.42,
              "wheat": 1
            },
            "C": [
              {
                "news": "流动性泛滥，黄金铜齐涨。",
                "super": true,
                "mults": {
                  "gold": 12.67,
                  "copper": 16.05,
                  "oil": 15.86,
                  "wheat": 16.5
                }
              },
              {
                "news": "预期落空，市场回落。",
                "super": false,
                "mults": {
                  "gold": 1,
                  "copper": 0.11,
                  "oil": 0.07,
                  "wheat": 1
                }
              },
              {
                "news": "宽松持续，商品温和上涨。",
                "super": false,
                "mults": {
                  "gold": 6.44,
                  "copper": 8.86,
                  "oil": 7.64,
                  "wheat": 14.52
                }
              }
            ]
          },
          {
            "news": "财政刺激出台。",
            "mults": {
              "gold": 3.74,
              "copper": 5.23,
              "oil": 4.05,
              "wheat": 5.47
            },
            "C": [
              {
                "news": "基建拉动，铜油大涨。",
                "super": true,
                "mults": {
                  "gold": 12.27,
                  "copper": 13.64,
                  "oil": 12.93,
                  "wheat": 23.29
                }
              },
              {
                "news": "刺激不及预期，商品回落。",
                "super": false,
                "mults": {
                  "gold": 1,
                  "copper": 1,
                  "oil": 1,
                  "wheat": 1
                }
              },
              {
                "news": "经济复苏，商品普涨。",
                "super": false,
                "mults": {
                  "gold": 7.48,
                  "copper": 7.32,
                  "oil": 7.75,
                  "wheat": 12.09
                }
              }
            ]
          },
          {
            "news": "银行危机隐现。",
            "mults": {
              "gold": 4.69,
              "copper": 0.22,
              "oil": 0.12,
              "wheat": 5.35
            },
            "C": [
              {
                "news": "银行倒闭潮，黄金暴涨。",
                "super": true,
                "mults": {
                  "gold": 9.61,
                  "copper": 0.05,
                  "oil": 0.09,
                  "wheat": 19.24
                }
              },
              {
                "news": "政府担保，危机缓解。",
                "super": false,
                "mults": {
                  "gold": 6.42,
                  "copper": 1,
                  "oil": 1,
                  "wheat": 1
                }
              },
              {
                "news": "危机反复，黄金走强。",
                "super": false,
                "mults": {
                  "gold": 5.65,
                  "copper": 0.12,
                  "oil": 0.08,
                  "wheat": 10.79
                }
              }
            ]
          }
        ]
      },
      {
        "news": "信用危机爆发，市场剧烈分化。",
        "mults": {
          "gold": 2.65,
          "copper": 0.34,
          "oil": 0.33,
          "wheat": 4.77
        },
        "B": [
          {
            "news": "债务违约潮。",
            "mults": {
              "gold": 4.8,
              "copper": 0.16,
              "oil": 0.12,
              "wheat": 5.26
            },
            "C": [
              {
                "news": "全面违约，黄金暴涨，商品崩盘。",
                "super": true,
                "mults": {
                  "gold": 10.32,
                  "copper": 0.07,
                  "oil": 0.06,
                  "wheat": 15.29
                }
              },
              {
                "news": "国际援助，市场恢复。",
                "super": false,
                "mults": {
                  "gold": 5.5,
                  "copper": 0.13,
                  "oil": 0.11,
                  "wheat": 9.88
                }
              },
              {
                "news": "违约持续，黄金高位。",
                "super": false,
                "mults": {
                  "gold": 6.96,
                  "copper": 0.09,
                  "oil": 0.09,
                  "wheat": 14.5
                }
              }
            ]
          },
          {
            "news": "货币贬值担忧。",
            "mults": {
              "gold": 3.56,
              "copper": 0.15,
              "oil": 0.18,
              "wheat": 7.73
            },
            "C": [
              {
                "news": "恶性通胀，黄金与粮食暴涨。",
                "super": true,
                "mults": {
                  "gold": 11.04,
                  "copper": 0.05,
                  "oil": 11.06,
                  "wheat": 17.96
                }
              },
              {
                "news": "汇率稳定，市场回稳。",
                "super": false,
                "mults": {
                  "gold": 5.83,
                  "copper": 1,
                  "oil": 1,
                  "wheat": 8.16
                }
              },
              {
                "news": "贬值持续，黄金走强。",
                "super": false,
                "mults": {
                  "gold": 5.29,
                  "copper": 0.13,
                  "oil": 0.1,
                  "wheat": 10.25
                }
              }
            ]
          },
          {
            "news": "新兴市场遭重创。",
            "mults": {
              "gold": 3.65,
              "copper": 0.14,
              "oil": 0.17,
              "wheat": 7.53
            },
            "C": [
              {
                "news": "新兴市场崩盘，黄金独涨。",
                "super": true,
                "mults": {
                  "gold": 12.8,
                  "copper": 0.07,
                  "oil": 0.09,
                  "wheat": 17.45
                }
              },
              {
                "news": "救助计划出台，市场反弹。",
                "super": false,
                "mults": {
                  "gold": 5.14,
                  "copper": 0.11,
                  "oil": 0.14,
                  "wheat": 9.08
                }
              },
              {
                "news": "危机蔓延，分化加剧。",
                "super": false,
                "mults": {
                  "gold": 6.43,
                  "copper": 0.08,
                  "oil": 0.12,
                  "wheat": 11.86
                }
              }
            ]
          }
        ]
      }
    ]
  },
  "supplyChain": {
    "name": "供应链断裂",
    "unlock": 0,
    "goods": [
      "chip",
      "phone",
      "wood",
      "oil"
    ],
    "announce": {
      "title": "国际新闻",
      "desc": "全球供应链遭遇严重中断，芯片、手机、木材、石油价格可能出现剧烈波动。"
    },
    "A": [
      {
        "news": "港口停摆，物流全面受阻。",
        "mults": {
          "chip": 2.95,
          "phone": 2.8,
          "wood": 3.35,
          "oil": 3.82
        },
        "B": [
          {
            "news": "主要港口持续关闭。",
            "mults": {
              "chip": 5.44,
              "phone": 3.31,
              "wood": 5.53,
              "oil": 5.97
            },
            "C": [
              {
                "news": "供应链崩溃，商品暴涨。",
                "super": true,
                "mults": {
                  "chip": 16.8,
                  "phone": 11.7,
                  "wood": 17.09,
                  "oil": 14.86
                }
              },
              {
                "news": "部分港口恢复，价格回落。",
                "super": false,
                "mults": {
                  "chip": 9.01,
                  "phone": 5,
                  "wood": 8.04,
                  "oil": 6.75
                }
              },
              {
                "news": "停摆持续，高位运行。",
                "super": false,
                "mults": {
                  "chip": 7.4,
                  "phone": 5.97,
                  "wood": 9.49,
                  "oil": 8.72
                }
              }
            ]
          },
          {
            "news": "卡车司机罢工。",
            "mults": {
              "chip": 6.29,
              "phone": 3.4,
              "wood": 6.63,
              "oil": 4.63
            },
            "C": [
              {
                "news": "罢工蔓延，运输瘫痪。",
                "super": true,
                "mults": {
                  "chip": 14.94,
                  "phone": 10.32,
                  "wood": 16.38,
                  "oil": 16.12
                }
              },
              {
                "news": "工资协议达成，运输恢复。",
                "super": false,
                "mults": {
                  "chip": 1,
                  "phone": 1,
                  "wood": 1,
                  "oil": 1
                }
              },
              {
                "news": "谈判僵持，价格走高。",
                "super": false,
                "mults": {
                  "chip": 7.69,
                  "phone": 5.91,
                  "wood": 11.08,
                  "oil": 9.94
                }
              }
            ]
          },
          {
            "news": "集装箱严重短缺。",
            "mults": {
              "chip": 5.1,
              "phone": 4.7,
              "wood": 7.22,
              "oil": 5.99
            },
            "C": [
              {
                "news": "一箱难求，运费暴涨。",
                "super": true,
                "mults": {
                  "chip": 15.41,
                  "phone": 11.01,
                  "wood": 20.29,
                  "oil": 15.14
                }
              },
              {
                "news": "新箱投放，压力缓解。",
                "super": false,
                "mults": {
                  "chip": 8.67,
                  "phone": 5.22,
                  "wood": 12.7,
                  "oil": 8.04
                }
              },
              {
                "news": "短缺持续，高位震荡。",
                "super": false,
                "mults": {
                  "chip": 9.15,
                  "phone": 5.77,
                  "wood": 14.07,
                  "oil": 6.85
                }
              }
            ]
          }
        ]
      },
      {
        "news": "物流逐步恢复，价格开始回落。",
        "mults": {
          "chip": 0.22,
          "phone": 0.44,
          "wood": 0.17,
          "oil": 0.27
        },
        "B": [
          {
            "news": "港口复工顺利。",
            "mults": {
              "chip": 0.19,
              "phone": 0.25,
              "wood": 0.17,
              "oil": 0.2
            },
            "C": [
              {
                "news": "供应恢复，商品大跌。",
                "super": true,
                "mults": {
                  "chip": 0.09,
                  "phone": 0.09,
                  "wood": 0.05,
                  "oil": 0.04
                }
              },
              {
                "news": "恢复缓慢，价格企稳。",
                "super": false,
                "mults": {
                  "chip": 0.09,
                  "phone": 0.11,
                  "wood": 0.08,
                  "oil": 0.09
                }
              },
              {
                "news": "需求强劲，价格反弹。",
                "super": false,
                "mults": {
                  "chip": 9.7,
                  "phone": 5.62,
                  "wood": 9.76,
                  "oil": 6.77
                }
              }
            ]
          },
          {
            "news": "运费回落。",
            "mults": {
              "chip": 0.11,
              "phone": 0.29,
              "wood": 0.09,
              "oil": 0.23
            },
            "C": [
              {
                "news": "运费崩盘，商品成本大降。",
                "super": true,
                "mults": {
                  "chip": 0.09,
                  "phone": 0.11,
                  "wood": 0.04,
                  "oil": 0.06
                }
              },
              {
                "news": "运费企稳，市场平稳。",
                "super": false,
                "mults": {
                  "chip": 1,
                  "phone": 1,
                  "wood": 1,
                  "oil": 1
                }
              },
              {
                "news": "需求回升，商品走强。",
                "super": false,
                "mults": {
                  "chip": 7.66,
                  "phone": 6.04,
                  "wood": 13.43,
                  "oil": 6.69
                }
              }
            ]
          },
          {
            "news": "新航线开通。",
            "mults": {
              "chip": 0.11,
              "phone": 0.22,
              "wood": 0.11,
              "oil": 0.12
            },
            "C": [
              {
                "news": "运力大增，商品回落。",
                "super": false,
                "mults": {
                  "chip": 0.12,
                  "phone": 0.13,
                  "wood": 0.07,
                  "oil": 0.09
                }
              },
              {
                "news": "新航线遇阻，价格反弹。",
                "super": false,
                "mults": {
                  "chip": 7.13,
                  "phone": 5.33,
                  "wood": 9.74,
                  "oil": 7.01
                }
              },
              {
                "news": "平稳运行，小幅波动。",
                "super": false,
                "mults": {
                  "chip": 1,
                  "phone": 1,
                  "wood": 1,
                  "oil": 1
                }
              }
            ]
          }
        ]
      },
      {
        "news": "运费暴涨，成本推动价格上行。",
        "mults": {
          "chip": 2.59,
          "phone": 2.65,
          "wood": 4.95,
          "oil": 3.46
        },
        "B": [
          {
            "news": "燃油价格大涨。",
            "mults": {
              "chip": 5.91,
              "phone": 4.43,
              "wood": 5.77,
              "oil": 4.82
            },
            "C": [
              {
                "news": "能源与运输双重危机。",
                "super": true,
                "mults": {
                  "chip": 10,
                  "phone": 12.64,
                  "wood": 18.39,
                  "oil": 13.5
                }
              },
              {
                "news": "油价回落，运输成本下降。",
                "super": false,
                "mults": {
                  "chip": 1,
                  "phone": 1,
                  "wood": 10.27,
                  "oil": 8.11
                }
              },
              {
                "news": "成本高位，商品分化。",
                "super": false,
                "mults": {
                  "chip": 9.6,
                  "phone": 6.75,
                  "wood": 8.36,
                  "oil": 8.12
                }
              }
            ]
          },
          {
            "news": "港口拥堵加剧。",
            "mults": {
              "chip": 5.24,
              "phone": 3.72,
              "wood": 5.35,
              "oil": 4.17
            },
            "C": [
              {
                "news": "拥堵失控，商品暴涨。",
                "super": true,
                "mults": {
                  "chip": 13.93,
                  "phone": 12.75,
                  "wood": 21.4,
                  "oil": 14.34
                }
              },
              {
                "news": "拥堵缓解，价格回落。",
                "super": false,
                "mults": {
                  "chip": 1,
                  "phone": 1,
                  "wood": 14.21,
                  "oil": 8.72
                }
              },
              {
                "news": "持续拥堵，高位运行。",
                "super": false,
                "mults": {
                  "chip": 7.18,
                  "phone": 5.23,
                  "wood": 10.23,
                  "oil": 6.99
                }
              }
            ]
          },
          {
            "news": "空运替代增加。",
            "mults": {
              "chip": 4.67,
              "phone": 3.75,
              "wood": 7.79,
              "oil": 4.22
            },
            "C": [
              {
                "news": "空运成本高企，商品继续涨。",
                "super": false,
                "mults": {
                  "chip": 7.74,
                  "phone": 7.87,
                  "wood": 12.67,
                  "oil": 8.53
                }
              },
              {
                "news": "海运恢复，空运退潮。",
                "super": false,
                "mults": {
                  "chip": 1,
                  "phone": 1,
                  "wood": 14.54,
                  "oil": 8.02
                }
              },
              {
                "news": "混合运输，价格温和。",
                "super": false,
                "mults": {
                  "chip": 9.29,
                  "phone": 7.51,
                  "wood": 14.15,
                  "oil": 9.95
                }
              }
            ]
          }
        ]
      }
    ]
  },
  "collectorCraze": {
    "name": "稀世收藏热潮",
    "unlock": 10000000,
    "goods": [
      "antique",
      "diamond",
      "gold",
      "phone"
    ],
    "announce": {
      "title": "国际新闻",
      "desc": "全球富豪涌入收藏品市场，古董、钻石、黄金、手机价格可能出现剧烈波动。"
    },
    "A": [
      {
        "news": "顶级拍卖行成交价屡创新高，收藏品热度升温。",
        "mults": {
          "antique": 4.77,
          "diamond": 3.95,
          "gold": 2.16,
          "phone": 0.48
        },
        "B": [
          {
            "news": "亚洲买家疯狂扫货，古董钻石暴涨。",
            "mults": {
              "antique": 5.09,
              "diamond": 5.5,
              "gold": 3.77,
              "phone": 0.25
            },
            "C": [
              {
                "news": "收藏品超级牛市，古董钻石史诗级暴涨。",
                "super": true,
                "mults": {
                  "antique": 18.83,
                  "diamond": 17.58,
                  "gold": 10.06,
                  "phone": 0.07
                }
              },
              {
                "news": "热度回落，收藏品高位震荡。",
                "super": false,
                "mults": {
                  "antique": 10.07,
                  "diamond": 10.16,
                  "gold": 6,
                  "phone": 0.13
                }
              },
              {
                "news": "泡沫破裂，古董钻石崩盘。",
                "super": true,
                "mults": {
                  "antique": 0.05,
                  "diamond": 0.04,
                  "gold": 10.34,
                  "phone": 8.77
                }
              }
            ]
          },
          {
            "news": "市场传言有假货，收藏品遭抛售。",
            "mults": {
              "antique": 0.34,
              "diamond": 0.25,
              "gold": 3.21,
              "phone": 3.04
            },
            "C": [
              {
                "news": "假货风波持续，古董钻石大跌。",
                "super": false,
                "mults": {
                  "antique": 0.14,
                  "diamond": 0.08,
                  "gold": 5.75,
                  "phone": 6.16
                }
              },
              {
                "news": "鉴定澄清，价格修复。",
                "super": false,
                "mults": {
                  "antique": 10.72,
                  "diamond": 8.01,
                  "gold": 7.24,
                  "phone": 1
                }
              },
              {
                "news": "恐慌蔓延，收藏品长期低迷。",
                "super": false,
                "mults": {
                  "antique": 0.17,
                  "diamond": 0.11,
                  "gold": 7.9,
                  "phone": 5.58
                }
              }
            ]
          },
          {
            "news": "高净值人群资产配置转向收藏品。",
            "mults": {
              "antique": 6.27,
              "diamond": 5.39,
              "gold": 4.16,
              "phone": 0.3
            },
            "C": [
              {
                "news": "配置需求爆发，古董钻石大涨。",
                "super": true,
                "mults": {
                  "antique": 17.87,
                  "diamond": 17.68,
                  "gold": 11.95,
                  "phone": 0.12
                }
              },
              {
                "news": "配置趋缓，价格平稳。",
                "super": false,
                "mults": {
                  "antique": 12.07,
                  "diamond": 8.2,
                  "gold": 6.27,
                  "phone": 0.16
                }
              },
              {
                "news": "资金撤离，收藏品回落。",
                "super": false,
                "mults": {
                  "antique": 0.11,
                  "diamond": 0.15,
                  "gold": 1,
                  "phone": 6.55
                }
              }
            ]
          }
        ]
      },
      {
        "news": "拍卖行供应增加，市场开始降温。",
        "mults": {
          "antique": 0.34,
          "diamond": 0.44,
          "gold": 1,
          "phone": 2.19
        },
        "B": [
          {
            "news": "大量藏品涌入市场。",
            "mults": {
              "antique": 0.18,
              "diamond": 0.2,
              "gold": 0.29,
              "phone": 3.09
            },
            "C": [
              {
                "news": "供过于求，古董钻石大跌。",
                "super": true,
                "mults": {
                  "antique": 0.03,
                  "diamond": 0.06,
                  "gold": 0.11,
                  "phone": 10.61
                }
              },
              {
                "news": "部分精品仍受追捧。",
                "super": false,
                "mults": {
                  "antique": 9.84,
                  "diamond": 1,
                  "gold": 1,
                  "phone": 6.39
                }
              },
              {
                "news": "市场长期低迷，收藏品阴跌。",
                "super": false,
                "mults": {
                  "antique": 0.1,
                  "diamond": 0.14,
                  "gold": 0.15,
                  "phone": 5.39
                }
              }
            ]
          },
          {
            "news": "经济下行，奢侈品消费萎缩。",
            "mults": {
              "antique": 0.26,
              "diamond": 0.25,
              "gold": 3.59,
              "phone": 0.33
            },
            "C": [
              {
                "news": "消费寒冬，古董钻石崩盘。",
                "super": true,
                "mults": {
                  "antique": 0.09,
                  "diamond": 0.09,
                  "gold": 11.72,
                  "phone": 0.07
                }
              },
              {
                "news": "刺激政策出台，消费回暖。",
                "super": false,
                "mults": {
                  "antique": 1,
                  "diamond": 1,
                  "gold": 5.47,
                  "phone": 7.71
                }
              },
              {
                "news": "缓慢恢复，收藏品仍弱。",
                "super": false,
                "mults": {
                  "antique": 0.11,
                  "diamond": 0.11,
                  "gold": 7.37,
                  "phone": 0.11
                }
              }
            ]
          },
          {
            "news": "投机资金退潮。",
            "mults": {
              "antique": 0.28,
              "diamond": 0.32,
              "gold": 3.68,
              "phone": 1
            },
            "C": [
              {
                "news": "资金撤离，收藏品大跌。",
                "super": false,
                "mults": {
                  "antique": 0.11,
                  "diamond": 0.14,
                  "gold": 7.02,
                  "phone": 1
                }
              },
              {
                "news": "长线资金接盘，价格企稳。",
                "super": false,
                "mults": {
                  "antique": 9.86,
                  "diamond": 13.4,
                  "gold": 5.28,
                  "phone": 1
                }
              },
              {
                "news": "市场冷清，阴跌不止。",
                "super": false,
                "mults": {
                  "antique": 0.15,
                  "diamond": 0.12,
                  "gold": 7.22,
                  "phone": 1
                }
              }
            ]
          }
        ]
      },
      {
        "news": "监管关注收藏品市场，政策风险上升。",
        "mults": {
          "antique": 0.35,
          "diamond": 0.33,
          "gold": 2.15,
          "phone": 1
        },
        "B": [
          {
            "news": "拟征收收藏品交易税。",
            "mults": {
              "antique": 0.23,
              "diamond": 0.29,
              "gold": 3.3,
              "phone": 1
            },
            "C": [
              {
                "news": "重税落地，古董钻石崩盘。",
                "super": true,
                "mults": {
                  "antique": 0.09,
                  "diamond": 0.07,
                  "gold": 12.86,
                  "phone": 1
                }
              },
              {
                "news": "税率低于预期，市场回暖。",
                "super": false,
                "mults": {
                  "antique": 9.19,
                  "diamond": 10.96,
                  "gold": 6.67,
                  "phone": 1
                }
              },
              {
                "news": "政策悬而未决，市场低迷。",
                "super": false,
                "mults": {
                  "antique": 0.08,
                  "diamond": 0.16,
                  "gold": 6.63,
                  "phone": 1
                }
              }
            ]
          },
          {
            "news": "反洗钱调查波及拍卖行。",
            "mults": {
              "antique": 0.22,
              "diamond": 0.3,
              "gold": 3.68,
              "phone": 0.25
            },
            "C": [
              {
                "news": "调查扩大，收藏品重挫。",
                "super": false,
                "mults": {
                  "antique": 0.1,
                  "diamond": 0.09,
                  "gold": 6.35,
                  "phone": 0.15
                }
              },
              {
                "news": "调查结束，市场恢复。",
                "super": false,
                "mults": {
                  "antique": 13.2,
                  "diamond": 8.48,
                  "gold": 5.38,
                  "phone": 1
                }
              },
              {
                "news": "监管常态化，收藏品承压。",
                "super": false,
                "mults": {
                  "antique": 0.14,
                  "diamond": 0.17,
                  "gold": 6.28,
                  "phone": 0.08
                }
              }
            ]
          },
          {
            "news": "央行提示收藏品泡沫风险。",
            "mults": {
              "antique": 0.25,
              "diamond": 0.27,
              "gold": 3.31,
              "phone": 1
            },
            "C": [
              {
                "news": "警告引发抛售，古董钻石大跌。",
                "super": false,
                "mults": {
                  "antique": 0.08,
                  "diamond": 0.14,
                  "gold": 6.36,
                  "phone": 1
                }
              },
              {
                "news": "市场无视警告，继续上涨。",
                "super": false,
                "mults": {
                  "antique": 12.28,
                  "diamond": 10.97,
                  "gold": 7.49,
                  "phone": 0.18
                }
              },
              {
                "news": "情绪谨慎，高位震荡。",
                "super": false,
                "mults": {
                  "antique": 1,
                  "diamond": 1,
                  "gold": 5.81,
                  "phone": 1
                }
              }
            ]
          }
        ]
      }
    ]
  },
  "spaceRace": {
    "name": "太空竞赛",
    "unlock": 10000000,
    "goods": [
      "spacecraft",
      "chip",
      "copper",
      "oil"
    ],
    "announce": {
      "title": "国际新闻",
      "desc": "大国重启太空竞赛，航天器、芯片、铜、石油价格可能出现剧烈波动。"
    },
    "A": [
      {
        "news": "多国宣布载人登月计划，航天需求爆发。",
        "mults": {
          "spacecraft": 3.44,
          "chip": 3.4,
          "copper": 2.63,
          "oil": 2.89
        },
        "B": [
          {
            "news": "订单量超预期，航天器暴涨。",
            "mults": {
              "spacecraft": 6.12,
              "chip": 4.36,
              "copper": 6.27,
              "oil": 5.72
            },
            "C": [
              {
                "news": "太空竞赛白热化，航天器史诗级暴涨。",
                "super": true,
                "mults": {
                  "spacecraft": 22.55,
                  "chip": 12.02,
                  "copper": 15.06,
                  "oil": 15.14
                }
              },
              {
                "news": "订单落地缓慢，价格回落。",
                "super": false,
                "mults": {
                  "spacecraft": 12.1,
                  "chip": 6.65,
                  "copper": 7.69,
                  "oil": 6.82
                }
              },
              {
                "news": "多国竞争持续，高位震荡。",
                "super": false,
                "mults": {
                  "spacecraft": 13.31,
                  "chip": 9.39,
                  "copper": 9.77,
                  "oil": 8.52
                }
              }
            ]
          },
          {
            "news": "火箭发射失败，市场恐慌。",
            "mults": {
              "spacecraft": 0.31,
              "chip": 0.14,
              "copper": 1,
              "oil": 4.47
            },
            "C": [
              {
                "news": "连续失败，航天器崩盘。",
                "super": true,
                "mults": {
                  "spacecraft": 0.03,
                  "chip": 0.05,
                  "copper": 0.06,
                  "oil": 11.98
                }
              },
              {
                "news": "技术修复，市场回暖。",
                "super": false,
                "mults": {
                  "spacecraft": 11.37,
                  "chip": 7.09,
                  "copper": 7.21,
                  "oil": 7.79
                }
              },
              {
                "news": "进度延期，航天器阴跌。",
                "super": false,
                "mults": {
                  "spacecraft": 0.08,
                  "chip": 0.1,
                  "copper": 1,
                  "oil": 7.33
                }
              }
            ]
          },
          {
            "news": "私营航天公司崛起。",
            "mults": {
              "spacecraft": 7.78,
              "chip": 5.42,
              "copper": 4.65,
              "oil": 4.5
            },
            "C": [
              {
                "news": "私营资本涌入，航天器暴涨。",
                "super": true,
                "mults": {
                  "spacecraft": 20.09,
                  "chip": 16.31,
                  "copper": 13.31,
                  "oil": 12.58
                }
              },
              {
                "news": "竞争加剧，价格分化。",
                "super": false,
                "mults": {
                  "spacecraft": 11.67,
                  "chip": 9.31,
                  "copper": 9.3,
                  "oil": 7.56
                }
              },
              {
                "news": "资本退潮，航天器回落。",
                "super": false,
                "mults": {
                  "spacecraft": 0.16,
                  "chip": 1,
                  "copper": 9.4,
                  "oil": 1
                }
              }
            ]
          }
        ]
      },
      {
        "news": "预算削减，太空项目降温。",
        "mults": {
          "spacecraft": 0.33,
          "chip": 0.34,
          "copper": 0.31,
          "oil": 0.32
        },
        "B": [
          {
            "news": "多国取消部分计划。",
            "mults": {
              "spacecraft": 0.16,
              "chip": 0.13,
              "copper": 0.2,
              "oil": 0.21
            },
            "C": [
              {
                "news": "项目大规模取消，航天器崩盘。",
                "super": true,
                "mults": {
                  "spacecraft": 0.05,
                  "chip": 0.04,
                  "copper": 0.05,
                  "oil": 0.06
                }
              },
              {
                "news": "保留核心计划，价格企稳。",
                "super": false,
                "mults": {
                  "spacecraft": 1,
                  "chip": 0.09,
                  "copper": 0.09,
                  "oil": 0.13
                }
              },
              {
                "news": "持续削减，长期低迷。",
                "super": false,
                "mults": {
                  "spacecraft": 0.11,
                  "chip": 0.08,
                  "copper": 0.06,
                  "oil": 0.07
                }
              }
            ]
          },
          {
            "news": "芯片出口管制加剧。",
            "mults": {
              "spacecraft": 0.23,
              "chip": 0.2,
              "copper": 0.15,
              "oil": 0.19
            },
            "C": [
              {
                "news": "管制升级，航天器与芯片双崩。",
                "super": true,
                "mults": {
                  "spacecraft": 0.07,
                  "chip": 0.07,
                  "copper": 0.04,
                  "oil": 0.06
                }
              },
              {
                "news": "管制缓和，市场修复。",
                "super": false,
                "mults": {
                  "spacecraft": 8.49,
                  "chip": 6.78,
                  "copper": 6.97,
                  "oil": 1
                }
              },
              {
                "news": "长期限制，航天承压。",
                "super": false,
                "mults": {
                  "spacecraft": 0.07,
                  "chip": 0.09,
                  "copper": 0.1,
                  "oil": 0.06
                }
              }
            ]
          },
          {
            "news": "经济衰退影响航天投入。",
            "mults": {
              "spacecraft": 0.29,
              "chip": 0.17,
              "copper": 0.15,
              "oil": 0.18
            },
            "C": [
              {
                "news": "衰退加深，航天器大跌。",
                "super": false,
                "mults": {
                  "spacecraft": 0.08,
                  "chip": 0.14,
                  "copper": 0.08,
                  "oil": 0.08
                }
              },
              {
                "news": "财政刺激，项目重启。",
                "super": false,
                "mults": {
                  "spacecraft": 12.5,
                  "chip": 7.33,
                  "copper": 6.96,
                  "oil": 8.25
                }
              },
              {
                "news": "复苏缓慢，低位徘徊。",
                "super": false,
                "mults": {
                  "spacecraft": 0.11,
                  "chip": 0.11,
                  "copper": 0.09,
                  "oil": 0.11
                }
              }
            ]
          }
        ]
      },
      {
        "news": "技术突破，太空经济进入新阶段。",
        "mults": {
          "spacecraft": 3.36,
          "chip": 3.3,
          "copper": 3.04,
          "oil": 3.83
        },
        "B": [
          {
            "news": "可回收火箭成本大降。",
            "mults": {
              "spacecraft": 5.42,
              "chip": 4.61,
              "copper": 4.88,
              "oil": 6.31
            },
            "C": [
              {
                "news": "成本革命，航天器暴涨。",
                "super": true,
                "mults": {
                  "spacecraft": 22.11,
                  "chip": 13.34,
                  "copper": 16.7,
                  "oil": 10.52
                }
              },
              {
                "news": "技术扩散，价格回落。",
                "super": false,
                "mults": {
                  "spacecraft": 12.26,
                  "chip": 9.29,
                  "copper": 7.64,
                  "oil": 7.03
                }
              },
              {
                "news": "竞争加剧，高位震荡。",
                "super": false,
                "mults": {
                  "spacecraft": 9.1,
                  "chip": 8.81,
                  "copper": 9.52,
                  "oil": 6.55
                }
              }
            ]
          },
          {
            "news": "太空采矿概念升温。",
            "mults": {
              "spacecraft": 7.11,
              "chip": 6.24,
              "copper": 4.18,
              "oil": 5.48
            },
            "C": [
              {
                "news": "采矿预期爆发，航天器与铜暴涨。",
                "super": true,
                "mults": {
                  "spacecraft": 22.08,
                  "chip": 16.54,
                  "copper": 16.26,
                  "oil": 10.82
                }
              },
              {
                "news": "预期降温，价格回落。",
                "super": false,
                "mults": {
                  "spacecraft": 9.71,
                  "chip": 7.5,
                  "copper": 9.2,
                  "oil": 8.02
                }
              },
              {
                "news": "长期故事，高位运行。",
                "super": false,
                "mults": {
                  "spacecraft": 9.69,
                  "chip": 6.92,
                  "copper": 8.5,
                  "oil": 8.85
                }
              }
            ]
          },
          {
            "news": "国际竞争引发黄金避险。",
            "mults": {
              "spacecraft": 5.46,
              "chip": 4.62,
              "copper": 5.96,
              "oil": 5.01
            },
            "C": [
              {
                "news": "地缘紧张，黄金暴涨，航天分化。",
                "super": true,
                "mults": {
                  "spacecraft": 24.77,
                  "chip": 12.17,
                  "copper": 10.42,
                  "oil": 15.62
                }
              },
              {
                "news": "局势缓和，黄金回落。",
                "super": false,
                "mults": {
                  "spacecraft": 13.36,
                  "chip": 7.55,
                  "copper": 7.52,
                  "oil": 9.41
                }
              },
              {
                "news": "长期博弈，多品高位。",
                "super": false,
                "mults": {
                  "spacecraft": 14.75,
                  "chip": 8.31,
                  "copper": 9.22,
                  "oil": 7.27
                }
              }
            ]
          }
        ]
      }
    ]
  }
};

function createExpandedEcoEvent(definition) {
  const toMults = values => Object.fromEntries(definition.goods.map((id, index) => [id, values[index]]));
  const finishBranches = branch => {
    const clamp = value => +Math.max(0.03, Math.min(24.9, value)).toFixed(2);
    const amplified = branch.values.map(value => clamp(value >= 1 ? value * 2.35 : value * 0.42));
    const reversed = branch.values.map(value => clamp(value >= 1 ? 0.72 / value : 1.18 / value));
    const settled = branch.values.map(value => clamp(Math.sqrt(value)));
    return [
      { news: `${branch.news}后续影响继续放大。`, super: amplified.some(value => value >= 12 || value <= 0.08), mults: toMults(amplified) },
      { news: `${branch.news}随后政策与资金风向逆转。`, super: reversed.some(value => value >= 12 || value <= 0.08), mults: toMults(reversed) },
      { news: `${branch.news}最终被市场逐步消化。`, super: false, mults: toMults(settled) }
    ];
  };
  return {
    name: definition.name,
    unlock: definition.unlock || 0,
    goods: definition.goods,
    announce: { title: '国际新闻', desc: definition.announce },
    A: definition.A.map(stage => ({
      news: stage.news,
      mults: toMults(stage.values),
      B: stage.B.map(branch => ({
        news: branch.news,
        mults: toMults(branch.values),
        C: finishBranches(branch)
      }))
    }))
  };
}

Object.assign(ECO_EVENTS, {
  civilSupplyControl: createExpandedEcoEvent({
    name: '民生物资管制',
    goods: ['salt', 'cloth', 'medicine', 'tea'],
    announce: '多国开始调整民生物资供应与出口政策，食盐、棉布、药品、茶叶将在未来数日出现连锁波动。',
    A: [
      {
        news: '抢购与限运同时出现，基础物资供应迅速趋紧。',
        values: [2.4, 2.1, 3.2, 1.6],
        B: [
          { news: '居民囤货扩大，药品与食盐成为争抢重点。', values: [4.2, 3.8, 5.4, 2.7] },
          { news: '配给政策落地，紧缺程度有所分化。', values: [3.1, 2.7, 4.6, 1.9] },
          { news: '紧急进口抵港，供应压力暂时缓解。', values: [1.5, 1.4, 1.8, 1.1] }
        ]
      },
      {
        news: '产能恢复速度快于预期，民生物资价格普遍承压。',
        values: [0.65, 0.72, 0.55, 0.84],
        B: [
          { news: '库存集中释放，批发市场出现抛售。', values: [0.38, 0.46, 0.32, 0.7] },
          { news: '出口订单回升，部分商品率先反弹。', values: [1.7, 1.5, 0.75, 1.2] },
          { news: '新一轮公共卫生担忧令需求重新升温。', values: [2.9, 2.4, 4.2, 1.8] }
        ]
      },
      {
        news: '各地政策不一，民生供应出现明显分化。',
        values: [1.3, 0.58, 2.1, 0.72],
        B: [
          { news: '沿海运输受阻，食盐与药品价格走高。', values: [3.5, 0.44, 4.1, 0.65] },
          { news: '纺织订单爆发，棉布独自走强。', values: [0.82, 3.9, 1.1, 0.76] },
          { news: '消费转弱，茶叶与棉布库存积压。', values: [1.15, 0.42, 1.4, 0.35] }
        ]
      }
    ]
  }),
  manufacturingRevival: createExpandedEcoEvent({
    name: '制造业振兴',
    goods: ['steel', 'car', 'machine-tool', 'copper'],
    announce: '主要工业国推出制造业振兴计划，钢材、汽车、精密机床、铜的订单与产能将重新洗牌。',
    A: [
      {
        news: '基建与设备订单集中释放，工业品需求全面升温。',
        values: [2.2, 1.8, 2.7, 2.1],
        B: [
          { news: '大型工程提前开工，钢材与机床供不应求。', values: [4.8, 2.9, 5.2, 3.7] },
          { news: '汽车补贴扩大，整车订单快速增长。', values: [2.6, 5.1, 3.4, 2.8] },
          { news: '铜矿供应收紧，原料端推高制造成本。', values: [3.1, 2.2, 3.8, 5.4] }
        ]
      },
      {
        news: '投资计划推迟，制造业订单突然转弱。',
        values: [0.58, 0.66, 0.52, 0.61],
        B: [
          { news: '库存高企引发价格战，汽车与钢材领跌。', values: [0.3, 0.27, 0.48, 0.44] },
          { news: '设备出口获得新订单，机床率先修复。', values: [0.72, 0.58, 2.8, 0.81] },
          { news: '矿山停产带动铜价反弹，其他工业品仍弱。', values: [0.62, 0.55, 0.73, 3.6] }
        ]
      },
      {
        news: '产业升级与淘汰落后产能同时推进，行情严重分化。',
        values: [0.76, 1.4, 2.3, 1.2],
        B: [
          { news: '自动化改造提速，精密机床成为核心缺口。', values: [1.1, 1.6, 5.5, 1.8] },
          { news: '新能源车订单井喷，汽车与铜同步走强。', values: [1.25, 4.7, 2.2, 3.9] },
          { news: '需求预测落空，钢材库存继续累积。', values: [0.26, 0.82, 1.3, 0.68] }
        ]
      }
    ]
  }),
  lunarResourceDevelopment: createExpandedEcoEvent({
    name: '月球资源开发',
    unlock: ULTRA_UNLOCK,
    goods: ['lunar-soil', 'spacecraft', 'machine-tool', 'gold'],
    announce: '多国公布月球资源开发计划，月壤、航天器、精密机床、黄金相关市场进入高风险竞逐。',
    A: [
      {
        news: '首批商业合同落地，太空产业链估值快速上升。',
        values: [3.8, 2.6, 2.4, 1.7],
        B: [
          { news: '月壤样本拍卖引发全球资本追逐。', values: [6.2, 3.5, 2.9, 2.4] },
          { news: '运载订单暴增，航天器与机床供应紧张。', values: [4.3, 5.7, 4.8, 1.9] },
          { news: '避险资金同时涌入黄金与太空资产。', values: [4.9, 3.8, 2.6, 5.1] }
        ]
      },
      {
        news: '关键任务延期，月球开发预期迅速降温。',
        values: [0.22, 0.45, 0.6, 2.1],
        B: [
          { news: '发射事故打击产业信心，太空资产遭到抛售。', values: [0.08, 0.16, 0.34, 3.7] },
          { news: '政府追加预算，设备端获得短暂支撑。', values: [0.42, 1.8, 2.5, 1.6] },
          { news: '项目取消传闻扩散，月壤交易几近冻结。', values: [0.05, 0.28, 0.47, 2.9] }
        ]
      },
      {
        news: '新技术突破降低运输成本，产业价值重新分配。',
        values: [2.5, 3.2, 1.9, 0.72],
        B: [
          { news: '可回收运输系统成熟，航天订单快速扩张。', values: [3.7, 6.1, 3.2, 0.61] },
          { news: '原位加工获得验证，月壤与机床同步走强。', values: [5.8, 2.8, 5.1, 0.83] },
          { news: '商业回报遭到质疑，资金重新流向黄金。', values: [0.48, 0.74, 0.69, 4.6] }
        ]
      }
    ]
  })
});

// 仓库容量按财富评级动态解锁，达到过不降
const WAREHOUSE_CAPACITY_BY_MILESTONE = [1000, 4000, 16000, 64000, 256000, 1024000, 4096000, 16000000];

const GOODS = [
  { id:'wheat',name:'小麦',icon:'🌾',base:5,tier:'low',tags:['价格活跃','回稳较快','上架频繁'],market:[.095,.24,.05,.44,1.10,1.05,1.40,.62,1.45] },
  { id:'salt',name:'食盐',icon:'🧂',base:6,tier:'low',tags:['行情稳定','回稳较快','上架频繁'],market:[.035,.28,-.10,.46,.60,.80,1.50,.78,1.22] },
  { id:'wood',name:'木材',icon:'🪵',base:8,tier:'low',tags:['走势反复','工业相关','上架频繁'],market:[.075,.12,.12,.41,.90,1,1.25,.60,1.40] },
  { id:'coal',name:'煤炭',icon:'⛏️',base:12,tier:'low',tags:['行情持久','事件敏感','工业相关'],market:[.070,.09,.38,.39,1.25,1.10,1.10,.55,1.50] },
  { id:'tea',name:'茶叶',icon:'🍵',base:18,tier:'low',tags:['行情稳定','回稳较快','消费相关'],market:[.045,.23,-.05,.47,.75,.90,1.30,.72,1.30] },
  { id:'coffee',name:'咖啡',icon:'☕',base:28,tier:'low',tags:['价格活跃','消费相关','走势反复'],market:[.065,.15,-.12,.48,.95,1,1.20,.63,1.42] },
  { id:'cloth',name:'棉布',icon:'🧵',base:45,tier:'low',tags:['行情持久','消费相关','上架频繁'],market:[.060,.12,.28,.43,1.05,.95,1.15,.64,1.40] },
  { id:'copper',name:'铜',icon:'🔩',base:80,tier:'mid',tags:['价格活跃','工业相关','事件敏感'],market:[.060,.11,.30,.42,1.20,1,1.10,.65,1.38] },
  { id:'steel',name:'钢材',icon:'🧱',base:110,tier:'mid',tags:['行情持久','工业相关','事件敏感'],market:[.055,.10,.34,.43,1.25,1.05,1.10,.66,1.42] },
  { id:'oil',name:'石油',icon:'🛢️',base:160,tier:'mid',tags:['价格活跃','事件敏感','偶有重挫'],market:[.070,.08,.42,.38,1.50,1.15,1,.52,1.55] },
  { id:'chip',name:'芯片',icon:'🔲',base:320,tier:'mid',tags:['偶有暴涨','事件敏感','工业相关'],market:[.045,.14,.24,.51,1.45,1.20,.95,.68,1.45] },
  { id:'medicine',name:'药品',icon:'💊',base:700,tier:'mid',tags:['行情稳定','事件敏感','偶有暴涨'],market:[.030,.22,.02,.50,1.55,1.25,.85,.76,1.28] },
  { id:'phone',name:'手机',icon:'📱',base:2000,tier:'high',tags:['走势反复','消费相关','事件敏感'],market:[.040,.16,-.08,.40,1.30,1,1.05,.70,1.32] },
  { id:'car',name:'汽车',icon:'🚗',base:3500,tier:'high',tags:['行情持久','消费相关','偶有重挫'],market:[.045,.09,.36,.40,1.25,1.05,.85,.64,1.42] },
  { id:'gold',name:'黄金',icon:'🪙',base:6000,tier:'high',tags:['行情稳定','危机受益','事件敏感'],market:[.025,.18,.08,.49,1.20,1.05,.90,.76,1.28] },
  { id:'machine-tool',name:'精密机床',icon:'⚙️',base:12000,tier:'high',tags:['行情持久','工业相关','上架较少'],market:[.035,.08,.40,.43,1.15,1.05,.70,.68,1.40] },
  { id:'diamond',name:'钻石',icon:'💎',base:30000,tier:'ultra',tags:['上架较少','收藏属性','偶有暴涨'],market:[.025,.07,.14,.50,.85,1.25,.65,.72,1.35] },
  { id:'antique',name:'古董',icon:'🏺',base:120000,tier:'ultra',tags:['走势反复','收藏属性','上架较少'],market:[.030,.06,-.15,.46,.90,1.35,.55,.66,1.42] },
  { id:'spacecraft',name:'航天器',icon:'🚀',base:500000,tier:'ultra',tags:['航天相关','事件敏感','上架较少'],market:[.020,.05,.20,.42,1,1.40,.50,.75,1.30] },
  { id:'lunar-soil',name:'月壤',icon:'🌑',base:1500000,tier:'ultra',tags:['航天相关','收藏属性','偶有暴涨'],market:[.018,.04,.08,.52,.75,1.55,.40,.78,1.25] }
];

const MARKET_FIELDS = ['volatility','meanReversion','momentum','positiveBias','eventWeight','eventImpact','listingWeight','ordinaryFloor','ordinaryCeiling'];
GOODS.forEach(g => {
  g.market = Object.fromEntries(MARKET_FIELDS.map((field, index) => [field, g.market[index]]));
  g.vol = g.market.volatility;
  g.art = `assets/art/runtime/goods/good-${g.id}-128.webp`;
});

