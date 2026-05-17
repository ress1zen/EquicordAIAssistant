import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { SettingsSection } from "@components/settings/tabs/plugins/components/Common";
import { GithubButton, WebsiteButton } from "@components/settings/tabs/plugins/LinkIconButton";
import { insertTextIntoChatInputBox, sendMessage } from "@utils/discord";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { Message } from "@vencord/discord-types";
import { ChannelStore, Menu, MessageStore, SelectedChannelStore, showToast, Toasts, UserStore } from "@webpack/common";

const logger = new Logger("AIAssistant");
const memoryStorageKey = "EquicordAIAssistant:memory";
const magicWandIconDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACeklEQVR4AdSWDW6jMBCF30TZe6Q3aU5SkDaVeoq2p1hpsxLkJMlNkns0u7Mzw58NNjiQqqqFYWzseR9jY3uFL07fB4CLX5vPCFZ6BGh95vJPcW+IJAAufme18GP9vNtjEoAP+1fQ6rVS5I1GgYv93UBGAbjcMxhvADvjzxkIRwVBJOl80Rx57VVHAcwBQcQRSHQB8yHwAhYdmS+gH0eLXqiRUxcFoPzlQk+7d/D1AaASTWJsKfv5QPnu1FQ1z0ocx6rMGzBlUxBRgMoJoCDd11IZEoYkX1wq7KohRubMJID6MVEdjkjYtY0/T6qa7n69dLZvJQFoFx0OA9FCMP89QSG9d6RzJbcoevVdIRmg69JZOlHlTznKH3EG1hv8ux46iEZ8OFc6D8DKLdxiqzhoXUgfWRNkrInEriGYc/DHdjxi0lOuWQC+uHixq4Og/Fkm60t03K15fbsZoBaXkEO+HL0kEL2aqeJNAI542C8jKexu52SAzxBXkCSAueLaT7MKxfIkgDnQtT3mYSzssh9Ac6yv1I8CLBG3pdl2Ud5UtqgFrijAEnHTIXqyp95cW8tODgIsEde+1Q7ImaPzKKtlEYrEAEAdYOaYi8jZ+jLe4CWWAw1nqA4yZ9Oo33sA9mKuuJ2aOWn1czcnD8Doa7LBgzG6yKhTynZbO8AMdkXxpnVyuCE5zEipvVoA+/q2umdMiLutDURPUu4pSuxqOx/uDy2AdpSTT+46M/sGcWvf3PjjvTHF76G1e0YLoPW6i0njDmKuuDizDwJOkDy2LXsA0ljOgM+ljaOOV+DgqW2SM19z0nkx0mEAoG2VXrPaS3KKjyDAEtF+36nyfwAAAP//MnqKugAAAAZJREFUAwAePjBQnHzkXwAAAABJRU5ErkJggg==";
let floatingRoot: HTMLDivElement | null = null;

function AssistantIcon(props: any) {
    const { style, ...rest } = props;

    return (
        <span
            {...rest}
            aria-hidden="true"
            style={{
                display: "block",
                width: "1em",
                height: "1em",
                backgroundColor: "currentColor",
                WebkitMask: `url("${magicWandIconDataUri}") center / contain no-repeat`,
                mask: `url("${magicWandIconDataUri}") center / contain no-repeat`,
                ...style,
            }}
        />
    );
}

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

type ApiContentPart =
    | { type: "text"; text: string; }
    | { type: "image_url"; image_url: { url: string; }; };

type ApiMessage = {
    role: "system" | "user" | "assistant";
    content: string | ApiContentPart[];
};

type FloatingAttachment = {
    name: string;
    type: string;
    size: number;
    text?: string;
    dataUrl?: string;
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

function currentLocale() {
    return settings.store.locale === Locales.English ? Locales.English : Locales.Russian;
}

function responseLanguageInstruction() {
    return currentLocale() === Locales.English
        ? "IMPORTANT: answer strictly in English. This language rule has priority over the system prompt, memory, channel context, and previous messages. Do not switch to another language unless the user explicitly asks for translation."
        : "ВАЖНО: отвечай строго на русском языке. Это правило важнее системного промпта, памяти, контекста канала и прошлых сообщений. Даже если вопрос сложный, технический или содержит английские термины, основной ответ должен быть на русском.";
}

function responseLanguageReminder() {
    return currentLocale() === Locales.English
        ? "Language rule: answer strictly in English."
        : "Правило языка: ответь строго на русском языке.";
}

function withLanguageReminder(prompt: string) {
    return `${responseLanguageReminder()}\n\n${prompt.trim()}\n\n${responseLanguageReminder()}`.trim();
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

function buildUserContent(prompt: string, attachments: FloatingAttachment[] = []): string | ApiContentPart[] {
    if (!attachments.length) return withLanguageReminder(prompt);

    const textParts = [withLanguageReminder(prompt)];
    const content: ApiContentPart[] = [];

    for (const attachment of attachments) {
        if (attachment.dataUrl?.startsWith("data:image/")) {
            content.push({
                type: "image_url",
                image_url: {
                    url: attachment.dataUrl,
                },
            });
            textParts.push(`Image attachment: ${attachment.name} (${attachment.type || "image"}, ${attachment.size} bytes).`);
            continue;
        }

        if (attachment.text) {
            textParts.push(`File attachment: ${attachment.name} (${attachment.type || "text"}, ${attachment.size} bytes)\n${attachment.text}`);
        } else {
            textParts.push(`File attachment: ${attachment.name} (${attachment.type || "unknown"}, ${attachment.size} bytes).`);
        }
    }

    return [
        {
            type: "text",
            text: textParts.join("\n\n"),
        },
        ...content,
    ];
}

async function requestAssistant(prompt: string, channelId: string, attachments: FloatingAttachment[] = []) {
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
            content: buildUserContent(prompt, attachments),
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
        content: t("thinking"),
        author: {
            username: "AI Assistant",
        },
    });

    const answer = await requestAssistant(prompt, channelId);
    if (!answer) {
        sendLocalBotAnswer(channelId, t("noResponse"));
        return;
    }

    rememberExchange(prompt, answer);
    await outputAnswer(channelId, answer, outputMode);
}

type MessageAction = "answer" | "reply" | "explain" | "rewrite" | "shorten" | "translate";

