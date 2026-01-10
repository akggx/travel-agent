// chat.service.ts
import {
  SSEFields,
  XModelParams,
  XModelResponse,
  XRequest,
} from '@ant-design/x-sdk';

export const chatRequest = (conversationId: string) =>
  XRequest<XModelParams, Partial<Record<SSEFields, XModelResponse>>>(
    '/api/chat',
    {
      manual: true,
      params: { conversationId },
    },
  );
