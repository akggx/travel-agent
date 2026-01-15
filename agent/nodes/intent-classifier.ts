import { z } from 'zod';
import { AgentState } from '../state';
import { model } from '..';
import { AIMessage, SystemMessage } from '@langchain/core/messages';
import { INTENT_CLASSIFIER_PROMPT } from '../prompts';
import { Command } from '@langchain/langgraph';

const intentSchema = z.object({
  intent: z
    .enum(['chat', 'task', 'modify'])
    .default('chat')
    .describe('用户意图: 聊天、任务、修改'),
  reasoning: z.string().describe('分类理由，简述为什么这么分'),
  confidence: z.number().describe('意图置信度: 0-100'),

  // 尝试提取初级需求
  extractedInfo: z
    .object({
      destination: z.string().nullish().describe('提到的目的地'),
      days: z.number().nullish().describe('提到的天数'),
    })
    .nullish(),
});

export async function intentClassifier(state: AgentState) {
  const structureModel = model.withStructuredOutput(intentSchema);

  const response = await structureModel.invoke([
    new SystemMessage(INTENT_CLASSIFIER_PROMPT),
    ...state.messages,
  ]);

  if (response.intent === 'chat') {
    return new Command({
      update: {
        messages: [new AIMessage(response.intent)],
      },
      goto: 'chat_node',
    });
  }
  return new Command({
    update: {
      intent: response.intent,
      requirements: response.extractedInfo
        ? {
            destination: response.extractedInfo.destination,
            days: response.extractedInfo.days,
          }
        : {},
    },
    goto: 'requirement_node',
  });
}
