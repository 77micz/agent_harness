

/**
 * 注册工具函数
 */

// ====================== 导入 ======================
import type { AdapterInput } from "../utils/types.js";
import { z } from "zod";



// ====================== 注册 ======================

export const TOOLS: AdapterInput[] = [
    adapterInputFactory(getWeather, z.object({
        city: z.string().describe("The city to get the weather in"),
    }), "Get the weather in a city",),
]




/**
 * 将函数转为工具函数适配器输入对象
 * @param {Function} fn 函数
 * @param {z.ZodType<any>} schema 参数 schema
 * @param {string} description 描述
 * @returns {AdapterInput} 工具函数适配器对象
 */
function adapterInputFactory(fn: Function, schema: z.ZodType<any>, description?: string): AdapterInput {
    return {
        name: fn.name,
        description: description || "",
        schema,
        fn,
    }
}






// ====================== 工具函数 ======================

function getWeather({ city }: { city: string }) {
    // 输出参数city
    console.log(city);
    // 参数类型
    console.log(typeof city);
    const res = `${city}天气晴朗，温度25℃`;
    console.log(res);
    return res;
}
















