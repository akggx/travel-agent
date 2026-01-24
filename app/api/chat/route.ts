import { NextRequest } from 'next/server';
import { agent } from '@/agent';
import { HumanMessage } from '@langchain/core/messages';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, messages, conversationId } = body;

    let userMessage: string;
    if (messages && Array.isArray(messages) && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      userMessage = lastMessage.content;
    } else if (message) {
      userMessage = message;
    } else {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 创建 SSE 流
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 使用流式方法
          const streamResponse = agent.streamEvents(
            {
              messages: [new HumanMessage(userMessage)],
            },
            {
              version: 'v2',
              configurable: {
                thread_id: conversationId || 'default',
              },
            },
          );

          let accumulatedContent = '';
          const seenContents = new Set<string>(); // 去重用

          for await (const event of streamResponse) {
            // 1️⃣ 监听所有 LLM 的 token 流（真正的流式输出）
            if (event.event === 'on_chat_model_stream') {
              const chunk = event.data?.chunk;

              // 从 metadata 中获取节点名称
              const nodeName = event.metadata?.langgraph_node;

              // 只处理需要展示给用户的节点输出
              // 过滤掉 classifier_node、requirement_node、planner_node 等中间节点
              const shouldStream =
                nodeName === 'chat_node' ||
                nodeName === 'presenter_node' ||
                // 如果没有节点信息，为了安全起见不输出
                false;

              if (chunk?.content && shouldStream) {
                accumulatedContent += chunk.content;

                // 实时发送 token
                const data = {
                  id: conversationId || 'default',
                  choices: [
                    {
                      index: 0,
                      delta: {
                        role: 'assistant',
                        content: chunk.content,
                      },
                      finish_reason: null,
                    },
                  ],
                  created: Date.now(),
                  model: 'qwen-max',
                  object: 'chat.completion.chunk',
                };

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
                );
              }
            }

            // 2️⃣ 监听节点结束，获取非流式的 AIMessage
            if (event.event === 'on_chain_end') {
              const nodeName = event.metadata?.langgraph_node;

              // 只处理 requirement_node 的输出
              if (nodeName === 'requirement_node') {
                const output = event.data?.output;

                // 获取 Command.update.messages 中的最后一条消息
                const lastMessage =
                  output?.update?.messages?.[output.update.messages.length - 1];
                const content = lastMessage?.content;

                if (
                  content &&
                  typeof content === 'string' &&
                  !seenContents.has(content)
                ) {
                  seenContents.add(content);
                  accumulatedContent += content;

                  // 一次性发送整个内容
                  const data = {
                    id: conversationId || 'default',
                    choices: [
                      {
                        index: 0,
                        delta: {
                          role: 'assistant',
                          content: content,
                        },
                        finish_reason: null,
                      },
                    ],
                    created: Date.now(),
                    model: 'qwen-max',
                    object: 'chat.completion.chunk',
                  };

                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
                  );
                }
              }
            }
          }

          console.log('✅ 流式输出完成. Total content:', accumulatedContent);

          // 发送结束标记
          const endData = {
            id: conversationId || 'default',
            choices: [
              {
                index: 0,
                delta: {},
                finish_reason: 'stop',
              },
            ],
            created: Date.now(),
            model: 'qwen-max',
            object: 'chat.completion.chunk',
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(endData)}\n\n`),
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
