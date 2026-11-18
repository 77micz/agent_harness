


/**
 * 接口和类定义
 */

// ==================== 导入 ====================
import { z } from "zod";
// 导入openai规范tool类型
import type { ChatCompletionTool } from "openai/resources/chat/completions";




// 注意：listTools 返回的是 { tools: [...], nextCursor?: "..." } 结构
// 假设 tool 来自 MCP SDK 的 listTools() 返回
// tool 结构大致为: { name: string; description?: string; inputSchema: any }



// ====================== 类型定义 ======================
// mcp服务暴露的工具结构
interface MCPTool {
    name: string;
    description?: string;
    inputSchema: {
        type: "object";
        properties?: Record<string, unknown>;
        required?: string[];
        [key: string]: unknown;
    };
};


// 模型返回的tool_call结构
export interface ToolCall {
    "index": number,                    // 工具调用序号，用于并行调用时区分
    "id?": string,           // 本次调用的唯一 ID
    "type?": "function",
    "function?": {
        "name?": string,       // 工具名称
        "arguments?": string              // 一个json字符串
    }
}



// 告诉模型有哪些工具的json schema
// ChatCompletionTool结构
interface ToolJsonSchema {
    type: "function",
    function: {
        name: string,
        description: string,
        parameters: {
            type: "object",
            properties: Record<string, unknown>,
            required: string[],
        },
    },
}



// 便于生成工具schema的类型
export interface ToolFunction {
    function: Function
    description: string;
    paramDesc: { _zod: { output: unknown; }; } & { parse?: (data: unknown) => unknown; };
}




// 工具调用结果
export interface ToolCallResult {
    id: string; // 工具调用id
    result: any; // 工具调用结果
    err: boolean; // 是否出错
}


// 调用工具请求格式
export interface ToolCallRequest {
    id: string; // 工具调用id
    name: string; // 工具名称
    args: string; // 工具调用参数，json字符串
}





// 适配器输入类型
export interface AdapterInput {
    name: string;
    description?: string;
    schema: z.ZodType<any>;
    fn: Function;
}








// 统一工具类型
export interface UnifiedTool {
    name: string; // 工具名称
    description?: string; // 工具描述
    parameters: Record<string, any>; // 工具参数

    execute: (args: Record<string, any>) => Promise<any>; // 工具执行函数，返回工具执行结果

    // 转为ChatCompletionTool类型
    toChatCompletionTool(): ChatCompletionTool;
}












