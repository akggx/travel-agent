'use client';

import { storageStore } from '@/store/storage';
import { storage } from '@/store/utils/storage';
import { Conversations, ConversationsProps } from '@ant-design/x';
import { useXConversations } from '@ant-design/x-sdk';
import { GetProp } from 'antd';
import { useEffect, useState } from 'react';

const Conversation = () => {
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

    Object.values(savedConversations).forEach((conv) => {
      addConversation({
        key: conv.id,
        title: conv.title,
      });
    });
  }, []);

  // 监听对话变化，自动持久化
  useEffect(() => {
    conversations.forEach((conv) => {
      storageStore.saveConversation({
        id: conv.id,
        title: conv.title || '新对话',
        createdAt: Date.now(),
        lastMessageAt: Date.now(),
      });
    });
  }, [conversations]);

  const handleCreate = () => {
    const newId = Date.now().toString();
    addConversation({
      key: newId,
      title: '新对话',
    });

    // 保存到 localStorage
    storageStore.saveConversation({
      id: newId,
      title: '新对话',
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
    });
  };

  const handleDelete = (id: string) => {
    removeConversation(id);
    storageStore.deleteConversation(id);
  };

  return (
    <Conversations
      style={{
        width: 280,
        height: '100%',
      }}
      accessKey={activeConversationKey}
      onActiveChange={(key) => setActiveConversationKey(key)}
      creation={{
        onClick: handleCreate,
      }}
      items={conversations.map((conv) => ({
        key: conv.id,
        label: conv.title,
      }))}
      menu={(conversation) => ({
        items: [
          {
            label: '删除',
            key: 'delete',
            danger: true,
            onClick: () => handleDelete(conversation.key),
          },
        ],
      })}
    />
  );
};

export default Conversation;
