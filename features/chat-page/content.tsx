'use client';
import { storageStore } from '@/store/storage';
import { SyncOutlined } from '@ant-design/icons';
import { Actions, Bubble, Sender } from '@ant-design/x';
import {
  XRequest,
  XModelParams,
  SSEFields,
  XModelResponse,
  OpenAIChatProvider,
} from '@ant-design/x-sdk';
import { useXChat } from '@ant-design/x-sdk';
import { BubbleListRef } from '@ant-design/x/es/bubble';
import { SenderRef } from '@ant-design/x/es/sender';
import { Flex } from 'antd';
import { useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Provider factory - 为每个对话创建独立的 provider
const providerCaches = new Map();

const providerFactory = (conversationKey: string) => {
  if (!providerCaches.has(conversationKey)) {
    providerCaches.set(
      conversationKey,
      new OpenAIChatProvider({
        request: XRequest<
          XModelParams,
          Partial<Record<SSEFields, XModelResponse>>
        >('/api/chat', {
          manual: true,
          params: {
            conversationId: conversationKey,
          },
        }),
      }),
    );
  }
  return providerCaches.get(conversationKey);
};

interface ChatContentProps {
  conversationId: string | undefined;
}

const ChatContent = ({ conversationId }: ChatContentProps) => {
  const listRef = useRef<BubbleListRef>(null);
  const senderRef = useRef<SenderRef>(null);

  // 从 localStorage 加载历史消息
  const loadHistoryMessages = (convId: string) => {
    if (!convId) return [];
    const savedMessages = storageStore.loadMessages(convId);
    return savedMessages.map((msg) => ({
      message: {
        role: msg.role,
        content: msg.content,
      },
      status: 'success' as const,
      id: msg.id,
    }));
  };

  const { messages, onRequest, isRequesting, abort, onReload } = useXChat({
    provider: providerFactory(conversationId || 'default'),
    conversationKey: conversationId || 'default',
    defaultMessages: conversationId ? loadHistoryMessages(conversationId) : [],
    requestPlaceholder: () => ({
      content: '思考中...',
      role: 'assistant',
    }),
    requestFallback: (_, { error, errorInfo, messageInfo }) => {
      console.error('Request failed:', error, errorInfo, messageInfo);
      if (error.name === 'AbortError') {
        return {
          content: messageInfo?.message?.content || '请求已取消',
          role: 'assistant',
        };
      }
      return {
        content: errorInfo?.error?.message || '请求失败，请稍后重试',
        role: 'assistant',
      };
    },
  });

  // 调试：打印 messages 和检查重复 key
  useEffect(() => {
    console.log('Messages updated:', messages);
    const ids = messages.map((m) => m.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      console.warn('Duplicate message IDs found:', duplicates);
    }
  }, [messages]);

  // 自动保存到 localstorage
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

  // 自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollTo({ top: 'bottom' });
      }, 100);
    }
  }, [messages]);

  const handleSend = (msg: string) => {
    if (!msg.trim() || !conversationId) return;

    onRequest({
      messages: [{ role: 'user', content: msg }],
    });

    // 清空输入框
    senderRef.current?.clear();
  };

  const Footer = ({
    id,
    content,
    status,
  }: {
    id: string;
    content: string;
    status: string;
  }) => {
    const Items = [
      {
        key: 'retry',
        label: '重试',
        icon: <SyncOutlined />,
        onItemClick: () => {
          if (id) {
            onReload?.(id, { userAction: 'retry' });
          }
        },
      },
      {
        key: 'copy',
        actionRender: <Actions.Copy text={content} />,
      },
    ];

    return status !== 'updating' && status !== 'loading' ? (
      <div className="flex">{id && <Actions items={Items} />}</div>
    ) : null;
  };

  // 配置不同角色的展示方式
  const role = {
    assistant: {
      placement: 'start' as const,
      footer: (
        content: string,
        { status, key }: { status?: string; key?: string | number },
      ) => (
        <Footer
          content={content}
          status={status || ''}
          id={String(key || '')}
        />
      ),
    },
    user: {
      placement: 'end' as const,
    },
  };

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

  return (
    <Flex vertical className="h-full flex-1 gap-4">
      <h1 className="text-2xl font-bold">Travel Agent</h1>

      <Flex justify="space-between" vertical className="flex-1">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            开始和你的 AI 旅行规划专家聊天吧！
          </div>
        ) : (
          <Bubble.List
            ref={listRef}
            style={{ height: 'calc(100% - 120px)' }}
            items={messages.map((m) => ({
              key: m.id,
              role: m.message.role,
              content: m.message.content,
              status: m.status,
              loading: m.status === 'loading',
            }))}
            role={role}
            styles={{
              bubble: { maxWidth: 840 },
            }}
          />
        )}
      </Flex>

      <div className="mb-4 flex w-full justify-center">
        <Sender
          ref={senderRef}
          style={{
            width: 600,
          }}
          autoSize={{
            maxRows: 3,
            minRows: 2,
          }}
          onSubmit={handleSend}
          onCancel={abort}
          loading={isRequesting}
          placeholder="请输入你的旅行计划需求..."
        />
      </div>
    </Flex>
  );
};

export default ChatContent;
