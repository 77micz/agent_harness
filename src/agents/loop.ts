import 'dotenv/config'
// 读取.env文件中的变量


/**
 * Agent loop
 */


// ====================== 导入 ======================
// 导入openai客户端
import { OpenAI } from 'openai'
// 导入工具调用结果转为消息列表函数
import { wrap_tool_call_result } from "./messages.js";
// 导入openai规范的流式输出类型
import type { ChatCompletionChunk } from "openai/resources/chat/completions";
// 导入mcp客户端
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
// 导入工具适配器
import { functionAdapter, mcpAdapter } from "../tools/adapter.js";
// 导入统一工具类型
import type { AdapterInput, UnifiedTool } from "../utils/types.js";
// 导入调用工具函数
import { callTool } from "../tools/executor.js";
// 导入工具函数注册器
import { TOOLS } from "../tools/register.js";










// ====================== 全局变量 ======================


// 提取出流式 tool_call 的官方类型
type DeltaToolCall = ChatCompletionChunk.Choice.Delta.ToolCall;










// ====================== 类 ======================

// 代理循环类
export class AgentLoop {

    private name: string // 模型名称
    private apiKey: string // api key，这里是密钥名称，实际值在.env文件中
    private baseUrl: string // 模型提供商的URL
    private model: OpenAI // openai实例
    private mcpClient?: Client // mcp客户端实例，用于调用工具
    private tools: UnifiedTool[] // 统一规范的tool数组
    private messages: any[] = [] // 消息列表，包含用户消息和工具调用消息



    /**
     * 构造函数
     * @param {string} model 模型名称
     * @param {string} apiKey api key，这里是密钥名称，实际值在.env文件中
     * @param {string} baseUrl 模型提供商的URL
     * @param {Client} mcpClient mcp客户端实例，用于调用工具
     * @param {AdapterInput[]} functionTools 函数工具数组
     */
    private constructor(model: string, apiKey: string, baseUrl: string, mcpClient?: Client, functionTools?: AdapterInput[]) {
        this.name = model
        this.apiKey = apiKey
        this.baseUrl = baseUrl
        try {
            this.model = new OpenAI({
                // 在环境变量中取出对应的变量
                apiKey: process.env[this.apiKey],
                baseURL: this.baseUrl,
                // 默认超时时间10秒
                timeout: 10000,
                // 默认重试次数3次
                maxRetries: 3,
            })
            // 初始化tools数组
            this.tools = []

            // 如果functionTools数组不为undefined，累加tools数组
            if (functionTools) {
                this.tools = [...this.tools, ...functionAdapter(functionTools)]
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to create OpenAI instance for model ${model}.
                message: ${errorMessage}`
            )
        }
    }




    /**
     * 创建代理循环实例
     * @param {string} model 模型名称
     * @param {string} apiKey api key，这里是密钥名称，实际值在.env文件中
     * @param {string} baseUrl 模型提供商的URL
     * @param {Client} mcpClient mcp客户端实例，用于调用工具
     * @param {AdapterInput[]} functionTools 函数工具数组
     * @returns {AgentLoop} 代理循环实例
     */
    static async create(model: string, apiKey: string, baseUrl: string, mcpClient?: Client, functionTools: AdapterInput[] = TOOLS): Promise<AgentLoop> {

        const agent = new AgentLoop(model, apiKey, baseUrl, mcpClient, functionTools)
        // 如果mcp客户端不为undefined，提取tools数组
        if (mcpClient) {
            // 初始化mcp客户端实例
            agent.mcpClient = mcpClient
            // 累加tools数组
            agent.tools = [...agent.tools, ...await mcpAdapter(agent.mcpClient)]
        }
        return agent
    }



    /**
     * 运行代理循环
     * @param {string} task 任务描述
     * @returns 任务结果
     */
    async run(task: string): Promise<string> {
        // 更新消息列表
        this.messages.push({ role: "user", content: task });
        let final_res = ''
        // 循环处理任务
        while (true) {
            const res = await this.model.chat.completions.create({
                model: this.name,          // 模型名称
                messages: this.messages, // 消息列表
                tools: this.tools.map(tool => tool.toChatCompletionTool()), // openai规范的tool数组
                stream: true, // 开启流式输出
            });
            // 处理流式输出
            let result = ""
            // 初始化工具调用消息对象
            let tool_call_obj: Record<string, DeltaToolCall> = {}
            // 记录第一次遍历到不是null的tool_calls
            let firstToolCall = true
            // 记录结束标志，判断是否进行下一轮循环
            let finish_reason = ""
            for await (const chunk of res) {
                const content = chunk?.choices?.[0]?.delta?.content
                const tool_calls = chunk?.choices?.[0]?.delta?.tool_calls
                // 判断是工具调用还是普通消息
                if (content) {
                    // 如果content不是null，此次输出是普通消息，累加到结果字符串
                    result += content
                    // 输出到控制台，不换行
                    process.stdout.write(content);
                }
                if (tool_calls) {
                    if (firstToolCall) {
                        firstToolCall = false
                        // 提取其中的index作为key，tool_call作为value
                        tool_call_obj = Object.fromEntries(tool_calls.map(item => [item.index, item]));
                        continue
                    }
                    // 如果tool_calls不是null，此次输出是工具调用消息
                    // 遍历tool_calls数组，按照index累加arguments
                    tool_calls.forEach((tool_call) => {
                        const acc = tool_call_obj[tool_call.index];
                        // 只有当累加器存在，且当前 chunk 有 arguments 字符串时，才拼接
                        const argsChunk = tool_call.function?.arguments;

                        if (acc?.function && argsChunk) {
                            acc.function.arguments += argsChunk;
                        }
                    });
                }
                // 记录结束标志
                if (chunk?.choices?.[0]?.finish_reason) {
                    finish_reason = chunk?.choices?.[0]?.finish_reason
                }
            }
            if (finish_reason === "stop") {
                // 如果finish_reason是stop，说明模型输出了完整结果，结束循环
                // 输出换行符
                process.stdout.write("\n");
                // 更新消息列表
                this.messages.push({ role: "assistant", content: result });
                final_res = result
                break
            } else if (finish_reason === "tool_calls") {
                // 如果finish_reason是tool_calls，模型正在调用工具，循环继续
                // 将tool_call_obj转为数组
                const tool_calls_array = Object.values(tool_call_obj);
                // 封装assistant消息为数组元素
                this.messages.push({ role: "assistant", content: result, tool_calls: tool_calls_array })
                // 这里执行工具调用逻辑，根据tool_calls_array调用工具
                const tool_call_result = await callTool(tool_calls_array, this.tools);
                // 封装工具调用结果为消息列表
                const tool_call_result_messages = wrap_tool_call_result(tool_call_result);
                // 合并普通消息和工具调用结果消息
                this.messages = [...this.messages, ...tool_call_result_messages];
            } else {
                // 意外的情况，输出错误信息
                throw new Error(`unexpected error: unknown finish_reason '${finish_reason}'`)
            }
        }
        return final_res
    }

}








