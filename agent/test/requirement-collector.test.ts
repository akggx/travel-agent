import { HumanMessage } from '@langchain/core/messages';
import { requirementCollector } from '@/agent/nodes/requirement-collector';
import type { AgentState, Requirements } from '@/agent/state';
import { END } from '@langchain/langgraph';

// 辅助函数：创建测试状态
function createTestState(
  userMessage: string,
  requirements: Partial<Requirements> = {},
  hasAskedPreferences = false,
): AgentState {
  return {
    messages: [new HumanMessage(userMessage)],
    requirements: requirements as Requirements,
    intent: 'task',
    hasAskedPreferences,
    itinerary: null,
  } as AgentState;
}

// 类型守卫
function hasRequirements(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: any,
): update is { requirements?: Partial<Requirements> } {
  return (
    update &&
    typeof update === 'object' &&
    !Array.isArray(update) &&
    'requirements' in update
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasMessages(update: any): update is { messages?: any[] } {
  return (
    update &&
    typeof update === 'object' &&
    !Array.isArray(update) &&
    'messages' in update
  );
}

// 检查 goto 目标
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkGoto(goto: any, target: string | symbol): boolean {
  if (target === END) {
    return Array.isArray(goto) && goto.includes(END);
  }
  return Array.isArray(goto) && goto.includes(target);
}

async function runTests() {
  console.log('\n🧪 需求收集器测试（Command 模式 + 自循环）\n');

  // 测试 1：首次输入目的地
  console.log('【测试 1】首次输入目的地，应该追问其他核心字段');
  try {
    const state = createTestState('我想去成都');
    const result = await requirementCollector(state);

    console.log('✅ Command.goto:', result.goto);

    if (hasRequirements(result.update)) {
      console.log('✅ 提取到目的地:', result.update.requirements?.destination);
    }
    if (hasMessages(result.update)) {
      console.log('💬 AI 回复:', result.update.messages?.[0]?.content);
    }

    if (checkGoto(result.goto, 'requirement_node')) {
      console.log('✅ 测试通过：正确自循环，继续追问\n');
    } else {
      console.log('❌ 测试失败：路由错误\n');
    }
  } catch (error) {
    console.error('❌ 测试 1 失败:', error);
  }

  // 测试 2：核心信息齐全，应该询问偏好
  console.log('【测试 2】核心信息齐全，应该询问偏好');
  try {
    const state = createTestState(
      '我和老婆想3月15号去成都玩5天，预算人均3000',
      {},
      false,
    );
    const result = await requirementCollector(state);

    console.log('✅ Command.goto:', result.goto);

    if (hasRequirements(result.update)) {
      console.log('✅ 提取的需求:', result.update.requirements);
    }
    if (result.update && 'hasAskedPreferences' in result.update) {
      console.log('✅ hasAskedPreferences:', result.update.hasAskedPreferences);
    }
    if (hasMessages(result.update)) {
      console.log('💬 AI 回复:', result.update.messages?.[0]?.content);
    }

    if (
      checkGoto(result.goto, 'requirement_node') &&
      result.update &&
      'hasAskedPreferences' in result.update &&
      result.update.hasAskedPreferences === true
    ) {
      console.log('✅ 测试通过：正确标记已询问偏好\n');
    } else {
      console.log('⚠️ 可能未正确识别为 ask_prefs\n');
    }
  } catch (error) {
    console.error('❌ 测试 2 失败:', error);
  }

  // 测试 3：用户提供偏好后，应该完成并路由到 planner
  console.log('【测试 3】用户提供偏好，应该完成收集');
  try {
    const state = createTestState(
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

    console.log('✅ Command.goto:', result.goto);

    if (hasRequirements(result.update)) {
      console.log('✅ 偏好:', result.update.requirements?.preferences);
    }
    if (hasMessages(result.update)) {
      console.log('💬 AI 回复:', result.update.messages?.[0]?.content);
    }

    if (checkGoto(result.goto, 'planner_node')) {
      console.log('✅ 测试通过：正确路由到 planner_node\n');
    } else {
      console.log('❌ 测试失败：应该去 planner_node 但去了', result.goto, '\n');
    }
  } catch (error) {
    console.error('❌ 测试 3 失败:', error);
  }

  // 测试 4：用户取消规划（强退出）
  console.log('【测试 4】用户取消规划，应该路由到 END');
  try {
    const state = createTestState(
      '算了，不想去了',
      {
        destination: '成都',
        days: 5,
      },
      false,
    );
    const result = await requirementCollector(state);

    console.log('✅ Command.goto:', result.goto);

    if (hasMessages(result.update)) {
      console.log('💬 AI 回复:', result.update.messages?.[0]?.content);
    }

    if (checkGoto(result.goto, END)) {
      console.log('✅ 测试通过：正确识别取消意图并退出\n');
    } else {
      console.log('❌ 测试失败：应该路由到 END\n');
    }
  } catch (error) {
    console.error('❌ 测试 4 失败:', error);
  }

  // 测试 5：修改已有信息（覆盖式更新）
  console.log('【测试 5】修改目的地，应该覆盖旧值并继续');
  try {
    const state = createTestState(
      '改成三亚吧，去7天',
      {
        destination: '成都',
        days: 5,
        budget: 3000,
      },
      false,
    );
    const result = await requirementCollector(state);

    console.log('✅ Command.goto:', result.goto);

    if (hasRequirements(result.update)) {
      console.log(
        '✅ 更新后的目的地:',
        result.update.requirements?.destination,
      );
      console.log('✅ 更新后的天数:', result.update.requirements?.days);
      console.log('✅ 保留的预算:', result.update.requirements?.budget);
    }
    if (hasMessages(result.update)) {
      console.log('💬 AI 回复:', result.update.messages?.[0]?.content);
    }

    if (
      hasRequirements(result.update) &&
      result.update.requirements?.destination === '三亚' &&
      result.update.requirements?.budget === 3000
    ) {
      console.log('✅ 测试通过：正确覆盖更新并保留其他字段\n');
    } else {
      console.log('⚠️ 覆盖更新可能有问题\n');
    }
  } catch (error) {
    console.error('❌ 测试 5 失败:', error);
  }

  // 测试 6：一次性提供完整信息
  console.log('【测试 6】一次性提供完整信息');
  try {
    const state = createTestState(
      '我想3月20号和朋友去三亚玩7天，预算人均8000，我们2个人，喜欢海滩和美食',
      {},
      false,
    );
    const result = await requirementCollector(state);

    console.log('✅ Command.goto:', result.goto);

    if (hasRequirements(result.update)) {
      console.log('✅ 提取的完整信息:', result.update.requirements);
    }
    if (hasMessages(result.update)) {
      console.log('💬 AI 回复:', result.update.messages?.[0]?.content);
    }

    if (
      checkGoto(result.goto, 'planner_node') ||
      checkGoto(result.goto, 'requirement_node')
    ) {
      console.log('✅ 测试通过：正确处理完整信息\n');
    } else {
      console.log('❌ 测试失败：路由错误\n');
    }
  } catch (error) {
    console.error('❌ 测试 6 失败:', error);
  }

  console.log('✅ 需求收集器测试完成！\n');
}

runTests();
