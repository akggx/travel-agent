import { SystemMessage } from '@langchain/core/messages';
import { qwenTurbo } from '..';
import { AgentState } from '../state';
import { CHAT_PROMPT } from '../prompts';

export async function chatNode(state: AgentState) {
  const response = await qwenTurbo.invoke([
    new SystemMessage(CHAT_PROMPT),
    ...state.messages,
  ]);

  return { messages: [response] };
}
