import { Sender } from '@ant-design/x';
import { Flex } from 'antd';
import { useState } from 'react';

const ChatContent = () => {
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

  return (
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
  );
};

export default ChatContent;
