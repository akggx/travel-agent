import { AIMessage, SystemMessage } from '@langchain/core/messages';
import { model } from '..';
import { AgentState } from '../state';
import { z } from 'zod';
import { REQUIREMENT_COLLECTOR_PROMPT } from '../prompts';
import { message } from 'antd';

const requirementSchema = z.object({
  // 提取到的信息(可能只有部分)
  extractedInfo: z.object({
    destination: z.string().nullish().describe('目的地'),
    startDate: z.string().nullish().describe('出发时间/日期'),
    days: z.coerce.number().nullish().describe('旅行天数/时长'),
    budget: z.coerce.number().nullish().describe('总预算或均预算金额'),
    participants: z.number().nullish().describe('同行人数'),
    preferences: z
      .array(z.string())
      .nullish()
      .describe('兴趣偏好，如：美食、摄影、徒步、海景房、不吃辣'),
  }),

  // 决策字段
  step_decision: z
    .enum(['ask_core', 'ask_prefs', 'finalize'])
    .describe('当前对话所处的阶段决策'),
  // 回复话术
  replyMessage: z
    .string()
    .describe('回复给用户的自然语言。根据 step_decision 生成相应的话术。'),
});

export async function requirementCollector(state: AgentState) {
  const structureModel = model.withStructuredOutput(requirementSchema);

  const prompt = REQUIREMENT_COLLECTOR_PROMPT.replace(
    '{current_requirements}',
    JSON.stringify(state.requirements),
  ).replace('{has_asked_prefs}', String(state.hasAskedPreferences));

  const response = await structureModel.invoke([
    new SystemMessage(prompt),
    ...state.messages,
  ]);

  // 构建要更新的需求对象
  const oldPrefs = state.requirements.preferences || [];
  const newPrefs = response.extractedInfo.preferences || [];
  const updatedRequirements = {
    ...state.requirements,
    ...Object.fromEntries(
      Object.entries(response.extractedInfo).filter(
        ([_, value]) => value !== null && value !== undefined,
      ),
    ),
    preferences: Array.from(new Set([...oldPrefs, ...newPrefs])),
  };

  // 根据 LLM 的决策控制流程标记
  let isRequirementsComplete = state.isRequirementsComplete;
  let hasAskedPreferences = state.hasAskedPreferences;
  switch (response.step_decision) {
    case 'ask_core':
      isRequirementsComplete = false;
      break;
    case 'ask_prefs':
      hasAskedPreferences = true;
      isRequirementsComplete = false;

      break;
    case 'finalize':
      isRequirementsComplete = true;
      break;
  }

  return {
    messages: new AIMessage(response.replyMessage),
    requirements: updatedRequirements,
    isRequirementsComplete: isRequirementsComplete,
    hasAskedPreferences: hasAskedPreferences,
  };
}
