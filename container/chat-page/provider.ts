import { chatRequest } from '@/service/chat';
import { OpenAIChatProvider } from '@ant-design/x-sdk';

const providerCaches = new Map<string, OpenAIChatProvider>();

export const providerFactory = (conversationKey: string) => {
  if (!providerCaches.has(conversationKey)) {
    providerCaches.set(
      conversationKey,
      new OpenAIChatProvider({
        request: chatRequest(conversationKey),
      }),
    );
  }
  return providerCaches.get(conversationKey)!;
};
