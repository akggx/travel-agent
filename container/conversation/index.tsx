'use client';

import { storageStore } from '@/store/storage';
import { Conversations } from '@ant-design/x';
import { useXConversations } from '@ant-design/x-sdk';
import { DeleteOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import { message } from 'antd';

interface ConversationProps {
  onActiveChange?: (key: string | undefined) => void;
}

export const Conversation = ({ onActiveChange }: ConversationProps) => {
  const [, contextHolder] = message.useMessage();

  const {
    conversations,
    activeConversationKey,
    setActiveConversationKey,
    addConversation,
    removeConversation,
  } = useXConversations({
    defaultConversations: [],
    defaultActiveConversationKey: undefined,
  });

  // 初始化：从 localStorage 加载历史对话
  useEffect(() => {
    const savedConversations = storageStore.loadAllConversations();

    Object.values(savedConversations)
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
      .forEach((conv) => {
        addConversation({
          key: conv.id,
          label: conv.title,
        });
      });
  }, []);

  // 通知父组件 activeKey 变化
  useEffect(() => {
    onActiveChange?.(activeConversationKey);
  }, [activeConversationKey, onActiveChange]);

  const handleCreate = () => {
    const newId = Date.now().toString();
    const now = Date.now();

    addConversation({
      key: newId,
      label: '新对话',
    });

    // 保存到 localStorage
    storageStore.saveConversation({
      id: newId,
      title: '新对话',
      createdAt: now,
      lastMessageAt: now,
    });

    // 设置为活跃对话
    setActiveConversationKey(newId);
  };

  const handleDelete = (id: string) => {
    removeConversation(id);
    storageStore.deleteConversation(id);

    // 如果删除的是当前活跃对话，切换到第一个对话
    if (id === activeConversationKey) {
      const remaining = conversations.filter((c) => c.key !== id);
      if (remaining.length > 0) {
        setActiveConversationKey(remaining[0].key);
      } else {
        setActiveConversationKey('');
      }
    }
  };

  return (
    <>
      {contextHolder}
      <Conversations
        className="h-full w-74 overflow-y-auto"
        activeKey={activeConversationKey}
        onActiveChange={(key) => setActiveConversationKey(key)}
        creation={{
          onClick: handleCreate,
        }}
        items={conversations}
        menu={(conversation) => ({
          items: [
            {
              label: '删除',
              key: 'delete',
              icon: <DeleteOutlined />,
              danger: true,
              onClick: () => handleDelete(conversation.key),
            },
          ],
        })}
      />
    </>
  );
};
