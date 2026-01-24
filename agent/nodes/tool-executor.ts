import { ToolNode } from '@langchain/langgraph/prebuilt';
import { tools } from '../tools';
import { AgentState } from '../state';
import { Command, END } from '@langchain/langgraph';
import { AIMessage, ToolMessage } from 'langchain';

const toolNodeBase = new ToolNode(tools);

export async function toolExecutor(state: AgentState) {
  console.log('[toolExecutor] 开始执行工具');
  const lastMessage = state.messages[state.messages.length - 1];

  if (!(lastMessage instanceof AIMessage) || !lastMessage.tool_calls?.length) {
    return new Command({
      goto: END,
    });
  }

  try {
    console.log('[toolExecutor] 调用工具');
    const result = await toolNodeBase.invoke(state);
    console.log('[toolExecutor] 工具执行完成，跳转到 planner_node');

    return new Command({
      update: { messages: result.messages },
      goto: 'planner_node',
    });
  } catch (error) {
    console.log('[toolExecutor] 工具执行失败，跳转到 planner_node');
    const toolCall = lastMessage.tool_calls![0];
    const errMsg = error instanceof Error ? error.message : String(error);

    return new Command({
      update: {
        messages: [
          new ToolMessage({
            tool_call_id: toolCall.id!,
            content: `工具执行失败: ${errMsg}`,
            name: toolCall.name,
          }),
        ],
      },
      goto: 'planner_node',
    });
  }
}