function messageAssistPrompt(text: string, action: MessageAction = "answer") {
    const ruTaskByAction: Record<MessageAction, string> = {
        answer: "Если выбранное сообщение является вопросом, ответь на него напрямую. Если это просьба, выполни её. Если нужен ответ в чат, предложи полезный ответ.",
        reply: "Напиши прямой ответ на выбранное сообщение. Верни только текст ответа.",
        explain: "Объясни выбранное сообщение понятно и практично.",
        rewrite: "Перепиши выбранное сообщение более понятно и естественно. Сохрани смысл.",
        shorten: "Сократи выбранное сообщение, сохранив главный смысл.",
        translate: "Переведи выбранное сообщение на русский язык.",
    };
    const enTaskByAction: Record<MessageAction, string> = {
        answer: "If the selected message is a question, answer it directly. If it is a request, fulfill it. If it needs a reply, suggest a useful reply.",
        reply: "Write a direct reply to the selected message. Return only the reply text.",
        explain: "Explain the selected message clearly and practically.",
        rewrite: "Rewrite the selected message in a clearer, more natural style. Preserve the meaning.",
        shorten: "Shorten the selected message while preserving the key meaning.",
        translate: "Translate the selected message into English.",
    };
    const isEnglish = currentLocale() === Locales.English;

    return [
        isEnglish ? "You are helping with a Discord message." : "Ты помогаешь с сообщением в Discord.",
        isEnglish ? enTaskByAction[action] : ruTaskByAction[action],
        isEnglish ? "Keep the answer practical and concise." : "Отвечай практично и кратко.",
        "",
        `${isEnglish ? "Message" : "Сообщение"}:\n${text}`,
    ].join("\n");
}

function runMessageAction(channelId: string, text: string, action: MessageAction, outputMode?: string) {
    return askAndOutput(channelId, messageAssistPrompt(text, action), outputMode);
}

function t(key: string) {
    const ru: Record<string, string> = {
        title: "AI-ассистент",
        subtitle: "Личный помощник для вопросов и быстрых ответов",
        language: "Язык",
        provider: "Провайдер",
        model: "Модель",
        apiKey: "API-ключ",
        customEndpoint: "Свой endpoint",
        customModel: "Своя model ID",
        generation: "Генерация",
        systemPrompt: "Системный промпт",
        temperature: "Температура",
        contextMessages: "Сообщений контекста",
        maxTokens: "Макс. токенов",
        memory: "Память",
        memoryEnabledText: "Запоминать предыдущие запросы",
        prompt: "Запрос",
        ask: "Спросить",
        insert: "Вставить",
        reply: "Ответом",
        copy: "Копировать",
        clear: "Очистить",
        answer: "Ответ",
        ready: "Готов.",
        thinking: "Думаю...",
        done: "Готово.",
        missingChat: "Сначала открой текстовый канал или личный чат.",
        missingKey: "Не указан API-ключ.",
        emptyPrompt: "Запрос пустой.",
        noResponse: "Ответ не получен. Проверь настройки плагина, выбранную модель, API-ключ, endpoint провайдера или ошибки в консоли.",
        copied: "Скопировано.",
        inserted: "Вставлено в поле ввода.",
        attached: "Файлов прикреплено: {count}.",
        attachmentRemoved: "Вложение удалено.",
        attachFiles: "Прикрепить файлы",
        attachmentsHint: "Прикрепи, перетащи или вставь фото/файлы сюда.",
        hotkey: "Горячая клавиша: Ctrl+Shift+Y. Выделенный текст подставится в запрос.",
        website: "Сайт",
        sourceCode: "Исходный код",
        authors: "Авторы",
        open: "Открыть AI-ассистента",
        close: "Закрыть",
        showApiKey: "Показать API-ключ",
        hideApiKey: "Скрыть API-ключ",
        apiKeyPlaceholder: "Вставь API-ключ",
        endpointPlaceholder: "https://example.com/v1/chat/completions",
        customModelPlaceholder: "openrouter/auto",
        promptPlaceholder: "Спроси что угодно...",
        systemPromptPlaceholder: "Поведение ассистента и стиль ответа",
        infoLanguage: "Меняет язык меню ассистента и язык, на котором ИИ должен отвечать.",
        infoProvider: "Выбирает API-сервис, куда будут отправляться запросы.",
        infoModel: "Выбирает конкретную модель. Для фото нужна модель с поддержкой vision.",
        infoApiKey: "API-ключ выбранного провайдера. Хранится локально в этом клиенте.",
        infoCustomEndpoint: "OpenAI-compatible URL chat completions для своего провайдера.",
        infoCustomModel: "Своё имя или ID модели, которое отправляется в endpoint.",
        infoSystemPrompt: "Базовая инструкция, которая задаёт поведение и тон ассистента.",
        infoTemperature: "Отвечает за случайность. Ниже — строже, выше — креативнее.",
        infoContextMessages: "Сколько последних сообщений Discord брать как контекст.",
        infoMaxTokens: "Максимальная длина ответа. Больше значение — длиннее ответ.",
        infoMemory: "Хранит последние запросы и ответы локально, затем использует их как контекст.",
        infoPrompt: "Твой вопрос, команда или инструкция для ассистента.",
    };

    const en: Record<string, string> = {
        title: "AI Assistant",
        subtitle: "Private helper for quick replies and questions",
        language: "Language",
        provider: "Provider",
        model: "Model",
        apiKey: "API key",
        customEndpoint: "Custom endpoint",
        customModel: "Custom model ID",
        generation: "Generation",
        systemPrompt: "System prompt",
        temperature: "Temperature",
        contextMessages: "Context messages",
        maxTokens: "Max tokens",
        memory: "Memory",
        memoryEnabledText: "Remember previous assistant requests",
        prompt: "Prompt",
        ask: "Ask",
        insert: "Insert",
        reply: "Reply",
        copy: "Copy",
        clear: "Clear",
        answer: "Answer",
        ready: "Ready.",
        thinking: "Thinking...",
        done: "Done.",
        missingChat: "Open a text channel or DM first.",
        missingKey: "API key is missing.",
        emptyPrompt: "Prompt is empty.",
        noResponse: "No response. Check the plugin settings, selected model, API key, provider endpoint, or console errors.",
        copied: "Copied.",
        inserted: "Inserted into chat box.",
        attached: "{count} file(s) attached.",
        attachmentRemoved: "Attachment removed.",
        attachFiles: "Attach files",
        attachmentsHint: "Attach, drag, or paste images/files here.",
        hotkey: "Hotkey: Ctrl+Shift+Y. Select text before opening to use it as a prompt.",
        website: "Website",
        sourceCode: "Source Code",
        authors: "Authors",
        open: "Open AI Assistant",
        close: "Close",
        showApiKey: "Show API key",
        hideApiKey: "Hide API key",
        apiKeyPlaceholder: "Paste your API key",
        endpointPlaceholder: "https://example.com/v1/chat/completions",
        customModelPlaceholder: "openrouter/auto",
        promptPlaceholder: "Ask anything...",
        systemPromptPlaceholder: "Assistant behavior and response style",
        infoLanguage: "Changes the assistant UI language and the language the AI should answer in.",
        infoProvider: "Selects which API service will receive requests.",
        infoModel: "Selects the exact model. Use a vision-capable model if you attach images.",
        infoApiKey: "Your provider API key. It is stored locally in this client.",
        infoCustomEndpoint: "OpenAI-compatible chat completions URL for a custom provider.",
        infoCustomModel: "Custom model name or ID sent to the selected endpoint.",
        infoSystemPrompt: "Base instruction that defines the assistant's behavior and tone.",
        infoTemperature: "Controls randomness. Lower is stricter, higher is more creative.",
        infoContextMessages: "How many recent Discord messages are used as context.",
        infoMaxTokens: "Maximum response length. Higher values allow longer answers.",
        infoMemory: "Stores recent prompts and answers locally, then uses them as context for future requests.",
        infoPrompt: "Your question, command, or instruction for the assistant.",
    };

    return (currentLocale() === Locales.English ? en : ru)[key] ?? en[key] ?? key;
}

