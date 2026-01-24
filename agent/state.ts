import { BaseMessage } from '@langchain/core/messages';
import { Annotation, messagesStateReducer } from '@langchain/langgraph';

export type Requirements = {
  destination: string; // 目的地
  startDate: string; // 出发日期 (建议 ISO 格式或自然语言，后续由 Planner 处理)
  days: number; // 天数
  budget: number; // 预算
  participants: number; // 人数
  preferences: string[]; // 偏好 (数组)
};

export const StateAnnotation = Annotation.Root({
  // 消息流：存储所有对话历史
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  // 结构化需求
  requirements: Annotation<Requirements>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}) as Requirements,
  }),

  // 最终行程
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itinerary: Annotation<any>({ reducer: (x, y) => y ?? x }),

  // 流程控制标记
  // 当前意图：聊天、任务、修改
  intent: Annotation<'chat' | 'task' | 'modify'>({
    reducer: (_, y) => y,
    default: () => 'chat',
  }),

  // 标记：是否已经进行过“偏好追问”
  hasAskedPreferences: Annotation<boolean>({
    reducer: (current, update) => update ?? current, // update 存在则覆盖
    default: () => false,
  }),

  // 审计发现的问题列表
  auditIssues: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),

  finalPresentation: Annotation<string>({
    reducer: (_, y) => y,
    default: () => '',
  }),
});

export type AgentState = typeof StateAnnotation.State;
