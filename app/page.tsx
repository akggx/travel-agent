'use client';
import {
  Bubble,
  Conversations,
  ConversationsProps,
  Sender,
  XProvider,
} from '@ant-design/x';
import { Divider, Flex, GetProp } from 'antd';
import { useState } from 'react';

const agentItems: GetProp<ConversationsProps, 'items'> = [
  {
    key: 'write',
    label: 'Help Me Write',
  },
  {
    key: 'coding',
    label: 'AI Coding',
  },
  {
    type: 'divider',
  },
];

export default function Home() {
  // 模拟消息数据
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);

  const handleSend = (msg: string) => {
    // 先把用户消息加进去
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);

    // 模拟 AI 回复
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `你刚刚说: "${msg}"` },
      ]);
    }, 500);
  };

  const [historicalItems, setHistoricalItems] = useState<
    GetProp<ConversationsProps, 'items'>
  >([
    {
      key: `item1`,
      label: 'Conversation Item 1',
    },
  ]);

  const newChatClick = () => {
    setHistoricalItems((ori) => {
      return [
        ...ori,
        {
          key: `item${ori.length + 1}`,
          label: `Conversation Item ${ori.length + 1}`,
        },
      ];
    });
  };

  return (
    <XProvider>
      <Flex className="h-screen w-screen flex-row">
        <Conversations
          style={{
            width: 280,
            height: '100%',
          }}
          creation={{
            onClick: newChatClick,
          }}
          items={[...agentItems, ...historicalItems]}
        />

        <Divider orientation="vertical" className="h-full" />

        <Flex vertical className="h-full flex-1 gap-4">
          <h1 className="text-2xl font-bold">Travel Agent</h1>

          <Flex justify="space-between" vertical className="flex-1">
            chat content
          </Flex>

          <div className="mb-4 flex w-full justify-center">
            <Sender
              style={{
                width: 600,
              }}
              autoSize={{
                maxRows: 3,
                minRows: 2,
              }}
              onSubmit={handleSend}
              placeholder="请输入你的旅行计划需求..."
            />
          </div>
        </Flex>
      </Flex>
    </XProvider>
  );
}
