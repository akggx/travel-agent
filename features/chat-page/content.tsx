import { Bubble, Sender } from '@ant-design/x';
import { Flex } from 'antd';
import { useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const ChatContent = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (msg: string) => {
    if (!msg.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: msg }),
      });

      const data = await response.json();

      // 添加 ai 回复
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，网络出现问题，请稍后再试。',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex vertical className="h-full flex-1 gap-4">
      <h1 className="text-2xl font-bold">Travel Agent</h1>

      <Flex justify="space-between" vertical className="flex-1">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-gray-400">
            开始和你的 AI 旅行规划专家聊天吧！
          </div>
        )}

        {messages.map((message) => (
          <Bubble
            key={message.id}
            content={message.content}
            placement={message.role === 'user' ? 'end' : 'start'}
          />
        ))}

        {loading && <Bubble placement="start" loading content={'思考中...'} />}
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
          loading={loading}
          placeholder="请输入你的旅行计划需求..."
        />
      </div>
    </Flex>
  );
};

export default ChatContent;
