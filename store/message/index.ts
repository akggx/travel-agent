import { makeAutoObservable, reaction } from 'mobx';
import { storage } from '../utils/storage';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

class MessageStore {
  conversationMessages = new Map<string, Message[]>(); // key = conversationId
  isHydrated = false;
  constructor() {
    makeAutoObservable(this);
  }

  hydrate() {
    const savedMessages = storage.loadMessages();
    if (!savedMessages) return;

    this.conversationMessages = new Map(
      savedMessages as Map<string, Message[]>,
    );
    this.isHydrated = true;
  }

  setupAutoSave() {
    // 只监听 Messages 的变化
    reaction(
      () => Array.from(this.conversationMessages.entries()),
      () => {
        if (this.isHydrated) {
          storage.saveMessages(this.conversationMessages);
          console.log('Messages saved to localStorage');
        }
      },
      { delay: 500 },
    );
  }
  getMessages(conversationId: string) {
    return this.conversationMessages.get(conversationId) || [];
  }

  addMessage(conversationId: string, message: Message) {
    const messages = this.getMessages(conversationId) ?? [];
    messages.push(message);
    this.conversationMessages.set(conversationId, messages);
  }
}

export const messageStore = new MessageStore();
