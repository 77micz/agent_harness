


/**
 * 工具函数执行器
 */

// ====================== 导入 ======================
// 导入工具调用结果类型,调用工具请求格式
import type { ToolCallResult, UnifiedTool } from "../utils/types.js";





// ====================== 函数 ======================


/**
 * 执行工具函数
 * @param {any[]} tool_calls 要执行的工具函数调用数组
 * @param {UnifiedTool[]} tools 工具数组
 * @returns {ToolCallResult[]} 函数执行结果数组
 */
export async function callTool(tool_calls: any[], tools: UnifiedTool[]): Promise<ToolCallResult[]> {
    // 将tools数组转为key为tool.name的map
    const tool_map = new Map(tools.map(tool => [tool.name, tool.execute]));
    // 收集结果
    const results: ToolCallResult[] = [];
    // 这里执行工具调用逻辑，根据tool_calls调用工具
    for (const item of tool_calls) {
        try {
            const func = item.function;
            // 调用工具
            const fn = tool_map.get(func.name);
            // 检查函数是否存在
            if (!fn) {
                results.push({ id: item.id, result: `can not find tool name: ${func.name}`, err: true });
                continue;
            }
            // 解析json字符串为js对象
            const arg_obj = JSON.parse(func.arguments);
            // 调用函数
            const result = await fn(arg_obj);
            // 收集结果
            results.push({ id: item.id, result: result, err: false });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            // throw new Error(`unexpected error: ${msg}`);
            results.push({
                id: item.id,
                result: `unexpected error: 
                ${msg}`,
                err: true
            });
        }
    }
    return results;
}




