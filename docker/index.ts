import { bots, startServerWithUI } from "@duck4i/sloppy-chat-full";
import type { BotProcessFunction, BotProcessReturn, BotReply } from "@duck4i/sloppy-chat-full";
const { downloadModel, LoadModelAsync, CreateContextAsync, RunInferenceAsync, ReleaseContextAsync, ReleaseModelAsync } = require('@duck4i/llama');
import fs from "fs"

const system_prompt = "The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.";

const bot = async (message: string, userName: string, userId: string): BotProcessReturn => {

    if (message.startsWith("!llm")) {

        if (!fs.existsSync("model.gguf")) {
            await downloadModel(
                "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-fp16.gguf?download=true",
                "model.gguf"
            );
        }

        const model = await LoadModelAsync("model.gguf");
        const ctx = await CreateContextAsync(model);

        const inference = await RunInferenceAsync(model, ctx, message.substring(3).trim(), system_prompt);

        const repl: BotReply = {
            botName: "QWEN",
            message: inference,
            onlyToSender: false
        }

        await ReleaseContextAsync(ctx);
        await ReleaseModelAsync(model);

        return repl;
    }

    return null;
}

bots.push(bot);

const server = startServerWithUI();