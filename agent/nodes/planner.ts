import { z } from 'zod';
import { AgentState } from '../state';
import { AIMessage, SystemMessage } from '@langchain/core/messages';
import { PLANNER_PROMPT } from '../prompts';
import { qwenMax } from '..';
import { Command, END } from '@langchain/langgraph';
import { tools } from '../tools';

const itinerarySchema = z.object({
  // 行程概览
  overview: z.object({
    destination: z.string().describe('目的地城市'),
    startDate: z.string().describe('出发日期 YYYY-MM-DD'),
    endDate: z.string().describe('结束日期 YYYY-MM-DD'),
    days: z.number().describe('总天数'),
    people: z.number().describe('人数'),
    budgetPerPerson: z.number().describe('人均预算（元）'),
    estimatedCostPerPerson: z.number().describe('预估人均花费（元）'),
  }),

  // 每日行程安排
  dailyItinerary: z.array(
    z.object({
      day: z.number().describe('第几天'),
      date: z.string().describe('日期 YYYY-MM-DD'),
      title: z.string().describe('当日主题，如"古城文化体验"'),
      morning: z.string().describe('上午安排（包含时间、地点、活动）'),
      afternoon: z.string().describe('下午安排（包含时间、地点、活动）'),
      evening: z.string().describe('晚上安排（包含时间、地点、活动）'),
      meals: z.string().describe('餐饮推荐'),
      accommodation: z.string().describe('住宿建议（地点+类型）'),
      tips: z.string().describe('当日特别提示'),
    }),
  ),

  // 预算明细（人均）
  budget: z.object({
    transportation: z.number().describe('交通费用（元）'),
    accommodation: z.number().describe('住宿费用（元）'),
    food: z.number().describe('餐饮费用（元）'),
    tickets: z.number().describe('门票费用（元）'),
    other: z.number().describe('其他费用（元）'),
  }),

  // 旅行建议
  recommendations: z.object({
    bestTimeToVisit: z.string().describe('最佳游览时间建议'),
    whatToBring: z.string().describe('必备物品建议'),
    localTips: z.string().describe('当地注意事项'),
    transportation: z.string().describe('交通出行建议'),
  }),

  // 总结
  summary: z.string().describe('行程亮点总结，2-3句话'),
});

export async function planner(state: AgentState) {
  console.log('[planner] 开始判断工具');
  // tools
  const modelWithTools = qwenMax.bindTools(tools);

  // 构建提示词，注入需求信息
  const prompt = PLANNER_PROMPT.replace(
    '{requirements}',
    JSON.stringify(state.requirements),
  );

  console.log('[planner] 判断工具完成，开始生成行程');
  const response = await modelWithTools.invoke([
    new SystemMessage(prompt),
    ...state.messages,
  ]);

  // 如果模型返回工具调用，则调用工具
  if (response.tool_calls && response.tool_calls.length > 0) {
    console.log('[planner] 模型返回工具调用，跳转到 tool_node');
    return new Command({
      update: { messages: [response] },
      goto: 'tool_node',
    });
  }

  // 模型信息充足，直接生成结构化行程
  const structureModel = qwenMax.withStructuredOutput(itinerarySchema);
  console.log('[planner] 开始生成行程');

  // 构建用于生成行程的消息，包含用户需求和工具结果
  const toolMessages = state.messages.filter(
    (msg) => msg._getType() === 'tool',
  );

  const generationPrompt = `
${prompt}

## 工具调用结果
${toolMessages.map((msg) => `- ${msg.name}: ${msg.content}`).join('\n')}

请根据以上需求和工具查询结果，生成完整的旅行行程计划。
`;

  const itinerary = await structureModel.invoke([
    new SystemMessage(generationPrompt),
  ]);

  return new Command({
    update: {
      messages: [new AIMessage(itinerary.summary)],
      itinerary: itinerary,
    },
    goto: 'presenter_node',
  });
}
