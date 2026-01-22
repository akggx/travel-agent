import { tool } from '@langchain/core/tools';
import { z } from 'zod';
export const getTimeTool = tool(
  async () => {
    const now = new Date();

    return {
      currentDate: now.toISOString().split('T')[0],
      currentTime: now.toTimeString().split(' ')[0],
      weekday: now.toLocaleDateString('zh-CN', { weekday: 'long' }),
      timestamp: now.getTime(),
    };
  },
  {
    name: 'get_current_time',
    description: '获取当前的日期和时间，用于确保行程规划的时间是合理和最新的',
    schema: z.object({}),
  },
);
