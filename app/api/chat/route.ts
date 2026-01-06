import { chatWithAgent } from '@/agent';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, messages, conversationId } = body;

    // 兼容两种格式：单个 message 或 messages 数组
    let userMessage: string;

    if (messages && Array.isArray(messages) && messages.length > 0) {
      // XRequest 发送的格式：messages 数组
      const lastMessage = messages[messages.length - 1];
      userMessage = lastMessage.content;
    } else if (message) {
      // 直接的 message 字段
      userMessage = message;
    } else {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 },
      );
    }

    // 调用 agent，使用 conversationId 作为 threadId
    const response = await chatWithAgent(userMessage, conversationId || '1');

    const aiMessage = response.messages[response.messages.length - 1];
    const content = aiMessage.content;

    // 返回 OpenAI 兼容的格式，供 OpenAIChatProvider 解析
    return NextResponse.json({
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: content,
          },
          finish_reason: 'stop',
        },
      ],
      created: Date.now(),
      id: conversationId || 'default',
      model: 'qwen-turbo',
      object: 'chat.completion',
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
