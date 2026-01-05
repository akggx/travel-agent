import { ConversationMeta } from '../conversation';
import { Message } from '../message';

const STORAGE_KEYS = {
  CONVERSATIONS: 'travel-agent-conversations',
  MESSAGES: 'travel-agent-messages',
  ACTIVE_ID: 'travel-agent-active-id',
} as const;

export const storage = {
  // 保存对话列表
  saveConversations(conversations: Map<string, ConversationMeta>) {
    try {
      const data = Array.from(conversations.entries());
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  },

  // 加载对话列表
  loadConversations() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (!data) return null;
      const entries = JSON.parse(data);
      return new Map(entries);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return null;
    }
  },

  // 保存消息
  saveMessages(messages: Map<string, Message[]>) {
    try {
      const data = Array.from(messages.entries());
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  },

  // 加载消息
  loadMessages() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (!data) return null;
      const entries = JSON.parse(data);
      return new Map(entries);
    } catch (error) {
      console.error('Failed to load messages:', error);
      return null;
    }
  },

  // 清空数据
  clear() {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  },
};
