import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { QWEN_API_KEY } from '../config/index';
import { SYSTEM_PROMPT } from './constants';

const agent = new ChatOpenAI({
  model: 'qwen-turbo',
  apiKey: QWEN_API_KEY,
  configuration: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  },
});

const messages = [
  new SystemMessage(SYSTEM_PROMPT),
  new HumanMessage('你是干什么的'),
];

async function run() {
  try {
    const resTurbo = await agent.invoke(messages);
    console.log('qwen-turbo response:', resTurbo);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
