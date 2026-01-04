import { chatWithAgent } from '@/agent';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 },
      );
    }

    // 调用 agent
    const response = await chatWithAgent(message);

    const aiMessage = response.messages[response.messages.length - 1];
    const content = aiMessage.content;

    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
