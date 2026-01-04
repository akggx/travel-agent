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

const response = await agent.invoke(
  {
    messages: [
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage('我想去西安'),
    ],
  },
  { configurable: { thread_id: '1' } },
);
console.log('response:', response);

const response1 = await agent.invoke(
  {
    messages: [
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage('我之前计划去哪里来着？'),
    ],
  },
  { configurable: { thread_id: '1' } },
);
console.log('response:', response1);
