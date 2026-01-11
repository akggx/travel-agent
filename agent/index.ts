import { ChatOpenAI } from '@langchain/openai';
import { QWEN_API_KEY } from '../config/index';
import { StateGraph } from '@langchain/langgraph';
import { StateAnnotation } from './state';
import { intentClassifier } from './nodes/intent-classifier';

export const model = new ChatOpenAI({
  model: 'qwen-turbo',
  apiKey: QWEN_API_KEY,
  configuration: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  },
});

const workflow = new StateGraph(StateAnnotation).addNode(
  'intentClassifier',
  intentClassifier,
);

workflow
  .addEdge('__start__', 'intentClassifier')
  .addEdge('intentClassifier', '__end__');

export const agent = workflow.compile();
