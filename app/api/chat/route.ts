import { chatWithAgentStream } from '@/agent';
import { NextRequest } from 'next/server';

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
          const streamResponse = await chatWithAgentStream(
            userMessage,
            conversationId || '1',
          );

          let accumulatedContent = '';

          for await (const event of streamResponse) {
            // 只处理 on_chat_model_stream 事件（LLM 的 token 流）
            if (event.event === 'on_chat_model_stream') {
              const chunk = event.data?.chunk;
              if (chunk?.content) {
                accumulatedContent += chunk.content;

                // 发送 SSE 格式数据
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
                  model: 'qwen-turbo',
                  object: 'chat.completion.chunk',
                };

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
                );
              }
            }
          }

          console.log('Stream completed. Total content:', accumulatedContent);

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
            model: 'qwen-turbo',
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
