import { HumanMessage } from '@langchain/core/messages';
import { agent } from '@/agent/index';
import { intentClassifier } from '@/agent/nodes/intent-classifier';

export async function testClassifier(userText: string) {
  // 方式1：直接测试节点（可以看到完整输出，包括 reasoning 和 confidence）
  console.log('\n========== 节点直接测试 ==========');
  const nodeInput = {
    messages: [new HumanMessage(userText)],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeResult = await intentClassifier(nodeInput as any);

  console.log('用户输入:', userText);
  console.log('节点完整输出:', nodeResult);
  console.log('识别到的意图:', nodeResult.intent);
  console.log('分类理由:', nodeResult.reasoning);
  console.log('置信度:', nodeResult.confidence);
  console.log('提取的信息:', nodeResult.requirements);

  // 方式2：通过完整 workflow 测试（只能看到写入 state 的字段）
  console.log('\n========== Workflow 集成测试 ==========');
  const workflowResult = await agent.invoke(nodeInput);
  console.log('Workflow 最终状态:', workflowResult);

  return { nodeResult, workflowResult };
}

async function runTests() {
  // 尝试调用
  await testClassifier('我想去成都玩5天'); // 预期结果：task
  await testClassifier('你好呀'); // 预期结果：chat
  await testClassifier('把去成都的预算改成5000'); // 预期结果：modify
}

runTests();
