import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { requirementCollector } from '@/agent/nodes/requirement-collector';

async function testRequirementCollector(
  userText: string,
  existingRequirements = {},
) {
  console.log('\n========== 需求收集节点测试 ==========');

  const nodeInput = {
    messages: [new HumanMessage(userText)],
    requirements: existingRequirements,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await requirementCollector(nodeInput as any);

  console.log('用户输入:', userText);
  console.log('当前需求:', existingRequirements);
  console.log('\n--- 节点输出 ---');
  console.log('提取的需求:', result.requirements);
  console.log('需求完整:', result.isRequirementsComplete);
  console.log('缺失信息描述:', result.reasoning);
  console.log('AI 回复:', result.messages[0].content);

  return result;
}

// 测试场景 1: 用户一次性提供所有信息
await testRequirementCollector('我想去成都玩5天,预算3000元');

// 测试场景 2: 用户只提供目的地
await testRequirementCollector('我想去北京玩');

// 测试场景 3: 多轮对话 - 先提供目的地
const round1 = await testRequirementCollector('我想去杭州');

// 测试场景 4: 多轮对话 - 补充天数和预算
await testRequirementCollector(
  '大概5天吧,预算每人4000左右',
  round1.requirements,
);

// 测试场景 5: 用户修改之前的信息
const round2 = await testRequirementCollector('我想去上海玩3天');
await testRequirementCollector('不对,改成5天吧,预算5000', round2.requirements);

// 测试场景 6: 包含偏好信息
await testRequirementCollector('我想去云南7天,预算6000,喜欢摄影和徒步');
