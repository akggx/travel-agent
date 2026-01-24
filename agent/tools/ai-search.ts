/* eslint-disable @typescript-eslint/no-explicit-any */
import { BOCHA_API_KEY, BOCHA_API_URL } from '@/config';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

interface WebPageItem {
  name: string;
  url: string;
  snippet?: string;
}

interface ImageItem {
  name: string;
  thumbnailUrl: string;
  contentUrl: string;
}

interface AISearchResult {
  query: string;
  webPages: WebPageItem[];
  images: ImageItem[];
  modalCards: Record<string, any>;
}

// api 调用
async function fetchAISearch(query: string) {
  const response = await fetch(BOCHA_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${BOCHA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      freshness: 'noLimit',
      count: 10,
      answer: false,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Bocha API Error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

//结构化解析
function parseAISearchResponse(data: any, query: string): AISearchResult {
  const result: AISearchResult = {
    query,
    webPages: [],
    images: [],
    modalCards: {},
  };

  if (!Array.isArray(data?.messages)) return result;

  for (const msg of data.messages) {
    if (msg.role !== 'assistant' || msg.type !== 'source') continue;

    const content = safeJsonParse(msg.content);
    if (!content) continue;

    switch (msg.content_type) {
      // 网页结果
      case 'webpage':
        if (content.value) {
          result.webPages.push(
            ...content.value.slice(0, 5).map((p: WebPageItem) => ({
              name: p.name,
              url: p.url,
              snippet: p.snippet || '',
            })),
          );
        }
        break;

      // 图片结果
      case 'image':
        if (content.value) {
          result.images.push(
            ...content.value.slice(0, 3).map((img: ImageItem) => ({
              name: img.name,
              thumbnailUrl: img.thumbnailUrl,
              contentUrl: img.contentUrl,
            })),
          );
        }
        break;

      // 模态卡（天气、百科等）
      default:
        result.modalCards[msg.content_type] = Array.isArray(content.value)
          ? content[0]
          : content;
        break;
    }
  }

  return result;
}

// 结构化解析
function safeJsonParse(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export const aiSearchTool = tool(
  async ({ query }) => {
    const data = await fetchAISearch(query);
    const result = parseAISearchResponse(data, query);
    return JSON.stringify(result);
  },
  {
    name: 'ai_search',
    description:
      'AI 搜索工具：返回网页结果、图片结果及结构化模态卡数据（如天气、百科、医疗、地图等），适用于实时信息查询。',
    schema: z.object({
      query: z.string().describe('搜索关键词'),
    }),
  },
);
