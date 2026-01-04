'use client';
import { XProvider } from '@ant-design/x';
import { Divider, Flex } from 'antd';
import Conversation from '../conversation';
import ChatContent from './content';

const ChatPage = () => {
  return (
    <XProvider>
      <Flex className="h-screen w-screen flex-row">
        <Conversation />

        <Divider orientation="vertical" className="h-full" />
        <ChatContent />
      </Flex>
    </XProvider>
  );
};

export default ChatPage;
