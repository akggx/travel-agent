// agent/test/planner-with-tools.test.ts

import 'dotenv/config';
import { agent } from '../index';
import { HumanMessage } from '@langchain/core/messages';

async function testPlannerWithTools() {
  console.log('🧪 测试 Planner + Tools (ReAct 模式)\n');
  console.log('='.repeat(60));

  // 测试场景：用户提出旅行需求，Planner 应该自动调用工具
  const config = {
    configurable: { thread_id: 'test-planner-tools-' + Date.now() },
  };

  try {
    // 🎯 测试 1：提出旅行需求
    console.log('\n【测试 1】用户提出旅行需求');
    console.log('用户: "我想去成都玩3天，预算3000元"');

    let result = await agent.invoke(
      { messages: [new HumanMessage('我想去成都玩3天，预算3000元')] },
      config,
    );

    console.log('\n💬 Agent 回复:');
    const lastMsg = result.messages[result.messages.length - 1];
    console.log(lastMsg.content);

    // 检查 requirements
    console.log('\n📋 收集到的需求:');
    console.log(JSON.stringify(result.requirements, null, 2));

    // 🎯 测试 2：补充信息
    console.log('\n\n【测试 2】补充偏好信息');
    console.log('用户: "我喜欢美食和历史文化，2个人一起去"');

    result = await agent.invoke(
      { messages: [new HumanMessage('我喜欢美食和历史文化，2个人一起去')] },
      config,
    );

    console.log('\n💬 Agent 回复:');
    const msg2 = result.messages[result.messages.length - 1];
    console.log(msg2.content);

    // 检查是否有工具调用
    console.log('\n🔍 检查工具调用:');
    const toolMessages = result.messages.filter((m) => m._getType() === 'tool');
    console.log(`工具调用次数: ${toolMessages.length}`);

    if (toolMessages.length > 0) {
      console.log('\n🔧 工具执行记录:');
      toolMessages.forEach((tm, idx) => {
        console.log(`  ${idx + 1}. ${tm.name}`);
        // 只显示前 200 字符
        const content = String(tm.content);
        console.log(`     结果: ${content.substring(0, 200)}...`);
      });
    }

    // 检查最终行程
    console.log('\n📝 最终行程:');
    if (result.itinerary) {
      console.log('✅ 行程已生成');
      console.log('目的地:', result.itinerary.overview?.destination);
      console.log('天数:', result.itinerary.overview?.days);
      console.log('每日行程数:', result.itinerary.dailyItinerary?.length);
      console.log('\n行程摘要:', result.itinerary.summary);
    } else {
      console.log('⚠️ 行程未生成（可能还在收集信息）');
    }

    // 🎯 测试 3：查看完整对话历史
    console.log('\n\n【测试 3】完整对话历史');
    console.log(`总消息数: ${result.messages.length}`);
    console.log('\n消息类型分布:');
    const typeCounts = result.messages.reduce(
      (acc, msg) => {
        const type = msg._getType();
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    console.log(JSON.stringify(typeCounts, null, 2));
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      console.error('堆栈:', error.stack);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 测试完成!\n');
}

// 运行测试
testPlannerWithTools();
