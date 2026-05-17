import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { SettingsSection } from "@components/settings/tabs/plugins/components/Common";
import { GithubButton, WebsiteButton } from "@components/settings/tabs/plugins/LinkIconButton";
import { insertTextIntoChatInputBox, sendMessage } from "@utils/discord";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { Message } from "@vencord/discord-types";
import { findExportedComponentLazy } from "@webpack";
import { ChannelStore, Menu, MessageStore, showToast, Toasts, UserStore } from "@webpack/common";

const logger = new Logger("AIAssistant");
const SparklesIcon = findExportedComponentLazy("SparklesIcon");
const memoryStorageKey = "EquicordAIAssistant:memory";

const Author = {
    name: "ress1zen",
    id: getCurrentUserAuthorId(),
};

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

const Locales = {
    Russian: "ru",
    English: "en",
} as const;

const CustomModel = "custom";

const providerEndpoints: Record<string, string> = {
    [Providers.OpenRouter]: "https://openrouter.ai/api/v1/chat/completions",
    [Providers.OpenAI]: "https://api.openai.com/v1/chat/completions",
    [Providers.Groq]: "https://api.groq.com/openai/v1/chat/completions",
    [Providers.Mistral]: "https://api.mistral.ai/v1/chat/completions",
    [Providers.DeepSeek]: "https://api.deepseek.com/chat/completions",
};

function getCurrentUserAuthorId() {
    try {
        return BigInt(UserStore.getCurrentUser()?.id ?? 0);
    } catch {
        return 0n;
    }
}

function SourcesAndAuthorSetting() {
    return (
        <SettingsSection name="Sources & Author" description="Project links and author profile.">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <WebsiteButton text="Website" href="https://equicord.org" />
                <GithubButton text="Source Code" href="https://github.com/ress1zen/EquicordAIAssistant" />
                <GithubButton text="Author: ress1zen" href="https://github.com/ress1zen" />
            </div>
        </SettingsSection>
    );
}

