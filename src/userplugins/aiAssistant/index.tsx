import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { insertTextIntoChatInputBox, sendMessage } from "@utils/discord";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { Message } from "@vencord/discord-types";
import { findExportedComponentLazy } from "@webpack";
import { ChannelStore, Menu, MessageStore, showToast, Toasts, UserStore } from "@webpack/common";

const logger = new Logger("AIAssistant");
const SparklesIcon = findExportedComponentLazy("SparklesIcon");

const Providers = {
    OpenRouter: "openrouter",
    OpenAI: "openai",
    Groq: "groq",
    Mistral: "mistral",
    DeepSeek: "deepseek",
    Custom: "custom",
} as const;

const OutputModes = {
    Bot: "bot",
    ChatBar: "chatbar",
    Send: "send",
} as const;

const CustomModel = "custom";

const providerEndpoints: Record<string, string> = {
    [Providers.OpenRouter]: "https://openrouter.ai/api/v1/chat/completions",
    [Providers.OpenAI]: "https://api.openai.com/v1/chat/completions",
    [Providers.Groq]: "https://api.groq.com/openai/v1/chat/completions",
    [Providers.Mistral]: "https://api.mistral.ai/v1/chat/completions",
    [Providers.DeepSeek]: "https://api.deepseek.com/chat/completions",
};

const settings = definePluginSettings({
    provider: {
        type: OptionType.SELECT,
        description: "AI provider.",
        options: [
            { label: "OpenRouter", value: Providers.OpenRouter, default: true },
            { label: "OpenAI", value: Providers.OpenAI },
            { label: "Groq", value: Providers.Groq },
            { label: "Mistral", value: Providers.Mistral },
            { label: "DeepSeek", value: Providers.DeepSeek },
            { label: "Custom OpenAI-compatible endpoint", value: Providers.Custom },
        ],
    },
    apiKey: {
        type: OptionType.STRING,
        description: "API key for the selected provider.",
        default: "",
        placeholder: "Paste your API key here",
        componentProps: {
            type: "password",
        },
    },
    modelPreset: {
        type: OptionType.SELECT,
        description: "Model preset.",
        options: [
            { label: "OpenRouter Auto", value: "openrouter/auto", default: true },
            { label: "OpenAI GPT-4o mini", value: "gpt-4o-mini" },
            { label: "OpenAI GPT-4o", value: "gpt-4o" },
            { label: "Groq Llama 3.3 70B", value: "llama-3.3-70b-versatile" },
            { label: "Mistral Large Latest", value: "mistral-large-latest" },
            { label: "DeepSeek Chat", value: "deepseek-chat" },
            { label: "Custom model ID", value: CustomModel },
        ],
    },
    customModel: {
        type: OptionType.STRING,
        description: "Custom model ID to use.",
        default: "",
        placeholder: "Example: openrouter/auto, gpt-4o-mini, llama-3.3-70b-versatile",
    },
    customEndpoint: {
        type: OptionType.STRING,
        description: "Custom OpenAI-compatible chat completions endpoint.",
        default: "",
        placeholder: "https://example.com/v1/chat/completions",
    },
    outputMode: {
        type: OptionType.SELECT,
        description: "Where AI answers should go.",
        options: [
            { label: "Local bot message", value: OutputModes.Bot, default: true },
            { label: "Insert into chat box", value: OutputModes.ChatBar },
            { label: "Send as my message", value: OutputModes.Send },
        ],
    },
    systemPrompt: {
        type: OptionType.STRING,
        description: "System prompt. Placeholders: {current_user}, {current_time}, {channel_id}.",
        default: "You are a helpful Discord assistant. Be useful, concise, and practical. Current user: {current_user}. Current time: {current_time}.",
        multiline: true,
    },
    contextMessages: {
        type: OptionType.NUMBER,
        description: "Number of recent channel messages to include as context.",
        default: 6,
    },
    includeAuthorNames: {
        type: OptionType.BOOLEAN,
        description: "Include Discord author names in recent-message context.",
        default: true,
    },
    maxTokens: {
        type: OptionType.NUMBER,
        description: "Maximum tokens in the response.",
        default: 900,
    },
    temperature: {
        type: OptionType.SLIDER,
        description: "Creativity level.",
        markers: [0, 0.2, 0.5, 0.7, 1, 1.3, 1.7, 2],
        default: 0.7,
        stickToMarkers: false,
    },
}, {
    customEndpoint: {
        hidden() {
            return this.store.provider !== Providers.Custom;
        },
        isValid(value) {
            if (this.store.provider !== Providers.Custom) return true;
            if (!value?.trim()) return "Custom endpoint is required when Custom provider is selected.";

            try {
                new URL(value);
                return true;
            } catch {
                return "Custom endpoint must be a valid URL.";
            }
        },
    },
    customModel: {
        hidden() {
            return this.store.modelPreset !== CustomModel;
        },
        isValid(value) {
            if (this.store.modelPreset !== CustomModel) return true;

            return value?.trim() ? true : "Custom model ID is required when Custom model ID is selected.";
        },
    },
    maxTokens: {
        isValid(value) {
            return value > 0 && value <= 8192 ? true : "Max tokens must be between 1 and 8192.";
        },
    },
    contextMessages: {
        isValid(value) {
            return value >= 0 && value <= 50 ? true : "Context messages must be between 0 and 50.";
        },
    },
});

