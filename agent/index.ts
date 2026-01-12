import { ChatOpenAI } from '@langchain/openai';
import { QWEN_API_KEY } from '../config/index';
import { END, START, StateGraph } from '@langchain/langgraph';
import { StateAnnotation } from './state';
import { intentClassifier } from './nodes/intent-classifier';
import { requirementCollector } from './nodes/requirement-collector';
import { chatNode } from './nodes/chat';
import { AIMessage } from '@langchain/core/messages';

export const model = new ChatOpenAI({
  model: 'qwen-turbo',
  apiKey: QWEN_API_KEY,
  configuration: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  },
});

const workflow = new StateGraph(StateAnnotation)
  .addNode('classifier_node', intentClassifier)
  .addNode('chat_node', chatNode)
  .addNode('requirement_node', requirementCollector)
  // 规划节点占位
  .addNode('planner_node', async (state) => {
    console.log('--- 🚀 进入规划节点：准备写行程 ---');
    return { messages: [new AIMessage('我已经准备好为您生成行程了！')] };
  });

// --- 连线逻辑 ---

// 1. 入口点
workflow.addEdge(START, 'classifier_node');

// 2.意图分流
workflow.addConditionalEdges('classifier_node', (state) => state.intent, {
  chat: 'chat_node',
  task: 'requirement_node',
  modify: 'requirement_node', // 修改意图也先去提取新信息
});

// 3.判断需求是否收集完成
workflow.addConditionalEdges(
  'requirement_node',
  (state) => (state.isRequirementsComplete ? 'go_plan' : 'wait_user'),
  {
    go_plan: 'planner_node', // 齐了，去写行程
    wait_user: END, // 不齐，直接结束，等待用户下一句回复
  },
);

// 4. 其他出口
workflow.addEdge('chat_node', END);
workflow.addEdge('planner_node', END);

export const agent = workflow.compile();
