import { HumanMessage } from '@langchain/core/messages';
import { agent } from '@/agent/index';

// 辅助函数：调用 agent
async function invokeAgent(userInput: string, threadId: string) {
  const config = {
    configurable: {
      thread_id: threadId,
    },
  };

  const result = await agent.invoke(
    {
      messages: [new HumanMessage(userInput)],
    },
    config,
  );

  return result;
}

// 辅助函数：提取最后一条 AI 消息
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getLastAIMessage(result: any): string {
  const messages = result.messages || [];
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]._getType() === 'ai') {
      return String(messages[i].content);
    }
  }
  return '';
}

async function runTests() {
  console.log('\n🚀 完整工作流测试（包含行程生成）\n');
  console.log('='.repeat(80));

  // ==================== 测试 1：完整流程 - 从对话到生成行程 ====================
  console.log('\n【测试 1】完整流程：Chat → Intent → Collector → Planner\n');

  const thread1 = 'complete_flow_test_1';

  try {
    // 第 1 轮：问候
    console.log('👤 用户: 你好');
    let result = await invokeAgent('你好', thread1);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📌 Intent:', result.intent);
    console.log('');

    // 第 2 轮：表达旅行意图
    console.log('👤 用户: 我想去成都玩');
    result = await invokeAgent('我想去成都玩', thread1);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📌 Intent:', result.intent);
    console.log('📊 需求:', result.requirements);
    console.log('');

    // 第 3 轮：补充天数
    console.log('👤 用户: 5天');
    result = await invokeAgent('5天', thread1);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📊 需求:', result.requirements);
    console.log('');

    // 第 4 轮：补充日期
    console.log('👤 用户: 3月15号出发');
    result = await invokeAgent('3月15号出发', thread1);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📊 需求:', result.requirements);
    console.log('');

    // 第 5 轮：补充预算
    console.log('👤 用户: 人均3000');
    result = await invokeAgent('人均3000', thread1);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📊 需求:', result.requirements);
    console.log('');

    // 第 6 轮：补充人数
    console.log('👤 用户: 2个人');
    result = await invokeAgent('2个人', thread1);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📊 需求:', result.requirements);
    console.log('📌 hasAskedPreferences:', result.hasAskedPreferences);
    console.log('');

    // 第 7 轮：回答偏好问题（此轮应该触发 Planner）
    console.log('👤 用户: 喜欢美食和摄影，不吃辣');
    result = await invokeAgent('喜欢美食和摄影，不吃辣', thread1);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📊 最终需求:', result.requirements);
    console.log('');

    // 验证是否生成了行程
    if (result.itinerary) {
      console.log('✅ 成功生成行程！');
      console.log('\n📋 行程概览:');
      console.log('  目的地:', result.itinerary.overview.destination);
      console.log('  天数:', result.itinerary.overview.days);
      console.log('  人数:', result.itinerary.overview.people);
      console.log(
        '  预算:',
        result.itinerary.overview.budgetPerPerson,
        '元/人',
      );
      console.log(
        '  预估花费:',
        result.itinerary.overview.estimatedCostPerPerson,
        '元/人',
      );
      console.log('\n📅 每日行程:');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.itinerary.dailyItinerary.forEach((day: any, index: number) => {
        console.log(`  Day ${day.day} (${day.date}): ${day.title}`);
      });
      console.log('\n💰 预算分解:');
      console.log('  交通:', result.itinerary.budget.transportation, '元');
      console.log('  住宿:', result.itinerary.budget.accommodation, '元');
      console.log('  餐饮:', result.itinerary.budget.food, '元');
      console.log('  门票:', result.itinerary.budget.tickets, '元');
      console.log('  其他:', result.itinerary.budget.other, '元');
      console.log('\n📝 总结:', result.itinerary.summary);
      console.log('\n✅ 测试 1 通过：完整流程正常运行！');
    } else {
      console.log('❌ 测试 1 失败：未生成行程');
    }
  } catch (error) {
    console.error('❌ 测试 1 失败:', error);
  }

  console.log('\n' + '='.repeat(80));

  // ==================== 测试 2：一次性提供完整信息并生成行程 ====================
  console.log('\n【测试 2】一次性提供完整信息并生成行程\n');

  const thread2 = 'complete_flow_test_2';

  try {
    console.log(
      '👤 用户: 我想3月20号去三亚玩3天，2个人，人均预算5000，喜欢海滩和潜水',
    );
    const result = await invokeAgent(
      '我想3月20号去三亚玩3天，2个人，人均预算5000，喜欢海滩和潜水',
      thread2,
    );
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📊 需求:', result.requirements);
    console.log('');

    // 可能需要一轮确认
    if (!result.itinerary) {
      console.log('需要确认，继续对话...');
      console.log('👤 用户: 就这些，可以开始规划了');
      const result2 = await invokeAgent('就这些，可以开始规划了', thread2);
      console.log('🤖 AI:', getLastAIMessage(result2));

      if (result2.itinerary) {
        console.log('\n✅ 成功生成行程！');
        console.log('目的地:', result2.itinerary.overview.destination);
        console.log('总结:', result2.itinerary.summary);
        console.log('\n✅ 测试 2 通过：快速流程正常！');
      } else {
        console.log('❌ 测试 2 失败：未生成行程');
      }
    } else {
      console.log('\n✅ 一次性生成行程成功！');
      console.log('✅ 测试 2 通过！');
    }
  } catch (error) {
    console.error('❌ 测试 2 失败:', error);
  }

  console.log('\n' + '='.repeat(80));

  // ==================== 测试 3：验证偏好是否生效 ====================
  console.log('\n【测试 3】验证偏好在行程中是否生效\n');

  const thread3 = 'complete_flow_test_3';

  try {
    console.log('👤 用户: 我想去北京玩5天，2个人，人均4000，3月1号出发');
    let result = await invokeAgent(
      '我想去北京玩5天，2个人，人均4000，3月1号出发',
      thread3,
    );
    console.log('🤖 AI:', getLastAIMessage(result).substring(0, 100) + '...');
    console.log('');

    console.log('👤 用户: 我喜欢历史文化，想看故宫和长城');
    result = await invokeAgent('我喜欢历史文化，想看故宫和长城', thread3);
    console.log('🤖 AI:', getLastAIMessage(result).substring(0, 100) + '...');
    console.log('');

    if (result.itinerary) {
      const itineraryText = JSON.stringify(result.itinerary).toLowerCase();
      const hasHistoricalSites =
        itineraryText.includes('故宫') ||
        itineraryText.includes('长城') ||
        itineraryText.includes('历史');

      if (hasHistoricalSites) {
        console.log('✅ 测试 3 通过：行程包含了用户偏好（历史文化景点）');
      } else {
        console.log('⚠️ 测试 3 警告：行程可能未充分体现用户偏好');
      }
    } else {
      console.log('❌ 测试 3 失败：未生成行程');
    }
  } catch (error) {
    console.error('❌ 测试 3 失败:', error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n🎉 完整工作流测试完成！\n');
}

runTests();
