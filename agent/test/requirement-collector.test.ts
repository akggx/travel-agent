import { HumanMessage } from '@langchain/core/messages';
import { requirementCollector } from '@/agent/nodes/requirement-collector';
import type { AgentState, Requirements } from '@/agent/state';

// 辅助函数：创建初始状态
function createState(
  userMessage: string,
  requirements: Partial<Requirements> = {},
  hasAskedPreferences = false,
): AgentState {
  return {
    messages: [new HumanMessage(userMessage)],
    requirements: {
      destination: '',
      startDate: '',
      days: 0,
      budget: 0,
      participants: 0,
      preferences: [],
      ...requirements,
    },
    intent: 'task',
    isRequirementsComplete: false,
    hasAskedPreferences,
    itinerary: null,
    auditIssues: [],
  } as AgentState;
}

// 测试执行
async function runTests() {
  console.log('\n🧪 需求收集器测试 - 简洁版\n');

  // 测试 1: 只提供目的地
  console.log('【测试 1】只提供目的地，应该追问其他核心信息');
  try {
    const state = createState('我想去成都');
    const result = await requirementCollector(state);

    console.log('✅ 提取到:', result.requirements?.destination);
    console.log('💬 AI:', result.messages?.content); // 改这里
    console.log('📊 完成状态:', result.isRequirementsComplete);
    console.log('');
  } catch (error) {
    console.error('❌ 测试 1 失败:', error);
  }

  // 测试 2: 核心信息齐全，应该询问偏好
  console.log('【测试 2】核心信息齐全，应该询问偏好');
  try {
    const state = createState(
      '我和老婆想3月15号去成都玩5天，预算人均3000',
      {},
      false,
    );
    const result = await requirementCollector(state);

    console.log('✅ 提取到:', JSON.stringify(result.requirements, null, 2));
    console.log('💬 AI:', result.messages?.content); // 改这里
    console.log('📊 完成状态:', result.isRequirementsComplete);
    console.log('🔍 已问偏好:', result.hasAskedPreferences);
    console.log('');
  } catch (error) {
    console.error('❌ 测试 2 失败:', error);
  }

  // 测试 3: 用户提供偏好后，应该完成
  console.log('【测试 3】用户提供偏好，应该确认完成');
  try {
    const state = createState(
      '喜欢美食和摄影，不吃辣',
      {
        destination: '成都',
        startDate: '2026-03-15',
        days: 5,
        budget: 3000,
        participants: 2,
        preferences: [],
      },
      true,
    );
    const result = await requirementCollector(state);

    console.log('✅ 偏好:', result.requirements?.preferences);
    console.log('💬 AI:', result.messages?.content); // 改这里
    console.log('📊 完成状态:', result.isRequirementsComplete);
    console.log('');
  } catch (error) {
    console.error('❌ 测试 3 失败:', error);
  }

  // 测试 4: 用户拒绝提供偏好
  console.log('【测试 4】用户拒绝提供偏好，应该确认完成');
  try {
    const state = createState(
      '没有特别要求',
      {
        destination: '北京',
        startDate: '2026-04-01',
        days: 3,
        budget: 2000,
        participants: 1,
        preferences: [],
      },
      true,
    );
    const result = await requirementCollector(state);

    console.log('💬 AI:', result.messages?.content); // 改这里
    console.log('📊 完成状态:', result.isRequirementsComplete);
    console.log('');
  } catch (error) {
    console.error('❌ 测试 4 失败:', error);
  }

  // 测试 5: 一次性提供所有信息（包括偏好）
  console.log('【测试 5】一次性提供完整信息');
  try {
    const state = createState(
      '我想3月20号和朋友去三亚玩7天，预算人均8000，我们2个人，喜欢海滩和美食',
    );
    const result = await requirementCollector(state);

    console.log('✅ 提取到:', JSON.stringify(result.requirements, null, 2));
    console.log('💬 AI:', result.messages?.content); // 改这里
    console.log('📊 完成状态:', result.isRequirementsComplete);
    console.log('');
  } catch (error) {
    console.error('❌ 测试 5 失败:', error);
  }

  console.log('✅ 所有测试完成！\n');
}

runTests();
