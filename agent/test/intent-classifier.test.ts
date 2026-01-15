import { HumanMessage } from '@langchain/core/messages';
import { intentClassifier } from '@/agent/nodes/intent-classifier';
import type { AgentState } from '@/agent/state';

// 辅助函数：创建测试状态
function createTestState(userMessage: string): AgentState {
  return {
    messages: [new HumanMessage(userMessage)],
    requirements: {},
    intent: 'chat',
    hasAskedPreferences: false,
    itinerary: null,
  } as AgentState;
}

// 类型守卫函数
function hasRequirements(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): update is { intent?: string; requirements?: any } {
  return (
    update &&
    typeof update === 'object' &&
    !Array.isArray(update) &&
    'requirements' in update
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasIntent(update: any): update is { intent?: string } {
  return (
    update &&
    typeof update === 'object' &&
    !Array.isArray(update) &&
    'intent' in update
  );
}

// 🔥 辅助函数：检查 goto 目标（goto 是数组形式）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkGoto(goto: any, target: string): boolean {
  return Array.isArray(goto) && goto.includes(target);
}

async function runTests() {
  console.log('\n🧪 意图分类器测试（Command 模式）\n');

  // 测试 1：识别任务意图
  console.log('【测试 1】识别旅行任务意图');
  try {
    const state = createTestState('我想去成都玩5天');
    const result = await intentClassifier(state);

    console.log('✅ Command.goto:', result.goto);

    if (hasIntent(result.update)) {
      console.log('✅ Command.update.intent:', result.update.intent);
    }
    if (hasRequirements(result.update)) {
      console.log(
        '✅ Command.update.requirements:',
        result.update.requirements,
      );
    }

    // 🔥 修复：使用 checkGoto 检查
    if (checkGoto(result.goto, 'requirement_node')) {
      console.log('✅ 测试通过：正确路由到 requirement_node\n');
    } else {
      console.log('❌ 测试失败：路由错误\n');
    }
  } catch (error) {
    console.error('❌ 测试 1 失败:', error);
  }

  // 测试 2：识别闲聊意图
  console.log('【测试 2】识别闲聊意图');
  try {
    const state = createTestState('你好呀，今天天气真不错');
    const result = await intentClassifier(state);

    console.log('✅ Command.goto:', result.goto);

    // 🔥 修复
    if (checkGoto(result.goto, 'chat_node')) {
      console.log('✅ 测试通过：正确路由到 chat_node\n');
    } else {
      console.log('❌ 测试失败：路由错误\n');
    }
  } catch (error) {
    console.error('❌ 测试 2 失败:', error);
  }

  // 测试 3：识别修改意图
  console.log('【测试 3】识别修改意图');
  try {
    const state = createTestState('把预算改成5000吧');
    const result = await intentClassifier(state);

    console.log('✅ Command.goto:', result.goto);

    if (hasIntent(result.update)) {
      console.log('✅ Command.update.intent:', result.update.intent);

      // 🔥 修复
      if (
        checkGoto(result.goto, 'requirement_node') &&
        result.update.intent === 'modify'
      ) {
        console.log('✅ 测试通过：正确识别修改意图并路由\n');
      } else {
        console.log('❌ 测试失败\n');
      }
    }
  } catch (error) {
    console.error('❌ 测试 3 失败:', error);
  }

  // 测试 4：提取初始信息
  console.log('【测试 4】提取初始目的地和天数');
  try {
    const state = createTestState('我想去三亚玩7天');
    const result = await intentClassifier(state);

    if (hasRequirements(result.update)) {
      console.log('✅ 提取的目的地:', result.update.requirements?.destination);
      console.log('✅ 提取的天数:', result.update.requirements?.days);

      if (
        result.update.requirements?.destination &&
        result.update.requirements?.days
      ) {
        console.log('✅ 测试通过：成功提取初始信息\n');
      } else {
        console.log('⚠️ 未提取到初始信息（可能需要优化 Prompt）\n');
      }
    }
  } catch (error) {
    console.error('❌ 测试 4 失败:', error);
  }

  console.log('✅ 意图分类器测试完成！\n');
}

runTests();
