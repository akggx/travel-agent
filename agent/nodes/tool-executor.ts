import { ToolNode } from '@langchain/langgraph/prebuilt';
import { tools } from '../tools';
import { AgentState } from '../state';
import { Command, END } from '@langchain/langgraph';
import {
  AIMessage,
  AIMessageChunk,
  ToolMessage,
} from '@langchain/core/messages';

const toolNodeBase = new ToolNode(tools);

export async function toolExecutor(state: AgentState) {
  console.log('[toolExecutor] 开始执行工具');
  console.log('[toolExecutor] state.messages 数量:', state.messages.length);
  const lastMessage = state.messages[state.messages.length - 1];
  console.log('[toolExecutor] 最后一条消息类型:', lastMessage.constructor.name);

  // 支持 AIMessage 和 AIMessageChunk（流式场景）
  const isAIMessage =
    lastMessage instanceof AIMessage || lastMessage instanceof AIMessageChunk;
  const toolCalls = (lastMessage as any).tool_calls;

  if (!isAIMessage || !toolCalls?.length) {
    console.log('[toolExecutor] 没有工具调用，直接结束');
    return new Command({
      goto: END,
    });
  }

  console.log('[toolExecutor] 工具调用信息:', {
    toolCount: toolCalls.length,
    tools: toolCalls.map((t: any) => t.name),
  });

  try {
    console.log('[toolExecutor] 调用工具...');
    const result = await toolNodeBase.invoke(state);
    console.log(
      '[toolExecutor] 工具执行完成，返回消息数:',
      result.messages?.length,
    );
    console.log('[toolExecutor] 跳转到 planner_node');

    return new Command({
      update: { messages: result.messages },
      goto: 'planner_node',
    });
  } catch (error) {
    console.log('[toolExecutor] 工具执行失败:', error);
    const toolCall = toolCalls[0];
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
