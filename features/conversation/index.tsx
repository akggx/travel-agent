import { Conversations, ConversationsProps } from '@ant-design/x';
import { GetProp } from 'antd';
import { useState } from 'react';

const Conversation = () => {
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
  );
};

export default Conversation;
