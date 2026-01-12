import { AIMessage, SystemMessage } from '@langchain/core/messages';
import { model } from '..';
import { AgentState } from '../state';
import { z } from 'zod';
import { REQUIREMENT_COLLECTOR_PROMPT } from '../prompts';

const requirementSchema = z.object({
  // 提取到的信息(可能只有部分)
  extractedInfo: z.object({
    destination: z.string().nullish().describe('目的地'),
    days: z.coerce.number().nullish().describe('旅行天数/时长'),
    budget: z.coerce.number().nullish().describe('人均预算金额'),
    participants: z.number().nullish().describe('同行人数'),
    preferences: z
      .array(z.string())
      .nullish()
      .describe('兴趣偏好，如：美食、摄影、徒步'),
  }),

  // 状态判断
  isCompleted: z
    .boolean()
    .describe('目的地、天数、预算这三项核心信息是否都已经收齐'),

  // 话术生成
  missingInfoResponse: z
    .string()
    .describe('简单描述还缺什么信息，用于逻辑记录'),
  replyMessage: z
    .string()
    .describe(
      '如果信息不全，生成一句自然的追问；如果全了，生成一句确认并引导开始规划的话"',
    ),
});
export async function requirementCollector(state: AgentState) {
  const structureModel = model.withStructuredOutput(requirementSchema);

  // 格式化系统提示词, 把当前表单状态告诉 AI
  const currentRequirements = JSON.stringify(state.requirements, null, 2);
  const systemContent = REQUIREMENT_COLLECTOR_PROMPT.replace(
    '{current_requirements}',
    currentRequirements,
  );

  const response = await structureModel.invoke([
    new SystemMessage(systemContent),
    ...state.messages,
  ]);

  // 处理提取到的新需求
  const updatedRequirements = {
    ...state.requirements,
    ...Object.fromEntries(
      Object.entries(response.extractedInfo).filter(
        ([_, value]) => value !== null,
      ),
    ),
  };

  return {
    requirements: updatedRequirements,
    isRequirementsComplete: response.isCompleted,
    messages: [new AIMessage(response.replyMessage)],
    reasoning: response.missingInfoResponse,
  };
}
