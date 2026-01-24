import { Command, END } from '@langchain/langgraph';
import { AgentState } from '../state';
import { AIMessage, SystemMessage } from 'langchain';
import { qwenMax } from '..';
import { PRESENTER_PROMPT } from '../prompts';

export async function presenter(state: AgentState) {
  console.log('[presenter] 开始展示行程');

  const prompt = PRESENTER_PROMPT.replace(
    '{itinerary}',
    JSON.stringify(state.itinerary, null, 2),
  ).replace(
    '{preferences}',
    state.requirements.preferences?.join('、') || '无特殊偏好',
  );

  const stream = await qwenMax.stream([new SystemMessage(prompt)]);

  // 收集完整内容（用于存储到 state）
  let fullContent = '';
  for await (const chunk of stream) {
    if (chunk.content) {
      fullContent += chunk.content;
    }
  }

  console.log('[presenter] 文案生成完成');

  return new Command({
    update: {
      messages: [new AIMessage(fullContent)],
      finalPresentation: fullContent,
    },
    goto: END,
  });
}
