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
    budget: z.number().nullish().describe('人均预算金额'),
    participants: z.number().nullish().describe('同行人数'),
    preferences: z
      .array(z.string())
      .nullish()
      .describe('兴趣偏好，如：美食、摄影、徒步'),
  }),

  // 状态判断
  needMoreSoftInfo: z.boolean().describe('是否还需要补充人数或偏好信息'),

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

  // 合并需求信息
  const updatedRequirements = {
    ...state.requirements,
    ...Object.fromEntries(
      Object.entries(response.extractedInfo).filter(
        ([_, value]) => value !== null,
      ),
    ),
  };

  // 3. 默认值处理：人数如果不填，默认是 1
  if (updatedRequirements.participants == null) {
    updatedRequirements.participants = 1;
  }

  // 2. 核心三项判定
  const hasCoreInfo = !!(
    updatedRequirements.destination &&
    updatedRequirements.days &&
    updatedRequirements.budget
  );

  let isComplete = false;
  let finalReply = response.replyMessage;

  // 核心：处理“追问一次”的逻辑锁
  if (hasCoreInfo) {
    // 情况 A：用户主动给齐了所有人，或者 LLM 觉得不需要再问了
    if (!response.needMoreSoftInfo) {
      isComplete = true;
    }
    // 情况 B：LLM 觉得还缺，但我们要看“历史记录”
    else if (state.hasAskedSoftFields) {
      // 关键：既然之前问过了，这一轮无论用户回什么，都必须强制结束，进入规划！
      isComplete = true;
      // 如果此时 AI 还在追问，我们要“捂住它的嘴”，换成确认语
      if (response.needMoreSoftInfo) {
        finalReply =
          '好的，我已经记录下您的偏好（或默认按标准规划），这就为您开始生成行程！';
      }
    }
    // 情况 C：核心齐了，但柔性缺，且还没问过 -> 去问一次
    else {
      isComplete = false;
      // 注意：这里先不设置 state.hasAskedSoftFields 为 true，
      // 我们在返回时设置，确保它在下一轮生效
    }
  }

  return {
    requirements: updatedRequirements,
    isRequirementsComplete: isComplete,
    hasAskedSoftFields:
      state.hasAskedSoftFields || (hasCoreInfo && response.needMoreSoftInfo),
    messages: [new AIMessage(finalReply)],
    reasoning: response.missingInfoResponse,
  };
}
