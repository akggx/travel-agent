/* eslint-disable @typescript-eslint/no-explicit-any */
import { agent } from '@/agent';
import { HumanMessage } from '@langchain/core/messages';

async function testFullWorkflow() {
  console.log('🧪 完整工作流测试（需求收集 → 规划 → 工具 → 展示）\n');
  console.log('============================================================\n');

  const conversationId = 'test-full-workflow-' + Date.now();

  try {
    // 第一轮：提出旅行需求
    console.log('【第1轮】用户提出旅行需求');
    console.log('用户: "我想3月份去成都玩3天，预算3000元"\n');

    let result = await agent.invoke(
      {
        messages: [new HumanMessage('我想3月份去成都玩3天，预算3000元')],
      },
      {
        configurable: { thread_id: conversationId },
      },
    );

    const lastMessage1 = result.messages[result.messages.length - 1];
    console.log('💬 Agent 回复:', lastMessage1.content);
    console.log('\n📋 当前需求:', JSON.stringify(result.requirements, null, 2));
    console.log('\n---\n');

    // 第二轮：补充人数信息
    console.log('【第2轮】补充人数');
    console.log('用户: "2个人一起去"\n');

    result = await agent.invoke(
      {
        messages: [new HumanMessage('2个人一起去')],
      },
      {
        configurable: { thread_id: conversationId },
      },
    );

    const lastMessage2 = result.messages[result.messages.length - 1];
    console.log('💬 Agent 回复:', lastMessage2.content);
    console.log('\n📋 当前需求:', JSON.stringify(result.requirements, null, 2));
    console.log('\n---\n');

    // 第三轮：补充偏好信息（触发 planner）
    console.log('【第3轮】补充偏好信息');
    console.log('用户: "我们喜欢美食和历史文化"\n');

    result = await agent.invoke(
      {
        messages: [new HumanMessage('我们喜欢美食和历史文化')],
      },
      {
        configurable: { thread_id: conversationId },
      },
    );

    console.log('⏳ Agent 处理中（调用工具 + 生成行程 + 格式化）...\n');

    // 检查最终结果
    const lastMessage3 = result.messages[result.messages.length - 1];

    console.log(
      '============================================================\n',
    );
    console.log('✅ 测试完成！\n');

    // 分析结果
    console.log('📊 结果分析:\n');
    console.log('总消息数:', result.messages.length);
    console.log('需求收集:', result.requirements ? '✅' : '❌');
    console.log('行程生成:', result.itinerary ? '✅' : '❌');
    console.log('文案展示:', result.finalPresentation ? '✅' : '❌');

    if (result.itinerary) {
      console.log('\n📝 行程概览:');
      console.log('  - 目的地:', result.itinerary.overview.destination);
      console.log('  - 天数:', result.itinerary.overview.days);
      console.log(
        '  - 预算:',
        result.itinerary.overview.budgetPerPerson,
        '元/人',
      );
      console.log('  - 每日行程数:', result.itinerary.dailyItinerary.length);
    }

    if (result.finalPresentation) {
      console.log('\n📄 最终展示文案预览（前300字）:');
      console.log(result.finalPresentation.substring(0, 300) + '...\n');
    } else {
      console.log('\n💬 Agent 最终回复:');
      console.log(lastMessage3.content);
    }

    // 统计工具调用
    const toolMessages = result.messages.filter(
      (m: any) => m._getType() === 'tool',
    );
    console.log('\n🔧 工具调用统计:');
    console.log('  - 调用次数:', toolMessages.length);
    toolMessages.forEach((msg: any, i: number) => {
      console.log(`  ${i + 1}. ${msg.name}`);
    });

    console.log(
      '\n============================================================',
    );
    console.log('🎉 完整工作流测试成功！');
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      console.error('堆栈:', error.stack);
    }
  }
}

testFullWorkflow();
