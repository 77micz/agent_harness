

/**
 * 测试harness
 * */

// ======================= 导入 =======================
import { AgentLoop } from '../src/agents/loop.js'
import test from 'node:test';
import assert from 'node:assert/strict'; // 推荐使用 strict 模式









// ======================= 集成测试 =======================
test('AgentLoop', async () => {
    let err
    try {
        const agent = await AgentLoop.create("deepseek-v4.1-flash", "DASHSCOPE_API_KEY", "https://cn-beijing.maas.qianwenaiapi.com/compatible-mode/v1");
        const res = await agent.run("深圳今天的天气如何");
        // 结果是否是字符串
        assert.strictEqual(typeof res, "string");
    } catch (error) {
        err = error
        console.error(error);
    }
    // 测试是否没有错误
    assert.strictEqual(err, undefined);
});












