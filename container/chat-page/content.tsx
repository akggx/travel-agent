'use client';

import { storageStore } from '@/store/storage';
import { SyncOutlined } from '@ant-design/icons';
import { Actions, Bubble, Sender } from '@ant-design/x';
import { useXChat } from '@ant-design/x-sdk';
import { BubbleListRef } from '@ant-design/x/es/bubble';
import { SenderRef } from '@ant-design/x/es/sender';
import { Flex } from 'antd';
import { useEffect, useRef } from 'react';
import { CONTENT_WIDTH, SAFE_BOTTOM_SPACE } from './constants';
import { providerFactory } from './provider';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatContentProps {
  conversationId?: string;
}

export const ChatContent = ({ conversationId }: ChatContentProps) => {
  const listRef = useRef<BubbleListRef>(null);
  const senderRef = useRef<SenderRef>(null);

  // 加载历史消息
  const loadHistoryMessages = (convId: string) => {
    const savedMessages = storageStore.loadMessages(convId);
    return savedMessages.map((msg) => ({
      id: msg.id,
      status: 'success' as const,
      message: {
        role: msg.role,
        content: msg.content,
      },
    }));
  };

  /** =====================
   * useXChat
   ====================== */
  const { messages, onRequest, isRequesting, abort, onReload } = useXChat({
    provider: providerFactory(conversationId || 'default'),
    conversationKey: conversationId || 'default',
    defaultMessages: conversationId ? loadHistoryMessages(conversationId) : [],
    requestPlaceholder: () => ({
      role: 'assistant',
      content: '思考中...',
    }),
    requestFallback: (_, { error, errorInfo, messageInfo }) => {
      if (error.name === 'AbortError') {
        return {
          role: 'assistant',
          content: messageInfo?.message?.content || '请求已取消',
        };
      }
      return {
        role: 'assistant',
        content: errorInfo?.error?.message || '请求失败，请稍后重试',
      };
    },
  });

  // 自动保存消息
  useEffect(() => {
    if (!conversationId) return;

    storageStore.saveMessages(
      conversationId,
      messages
        .filter((m) => m.status === 'success')
        .map((m) => ({
          id: m.id as string,
          role: m.message.role,
          content: m.message.content,
        })) as Message[],
    );
  }, [messages, conversationId]);

  // 发送消息
  const handleSend = (text: string) => {
    if (!text.trim() || !conversationId) return;
    onRequest({ messages: [{ role: 'user', content: text }] });
    senderRef.current?.clear();
  };

  // Bubble Footer
  const Footer = ({
    id,
    content,
    status,
  }: {
    id: string;
    content: string;
    status: string;
  }) => {
    if (status === 'loading' || status === 'updating') return null;

    return (
      <Actions
        items={[
          {
            key: 'retry',
            label: 'ask again',
            icon: <SyncOutlined />,
            onItemClick: () => onReload?.(id, { userAction: 'retry' }),
          },
          {
            key: 'copy',
            actionRender: <Actions.Copy text={content} />,
          },
        ]}
      />
    );
  };

  // Role 配置
  const role = {
    assistant: {
      placement: 'start' as const,
      footer: (
        content: string,
        { status, key }: { status?: string; key?: string | number },
      ) => <Footer id={String(key)} content={content} status={status || ''} />,
    },
    user: {
      placement: 'end' as const,
    },
  };

  // 空态
  if (!conversationId) {
    return (
      <Flex
        vertical
        className="h-full flex-1 items-center justify-center gap-4 p-8"
      >
        <div className="text-center text-gray-400">
          <h2 className="mb-4 text-2xl font-bold">Travel Agent</h2>
          <p>请创建或选择一个对话开始聊天</p>
        </div>
      </Flex>
    );
  }

  // 正式 UI：聊天内容
  return (
    <Flex vertical className="h-full flex-1 overflow-hidden">
      <h1 className="mb-4 text-2xl font-bold">Travel Agent</h1>

      {/* 消息区 */}
      <div className="flex flex-1 justify-center overflow-auto">
        <div
          style={{
            width: CONTENT_WIDTH,
            paddingBottom: SAFE_BOTTOM_SPACE,
          }}
        >
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              开始和你的 AI 旅行规划专家聊天吧！
            </div>
          ) : (
            <Bubble.List
              ref={listRef}
              items={messages.map((m, index) => ({
                key: `${m.id}-${index}`,
                role: m.message.role,
                content: m.message.content,
                status: m.status,
                loading: m.status === 'loading',
              }))}
              role={role}
              styles={{
                bubble: { maxWidth: CONTENT_WIDTH },
              }}
            />
          )}
        </div>
      </div>

      {/* 输入区 */}
      <div className="mb-4 flex justify-center">
        <div style={{ width: CONTENT_WIDTH }}>
          <Sender
            ref={senderRef}
            autoSize={{ minRows: 2, maxRows: 3 }}
            onSubmit={handleSend}
            onCancel={abort}
            loading={isRequesting}
            placeholder="请输入你的旅行计划需求..."
          />
        </div>
      </div>
    </Flex>
  );
};