const settings = definePluginSettings({
    sourcesAndAuthor: {
        type: OptionType.COMPONENT,
        component: SourcesAndAuthorSetting,
    },
    locale: {
        type: OptionType.SELECT,
        description: "Assistant UI language and response language.",
        options: [
            { label: "Русский", value: Locales.Russian, default: true },
            { label: "English", value: Locales.English },
        ],
    },
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
    memoryEnabled: {
        type: OptionType.BOOLEAN,
        description: "Remember previous assistant requests locally and use them as context.",
        default: true,
    },
    memoryMessages: {
        type: OptionType.NUMBER,
        description: "How many previous memory messages to include.",
        default: 12,
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
    memoryMessages: {
        isValid(value) {
            return value >= 0 && value <= 40 ? true : "Memory messages must be between 0 and 40.";
        },
    },
});

type ApiMessage = {
    role: "system" | "user" | "assistant";
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

function responseLanguageInstruction() {
    return settings.store.locale === Locales.English
        ? "IMPORTANT: answer strictly in English. Do not switch to another language unless the user explicitly asks for translation."
        : "ВАЖНО: отвечай строго на русском языке. Даже если вопрос сложный, технический или содержит английские термины, основной ответ должен быть на русском.";
}

function responseLanguageReminder() {
    return settings.store.locale === Locales.English
        ? "Answer strictly in English."
        : "Ответь строго на русском языке.";
}

function withLanguageReminder(prompt: string) {
    return `${prompt.trim()}\n\n${responseLanguageReminder()}`.trim();
}

function getSystemPrompt(channelId: string) {
    const currentUser = UserStore.getCurrentUser();
    const basePrompt = settings.store.systemPrompt
        .replace(/{current_user}/g, currentUser?.username ?? "Unknown User")
        .replace(/{current_time}/g, new Date().toString())
        .replace(/{channel_id}/g, channelId);

    return `${responseLanguageInstruction()}\n\n${basePrompt}\n\n${responseLanguageInstruction()}`.trim();
}

const maxMemoryContentChars = 4000;

function cleanMemoryContent(text: string) {
    return String(text || "").trim().slice(0, maxMemoryContentChars);
}

function readMemory(): ApiMessage[] {
    if (!settings.store.memoryEnabled) return [];

    const maxMessages = Math.max(0, Math.min(40, Number(settings.store.memoryMessages) || 0));
    if (!maxMessages) return [];

    try {
        const stored = JSON.parse(localStorage.getItem(memoryStorageKey) || "[]");
        if (!Array.isArray(stored)) return [];

        return stored
            .filter(item => (item?.role === "user" || item?.role === "assistant") && typeof item.content === "string")
            .map(item => ({
                role: item.role as "user" | "assistant",
                content: cleanMemoryContent(item.content),
            }))
            .filter(item => item.content)
            .slice(-maxMessages);
    } catch {
        return [];
    }
}

function writeMemory(messages: ApiMessage[]) {
    try {
        localStorage.setItem(memoryStorageKey, JSON.stringify(messages.slice(-40)));
    } catch (error) {
        logger.warn("Could not write AI Assistant memory", error);
    }
}

function rememberExchange(prompt: string, answer: string) {
    if (!settings.store.memoryEnabled) return;

    const userContent = cleanMemoryContent(prompt);
    const assistantContent = cleanMemoryContent(answer);
    if (!userContent || !assistantContent) return;

    writeMemory([
        ...readMemory(),
        { role: "user", content: userContent },
        { role: "assistant", content: assistantContent },
    ]);
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
        ...readMemory(),
        ...getRecentContext(channelId),
        {
            role: "user",
            content: withLanguageReminder(prompt),
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

async function outputAnswer(channelId: string, answer: string, outputMode = settings.store.outputMode) {
    if (!answer.trim()) return;

    switch (outputMode) {
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

async function askAndOutput(channelId: string, prompt: string, outputMode = settings.store.outputMode) {
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

    rememberExchange(prompt, answer);
    await outputAnswer(channelId, answer, outputMode);
}

type MessageAction = "answer" | "reply" | "explain" | "rewrite" | "shorten" | "translate";

function messageAssistPrompt(text: string, action: MessageAction = "answer") {
    const taskByAction: Record<MessageAction, string> = {
        answer: "If the selected message is a question, answer it directly. If it is a request, fulfill it. If it needs a reply, suggest a useful reply.",
        reply: "Write a direct reply to the selected message. Return only the reply text.",
        explain: "Explain the selected message clearly and practically.",
        rewrite: "Rewrite the selected message in a clearer, more natural style. Preserve the meaning.",
        shorten: "Shorten the selected message while preserving the key meaning.",
        translate: settings.store.locale === Locales.English
            ? "Translate the selected message into English."
            : "Переведи выбранное сообщение на русский язык.",
    };

    return [
        "You are helping with a Discord message.",
        taskByAction[action],
        "Keep the answer practical and concise.",
        "",
        `Message:\n${text}`,
    ].join("\n");
}

function runMessageAction(channelId: string, text: string, action: MessageAction, outputMode?: string) {
    return askAndOutput(channelId, messageAssistPrompt(text, action), outputMode);
}

const messageCtxPatch: NavContextMenuPatchCallback = (children, { message }: { message: Message; }) => {
    const text = messageToText(message);
    if (!text) return;

    const group = findGroupChildrenByChildId("copy-text", children);
    if (!group) return;

    group.splice(group.findIndex(c => c?.props?.id === "copy-text") + 1, 0, (
        <Menu.MenuItem
            id="vc-ai-assistant"
            label="Answer With AI"
            icon={SparklesIcon}
        >
            <Menu.MenuItem
                id="vc-ai-assistant-answer"
                label="Answer"
                action={() => runMessageAction(message.channel_id, text, "answer")}
            />
            <Menu.MenuItem
                id="vc-ai-assistant-reply"
                label="Answer + Reply"
                action={() => runMessageAction(message.channel_id, text, "reply", OutputModes.ChatBar)}
            />
            <Menu.MenuItem
                id="vc-ai-assistant-explain"
                label="Explain"
                action={() => runMessageAction(message.channel_id, text, "explain")}
            />
            <Menu.MenuItem
                id="vc-ai-assistant-rewrite"
                label="Rewrite"
                action={() => runMessageAction(message.channel_id, text, "rewrite", OutputModes.ChatBar)}
            />
            <Menu.MenuItem
                id="vc-ai-assistant-shorten"
                label="Shorten"
                action={() => runMessageAction(message.channel_id, text, "shorten", OutputModes.ChatBar)}
            />
            <Menu.MenuItem
                id="vc-ai-assistant-translate"
                label="Translate"
                action={() => runMessageAction(message.channel_id, text, "translate", OutputModes.ChatBar)}
            />
        </Menu.MenuItem>
    ));
};

export default definePlugin({
    name: "AIAssistant",
    description: "Adds a configurable AI assistant with providers, localization, memory, message actions, and API key settings.",
    tags: ["Chat", "Commands", "Utility"],
    authors: [Author],
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
                onClick: () => runMessageAction(message.channel_id, text, "answer"),
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
