import { ChatOpenAI } from '@langchain/openai';
import { QWEN_API_KEY } from '../config/index';

export const model = new ChatOpenAI({
  model: 'qwen-turbo',
  apiKey: QWEN_API_KEY,
  configuration: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  },
});