type ApiMessage = {
    role: "system" | "user";
    content: string;
};

type ChatCompletionResponse = {
    error?: {
        message?: string;
    };
    choices?: Array<{
        message?: {
            content?: string | null;
        };
        text?: string;
    }>;
};

function getEndpoint() {
    if (settings.store.provider === Providers.Custom) {
        return settings.store.customEndpoint.trim();
    }

    return providerEndpoints[settings.store.provider] ?? providerEndpoints[Providers.OpenRouter];
}

function getModel() {
    return settings.store.modelPreset === CustomModel
        ? settings.store.customModel.trim()
        : String(settings.store.modelPreset).trim();
}

function getSystemPrompt(channelId: string) {
    const currentUser = UserStore.getCurrentUser();

    return settings.store.systemPrompt
        .replace(/{current_user}/g, currentUser?.username ?? "Unknown User")
        .replace(/{current_time}/g, new Date().toString())
        .replace(/{channel_id}/g, channelId);
}

function messageToText(message: Message) {
    const chunks: string[] = [];

    if (message.content?.trim()) {
        chunks.push(message.content.trim());
    }

    message.embeds?.forEach(embed => {
        const embedParts = [
            embed.provider?.name ? `Provider: ${embed.provider.name}` : "",
            embed.author?.name ? `Author: ${embed.author.name}` : "",
            embed.rawTitle ? `Title: ${embed.rawTitle}` : "",
            embed.rawDescription ? `Description: ${embed.rawDescription}` : "",
            ...(embed.fields?.map(field => field.rawName && field.rawValue ? `${field.rawName}: ${field.rawValue}` : "") ?? []),
            embed.footer?.text ? `Footer: ${embed.footer.text}` : "",
        ].filter(Boolean);

        if (embedParts.length) {
            chunks.push(embedParts.join("\n"));
        }
    });

    message.attachments
        ?.filter(attachment => attachment.filename || attachment.url)
        .forEach(attachment => chunks.push(`Attachment: ${attachment.filename ?? attachment.url}`));

    return chunks.join("\n\n").trim();
}

function getRecentContext(channelId: string): ApiMessage[] {
    const count = Math.max(0, Math.min(50, Number(settings.store.contextMessages) || 0));
    if (!count) return [];

    const messages = MessageStore.getMessages(channelId)?._array as Message[] | undefined;
    if (!messages?.length) return [];

    return messages
        .slice(-count)
        .map(message => {
            const text = messageToText(message);
            if (!text) return null;

            const username = message.author?.username ?? "Unknown";
            const content = settings.store.includeAuthorNames ? `${username}: ${text}` : text;

            return {
                role: "user" as const,
                content,
            };
        })
        .filter(Boolean) as ApiMessage[];
}

async function requestAssistant(prompt: string, channelId: string) {
    const apiKey = settings.store.apiKey.trim();
    const model = getModel();
    const endpoint = getEndpoint();

    if (!apiKey || !model || !endpoint) {
        showToast("AI Assistant: provider, API key, model, or endpoint is missing.", Toasts.Type.FAILURE);
        return "";
    }

    const messages: ApiMessage[] = [
        {
            role: "system",
            content: getSystemPrompt(channelId),
        },
        ...getRecentContext(channelId),
        {
            role: "user",
            content: prompt,
        },
    ];

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "https://discord.com",
                "X-Title": "Equicord AI Assistant",
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: Math.max(1, Math.min(8192, Number(settings.store.maxTokens) || 900)),
                temperature: Number.isFinite(Number(settings.store.temperature)) ? Number(settings.store.temperature) : 0.7,
            }),
        });

        const rawBody = await response.text();
        let data: ChatCompletionResponse = {};

        try {
            data = JSON.parse(rawBody);
        } catch {
            data = {};
        }

        if (!response.ok || data.error) {
            const message = data.error?.message || rawBody || `HTTP ${response.status}`;

            logger.error("AI provider returned an error", message);
            showToast(`AI Assistant: ${message}`, Toasts.Type.FAILURE);

            return "";
        }

        const answer = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text ?? "";
        if (!answer.trim()) {
            showToast("AI Assistant: empty model response.", Toasts.Type.FAILURE);
        }

        return answer.trim();
    } catch (error) {
        logger.error("AI request failed", error);
        showToast("AI Assistant: request failed. Check console for details.", Toasts.Type.FAILURE);
        return "";
    }
}

