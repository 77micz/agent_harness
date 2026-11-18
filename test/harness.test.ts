

/**
 * 测试harness
 * */

// ======================= 导入 =======================
import { AgentLoop } from '../src/agents/loop.js'
// 导入 test 模块，用于测试
import { test, mock } from 'node:test';
// 导入 assert 模块，用于断言
import assert from 'node:assert';
// 导入 OpenAI 模块，用于模拟 OpenAI API
import OpenAI from 'openai';











// ======================= 集成测试 =======================


// test/harness.test.ts

test('测试 Agent，不发真实请求 (依赖注入方案)', async () => {
    // 1. 手搓一个假的 Client（Mock 对象）
    const fakeClient = {
        chat: {
            completions: {
                // 这个 create 方法必须返回一个异步生成器（流）
                create: async () => {
                    return (async function* () {
                        yield { choices: [{ delta: { content: '深圳' } }] };
                        yield { choices: [{ delta: { content: '天气晴朗，' } }] };
                        yield { choices: [{ delta: { content: '温度25℃' } }] };
                    })();
                }
            }
        }
    };


    let err
    try {
        // 2. 把假 Client 注入给 AgentLoop
        // 注意：TS 可能会报错因为 fakeClient 缺了很多 OpenAI 的属性
        // 我们用 `as unknown as OpenAI` 骗过 TS（类型断言）
        const agent = await AgentLoop.create("deepseek-v4.1-flash", fakeClient as unknown as OpenAI);

        // 3. 运行测试
        const result = await agent.run('深圳');

        // 结果是字符串
        assert.strictEqual(typeof result, 'string');
        // 结果是正确的
        assert.strictEqual(result, '深圳天气晴朗，温度25℃');



    } catch (error) {
        err = error
    }

    // 没有报错
    assert.strictEqual(err, undefined);
});












