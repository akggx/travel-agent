import { makeAutoObservable, reaction } from 'mobx';
import { storage } from '../utils/storage';

export interface ConversationMeta {
  id: string;
  title: string;
  createdAt: number;
  lastMessageAt: number;
}

class ConversationStore {
  conversations = new Map<string, ConversationMeta>();
  activeId: string | null = null;
  isHydrated = false;

  constructor() {
    makeAutoObservable(this);
  }

  // 从 localStorage 加载数据
  hydrate() {
    const savedConversations = storage.loadConversations();
    if (!savedConversations) return;

    this.conversations = new Map(
      savedConversations as Map<string, ConversationMeta>,
    );
    this.isHydrated = true;
  }

  setupAutoSave() {
    // 只监听 conversations 的变化
    reaction(
      () => Array.from(this.conversations.entries()),
      () => {
        if (this.isHydrated) {
          storage.saveConversations(this.conversations);
          console.log('Conversations saved to localStorage');
        }
      },
      { delay: 500 },
    );
  }

  createConversation(title: string) {
    const id = Date.now().toString();
    const timestamp = Date.now();

    this.conversations.set(id, {
      id,
      title,
      createdAt: timestamp,
      lastMessageAt: timestamp,
    });

    this.activeId = id;
    return id;
  }

  setActiveId(id: string) {
    this.activeId = id;
  }
}

export const conversationStore = new ConversationStore();