function splitMessage(content: string, limit = 1900) {
    const chunks: string[] = [];
    let buffer = content.trim();

    while (buffer.length > limit) {
        let splitAt = buffer.lastIndexOf("\n", limit);
        if (splitAt < limit * 0.5) splitAt = buffer.lastIndexOf(" ", limit);
        if (splitAt < limit * 0.5) splitAt = limit;

        chunks.push(buffer.slice(0, splitAt).trim());
        buffer = buffer.slice(splitAt).trim();
    }

    if (buffer) chunks.push(buffer);

    return chunks;
}

function sendLocalBotAnswer(channelId: string, content: string) {
    for (const chunk of splitMessage(content)) {
        sendBotMessage(channelId, {
            content: chunk,
            author: {
                username: "AI Assistant",
            },
        });
    }
}

async function outputAnswer(channelId: string, answer: string) {
    if (!answer.trim()) return;

    switch (settings.store.outputMode) {
        case OutputModes.ChatBar:
            insertTextIntoChatInputBox(answer);
            break;
        case OutputModes.Send:
            for (const chunk of splitMessage(answer)) {
                await sendMessage(channelId, { content: chunk });
            }
            break;
        default:
            sendLocalBotAnswer(channelId, answer);
            break;
    }
}

async function askAndOutput(channelId: string, prompt: string) {
    sendBotMessage(channelId, {
        content: "Thinking...",
        author: {
            username: "AI Assistant",
        },
    });

    const answer = await requestAssistant(prompt, channelId);
    if (!answer) {
        sendLocalBotAnswer(channelId, "No response. Check the plugin settings, selected model, API key, provider endpoint, or console errors.");
        return;
    }

    await outputAnswer(channelId, answer);
}

function messageAssistPrompt(text: string) {
    return [
        "You are helping with a Discord message.",
        "If the message is a question, answer it directly.",
        "If the message asks for an action or explanation, fulfill it.",
        "If the message is rough, unclear, or badly written, rewrite it in a cleaner natural style.",
        "If none of those apply, summarize the meaning and suggest a useful reply.",
        "Keep the answer practical and concise.",
        "",
        `Message:\n${text}`,
    ].join("\n");
}

const messageCtxPatch: NavContextMenuPatchCallback = (children, { message }: { message: Message; }) => {
    const text = messageToText(message);
    if (!text) return;

    const group = findGroupChildrenByChildId("copy-text", children);
    if (!group) return;

    group.splice(group.findIndex(c => c?.props?.id === "copy-text") + 1, 0, (
        <Menu.MenuItem
            id="vc-ai-assistant-explain"
            label="Answer With AI"
            icon={SparklesIcon}
            action={() => askAndOutput(message.channel_id, messageAssistPrompt(text))}
        />
    ));
};

export default definePlugin({
    name: "AIAssistant",
    description: "Adds a configurable AI assistant with provider, model, and API key settings.",
    tags: ["Chat", "Commands", "Utility"],
    authors: [{ name: "local-user", id: 0n }],
    dependencies: ["MessagePopoverAPI"],
    settings,
    contextMenus: {
        message: messageCtxPatch,
    },
    messagePopoverButton: {
        icon: SparklesIcon,
        render(message: Message) {
            const text = messageToText(message);
            if (!text) return null;

            return {
                label: "Answer With AI",
                icon: SparklesIcon,
                message,
                channel: ChannelStore.getChannel(message.channel_id),
                onClick: () => askAndOutput(message.channel_id, messageAssistPrompt(text)),
            };
        },
    },
    commands: [
        {
            name: "ai",
            description: "Ask your configured AI assistant.",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    name: "prompt",
                    description: "What should the assistant help with?",
                    type: ApplicationCommandOptionType.STRING,
                    required: true,
                },
            ],
            execute: async (args, ctx) => {
                const prompt = findOption<string>(args, "prompt", "").trim();

                if (!prompt) {
                    sendBotMessage(ctx.channel.id, {
                        content: "Please enter a prompt.",
                        author: {
                            username: "AI Assistant",
                        },
                    });
                    return;
                }

                await askAndOutput(ctx.channel.id, prompt);
            },
        },
    ],
});
