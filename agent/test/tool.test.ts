// agent/test/tool.test.ts - 添加调试信息

import 'dotenv/config';
import { getTimeTool, aiSearchTool } from '../tools/index';

async function testTools() {
  console.log('🧪 测试旅行工具\n');
  console.log('='.repeat(60));

  // 测试 1：获取当前时间
  console.log('\n【测试 1】获取当前时间');
  try {
    const timeResult = await getTimeTool.invoke({});
    console.log('✅ 成功:', JSON.stringify(timeResult, null, 2));
  } catch (error) {
    console.error('❌ 失败:', error);
  }

  // 测试 2：搜索景点 - 添加详细调试
  console.log('\n【测试 2】搜索成都景点（调试模式）');
  try {
    const attractionResult = await aiSearchTool.invoke({
      query: '成都必去景点推荐',
      count: 5,
    });

    // 🔍 打印完整返回结果
    console.log('📦 完整返回数据:');
    console.log(JSON.stringify(attractionResult, null, 2));

    // 解析 JSON 字符串
    const parsedResult = JSON.parse(attractionResult);

    // 检查是否有错误
    if (parsedResult.error) {
      console.log('⚠️ 发现错误:', parsedResult.error);
      console.log('⚠️ 错误信息:', parsedResult.message);
    } else {
      console.log('✅ 无错误');
      console.log('  - 网页结果数:', parsedResult.webPages?.length || 0);
      if (parsedResult.webPages && parsedResult.webPages.length > 0) {
        console.log('  - 第一条:', parsedResult.webPages[0].name);
      }
      console.log('  - 图片数:', parsedResult.images?.length || 0);
      console.log(
        '  - 模态卡:',
        Object.keys(parsedResult.modalCards || {}).join(', '),
      );
    }
  } catch (error) {
    console.error('❌ 异常:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 测试完成！\n');
}

testTools();
