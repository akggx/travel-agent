import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { QWEN_API_KEY } from '../config/index';
import { SYSTEM_PROMPT } from './constants';
import { createAgent } from 'langchain';
import { MemorySaver } from '@langchain/langgraph';

const model = new ChatOpenAI({
  model: 'qwen-turbo',
  apiKey: QWEN_API_KEY,
  configuration: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  },
});

const checkpointer = new MemorySaver();
export const agent = createAgent({ model, tools: [], checkpointer });

export async function chatWithAgent(
  userMessage: string,
  threadId: string = '1',
) {
  const response = await agent.invoke(
    {
      messages: [
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(userMessage),
      ],
    },
    { configurable: { thread_id: threadId } },
  );

  return response;
}

export async function chatWithAgentStream(
  userMessage: string,
  threadId: string = '1',
) {
  // 使用 streamEvents 来获取真正的 token 级别流式输出
  const stream = agent.streamEvents(
    {
      messages: [
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(userMessage),
      ],
    },
    {
      configurable: { thread_id: threadId },
      version: 'v2',
    },
  );

  return stream;
}
