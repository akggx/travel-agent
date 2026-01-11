import { SystemMessage } from '@langchain/core/messages';
import { model } from '..';
import { AgentState } from '../state';
import { CHAT_PROMPT } from '../prompts';

export async function chatNode(state: AgentState) {
  const response = await model.invoke([
    new SystemMessage(CHAT_PROMPT),
    ...state.messages,
  ]);

  return { messages: [response] };
}
