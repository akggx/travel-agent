// store/storage/index.ts
import { makeAutoObservable } from 'mobx';

export interface ConversationMeta {
  id: string;
  title: string;
  createdAt: number;
  lastMessageAt: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

class StorageStore {
  constructor() {
    makeAutoObservable(this);
  }

  // 保存单个对话的元数据
  saveConversation(conversation: ConversationMeta) {
    const all = this.loadAllConversations();
    all[conversation.id] = conversation;
    localStorage.setItem('conversations', JSON.stringify(all));
  }

  // 加载所有对话
  loadAllConversations(): Record<string, ConversationMeta> {
    const data = localStorage.getItem('conversations');
    return data ? JSON.parse(data) : {};
  }

  // 删除对话
  deleteConversation(id: string) {
    const all = this.loadAllConversations();
    delete all[id];
    localStorage.setItem('conversations', JSON.stringify(all));

    // 同时删除消息
    this.deleteMessages(id);
  }

  // ==================== 消息相关 ====================

  // 保存某个对话的消息列表
  saveMessages(conversationId: string, messages: Message[]) {
    const all = this.loadAllMessages();
    all[conversationId] = messages;
    localStorage.setItem('messages', JSON.stringify(all));
  }

  // 加载某个对话的消息
  loadMessages(conversationId: string): Message[] {
    const all = this.loadAllMessages();
    return all[conversationId] || [];
  }

  // 加载所有消息
  loadAllMessages(): Record<string, Message[]> {
    const data = localStorage.getItem('messages');
    return data ? JSON.parse(data) : {};
  }

  // 删除某个对话的消息
  deleteMessages(conversationId: string) {
    const all = this.loadAllMessages();
    delete all[conversationId];
    localStorage.setItem('messages', JSON.stringify(all));
  }

  // ==================== 工具方法 ====================

  // 清空所有数据
  clear() {
    localStorage.removeItem('conversations');
    localStorage.removeItem('messages');
  }
}

export const storageStore = new StorageStore();
