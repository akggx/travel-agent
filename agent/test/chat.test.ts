// agent/test/chat.test.ts
import { HumanMessage } from '@langchain/core/messages';
import { chatNode } from '@/agent/nodes/chat';

async function testChatNode(userText: string) {
  console.log('\n========== 闲聊节点测试 ==========');

  const nodeInput = {
    messages: [new HumanMessage(userText)],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await chatNode(nodeInput as any);

  console.log('用户输入:', userText);
  console.log('AI 回复:', result.messages[0].content);

  return result;
}

async function runTests() {
  await testChatNode('你好呀');
  await testChatNode('你是谁？');
  await testChatNode('今天天气真好');
  await testChatNode('能帮我写个 Python 代码吗？'); // 测试引导任务
}

runTests();
