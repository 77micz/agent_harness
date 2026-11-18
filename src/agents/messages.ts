


/**
 * 消息管理
 */


// ====================== 导入 ======================
// 导入工具调用结果类型
import type { ToolCallResult } from "../utils/types.js";







// ====================== 函数 ======================





/**
 * 将工具调用结果转换为 字符串 格式
 * @param {any} result 工具调用结果
 * @returns {string} 字符串结果
 */
function convert(result: any): string {
    // null和undefined直接返回空字符串
    if (result === null || result === undefined) {
        return "";
    }
    // 是否为字符串
    if (typeof result === "string") {
        return result;
    }
    // 是否为number或boolean
    if (typeof result === "number" || typeof result === "boolean") {
        return String(result);
    }
    // 其他情况数组或对象，尝试转换为JSON字符
    try {
        return JSON.stringify(result);
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new Error(`unexpected error: ${msg}`);
    }

}







/**
 * 封装工具调用结果为消息列表
 * @param {ToolCallResult[]} tool_call_result 工具调用结果数组
 * @returns 消息列表
 */
export function wrap_tool_call_result(tool_call_result: ToolCallResult[]): any[] {
    return tool_call_result.map(item => {
        try {
            return {
                role: "tool",
                tool_call_id: item.id,
                content: convert(item.result) // 工具调用结果必须是字符串
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            // throw new Error(`unexpected error: ${msg}`);
            return {
                role: "tool",
                tool_call_id: item.id,
                content: msg
            }
        }
    });
}







