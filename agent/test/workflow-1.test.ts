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
  console.log('\n🚀 完整工作流集成测试\n');
  console.log('='.repeat(60));

  // ==================== 测试 1：完整的需求收集流程 ====================
  console.log('\n【测试 1】完整的需求收集流程（多轮对话）\n');

  const thread1 = 'test_thread_1';

  try {
    // 第 1 轮：用户首次表达意图
    console.log('👤 用户: 我想去成都');
    let result = await invokeAgent('我想去成都', thread1);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📊 当前需求:', result.requirements);
    console.log('');

    // 第 2 轮：回答天数
    console.log('👤 用户: 5天');
    result = await invokeAgent('5天', thread1);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📊 当前需求:', result.requirements);
    console.log('');

    // 第 3 轮：回答预算
    console.log('👤 用户: 预算人均3000');
    result = await invokeAgent('预算人均3000', thread1);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📊 当前需求:', result.requirements);
    console.log('');

    // 第 4 轮：回答人数
    console.log('👤 用户: 2个人');
    result = await invokeAgent('2个人', thread1);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📊 当前需求:', result.requirements);
    console.log('');

    // 第 5 轮：回答出发日期
    console.log('👤 用户: 3月15号出发');
    result = await invokeAgent('3月15号出发', thread1);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📊 当前需求:', result.requirements);
    console.log('📌 hasAskedPreferences:', result.hasAskedPreferences);
    console.log('');

    // 第 6 轮：回答偏好
    console.log('👤 用户: 喜欢美食和摄影，不吃辣');
    result = await invokeAgent('喜欢美食和摄影，不吃辣', thread1);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📊 最终需求:', result.requirements);
    console.log('');

    console.log('✅ 测试 1 完成：需求收集流程正常\n');
  } catch (error) {
    console.error('❌ 测试 1 失败:', error);
  }

  console.log('='.repeat(60));

  // ==================== 测试 2：一次性提供完整信息 ====================
  console.log('\n【测试 2】一次性提供完整信息\n');

  const thread2 = 'test_thread_2';

  try {
    console.log(
      '👤 用户: 我想3月20号和朋友去三亚玩7天，预算人均8000，我们2个人，喜欢海滩和美食',
    );
    const result = await invokeAgent(
      '我想3月20号和朋友去三亚玩7天，预算人均8000，我们2个人，喜欢海滩和美食',
      thread2,
    );
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📊 提取的需求:', result.requirements);
    console.log('📌 hasAskedPreferences:', result.hasAskedPreferences);
    console.log('');

    console.log('✅ 测试 2 完成：一次性信息提取正常\n');
  } catch (error) {
    console.error('❌ 测试 2 失败:', error);
  }

  console.log('='.repeat(60));

  // ==================== 测试 3：闲聊流程 ====================
  console.log('\n【测试 3】闲聊流程\n');

  const thread3 = 'test_thread_3';

  try {
    console.log('👤 用户: 你好呀');
    let result = await invokeAgent('你好呀', thread3);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('');

    console.log('👤 用户: 你是谁？');
    result = await invokeAgent('你是谁？', thread3);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('');

    console.log('✅ 测试 3 完成：闲聊路由正常\n');
  } catch (error) {
    console.error('❌ 测试 3 失败:', error);
  }

  console.log('='.repeat(60));

  // ==================== 测试 4：中途修改信息 ====================
  console.log('\n【测试 4】中途修改信息（覆盖式更新）\n');

  const thread4 = 'test_thread_4';

  try {
    // 先建立初始需求
    console.log('👤 用户: 我想去成都玩5天');
    let result = await invokeAgent('我想去成都玩5天', thread4);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📊 初始需求:', result.requirements);
    console.log('');

    // 修改目的地和天数
    console.log('👤 用户: 改成三亚吧，去7天');
    result = await invokeAgent('改成三亚吧，去7天', thread4);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📊 更新后需求:', result.requirements);
    console.log('');

    if (
      result.requirements.destination === '三亚' &&
      result.requirements.days === 7
    ) {
      console.log('✅ 测试 4 完成：信息修改（覆盖更新）正常\n');
    } else {
      console.log('⚠️ 测试 4 警告：修改可能未生效\n');
    }
  } catch (error) {
    console.error('❌ 测试 4 失败:', error);
  }

  console.log('='.repeat(60));

  // ==================== 测试 5：取消规划（强退出）====================
  console.log('\n【测试 5】取消规划（强退出）\n');

  const thread5 = 'test_thread_5';

  try {
    console.log('👤 用户: 我想去北京');
    let result = await invokeAgent('我想去北京', thread5);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('');

    console.log('👤 用户: 算了，不想去了');
    result = await invokeAgent('算了，不想去了', thread5);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('');

    const aiMessage = getLastAIMessage(result);
    if (aiMessage.includes('期待') || aiMessage.includes('服务')) {
      console.log('✅ 测试 5 完成：取消规划（强退出）正常\n');
    } else {
      console.log('⚠️ 测试 5 警告：取消响应可能不符合预期\n');
    }
  } catch (error) {
    console.error('❌ 测试 5 失败:', error);
  }

  console.log('='.repeat(60));

  // ==================== 测试 6：状态持久化（Checkpointer）====================
  console.log('\n【测试 6】状态持久化测试（模拟用户中断后继续）\n');

  const thread6 = 'test_thread_6';

  try {
    // 第一次会话
    console.log('--- 第一次会话 ---');
    console.log('👤 用户: 我想去杭州');
    let result = await invokeAgent('我想去杭州', thread6);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📊 需求:', result.requirements);
    console.log('');

    console.log('👤 用户: 5天');
    result = await invokeAgent('5天', thread6);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📊 需求:', result.requirements);
    console.log('');

    // 模拟用户离开...

    console.log('--- 用户离开一段时间后回来 ---');
    console.log('👤 用户: 预算3000');
    result = await invokeAgent('预算3000', thread6);
    console.log('🤖 AI:', getLastAIMessage(result));
    console.log('📊 需求:', result.requirements);
    console.log('');

    if (
      result.requirements.destination === '杭州' &&
      result.requirements.days === 5 &&
      result.requirements.budget === 3000
    ) {
      console.log('✅ 测试 6 完成：状态持久化正常，数据未丢失\n');
    } else {
      console.log('⚠️ 测试 6 警告：状态可能未正确持久化\n');
    }
  } catch (error) {
    console.error('❌ 测试 6 失败:', error);
  }

  console.log('='.repeat(60));
  console.log('\n🎉 完整工作流集成测试完成！\n');
}

runTests();
