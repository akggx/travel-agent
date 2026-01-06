'use client';
import { XProvider } from '@ant-design/x';
import { Divider, Flex } from 'antd';
import Conversation from '../conversation';
import ChatContent from './content';
import { useState } from 'react';

const ChatPage = () => {
  const [activeConversationKey, setActiveConversationKey] = useState<
    string | undefined
  >(undefined);
  return (
    <XProvider>
      <Flex className="h-screen w-screen flex-row">
        <Conversation onActiveChange={setActiveConversationKey} />
        <Divider orientation="vertical" className="h-full" />
        <ChatContent
          key={activeConversationKey || 'default'}
          conversationId={activeConversationKey}
        />
      </Flex>
    </XProvider>
  );
};

export default ChatPage;
