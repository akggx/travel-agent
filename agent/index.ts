import { ChatOpenAI } from '@langchain/openai';
import { QWEN_API_KEY, QWEN_API_URL } from '../config/index';
import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph';
import { StateAnnotation } from './state';
import { intentClassifier } from './nodes/intent-classifier';
import { requirementCollector } from './nodes/requirement-collector';
import { chatNode } from './nodes/chat';
import { planner } from './nodes/planner';

export const qwenTurbo = new ChatOpenAI({
  model: 'qwen-turbo',
  apiKey: QWEN_API_KEY,
  configuration: {
    baseURL: QWEN_API_URL,
  },
  temperature: 0.1,
  maxTokens: 500,
});

export const qwenMax = new ChatOpenAI({
  model: 'qwen-max',
  apiKey: QWEN_API_KEY,
  configuration: {
    baseURL: QWEN_API_URL,
  },
  temperature: 0.1,
  maxTokens: 4096,
});

const workflow = new StateGraph(StateAnnotation)
  .addNode('classifier_node', intentClassifier, {
    ends: ['chat_node', 'requirement_node'],
  })
  .addNode('chat_node', chatNode, {
    ends: [END],
  })
  .addNode('requirement_node', requirementCollector, {
    ends: ['planner_node', END],
  })
  // 规划节点占位
  .addNode('planner_node', planner, { ends: [END] });

// 入口点
workflow.addEdge(START, 'classifier_node');

export const agent = workflow.compile({
  checkpointer: new MemorySaver(),
});
