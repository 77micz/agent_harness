



/**
 * 工具适配器
 */

// ======================= 导入 =======================
// 导入适配器输入类型,统一工具类型
import type { AdapterInput, UnifiedTool } from "../utils/types.js";
// 用于定义参数和描述
import { z } from "zod";
// 连接mcp服务的客户端
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
// 导入openai规范tool类型
import type { ChatCompletionTool } from "openai/resources/chat/completions";



// ======================= 工具适配器 =======================


/**
 * 函数工具适配器
 * 将函数转换为统一工具类型
 * @param {AdapterInput[]} tools 函数数组
 * @returns {UnifiedTool[]} 转换后的工具数组
 */
export function functionAdapter(tools: AdapterInput[]): UnifiedTool[] {
    return tools.map((tool) => ({
        name: tool.name,
        description: tool.description || "",
        parameters: z.toJSONSchema(tool.schema),
        execute: async (args: z.infer<typeof tool.schema>) => {
            return await tool.fn(args);
        },
        // 转换为ChatCompletionTool类型
        toChatCompletionTool(): ChatCompletionTool {
            return {
                type: "function",
                function: {
                    name: this.name,
                    description: this.description,
                    parameters: this.parameters
                }
            };
        }
    }));
}





/**
 * mcp服务工具适配器
 * 将mcp服务暴露的工具结构转换为统一工具类型
 * @param {Client} client mcp服务客户端
 * @returns {UnifiedTool[]} 转换后的工具数组
 */
export async function mcpAdapter(client: Client): Promise<UnifiedTool[]> {
    const tools = (await client.listTools()).tools || []
    return tools.map((mcpTool) => ({
        name: mcpTool.name,
        description: mcpTool.description || "",
        parameters: mcpTool.inputSchema, // MCP 的 schema 本身就是 JSON Schema，直接用
        // 包装执行逻辑
        execute: async (args: any) => {
            const result = await client.callTool({
                name: mcpTool.name,
                arguments: args
            });

            if (result.isError) {
                throw new Error(`MCP Tool Error: ${JSON.stringify(result.content)}`);
            }

            // 通常 MCP 返回的 content 是数组，我们可以提取出纯文本返回给模型
            // 或者直接返回原样，看你的业务需求
            return result.content;
        },
        // 转换为ChatCompletionTool类型
        toChatCompletionTool(): ChatCompletionTool {
            return {
                type: "function",
                function: {
                    name: this.name,
                    description: this.description,
                    parameters: this.parameters
                }
            };
        }
    }));
}