function syncFloatingForm(shadow: ShadowRoot) {
    (shadow.querySelector("[data-setting='locale']") as HTMLSelectElement).value = currentLocale();
    (shadow.querySelector("[data-setting='provider']") as HTMLSelectElement).value = settings.store.provider;
    (shadow.querySelector("[data-setting='modelPreset']") as HTMLSelectElement).value = settings.store.modelPreset;
    (shadow.querySelector("[data-setting='apiKey']") as HTMLInputElement).value = settings.store.apiKey;
    (shadow.querySelector("[data-setting='customEndpoint']") as HTMLInputElement).value = settings.store.customEndpoint;
    (shadow.querySelector("[data-setting='customModel']") as HTMLInputElement).value = settings.store.customModel;
    (shadow.querySelector("[data-setting='systemPrompt']") as HTMLTextAreaElement).value = settings.store.systemPrompt;
    (shadow.querySelector("[data-setting='temperature']") as HTMLInputElement).value = String(settings.store.temperature);
    (shadow.querySelector("[data-setting='contextMessages']") as HTMLInputElement).value = String(settings.store.contextMessages);
    (shadow.querySelector("[data-setting='maxTokens']") as HTMLInputElement).value = String(settings.store.maxTokens);
    (shadow.querySelector("[data-setting='memoryEnabled']") as HTMLInputElement).checked = Boolean(settings.store.memoryEnabled);
    shadow.querySelectorAll("[data-i18n]").forEach(node => {
        node.textContent = t((node as HTMLElement).dataset.i18n || "");
    });
    shadow.querySelectorAll("[data-info-i18n]").forEach(node => {
        (node as HTMLElement).title = t((node as HTMLElement).dataset.infoI18n || "");
    });
    shadow.querySelectorAll("[data-placeholder]").forEach(node => {
        (node as HTMLInputElement | HTMLTextAreaElement).placeholder = t((node as HTMLElement).dataset.placeholder || "");
    });
    (shadow.querySelector(".custom-endpoint") as HTMLElement).style.display = settings.store.provider === Providers.Custom ? "block" : "none";
    (shadow.querySelector(".custom-model") as HTMLElement).style.display = settings.store.modelPreset === CustomModel ? "block" : "none";
    const fab = shadow.querySelector(".fab") as HTMLButtonElement;
    const close = shadow.querySelector(".close") as HTMLButtonElement;
    const eye = shadow.querySelector(".api-key-eye") as HTMLButtonElement;
    fab.title = t("open");
    close.title = t("close");
    eye.title = (shadow.querySelector("[data-setting='apiKey']") as HTMLInputElement).type === "password"
        ? t("showApiKey")
        : t("hideApiKey");
}

function writeFloatingSettings(shadow: ShadowRoot) {
    settings.store.locale = (shadow.querySelector("[data-setting='locale']") as HTMLSelectElement).value;
    settings.store.provider = (shadow.querySelector("[data-setting='provider']") as HTMLSelectElement).value;
    settings.store.modelPreset = (shadow.querySelector("[data-setting='modelPreset']") as HTMLSelectElement).value;
    settings.store.apiKey = (shadow.querySelector("[data-setting='apiKey']") as HTMLInputElement).value;
    settings.store.customEndpoint = (shadow.querySelector("[data-setting='customEndpoint']") as HTMLInputElement).value;
    settings.store.customModel = (shadow.querySelector("[data-setting='customModel']") as HTMLInputElement).value;
    settings.store.systemPrompt = (shadow.querySelector("[data-setting='systemPrompt']") as HTMLTextAreaElement).value;
    settings.store.temperature = Number((shadow.querySelector("[data-setting='temperature']") as HTMLInputElement).value) || 0.7;
    settings.store.contextMessages = Number((shadow.querySelector("[data-setting='contextMessages']") as HTMLInputElement).value) || 0;
    settings.store.maxTokens = Number((shadow.querySelector("[data-setting='maxTokens']") as HTMLInputElement).value) || 900;
    settings.store.memoryEnabled = (shadow.querySelector("[data-setting='memoryEnabled']") as HTMLInputElement).checked;
    syncFloatingForm(shadow);
}

function renderFloatingAnswer(answer: HTMLElement, text: string) {
    answer.textContent = text;
    answer.parentElement?.classList.toggle("visible", Boolean(text.trim()));
}

function formatBytes(size: number) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function readFileAsText(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error);
        reader.onload = () => resolve(String(reader.result || ""));
        reader.readAsText(file);
    });
}

function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error);
        reader.onload = () => resolve(String(reader.result || ""));
        reader.readAsDataURL(file);
    });
}

async function fileToAttachment(file: File): Promise<FloatingAttachment> {
    const attachment: FloatingAttachment = {
        name: file.name,
        type: file.type,
        size: file.size,
    };

    if (file.type.startsWith("image/")) {
        attachment.dataUrl = await readFileAsDataUrl(file);
        return attachment;
    }

    if (file.type.startsWith("text/") || /\.(txt|md|json|csv|ts|tsx|js|jsx|css|html|xml|yaml|yml|log)$/i.test(file.name)) {
        attachment.text = (await readFileAsText(file)).slice(0, 12000);
    }

    return attachment;
}

