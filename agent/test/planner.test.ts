import { planner } from '../nodes/planner';
import { HumanMessage } from '@langchain/core/messages';
import type { AgentState, Requirements } from '../state';

// 辅助函数：创建测试状态
function createPlannerTestState(requirements: Requirements): AgentState {
  return {
    messages: [new HumanMessage('帮我规划行程')],
    requirements,
    intent: 'task',
    hasAskedPreferences: true,
    itinerary: null,
  } as AgentState;
}

async function runTests() {
  console.log('\n🧪 Planner 节点测试\n');

  // 测试 1：生成完整的行程规划
  console.log('【测试 1】从完整需求生成行程');
  try {
    const state = createPlannerTestState({
      destination: '成都',
      startDate: '2026-03-01',
      days: 5,
      budget: 3000,
      participants: 2,
      preferences: ['美食', '摄影', '不吃辣'],
    });

    const result = await planner(state);

    if (!result.update.itinerary) {
      console.log('❌ 测试失败：未生成行程');
      console.log('返回的结果:', result);
      return;
    }

    const itinerary = result.update.itinerary;
    console.log('✅ 生成的行程概览:', itinerary.overview);
    console.log('✅ 每日行程数量:', itinerary.dailyItinerary.length);
    console.log('✅ 预算分解:', itinerary.budget);
    console.log('✅ 总结文案:', itinerary.summary);

    // 验证预算不超支
    const budgetPerPerson = itinerary.overview.budgetPerPerson;
    const estimatedCost = itinerary.overview.estimatedCostPerPerson;

    if (estimatedCost <= budgetPerPerson) {
      console.log(`✅ 预算控制正确: ${estimatedCost} <= ${budgetPerPerson}`);
    } else {
      console.log(`❌ 预算超支: ${estimatedCost} > ${budgetPerPerson}`);
    }

    if (itinerary.dailyItinerary.length === 5) {
      console.log('✅ 测试通过：生成了正确天数的行程');
    } else {
      console.log(
        `❌ 测试失败：天数不符（期望5天，实际${itinerary.dailyItinerary.length}天）`,
      );
    }

    // 验证每天都有完整信息
    const hasCompleteInfo = itinerary.dailyItinerary.every(
      (day: any) =>
        day.morning && day.afternoon && day.evening && day.accommodation,
    );

    if (hasCompleteInfo) {
      console.log('✅ 每日行程信息完整');
    } else {
      console.log('⚠️ 部分日期信息不完整');
    }

    // 打印完整行程
    console.log('\n=== 生成的完整行程方案 ===');
    console.log(JSON.stringify(itinerary, null, 2));
  } catch (error) {
    console.error('❌ 测试 1 失败:', error);
  }

  // 测试 2：处理不同偏好
  console.log('\n【测试 2】处理不同的旅行偏好（海滩度假）');
  try {
    const state = createPlannerTestState({
      destination: '三亚',
      startDate: '2026-04-01',
      days: 3,
      budget: 5000,
      participants: 1,
      preferences: ['海滩', '潜水', '放松'],
    });

    const result = await planner(state);

    if (!result.update.itinerary) {
      console.log('❌ 测试失败：未生成行程\n');
      return;
    }

    const itinerary = result.update.itinerary;
    console.log('✅ 生成的行程概览:', itinerary.overview);
    console.log('✅ 总结文案:', itinerary.summary);

    // 验证行程中包含海滩相关活动（检查文本内容）
    const hasBeachActivity = itinerary.dailyItinerary.some(
      (day: any) =>
        day.morning?.includes('海') ||
        day.afternoon?.includes('海') ||
        day.evening?.includes('海') ||
        day.morning?.includes('潜水') ||
        day.afternoon?.includes('潜水') ||
        day.title?.includes('海滩'),
    );

    if (hasBeachActivity) {
      console.log('✅ 测试通过：行程包含海滩相关活动');
    } else {
      console.log('⚠️ 警告：行程中可能缺少海滩相关活动');
    }

    // 打印第一天的详细安排
    console.log('\n第一天详细安排示例:');
    console.log('主题:', itinerary.dailyItinerary[0].title);
    console.log('上午:', itinerary.dailyItinerary[0].morning);
    console.log('下午:', itinerary.dailyItinerary[0].afternoon);
    console.log('晚上:', itinerary.dailyItinerary[0].evening);
  } catch (error) {
    console.error('❌ 测试 2 失败:', error);
  }

  console.log('\n✅ Planner 节点测试完成！\n');
}

runTests();
