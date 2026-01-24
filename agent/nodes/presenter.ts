import { Command, END } from '@langchain/langgraph';
import { AgentState } from '../state';
import { AIMessage, SystemMessage } from 'langchain';
import { qwenMax } from '..';
import { PRESENTER_PROMPT } from '../prompts';

export async function presenter(state: AgentState) {
  console.log('[presenter] 开始展示行程');

  const { itinerary, requirements } = state;

  const response = await qwenMax.invoke([
    new SystemMessage(
      PRESENTER_PROMPT.replace(
        '{itinerary}',
        JSON.stringify(itinerary),
      ).replace(
        '{preferences}',
        requirements.preferences?.join('、') || '无特殊偏好',
      ),
    ),
  ]);

  const markdownContent =
    typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

  return new Command({
    update: {
      messages: [new AIMessage(markdownContent)],
      finalPresentation: markdownContent,
    },
    goto: END,
  });
}
