import { ChatOpenAI } from '@langchain/openai';
import { QWEN_API_KEY, QWEN_API_URL } from '../config/index';
import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph';
import { StateAnnotation } from './state';
import { intentClassifier } from './nodes/intent-classifier';
import { requirementCollector } from './nodes/requirement-collector';
import { chatNode } from './nodes/chat';
import { planner } from './nodes/planner';
import { toolExecutor } from './nodes/tool-executor';

export const qwenTurbo = new ChatOpenAI({
  model: 'qwen-turbo',
  apiKey: QWEN_API_KEY,
  configuration: {
    baseURL: QWEN_API_URL,
  },
  temperature: 0.1,
  maxTokens: 1024,
});

export const qwenMax = new ChatOpenAI({
  model: 'qwen-max',
  apiKey: QWEN_API_KEY,
  configuration: {
    baseURL: QWEN_API_URL,
  },
  temperature: 0.1,
  maxTokens: 8192,
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
  .addNode('planner_node', planner, { ends: ['tool_node', END] })
  .addNode('tool_node', toolExecutor, { ends: ['planner_node'] });

// 入口点
workflow.addEdge(START, 'classifier_node');

export const agent = workflow.compile({
  checkpointer: new MemorySaver(),
});