function renderAttachments(list: HTMLElement, attachments: FloatingAttachment[], onRemove: (index: number) => void) {
    list.innerHTML = "";
    list.classList.toggle("visible", attachments.length > 0);

    attachments.forEach((attachment, index) => {
        const item = document.createElement("div");
        item.className = "attachment-item";

        const kind = document.createElement("div");
        kind.className = "attachment-kind";
        kind.textContent = attachment.type.startsWith("image/") ? "img" : "file";

        const meta = document.createElement("div");
        meta.className = "attachment-meta";

        const name = document.createElement("div");
        name.className = "attachment-name";
        name.textContent = attachment.name;

        const size = document.createElement("div");
        size.className = "attachment-size";
        size.textContent = formatBytes(attachment.size);

        const remove = document.createElement("button");
        remove.className = "attachment-remove";
        remove.type = "button";
        remove.addEventListener("click", () => onRemove(index));

        meta.append(name, size);
        item.append(kind, meta, remove);
        list.append(item);
    });
}

function startFloatingAssistant() {
    stopFloatingAssistant();

    floatingRoot = document.createElement("div");
    floatingRoot.id = "equicord-ai-assistant-floating";
    const shadow = floatingRoot.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host {
          all: initial;
          --panel: var(--modal-background, #313338);
          --panel-elevated: var(--modal-footer-background, var(--background-secondary, #2b2d31));
          --field: var(--input-background, #1e1f22);
          --field-hover: var(--background-modifier-hover, #232428);
          --border: var(--background-modifier-accent, rgba(78, 80, 88, .48));
          --text: var(--text-normal, #dbdee1);
          --text-strong: var(--header-primary, #f2f3f5);
          --muted: var(--text-muted, #b5bac1);
          --interactive: var(--interactive-normal, #b5bac1);
          --interactive-hover: var(--interactive-hover, #dbdee1);
          --accent: var(--brand-experiment, var(--brand-500, #5865f2));
          --danger: var(--status-danger, #da373c);
          font-family: var(--font-primary, "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif);
          letter-spacing: 0;
          text-rendering: optimizeLegibility;
        }
        * {
          box-sizing: border-box;
          font-family: var(--font-primary, "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif) !important;
        }
        .fab {
          position: fixed; right: 18px; bottom: 18px; z-index: 2147483647;
          width: 48px; height: 48px; border: 1px solid rgba(255,255,255,.14); border-radius: 8px;
          background: var(--accent); color: white; cursor: pointer;
          display: grid; place-items: center; padding: 0; font: inherit; font-size: 15px; font-weight: 800;
          box-shadow: 0 16px 42px rgba(0,0,0,.42);
          transition: transform .16s ease, filter .16s ease, box-shadow .16s ease;
        }
        .fab:hover { transform: translateY(-2px); filter: brightness(1.06); box-shadow: 0 20px 52px rgba(0,0,0,.5); }
        .magic-wand-icon {
          display: block; width: 28px; height: 28px; background: #b8bed8;
          -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
          -webkit-mask-position: center; mask-position: center;
          -webkit-mask-size: contain; mask-size: contain;
          pointer-events: none;
        }
        .mark .magic-wand-icon { width: 20px; height: 20px; }
        .panel {
          position: fixed; right: 18px; bottom: 78px; z-index: 2147483647;
          width: min(520px, calc(100vw - 28px)); max-height: min(780px, calc(100vh - 100px));
          display: none; flex-direction: column; overflow: hidden;
          border: 1px solid rgba(0,0,0,.28); border-radius: 8px;
          background: var(--panel); color: var(--text);
          box-shadow: var(--elevation-high, 0 18px 48px rgba(0,0,0,.52));
        }
        .panel.open { display: flex; animation: panel-in .16s ease-out; }
        @keyframes panel-in {
          from { opacity: 0; transform: translateY(8px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .header {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 16px 20px; border-bottom: 1px solid var(--border); background: var(--panel);
        }
        .brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .mark {
          display: grid; place-items: center; flex: 0 0 auto; width: 36px; height: 36px;
          border-radius: 8px; background: var(--accent); color: white; font-size: 13px; font-weight: 800;
        }
        .title { color: var(--text-strong); font-size: 20px; line-height: 24px; font-weight: 700; }
        .subtitle { margin-top: 2px; color: var(--muted); font-size: 13px; line-height: 18px; font-weight: 400; }
        .close {
          flex: 0 0 auto; width: 32px; height: 32px; display: grid; place-items: center;
          border: 0; border-radius: 4px; background: transparent; color: var(--interactive);
          cursor: pointer; font-size: 0; line-height: 1;
        }
        .close:hover { color: var(--interactive-hover); background: rgba(255,255,255,.06); }
        .close::before {
          content: ""; width: 18px; height: 18px; background: currentColor;
          -webkit-mask: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13.5 4.5l-9 9M4.5 4.5l9 9' stroke='black' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") center / contain no-repeat;
          mask: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13.5 4.5l-9 9M4.5 4.5l9 9' stroke='black' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") center / contain no-repeat;
        }
        .body {
          flex: 1 1 auto; overflow: auto; min-height: 0; padding: 0;
          scrollbar-width: thin; scrollbar-color: var(--scrollbar-auto-thumb, #1a1b1e) transparent;
        }
        .body::-webkit-scrollbar, .answer::-webkit-scrollbar { width: 8px; height: 8px; }
        .body::-webkit-scrollbar-thumb, .answer::-webkit-scrollbar-thumb {
          border: 2px solid var(--panel); border-radius: 999px; background: var(--scrollbar-auto-thumb, #1a1b1e);
        }
        .group { padding: 16px 20px; border-bottom: 1px solid var(--border); background: transparent; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .full { grid-column: 1 / -1; }
        .control { min-width: 0; }
        label, .group-title {
          display: block; color: var(--muted); font-size: 12px; line-height: 16px;
          font-weight: 700; text-transform: uppercase;
        }
        .group-title { margin-bottom: 12px; color: var(--text-strong); font-size: 16px; line-height: 20px; text-transform: none; }
        label { margin: 0 0 6px; }
        .label-with-info { display: flex; align-items: center; gap: 6px; min-height: 16px; margin: 0 0 6px; }
        .label-with-info label { margin: 0; }
        .info-button {
          display: inline-grid; place-items: center; flex: 0 0 auto; width: 16px; height: 16px;
          border: 0; border-radius: 50%; background: transparent; color: var(--muted);
          cursor: help; font: inherit; font-size: 0; padding: 0;
        }
        .info-button::before {
          content: ""; display: block; width: 16px; height: 16px; background: currentColor;
          -webkit-mask: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='black' d='M8 1.333A6.667 6.667 0 108 14.667 6.667 6.667 0 008 1.333zm0 1.334a5.333 5.333 0 110 10.666A5.333 5.333 0 018 2.667zm-.667 2.666h1.334v4H7.333v-4zm0 5.334h1.334V12H7.333v-1.333z'/%3E%3C/svg%3E") center / contain no-repeat;
          mask: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='black' d='M8 1.333A6.667 6.667 0 108 14.667 6.667 6.667 0 008 1.333zm0 1.334a5.333 5.333 0 110 10.666A5.333 5.333 0 018 2.667zm-.667 2.666h1.334v4H7.333v-4zm0 5.334h1.334V12H7.333v-1.333z'/%3E%3C/svg%3E") center / contain no-repeat;
        }
        input, select, textarea {
          width: 100%; border: 1px solid transparent; border-radius: 4px; background: var(--field);
          color: var(--text); padding: 10px 12px; font: inherit; font-size: 14px; line-height: 20px; outline: none;
          transition: border-color .14s ease, background .14s ease;
        }
        input:hover, select:hover, textarea:hover { background: var(--field-hover); }
        input:focus, select:focus, textarea:focus { border-color: var(--accent); }
        textarea { min-height: 92px; resize: vertical; }
        select {
          min-height: 42px; padding-right: 42px; cursor: pointer; appearance: none; -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%23b8bed8' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center; background-size: 16px 16px;
        }
        .api-key-shell { position: relative; }
        .api-key-shell input { padding-right: 42px; }
        .api-key-eye {
          position: absolute; right: 4px; top: 50%; width: 32px; height: 32px; display: grid; place-items: center;
          border: 0; border-radius: 4px; background: transparent; color: var(--muted); padding: 0; transform: translateY(-50%); cursor: pointer;
        }
        .api-key-eye:hover { background: rgba(255,255,255,.06); color: var(--text); }
        .api-key-eye-icon {
          width: 18px; height: 18px; background: currentColor;
          -webkit-mask: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.1 12S5.7 5.8 12 5.8 21.9 12 21.9 12 18.3 18.2 12 18.2 2.1 12 2.1 12zM12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z' fill='black'/%3E%3C/svg%3E") center / contain no-repeat;
          mask: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.1 12S5.7 5.8 12 5.8 21.9 12 21.9 12 18.3 18.2 12 18.2 2.1 12 2.1 12zM12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z' fill='black'/%3E%3C/svg%3E") center / contain no-repeat;
        }
        .switch-row { display: inline-flex; align-items: center; gap: 10px; min-height: 40px; width: 100%; color: var(--text); cursor: pointer; font-size: 14px; font-weight: 600; }
        .switch-row input { appearance: none; flex: 0 0 auto; width: 40px; height: 24px; border: 0; border-radius: 999px; background: var(--background-modifier-accent, #4e5058); cursor: pointer; padding: 0; position: relative; }
        .switch-row input::before { content: ""; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .14s ease; }
        .switch-row input:checked { background: var(--accent); }
        .switch-row input:checked::before { transform: translateX(16px); }
        .prompt-area { padding: 16px 20px; border-bottom: 1px solid var(--border); }
        .prompt-area textarea { min-height: 118px; }
        .attachments-toolbar { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
        .attach-button {
          min-height: 32px; border: 1px solid rgba(88,101,242,.5); border-radius: 3px;
          background: rgba(88,101,242,.18); color: #e1e6ff; padding: 6px 10px;
          cursor: pointer; font: inherit; font-size: 13px; font-weight: 600;
        }
        .attachments-hint { min-width: 0; color: var(--muted); font-size: 12px; line-height: 16px; }
        .file-input { display: none; }
        .attachments-list { display: none; margin-top: 10px; gap: 8px; flex-direction: column; }
        .attachments-list.visible { display: flex; }
        .attachment-item { display: flex; align-items: center; gap: 8px; min-height: 34px; border-radius: 4px; background: var(--field); padding: 6px 8px; }
        .attachment-kind { display: grid; place-items: center; flex: 0 0 auto; width: 22px; height: 22px; border-radius: 4px; background: var(--accent); color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; }
        .attachment-meta { min-width: 0; flex: 1; }
        .attachment-name { overflow: hidden; color: var(--text); font-size: 13px; line-height: 16px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
        .attachment-size { color: var(--muted); font-size: 11px; line-height: 14px; }
        .attachment-remove { display: grid; place-items: center; flex: 0 0 auto; width: 24px; height: 24px; border: 0; border-radius: 4px; background: transparent; color: var(--interactive); cursor: pointer; font-size: 0; }
        .attachment-remove::before { content: "x"; font-size: 14px; line-height: 1; }
        .actions {
          display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px;
          padding: 16px 20px 10px; background: var(--panel-elevated);
        }
        button.action {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          min-height: 38px; min-width: 0; border: 1px solid transparent; border-radius: 3px;
          background: var(--accent); color: white; padding: 8px 14px; cursor: pointer;
          font: inherit; font-size: 14px; font-weight: 600; transition: transform .12s ease, filter .12s ease, background .12s ease;
          white-space: nowrap;
        }
        button.action:hover { filter: brightness(1.07); }
        button.action:active { transform: translateY(1px); }
        button.action.ask { background: linear-gradient(180deg, #6d7cff 0%, var(--accent) 100%); box-shadow: inset 0 1px 0 rgba(255,255,255,.16), 0 8px 18px rgba(88,101,242,.2); }
        button.action.insert { border-color: rgba(88,101,242,.5); background: rgba(88,101,242,.18); color: #e1e6ff; }
        button.action.reply { border-color: rgba(35,165,90,.5); background: rgba(35,165,90,.18); color: #d8f7e6; }
        button.action.copy { border-color: rgba(52,152,219,.5); background: rgba(52,152,219,.18); color: #d7edff; }
        button.action.clear { border-color: rgba(218,55,60,.5); background: rgba(218,55,60,.16); color: #ffd9dc; }
        button.action.insert:hover { background: rgba(88,101,242,.3); }
        button.action.reply:hover { background: rgba(35,165,90,.3); }
        button.action.copy:hover { background: rgba(52,152,219,.3); }
        button.action.clear:hover { background: rgba(218,55,60,.28); }
        .status-row {
          min-height: 36px; display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
          color: var(--muted); font-size: 12px; line-height: 16px; font-weight: 600;
          padding: 0 20px 12px; background: var(--panel-elevated);
        }
        .hint { max-width: 260px; text-align: right; }
        .answer-shell { display: none; border-top: 1px solid var(--border); }
        .answer-shell.visible { display: block; }
        .answer-header { padding: 10px 20px; color: var(--muted); font-size: 12px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid var(--border); }
        .answer { max-height: 260px; overflow: auto; padding: 12px 20px 18px; white-space: pre-wrap; font-size: 14px; line-height: 20px; }
        .meta-footer { padding: 16px 20px; border-top: 1px solid var(--border); background: var(--panel); }
        .source-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
        .source-button, .author-chip {
          display: inline-flex; align-items: center; gap: 8px; min-height: 32px; border: 0; border-radius: 8px;
          background: rgba(0,0,0,.24); color: var(--text); padding: 6px 11px; cursor: pointer; font: inherit; font-size: 13px; font-weight: 700; text-decoration: none;
        }
        .source-icon { width: 16px; height: 16px; background: currentColor; }
        .source-icon.website { -webkit-mask: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='black' d='M8 1.333A6.667 6.667 0 108 14.667 6.667 6.667 0 008 1.333zM3.1 7.333a5.32 5.32 0 011.45-3.06c.35.2.78.37 1.27.5a11.46 11.46 0 00-.42 2.56H3.1zm0 1.334h2.3c.06.94.2 1.8.42 2.56-.49.13-.92.3-1.27.5A5.32 5.32 0 013.1 8.667zm4.23 4.54c-.34-.42-.77-1.17-1.02-2.22.52-.09 1.09-.14 1.69-.14.6 0 1.17.05 1.69.14-.25 1.05-.68 1.8-1.02 2.22-.22.03-.44.04-.67.04s-.45-.01-.67-.04zm2.72-.48c.27-.48.52-1.03.7-1.66.33.1.62.22.86.36a5.36 5.36 0 01-1.56 1.3zM8 9.51c-.72 0-1.4.07-2.02.18a10.03 10.03 0 01-.25-1.02h4.54c-.06.35-.15.69-.25 1.02A11.46 11.46 0 008 9.51zm2.51-2.18H5.49c.05-.76.18-1.45.34-2.06.66.12 1.39.19 2.17.19s1.51-.07 2.17-.19c.16.61.29 1.3.34 2.06zm.24-3.39c-.18-.63-.43-1.18-.7-1.66.6.3 1.13.75 1.56 1.3-.24.14-.53.26-.86.36zm-1.06.08c-.52.09-1.09.14-1.69.14-.6 0-1.17-.05-1.69-.14.25-1.05.68-1.8 1.02-2.22.22-.03.44-.04.67-.04s.45.01.67.04c.34.42.77 1.17 1.02 2.22zM5.95 2.28c-.27.48-.52 1.03-.7 1.66-.33-.1-.62-.22-.86-.36.43-.55.96-1 1.56-1.3zm4.23 8.95c.22-.76.36-1.62.42-2.56h2.3a5.32 5.32 0 01-1.45 3.06 4.5 4.5 0 00-1.27-.5zm.42-3.9a11.46 11.46 0 00-.42-2.56c.49-.13.92-.3 1.27-.5a5.32 5.32 0 011.45 3.06h-2.3z'/%3E%3C/svg%3E") center / contain no-repeat; mask: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='black' d='M8 1.333A6.667 6.667 0 108 14.667 6.667 6.667 0 008 1.333zM3.1 7.333a5.32 5.32 0 011.45-3.06c.35.2.78.37 1.27.5a11.46 11.46 0 00-.42 2.56H3.1zm0 1.334h2.3c.06.94.2 1.8.42 2.56-.49.13-.92.3-1.27.5A5.32 5.32 0 013.1 8.667zm4.23 4.54c-.34-.42-.77-1.17-1.02-2.22.52-.09 1.09-.14 1.69-.14.6 0 1.17.05 1.69.14-.25 1.05-.68 1.8-1.02 2.22-.22.03-.44.04-.67.04s-.45-.01-.67-.04zm2.72-.48c.27-.48.52-1.03.7-1.66.33.1.62.22.86.36a5.36 5.36 0 01-1.56 1.3zM8 9.51c-.72 0-1.4.07-2.02.18a10.03 10.03 0 01-.25-1.02h4.54c-.06.35-.15.69-.25 1.02A11.46 11.46 0 008 9.51zm2.51-2.18H5.49c.05-.76.18-1.45.34-2.06.66.12 1.39.19 2.17.19s1.51-.07 2.17-.19c.16.61.29 1.3.34 2.06zm.24-3.39c-.18-.63-.43-1.18-.7-1.66.6.3 1.13.75 1.56 1.3-.24.14-.53.26-.86.36zm-1.06.08c-.52.09-1.09.14-1.69.14-.6 0-1.17-.05-1.69-.14.25-1.05.68-1.8 1.02-2.22.22-.03.44-.04.67-.04s.45.01.67.04c.34.42.77 1.17 1.02 2.22zM5.95 2.28c-.27.48-.52 1.03-.7 1.66-.33-.1-.62-.22-.86-.36.43-.55.96-1 1.56-1.3zm4.23 8.95c.22-.76.36-1.62.42-2.56h2.3a5.32 5.32 0 01-1.45 3.06 4.5 4.5 0 00-1.27-.5zm.42-3.9a11.46 11.46 0 00-.42-2.56c.49-.13.92-.3 1.27-.5a5.32 5.32 0 011.45 3.06h-2.3z'/%3E%3C/svg%3E") center / contain no-repeat; }
        .source-icon.github { -webkit-mask: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='black' d='M8 .8a7.2 7.2 0 00-2.28 14.03c.36.07.49-.16.49-.35v-1.25c-2 .43-2.42-.86-2.42-.86-.33-.84-.8-1.06-.8-1.06-.66-.45.05-.44.05-.44.73.05 1.11.75 1.11.75.65 1.1 1.7.78 2.11.6.07-.47.26-.78.47-.96-1.6-.18-3.28-.8-3.28-3.56 0-.79.28-1.43.75-1.94-.08-.18-.33-.92.07-1.91 0 0 .61-.2 1.98.74A6.88 6.88 0 018 4.34c.61 0 1.22.08 1.8.24 1.36-.94 1.97-.74 1.97-.74.4.99.15 1.73.07 1.91.47.51.75 1.15.75 1.94 0 2.77-1.69 3.37-3.3 3.55.27.23.5.68.5 1.37v2.03c0 .19.13.42.5.35A7.2 7.2 0 008 .8z'/%3E%3C/svg%3E") center / contain no-repeat; mask: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='black' d='M8 .8a7.2 7.2 0 00-2.28 14.03c.36.07.49-.16.49-.35v-1.25c-2 .43-2.42-.86-2.42-.86-.33-.84-.8-1.06-.8-1.06-.66-.45.05-.44.05-.44.73.05 1.11.75 1.11.75.65 1.1 1.7.78 2.11.6.07-.47.26-.78.47-.96-1.6-.18-3.28-.8-3.28-3.56 0-.79.28-1.43.75-1.94-.08-.18-.33-.92.07-1.91 0 0 .61-.2 1.98.74A6.88 6.88 0 018 4.34c.61 0 1.22.08 1.8.24 1.36-.94 1.97-.74 1.97-.74.4.99.15 1.73.07 1.91.47.51.75 1.15.75 1.94 0 2.77-1.69 3.37-3.3 3.55.27.23.5.68.5 1.37v2.03c0 .19.13.42.5.35A7.2 7.2 0 008 .8z'/%3E%3C/svg%3E") center / contain no-repeat; }
        .authors-title { color: var(--text-strong); font-size: 18px; line-height: 22px; font-weight: 800; margin-bottom: 8px; }
        .author-avatar, .author-avatar img { width: 24px; height: 24px; border-radius: 50%; display: block; }
        @media (max-width: 520px) { .grid, .actions { grid-template-columns: 1fr; } }
      </style>
      <button class="fab" type="button"><span class="magic-wand-icon" aria-hidden="true"></span></button>
      <section class="panel">
        <div class="header">
          <div class="brand"><div class="mark"><span class="magic-wand-icon" aria-hidden="true"></span></div><div><div class="title" data-i18n="title"></div><div class="subtitle" data-i18n="subtitle"></div></div></div>
          <button class="close" type="button">x</button>
        </div>
        <div class="body">
          <div class="group">
            <div class="grid">
              <div class="control">
                <div class="label-with-info"><label data-i18n="language"></label><button class="info-button" type="button" data-info-i18n="infoLanguage"></button></div>
                <select data-setting="locale"><option value="ru">Русский</option><option value="en">English</option></select>
              </div>
              <div class="control">
                <div class="label-with-info"><label data-i18n="provider"></label><button class="info-button" type="button" data-info-i18n="infoProvider"></button></div>
                <select data-setting="provider"><option value="openrouter">OpenRouter</option><option value="openai">OpenAI</option><option value="groq">Groq</option><option value="mistral">Mistral</option><option value="deepseek">DeepSeek</option><option value="custom">Custom</option></select>
              </div>
              <div class="control full">
                <div class="label-with-info"><label data-i18n="model"></label><button class="info-button" type="button" data-info-i18n="infoModel"></button></div>
                <select data-setting="modelPreset"><option value="openrouter/auto">OpenRouter Auto</option><option value="gpt-4o-mini">OpenAI GPT-4o mini</option><option value="gpt-4o">OpenAI GPT-4o</option><option value="llama-3.3-70b-versatile">Groq Llama 3.3 70B</option><option value="mistral-large-latest">Mistral Large Latest</option><option value="deepseek-chat">DeepSeek Chat</option><option value="custom">Custom model ID</option></select>
              </div>
              <div class="control full">
                <div class="label-with-info"><label data-i18n="apiKey"></label><button class="info-button" type="button" data-info-i18n="infoApiKey"></button></div>
                <div class="api-key-shell"><input data-setting="apiKey" type="password" autocomplete="off" spellcheck="false" data-placeholder="apiKeyPlaceholder"><button class="api-key-eye" type="button"><span class="api-key-eye-icon" aria-hidden="true"></span></button></div>
              </div>
              <div class="control full custom-endpoint">
                <div class="label-with-info"><label data-i18n="customEndpoint"></label><button class="info-button" type="button" data-info-i18n="infoCustomEndpoint"></button></div>
                <input data-setting="customEndpoint" data-placeholder="endpointPlaceholder">
              </div>
              <div class="control full custom-model">
                <div class="label-with-info"><label data-i18n="customModel"></label><button class="info-button" type="button" data-info-i18n="infoCustomModel"></button></div>
                <input data-setting="customModel" data-placeholder="customModelPlaceholder">
              </div>
            </div>
          </div>
          <div class="group">
            <div class="group-title" data-i18n="generation"></div>
            <div class="grid">
              <div class="control full">
                <div class="label-with-info"><label data-i18n="systemPrompt"></label><button class="info-button" type="button" data-info-i18n="infoSystemPrompt"></button></div>
                <textarea data-setting="systemPrompt" data-placeholder="systemPromptPlaceholder"></textarea>
              </div>
              <div class="control">
                <div class="label-with-info"><label data-i18n="temperature"></label><button class="info-button" type="button" data-info-i18n="infoTemperature"></button></div>
                <input data-setting="temperature" type="number" min="0" max="2" step="0.1">
              </div>
              <div class="control">
                <div class="label-with-info"><label data-i18n="contextMessages"></label><button class="info-button" type="button" data-info-i18n="infoContextMessages"></button></div>
                <input data-setting="contextMessages" type="number" min="0" max="50" step="1">
              </div>
              <div class="control">
                <div class="label-with-info"><label data-i18n="maxTokens"></label><button class="info-button" type="button" data-info-i18n="infoMaxTokens"></button></div>
                <input data-setting="maxTokens" type="number" min="1" max="8192" step="1">
              </div>
              <div class="control full">
                <div class="label-with-info"><label data-i18n="memory"></label><button class="info-button" type="button" data-info-i18n="infoMemory"></button></div>
                <label class="switch-row"><input data-setting="memoryEnabled" type="checkbox"><span data-i18n="memoryEnabledText"></span></label>
              </div>
            </div>
          </div>
          <div class="prompt-area">
            <div class="label-with-info"><label data-i18n="prompt"></label><button class="info-button" type="button" data-info-i18n="infoPrompt"></button></div>
            <textarea class="prompt" data-placeholder="promptPlaceholder"></textarea>
            <div class="attachments-toolbar">
              <button class="attach-button" type="button" data-i18n="attachFiles"></button>
              <div class="attachments-hint" data-i18n="attachmentsHint"></div>
              <input class="file-input" type="file" multiple>
            </div>
            <div class="attachments-list"></div>
          </div>
          <div class="actions"><button class="action ask" data-i18n="ask"></button><button class="action secondary insert" data-i18n="insert"></button><button class="action secondary reply" data-i18n="reply"></button><button class="action secondary copy" data-i18n="copy"></button><button class="action danger clear" data-i18n="clear"></button></div>
          <div class="status-row"><span class="status"></span><span class="hint" data-i18n="hotkey"></span></div>
          <div class="answer-shell"><div class="answer-header" data-i18n="answer"></div><div class="answer"></div></div>
          <div class="meta-footer">
            <div class="source-actions">
              <button class="source-button" type="button" data-open-url="https://equicord.org"><span class="source-icon website" aria-hidden="true"></span><span data-i18n="website"></span></button>
              <button class="source-button" type="button" data-open-url="https://github.com/ress1zen/EquicordAIAssistant"><span class="source-icon github" aria-hidden="true"></span><span data-i18n="sourceCode"></span></button>
            </div>
            <div class="authors-block">
              <div class="authors-title" data-i18n="authors"></div>
              <a class="author-chip" href="https://github.com/ress1zen" target="_blank" rel="noopener noreferrer"><span class="author-avatar"><img src="https://github.com/ress1zen.png?size=96" alt="ress1zen"></span><span>ress1zen</span></a>
            </div>
          </div>
        </div>
      </section>
    `;

    shadow.querySelectorAll(".magic-wand-icon").forEach(icon => {
        const element = icon as HTMLElement;
        element.style.webkitMaskImage = `url("${magicWandIconDataUri}")`;
        element.style.maskImage = `url("${magicWandIconDataUri}")`;
    });

    const panel = shadow.querySelector(".panel") as HTMLElement;
    const prompt = shadow.querySelector(".prompt") as HTMLTextAreaElement;
    const answer = shadow.querySelector(".answer") as HTMLElement;
    const status = shadow.querySelector(".status") as HTMLElement;
    const fileInput = shadow.querySelector(".file-input") as HTMLInputElement;
    const attachmentsList = shadow.querySelector(".attachments-list") as HTMLElement;
    const attachments: FloatingAttachment[] = [];

    const refreshAttachments = () => renderAttachments(attachmentsList, attachments, index => {
        attachments.splice(index, 1);
        refreshAttachments();
        status.textContent = t("attachmentRemoved");
    });

    const addFiles = async (files: FileList | File[]) => {
        const acceptedFiles = Array.from(files).filter(file => file.size <= 8 * 1024 * 1024);
        if (!acceptedFiles.length) return;

        for (const file of acceptedFiles) {
            try {
                attachments.push(await fileToAttachment(file));
            } catch (error) {
                logger.warn("Could not read attachment", error);
            }
        }

        refreshAttachments();
        status.textContent = t("attached").replace("{count}", String(attachments.length));
    };

    shadow.querySelector(".fab")?.addEventListener("click", () => panel.classList.toggle("open"));
    shadow.querySelector(".close")?.addEventListener("click", () => panel.classList.remove("open"));
    shadow.querySelector(".api-key-eye")?.addEventListener("click", () => {
        const input = shadow.querySelector("[data-setting='apiKey']") as HTMLInputElement;
        input.type = input.type === "password" ? "text" : "password";
        syncFloatingForm(shadow);
    });
    shadow.querySelector(".attach-button")?.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
        if (fileInput.files) void addFiles(fileInput.files);
        fileInput.value = "";
    });
    prompt.addEventListener("paste", event => {
        const files = event.clipboardData?.files;
        if (files?.length) void addFiles(files);
    });
    panel.addEventListener("dragover", event => {
        event.preventDefault();
        panel.classList.add("dragging");
    });
    panel.addEventListener("dragleave", () => panel.classList.remove("dragging"));
    panel.addEventListener("drop", event => {
        event.preventDefault();
        panel.classList.remove("dragging");
        if (event.dataTransfer?.files?.length) void addFiles(event.dataTransfer.files);
    });
    shadow.querySelectorAll("[data-open-url]").forEach(button => {
        button.addEventListener("click", () => {
            const url = (button as HTMLElement).dataset.openUrl;
            if (url) window.open(url, "_blank", "noopener,noreferrer");
        });
    });
    shadow.querySelectorAll("[data-setting]").forEach(input => {
        input.addEventListener("input", () => writeFloatingSettings(shadow));
        input.addEventListener("change", () => writeFloatingSettings(shadow));
    });
    prompt.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            (shadow.querySelector(".ask") as HTMLButtonElement).click();
        }
    });
    shadow.querySelector(".ask")?.addEventListener("click", async () => {
        writeFloatingSettings(shadow);
        const channelId = SelectedChannelStore.getChannelId();
        const text = prompt.value.trim();
        if (!channelId) {
            status.textContent = t("missingChat");
            return;
        }
        if (!text) {
            status.textContent = t("emptyPrompt");
            return;
        }
        if (!settings.store.apiKey.trim()) {
            status.textContent = t("missingKey");
            return;
        }
        status.textContent = t("thinking");
        renderFloatingAnswer(answer, "");
        const result = await requestAssistant(text, channelId, attachments);
        if (result) {
            rememberExchange(text, result);
            renderFloatingAnswer(answer, result);
            prompt.value = "";
            attachments.splice(0, attachments.length);
            refreshAttachments();
            status.textContent = t("done");
        }
    });
    shadow.querySelector(".insert")?.addEventListener("click", () => {
        const text = answer.textContent?.trim() || "";
        if (!text) return;
        insertTextIntoChatInputBox(text);
        status.textContent = t("inserted");
    });
    shadow.querySelector(".reply")?.addEventListener("click", () => {
        const text = answer.textContent?.trim() || "";
        const channelId = SelectedChannelStore.getChannelId();
        if (!channelId) {
            status.textContent = t("missingChat");
            return;
        }
        if (!text) return;
        insertTextIntoChatInputBox(text);
        status.textContent = t("inserted");
    });
    shadow.querySelector(".copy")?.addEventListener("click", async () => {
        await navigator.clipboard.writeText(answer.textContent?.trim() || "");
        status.textContent = t("copied");
    });
    shadow.querySelector(".clear")?.addEventListener("click", () => {
        prompt.value = "";
        attachments.splice(0, attachments.length);
        refreshAttachments();
        renderFloatingAnswer(answer, "");
        status.textContent = t("ready");
    });

    syncFloatingForm(shadow);
    status.textContent = t("ready");
    document.documentElement.appendChild(floatingRoot);
}

function stopFloatingAssistant() {
    floatingRoot?.remove();
    floatingRoot = null;
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
            icon={AssistantIcon}
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
        icon: AssistantIcon,
        render(message: Message) {
            const text = messageToText(message);
            if (!text) return null;

            return {
                label: currentLocale() === Locales.English ? "Answer With AI" : "Ответить с AI",
                icon: AssistantIcon,
                message,
                channel: ChannelStore.getChannel(message.channel_id),
                onClick: () => runMessageAction(message.channel_id, text, "answer"),
            };
        },
    },
    start: startFloatingAssistant,
    stop: stopFloatingAssistant,
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
