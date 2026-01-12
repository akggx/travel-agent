import { HumanMessage } from '@langchain/core/messages';
import { agent } from '@/agent/index';

// 辅助函数：打印状态（增强版）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function printState(state: any, round: number) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`第 ${round} 轮对话结果`);
  console.log(`${'='.repeat(60)}`);
  console.log('📍 当前意图:', state.intent);
  console.log('📋 需求状态:', JSON.stringify(state.requirements, null, 2));
  console.log('✅ 需求完整:', state.isRequirementsComplete);
  console.log('🔍 已问过柔性字段:', state.hasAskedSoftFields || false);

  const lastMsg = state.messages[state.messages.length - 1];
  console.log('💬 AI 回复:', lastMsg.content);
  console.log('-'.repeat(60));
}

// 测试场景 1: 标准流程 - 硬性齐全后问一次柔性字段
async function testStandardFlow() {
  console.log('\n\n🎯 测试场景 1: 标准流程 - 3硬性 + 1次柔性追问');
  console.log('='.repeat(60));
  console.log(
    '期望：硬性三项齐全后，AI会追问一次柔性字段，然后无论用户是否回答都进入规划',
  );

  const conversations = [
    '我想去成都玩5天，预算3000元', // 硬性三项齐全，应该问柔性
    '没有特别要求', // 用户没给柔性信息，应该直接进入规划
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let state: any = { messages: [] };

  for (let i = 0; i < conversations.length; i++) {
    const userMsg = conversations[i];
    console.log(`\n👤 用户 (第${i + 1}轮):`, userMsg);

    state = await agent.invoke({
      messages: [...state.messages, new HumanMessage(userMsg)],
    });

    printState(state, i + 1);
  }

  return state;
}

// 测试场景 2: 用户直接提供完整信息（包括柔性字段）
async function testCompleteInfoAtOnce() {
  console.log('\n\n🚀 测试场景 2: 用户一次性提供所有信息');
  console.log('='.repeat(60));
  console.log('期望：由于用户已提供柔性字段，AI 不应再追问，直接进入规划');

  const conversations = [
    '我想去三亚玩7天，预算8000元，我们两个人，喜欢海滩和美食',
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let state: any = { messages: [] };

  for (let i = 0; i < conversations.length; i++) {
    const userMsg = conversations[i];
    console.log(`\n👤 用户 (第${i + 1}轮):`, userMsg);

    state = await agent.invoke({
      messages: [...state.messages, new HumanMessage(userMsg)],
    });

    printState(state, i + 1);
  }

  return state;
}

// 测试场景 3: 渐进式收集 - 用户主动补充柔性字段
async function testGradualWithSoftFields() {
  console.log('\n\n📝 测试场景 3: 渐进式收集 + 用户主动补充柔性字段');
  console.log('='.repeat(60));
  console.log('期望：AI 问柔性字段后，用户主动提供，直接进入规划');

  const conversations = [
    '我想去杭州',
    '4天吧',
    '预算3500', // 硬性三项齐全，AI应该问柔性
    '我们两个人，喜欢美食和摄影', // 用户提供了柔性字段，应该进入规划
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let state: any = { messages: [] };

  for (let i = 0; i < conversations.length; i++) {
    const userMsg = conversations[i];
    console.log(`\n👤 用户 (第${i + 1}轮):`, userMsg);

    state = await agent.invoke({
      messages: [...state.messages, new HumanMessage(userMsg)],
    });

    printState(state, i + 1);
  }

  return state;
}

// 测试场景 4: 渐进式收集 - 用户不提供柔性字段
async function testGradualWithoutSoftFields() {
  console.log('\n\n⏭️ 测试场景 4: 渐进式收集 + 用户忽略柔性字段');
  console.log('='.repeat(60));
  console.log('期望：AI 问柔性字段后，用户没给，AI 应该默认处理并进入规划');

  const conversations = [
    '我想去北京',
    '3天',
    '预算2000', // 硬性三项齐全，AI应该问柔性
    '就这样吧，赶紧规划', // 用户不想提供柔性字段，应该进入规划
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let state: any = { messages: [] };

  for (let i = 0; i < conversations.length; i++) {
    const userMsg = conversations[i];
    console.log(`\n👤 用户 (第${i + 1}轮):`, userMsg);

    state = await agent.invoke({
      messages: [...state.messages, new HumanMessage(userMsg)],
    });

    printState(state, i + 1);
  }

  return state;
}

// 测试场景 5: 用户修改硬性字段
async function testModifyHardFields() {
  console.log('\n\n✏️ 测试场景 5: 用户修改硬性字段');
  console.log('='.repeat(60));
  console.log('期望：用户修改信息后，更新需求，然后询问柔性字段');

  const conversations = [
    '我想去上海玩3天，预算2000', // 硬性齐全，应该问柔性
    '不对，改成5天，预算4000', // 修改了硬性字段，重新问柔性
    '好的', // 不提供柔性字段，进入规划
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let state: any = { messages: [] };

  for (let i = 0; i < conversations.length; i++) {
    const userMsg = conversations[i];
    console.log(`\n👤 用户 (第${i + 1}轮):`, userMsg);

    state = await agent.invoke({
      messages: [...state.messages, new HumanMessage(userMsg)],
    });

    printState(state, i + 1);
  }

  return state;
}

// 测试场景 6: 从闲聊到任务
async function testChatToTask() {
  console.log('\n\n🔄 测试场景 6: 从闲聊切换到任务');
  console.log('='.repeat(60));
  console.log('期望：闲聊后切换到任务，正常收集需求');

  const conversations = [
    '你好',
    '你能帮我做什么？',
    '那我想去云南玩6天，预算5000', // 硬性齐全，应该问柔性
    '就一个人', // 只提供了人数，应该进入规划（已问过柔性）
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let state: any = { messages: [] };

  for (let i = 0; i < conversations.length; i++) {
    const userMsg = conversations[i];
    console.log(`\n👤 用户 (第${i + 1}轮):`, userMsg);

    state = await agent.invoke({
      messages: [...state.messages, new HumanMessage(userMsg)],
    });

    printState(state, i + 1);
  }

  return state;
}

// 测试场景 7: 硬性字段不全时不应问柔性
async function testIncompleteHardFields() {
  console.log('\n\n⚠️ 测试场景 7: 硬性字段不全 - 不应问柔性');
  console.log('='.repeat(60));
  console.log('期望：只有目的地和天数时，应该追问预算，而不是柔性字段');

  const conversations = [
    '我想去成都玩5天', // 缺少预算，应该追问预算
    '3000元', // 补充预算，硬性齐全，应该问柔性
    '好的', // 已问过柔性，进入规划
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let state: any = { messages: [] };

  for (let i = 0; i < conversations.length; i++) {
    const userMsg = conversations[i];
    console.log(`\n👤 用户 (第${i + 1}轮):`, userMsg);

    state = await agent.invoke({
      messages: [...state.messages, new HumanMessage(userMsg)],
    });

    printState(state, i + 1);
  }

  return state;
}

// 运行所有测试
async function runAllTests() {
  console.log('\n🚀 开始运行 Workflow 集成测试 - 3（硬性）+ 2（柔性）模式\n');
  console.log('📌 测试说明：');
  console.log('  - 硬性三项：目的地、天数、预算（必须全部收齐）');
  console.log('  - 柔性字段：人数、偏好（追问一次，没给就默认）');
  console.log('  - hasAskedSoftFields: 追踪是否已询问过柔性字段');
  console.log('');

  try {
    await testStandardFlow();
    await testCompleteInfoAtOnce();
    await testGradualWithSoftFields();
    await testGradualWithoutSoftFields();
    await testModifyHardFields();
    await testChatToTask();
    await testIncompleteHardFields();

    console.log('\n\n✅ 所有测试场景执行完毕！');
    console.log('\n📊 验证要点：');
    console.log('  ✓ 硬性三项齐全后应该触发柔性追问');
    console.log('  ✓ 柔性追问后无论用户是否回答都应进入规划');
    console.log('  ✓ hasAskedSoftFields 标志位正确切换');
    console.log('  ✓ 人数默认为 1');
  } catch (error) {
    console.error('\n\n❌ 测试过程中出现错误:', error);
  }
}

// 执行测试
runAllTests();
