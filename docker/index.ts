import { bots, startServerWithUI } from "@duck4i/sloppy-chat-full";
import type { BotProcessFunction, BotProcessReturn, BotReply } from "@duck4i/sloppy-chat-full";
const { downloadModel, LoadModelAsync, CreateContextAsync, RunInferenceAsync, ReleaseContextAsync, ReleaseModelAsync } = require('@duck4i/llama');
import { ChatManager, Role } from "./chat";
import fs from "fs"

const system_prompt = "You are an mother following chat between two individuals and trying to mediate between them, using soothing words.";

let model: any = null;
let ctx: any = null;
const chat = new ChatManager(system_prompt);

let textSoFar = "";

const bot = async (message: string, userName: string, userId: string): BotProcessReturn => {

    if (message.startsWith("!llm")) {

        if (!fs.existsSync("model.gguf")) {
            await downloadModel(
                "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-fp16.gguf?download=true",
                "model.gguf"
            );
        }

        if (model === null) {
            model = await LoadModelAsync("model.gguf");
            ctx = await CreateContextAsync(model);
        }

        const cleanMessage = `(${userName})${message.substring(4).trim()}`
        const formatted = chat.getNextPrompt(cleanMessage);
        console.log("Mes", formatted);

        const inference = await RunInferenceAsync(model, ctx, formatted);
        chat.addMessage(Role.ASSISTANT, inference);

        const repl: BotReply = {
            botName: "QWEN",
            message: inference,
            onlyToSender: false
        }

        textSoFar = "";

        return repl;
    }

    return null;
}

bots.push(bot);

const server = startServerWithUI();