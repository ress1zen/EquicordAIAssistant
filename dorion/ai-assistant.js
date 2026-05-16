(function () {
  const pluginId = "dorion-ai-assistant";
  const storageKey = "dorion-ai-assistant-settings";
  const apiKeyStorageKey = `${storageKey}:api-key`;
  const memoryStorageKey = `${storageKey}:memory`;

  if (window.DorionAIAssistant?.destroy) {
    window.DorionAIAssistant.destroy();
  }

  const providers = {
    openrouter: "https://openrouter.ai/api/v1/chat/completions",
    openai: "https://api.openai.com/v1/chat/completions",
    groq: "https://api.groq.com/openai/v1/chat/completions",
    mistral: "https://api.mistral.ai/v1/chat/completions",
    deepseek: "https://api.deepseek.com/chat/completions"
  };

  const magicWandIconDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACeklEQVR4AdSWDW6jMBCF30TZe6Q3aU5SkDaVeoq2p1hpsxLkJMlNkns0u7Mzw58NNjiQqqqFYWzseR9jY3uFL07fB4CLX5vPCFZ6BGh95vJPcW+IJAAufme18GP9vNtjEoAP+1fQ6rVS5I1GgYv93UBGAbjcMxhvADvjzxkIRwVBJOl80Rx57VVHAcwBQcQRSHQB8yHwAhYdmS+gH0eLXqiRUxcFoPzlQk+7d/D1AaASTWJsKfv5QPnu1FQ1z0ocx6rMGzBlUxBRgMoJoCDd11IZEoYkX1wq7KohRubMJID6MVEdjkjYtY0/T6qa7n69dLZvJQFoFx0OA9FCMP89QSG9d6RzJbcoevVdIRmg69JZOlHlTznKH3EG1hv8ux46iEZ8OFc6D8DKLdxiqzhoXUgfWRNkrInEriGYc/DHdjxi0lOuWQC+uHixq4Og/Fkm60t03K15fbsZoBaXkEO+HL0kEL2aqeJNAI542C8jKexu52SAzxBXkCSAueLaT7MKxfIkgDnQtT3mYSzssh9Ac6yv1I8CLBG3pdl2Ud5UtqgFrijAEnHTIXqyp95cW8tODgIsEde+1Q7ImaPzKKtlEYrEAEAdYOaYi8jZ+jLe4CWWAw1nqA4yZ9Oo33sA9mKuuJ2aOWn1czcnD8Doa7LBgzG6yKhTynZbO8AMdkXxpnVyuCE5zEipvVoA+/q2umdMiLutDURPUu4pSuxqOx/uDy2AdpSTT+46M/sGcWvf3PjjvTHF76G1e0YLoPW6i0njDmKuuDizDwJOkDy2LXsA0ljOgM+ljaOOV+DgqW2SM19z0nkx0mEAoG2VXrPaS3KKjyDAEtF+36nyfwAAAP//MnqKugAAAAZJREFUAwAePjBQnHzkXwAAAABJRU5ErkJggg==";
  const authorLogin = "ress1zen";
  const authorProfileUrl = `https://github.com/${authorLogin}`;
  const authorApiUrl = `https://api.github.com/users/${authorLogin}`;
  const authorAvatarUrl = `https://github.com/${authorLogin}.png?size=96`;

  const defaultLocale = /^ru\b/i.test(navigator.language || "") ? "ru" : "en";

  const defaults = {
    locale: defaultLocale,
    provider: "openrouter",
    apiKey: "",
    modelPreset: "openrouter/auto",
    customModel: "",
    customEndpoint: "",
    systemPrompt: "You are a helpful Discord assistant. Be useful, concise, and practical.",
    contextMessages: 8,
    memoryEnabled: true,
    temperature: 0.7,
    maxTokens: 900
  };

  const strings = {
    en: {
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
      contextMessages: "Context messages",
      temperature: "Temperature",
      maxTokens: "Max tokens",
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
      copied: "Copied.",
      inserted: "Inserted into chat box.",
      insertedAsReply: "Inserted as a reply.",
      missingKey: "API key is missing.",
      emptyPrompt: "Prompt is empty.",
      missingProvider: "Provider endpoint or model is missing.",
      emptyResponse: "Empty response.",
      requestFailed: "Request failed. Check DevTools console.",
      chatMissing: "Discord chat box was not found. Click a channel input first.",
      noReplyTarget: "Reply target was not found. Hover the message and try again.",
      noAnswerToInsert: "There is no answer to insert yet.",
      noAnswerToCopy: "There is no answer to copy yet.",
      quickAnswer: "Answer",
      quickReply: "Answer + Reply",
      quickExplain: "Explain",
      quickRewrite: "Rewrite",
      quickShorten: "Shorten",
      quickTranslate: "Translate",
      hotkey: "Hotkey: Ctrl+Shift+Y. Select text before opening to use it as a prompt.",
      openTitle: "Open AI Assistant",
      closeTitle: "Close",
      showApiKey: "Show API key",
      hideApiKey: "Hide API key",
      apiKeyPlaceholder: "Paste your API key",
      endpointPlaceholder: "https://example.com/v1/chat/completions",
      customModelPlaceholder: "openrouter/auto",
      promptPlaceholder: "Ask anything...",
      systemPromptPlaceholder: "Assistant behavior and response style"
    },
    ru: {
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
      contextMessages: "Сообщений контекста",
      temperature: "Температура",
      maxTokens: "Макс. токенов",
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
      copied: "Скопировано.",
      inserted: "Вставлено в поле ввода.",
      insertedAsReply: "Вставлено как ответ.",
      missingKey: "Не указан API-ключ.",
      emptyPrompt: "Запрос пустой.",
      missingProvider: "Не указан endpoint провайдера или модель.",
      emptyResponse: "Пустой ответ.",
      requestFailed: "Запрос не прошел. Проверь DevTools console.",
      chatMissing: "Поле ввода Discord не найдено. Сначала кликни в поле сообщения.",
      noReplyTarget: "Не нашел сообщение для ответа. Наведи на сообщение и попробуй снова.",
      noAnswerToInsert: "Пока нечего вставлять.",
      noAnswerToCopy: "Пока нечего копировать.",
      quickAnswer: "Ответить",
      quickReply: "Ответить в чат",
      quickExplain: "Объяснить",
      quickRewrite: "Переписать",
      quickShorten: "Сократить",
      quickTranslate: "Перевести",
      hotkey: "Горячая клавиша: Ctrl+Shift+Y. Выделенный текст подставится в запрос.",
      openTitle: "Открыть AI-ассистента",
      closeTitle: "Закрыть",
      showApiKey: "Показать API-ключ",
      hideApiKey: "Скрыть API-ключ",
      apiKeyPlaceholder: "Вставь API-ключ",
      endpointPlaceholder: "https://example.com/v1/chat/completions",
      customModelPlaceholder: "openrouter/auto",
      promptPlaceholder: "Спроси что угодно...",
      systemPromptPlaceholder: "Поведение ассистента и стиль ответа"
    }
  };

  Object.assign(strings.en, {
    website: "Website",
    sourceCode: "Source Code",
    authors: "Authors"
  });

  Object.assign(strings.ru, {
    website: "Сайт",
    sourceCode: "Исходный код",
    authors: "Авторы"
  });

  Object.assign(strings.en, {
    actionBlocked: "This action is blocked for safety. I will not leave servers or perform destructive bulk actions.",
    actionCancelled: "Action cancelled.",
    actionDraftInserted: "Draft inserted. Press Enter yourself if you want to send it.",
    actionNickConfirm: "Change your nickname on this server to \"{nick}\"?",
    actionNickChanged: "Nickname changed to \"{nick}\".",
    actionNoGuild: "Open a server first. Nicknames can only be changed inside a server.",
    actionUnavailable: "I could not access the required Discord action.",
    actionUserNotFound: "User \"{user}\" was not found in cached Discord users. I inserted the draft in the current chat.",
    actionOpeningDm: "Opening DM and inserting draft...",
    actionChannelNotFound: "Chat or channel \"{target}\" was not found.",
    actionSendConfirm: "Send this message to {target}?\n\n{message}",
    actionSent: "Message sent to {target}.",
    actionSendFailed: "Could not send the message. Check permissions or open the chat manually."
  });

  Object.assign(strings.en, {
    attachFiles: "Attach files",
    attachmentsHint: "Attach, drag, or paste images/files here.",
    attachmentOnlyPrompt: "Analyze the attached file or image.",
    attachmentAdded: "{count} file(s) attached.",
    attachmentRemoved: "Attachment removed.",
    attachmentTooLarge: "\"{name}\" is too large.",
    attachmentTextTruncated: "\"{name}\" was truncated to keep the request small.",
    attachmentUnsupported: "\"{name}\" was attached as metadata only.",
    attachmentReadFailed: "Could not read \"{name}\".",
    removeAttachment: "Remove attachment",
    infoLanguage: "Changes the assistant UI language and the language the AI should answer in.",
    infoProvider: "Selects which API service will receive requests.",
    infoModel: "Selects the exact model. Use a vision-capable model if you attach images.",
    infoApiKey: "Your provider API key. It is stored locally in this client.",
    infoCustomEndpoint: "OpenAI-compatible chat completions URL for a custom provider.",
    infoCustomModel: "Custom model name or ID sent to the selected endpoint.",
    infoSystemPrompt: "Base instruction that defines the assistant's behavior and tone.",
    infoTemperature: "Controls randomness. Lower is stricter, higher is more creative.",
    infoContextMessages: "How many recent Discord messages are used for toolbar actions.",
    infoMaxTokens: "Maximum response length. Higher values allow longer answers.",
    infoPrompt: "Your question, command, or instruction for the assistant."
  });

  Object.assign(strings.ru, {
    actionBlocked: "Это действие заблокировано для безопасности. Я не буду выходить из серверов или выполнять массовые опасные действия.",
    actionCancelled: "Действие отменено.",
    actionDraftInserted: "Черновик вставлен. Нажми Enter сам, если хочешь отправить.",
    actionNickConfirm: "Изменить твой ник на этом сервере на «{nick}»?",
    actionNickChanged: "Ник изменён на «{nick}».",
    actionNoGuild: "Сначала открой сервер. Ник можно менять только внутри сервера.",
    actionUnavailable: "Не получилось получить доступ к нужному действию Discord.",
    actionUserNotFound: "Пользователь «{user}» не найден в кэше Discord. Черновик вставлен в текущий чат.",
    actionOpeningDm: "Открываю личку и вставляю черновик...",
    actionChannelNotFound: "Чат или канал «{target}» не найден.",
    actionSendConfirm: "Отправить это сообщение в {target}?\n\n{message}",
    actionSent: "Сообщение отправлено в {target}.",
    actionSendFailed: "Не получилось отправить сообщение. Проверь права или открой чат вручную."
  });

  Object.assign(strings.ru, {
    attachFiles: "Прикрепить файлы",
    attachmentsHint: "Прикрепи, перетащи или вставь фото/файлы сюда.",
    attachmentOnlyPrompt: "Проанализируй прикреплённый файл или изображение.",
    attachmentAdded: "Прикреплено файлов: {count}.",
    attachmentRemoved: "Вложение удалено.",
    attachmentTooLarge: "«{name}» слишком большой.",
    attachmentTextTruncated: "«{name}» был обрезан, чтобы запрос не стал слишком большим.",
    attachmentUnsupported: "«{name}» прикреплён только как метаданные.",
    attachmentReadFailed: "Не получилось прочитать «{name}».",
    removeAttachment: "Удалить вложение",
    infoLanguage: "Меняет язык меню ассистента и язык, на котором ИИ должен отвечать.",
    infoProvider: "Выбирает API-сервис, куда будут отправляться запросы.",
    infoModel: "Выбирает конкретную модель. Для фото нужна модель с поддержкой vision.",
    infoApiKey: "API-ключ выбранного провайдера. Хранится локально в этом клиенте.",
    infoCustomEndpoint: "OpenAI-compatible URL chat completions для своего провайдера.",
    infoCustomModel: "Своё имя или ID модели, которое отправляется в endpoint.",
    infoSystemPrompt: "Базовая инструкция, которая задаёт поведение и тон ассистента.",
    infoTemperature: "Отвечает за случайность. Ниже — строже, выше — креативнее.",
    infoContextMessages: "Сколько последних сообщений Discord брать для кнопки в тулбаре.",
    infoMaxTokens: "Максимальная длина ответа. Больше значение — длиннее ответ.",
    infoPrompt: "Твой вопрос, команда или инструкция для ассистента."
  });

  Object.assign(strings.en, {
    memory: "Memory",
    memoryEnabledText: "Remember previous assistant requests",
    infoMemory: "Stores recent prompts and answers locally, then uses them as context for future requests.",
    scrollToAnswer: "Scroll to answer"
  });

  Object.assign(strings.ru, {
    memory: "Память",
    memoryEnabledText: "Запоминать предыдущие запросы",
    infoMemory: "Хранит последние запросы и ответы локально, потом использует их как контекст для следующих запросов.",
    scrollToAnswer: "К ответу"
  });

  function readSettings() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
      const storedApiKey = localStorage.getItem(apiKeyStorageKey);
      if (!stored.apiKey && storedApiKey) stored.apiKey = storedApiKey;
      return { ...defaults, ...stored };
    } catch {
      return { ...defaults };
    }
  }

  function writeSettings(next) {
    localStorage.setItem(storageKey, JSON.stringify(next));
    if (typeof next.apiKey === "string") {
      localStorage.setItem(apiKeyStorageKey, next.apiKey);
    }
  }

  let settings = readSettings();

  const root = document.createElement("div");
  root.id = pluginId;
  const shadow = root.attachShadow({ mode: "open" });

  shadow.innerHTML = `
    <style>
      @font-face {
        font-family: "SF Pro Display";
        src: url("https://Cinnab0nBak3ry.github.io/AppleFontsCSS/SanFrancisco/SF-Pro-Display-Regular.woff2") format("woff2");
        font-weight: 400;
        font-style: normal;
      }

      @font-face {
        font-family: "SF Pro Display";
        src: url("https://Cinnab0nBak3ry.github.io/AppleFontsCSS/SanFrancisco/SF-Pro-Display-Semibold.woff2") format("woff2");
        font-weight: 600;
        font-style: normal;
      }

      @font-face {
        font-family: "SF Pro Display";
        src: url("https://Cinnab0nBak3ry.github.io/AppleFontsCSS/SanFrancisco/SF-Pro-Display-Bold.woff2") format("woff2");
        font-weight: 700;
        font-style: normal;
      }

      @font-face {
        font-family: "SF Pro Text";
        src: url("https://Cinnab0nBak3ry.github.io/AppleFontsCSS/SanFrancisco/SF-Pro-Text-Regular.woff2") format("woff2");
        font-weight: 400;
        font-style: normal;
      }

      @font-face {
        font-family: "SF Pro Text";
        src: url("https://Cinnab0nBak3ry.github.io/AppleFontsCSS/SanFrancisco/SF-Pro-Text-Semibold.woff2") format("woff2");
        font-weight: 600;
        font-style: normal;
      }

      :host {
        --bg: var(--modal-background, var(--background-primary, #313338));
        --panel: var(--modal-background, #313338);
        --panel-elevated: var(--modal-footer-background, var(--background-secondary, #2b2d31));
        --field: var(--input-background, #1e1f22);
        --field-hover: var(--background-modifier-hover, #232428);
        --border: var(--background-modifier-accent, rgba(78, 80, 88, .48));
        --border-strong: rgba(128, 132, 142, .5);
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
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 2147483647;
        width: 48px;
        height: 48px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,.14);
        background: var(--accent);
        color: white;
        display: grid;
        place-items: center;
        padding: 0;
        font: inherit;
        font-size: 15px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 16px 42px rgba(0,0,0,.42);
        transition: transform .16s ease, filter .16s ease, box-shadow .16s ease;
      }

      .magic-wand-icon {
        display: block;
        width: 28px;
        height: 28px;
        background: #b8bed8;
        -webkit-mask-repeat: no-repeat;
        mask-repeat: no-repeat;
        -webkit-mask-position: center;
        mask-position: center;
        -webkit-mask-size: contain;
        mask-size: contain;
        pointer-events: none;
      }

      .mark .magic-wand-icon {
        width: 20px;
        height: 20px;
      }

      .fab:hover {
        transform: translateY(-2px);
        filter: brightness(1.06);
        box-shadow: 0 20px 52px rgba(0,0,0,.5);
      }

      .panel {
        position: fixed;
        right: 18px;
        bottom: 78px;
        z-index: 2147483647;
        width: min(520px, calc(100vw - 28px));
        max-height: min(780px, calc(100vh - 100px));
        display: none;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid rgba(0, 0, 0, .28);
        border-radius: 8px;
        background: var(--panel);
        color: var(--text);
        box-shadow: var(--elevation-high, 0 18px 48px rgba(0,0,0,.52));
      }

      .panel.open {
        display: flex;
        animation: panel-in .16s ease-out;
      }

      @keyframes panel-in {
        from { opacity: 0; transform: translateY(8px) scale(.985); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border);
        background: var(--panel);
      }

      .brand {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .mark {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: var(--accent);
        color: white;
        font-size: 13px;
        font-weight: 800;
      }

      .title {
        color: var(--text-strong);
        font-size: 20px;
        line-height: 24px;
        font-weight: 700;
      }

      .subtitle {
        margin-top: 2px;
        color: var(--muted);
        font-size: 13px;
        line-height: 18px;
        font-weight: 400;
      }

      .close {
        flex: 0 0 auto;
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: var(--interactive);
        cursor: pointer;
        font-size: 0;
      }

      .close:hover {
        background: var(--background-modifier-hover, rgba(255, 255, 255, .06));
        color: var(--interactive-hover);
      }

      .close::before {
        content: "";
        width: 18px;
        height: 18px;
        background: currentColor;
        -webkit-mask: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13.5 4.5l-9 9M4.5 4.5l9 9' stroke='black' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") center / contain no-repeat;
        mask: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13.5 4.5l-9 9M4.5 4.5l9 9' stroke='black' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") center / contain no-repeat;
      }

      .body {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        padding: 0;
        scrollbar-width: thin;
        scrollbar-color: var(--scrollbar-auto-thumb, #1a1b1e) transparent;
      }

      .body::-webkit-scrollbar,
      .answer::-webkit-scrollbar,
      .ai-code-scroll::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      .body::-webkit-scrollbar-thumb,
      .answer::-webkit-scrollbar-thumb,
      .ai-code-scroll::-webkit-scrollbar-thumb {
        border: 2px solid var(--panel);
        border-radius: 999px;
        background: var(--scrollbar-auto-thumb, #1a1b1e);
      }

      .group {
        padding: 16px 20px;
        border: 0;
        border-bottom: 1px solid var(--border);
        border-radius: 0;
        background: transparent;
      }

      .group + .group,
      .group + .prompt-area,
      .prompt-area + .actions,
      .actions + .status-row,
      .status-row + .answer-shell {
        margin-top: 0;
      }

      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .control.full {
        grid-column: 1 / -1;
      }

      label,
      .group-title {
        display: block;
        color: var(--muted);
        font-size: 12px;
        line-height: 16px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .group-title {
        margin-bottom: 12px;
        color: var(--text-strong);
        font-size: 16px;
        line-height: 20px;
        text-transform: none;
      }

      label {
        margin: 0 0 6px;
      }

      .label-with-info {
        display: flex;
        align-items: center;
        gap: 6px;
        min-height: 16px;
        margin: 0 0 6px;
      }

      .label-with-info label {
        margin: 0;
      }

      .info-button {
        position: relative;
        display: inline-grid;
        place-items: center;
        flex: 0 0 auto;
        width: 16px;
        height: 16px;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--text-muted, #b5bac1);
        cursor: help;
        font: inherit;
        font-size: 11px;
        font-weight: 800;
        line-height: 1;
        padding: 0;
      }

      .info-button::before {
        content: "";
        display: block;
        width: 16px;
        height: 16px;
        background: currentColor;
        -webkit-mask: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='black' d='M8 1.333A6.667 6.667 0 108 14.667 6.667 6.667 0 008 1.333zm0 1.334a5.333 5.333 0 110 10.666A5.333 5.333 0 018 2.667zm-.667 2.666h1.334v4H7.333v-4zm0 5.334h1.334V12H7.333v-1.333z'/%3E%3C/svg%3E") center / contain no-repeat;
        mask: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='black' d='M8 1.333A6.667 6.667 0 108 14.667 6.667 6.667 0 008 1.333zm0 1.334a5.333 5.333 0 110 10.666A5.333 5.333 0 018 2.667zm-.667 2.666h1.334v4H7.333v-4zm0 5.334h1.334V12H7.333v-1.333z'/%3E%3C/svg%3E") center / contain no-repeat;
      }

      .info-button:hover,
      .info-button:focus-visible {
        color: var(--brand-experiment, #5865f2);
        outline: none;
      }

      input, select, textarea {
        width: 100%;
        border: 1px solid transparent;
        border-radius: 4px;
        background: var(--field);
        color: var(--text);
        padding: 10px 12px;
        font: inherit;
        font-size: 14px;
        line-height: 20px;
        outline: none;
        transition: border-color .14s ease, background .14s ease, box-shadow .14s ease;
      }

      .switch-row {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        min-height: 40px;
        width: 100%;
        color: var(--text);
        cursor: pointer;
        font-size: 14px;
        line-height: 20px;
        font-weight: 500;
      }

      .switch-row input {
        appearance: none;
        flex: 0 0 auto;
        width: 40px;
        height: 24px;
        border: 0;
        border-radius: 999px;
        background: var(--background-modifier-accent, #4e5058);
        cursor: pointer;
        padding: 0;
        position: relative;
        transition: background .14s ease;
      }

      .switch-row input::before {
        content: "";
        position: absolute;
        top: 3px;
        left: 3px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
        transition: transform .14s ease;
      }

      .switch-row input:checked {
        background: var(--brand-experiment, #5865f2);
      }

      .switch-row input:checked::before {
        transform: translateX(16px);
      }

      input:hover, select:hover, textarea:hover {
        background-color: var(--field-hover);
      }

      .switch-row input:hover {
        background-color: var(--background-modifier-accent, #4e5058);
      }

      .switch-row input:checked:hover {
        background-color: var(--brand-experiment, #5865f2);
      }

      input:focus, select:focus, textarea:focus {
        border-color: var(--accent);
        box-shadow: none;
      }

      .api-key-shell {
        position: relative;
      }

      .api-key-shell input {
        padding-right: 42px;
      }

      .api-key-eye {
        position: absolute;
        right: 4px;
        top: 50%;
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: var(--muted);
        padding: 0;
        transform: translateY(-50%);
        cursor: pointer;
      }

      .api-key-eye:hover {
        background: rgba(255, 255, 255, .06);
        color: var(--text);
      }

      .api-key-eye-icon {
        width: 18px;
        height: 18px;
        background: currentColor;
        -webkit-mask: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.1 12S5.7 5.8 12 5.8 21.9 12 21.9 12 18.3 18.2 12 18.2 2.1 12 2.1 12zM12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z' fill='black'/%3E%3C/svg%3E") center / contain no-repeat;
        mask: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.1 12S5.7 5.8 12 5.8 21.9 12 21.9 12 18.3 18.2 12 18.2 2.1 12 2.1 12zM12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z' fill='black'/%3E%3C/svg%3E") center / contain no-repeat;
      }

      textarea {
        resize: vertical;
        min-height: 92px;
      }

      select {
        min-height: 42px;
        padding-right: 42px;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        background-color: var(--field);
        background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%23b8bed8' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 14px center;
        background-size: 16px 16px;
      }

      select:hover {
        background-color: var(--field-hover);
      }

      .prompt-area textarea {
        min-height: 118px;
      }

      .prompt-area {
        padding: 16px 20px;
        border-bottom: 1px solid var(--border);
      }

      .prompt-area.dragging {
        background: rgba(88, 101, 242, .08);
      }

      .attachments-toolbar {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
      }

      .attach-button {
        min-height: 32px;
        border: 1px solid rgba(88, 101, 242, .5);
        border-radius: 3px;
        background: rgba(88, 101, 242, .18);
        color: #e1e6ff;
        padding: 6px 10px;
        cursor: pointer;
        font: inherit;
        font-size: 13px;
        font-weight: 600;
      }

      .attach-button:hover {
        border-color: rgba(88, 101, 242, .75);
        background: rgba(88, 101, 242, .28);
      }

      .file-input {
        display: none;
      }

      .attachments-hint {
        min-width: 0;
        color: var(--muted);
        font-size: 12px;
        line-height: 16px;
      }

      .attachments-list {
        display: none;
        margin-top: 10px;
        gap: 8px;
        flex-direction: column;
      }

      .attachments-list.visible {
        display: flex;
      }

      .attachment-item {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 34px;
        border-radius: 4px;
        background: var(--field);
        padding: 6px 8px;
      }

      .attachment-kind {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 22px;
        height: 22px;
        border-radius: 4px;
        background: var(--accent);
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .attachment-meta {
        min-width: 0;
        flex: 1;
      }

      .attachment-name {
        overflow: hidden;
        color: var(--text);
        font-size: 13px;
        line-height: 16px;
        font-weight: 600;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .attachment-size {
        color: var(--muted);
        font-size: 11px;
        line-height: 14px;
      }

      .attachment-remove {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 24px;
        height: 24px;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: var(--interactive);
        cursor: pointer;
        font-size: 0;
      }

      .attachment-remove:hover {
        background: var(--background-modifier-hover, rgba(255, 255, 255, .06));
        color: var(--interactive-hover);
      }

      .attachment-remove::before {
        content: "";
        width: 14px;
        height: 14px;
        background: currentColor;
        -webkit-mask: url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 14 14' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10.5 3.5l-7 7M3.5 3.5l7 7' stroke='black' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E") center / contain no-repeat;
        mask: url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 14 14' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10.5 3.5l-7 7M3.5 3.5l7 7' stroke='black' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E") center / contain no-repeat;
      }

      .actions {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 8px;
        padding: 16px 20px 10px;
        background: var(--panel-elevated);
      }

      button.action {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 38px;
        min-width: 0;
        border: 1px solid transparent;
        border-radius: 3px;
        background: var(--accent);
        color: white;
        padding: 8px 14px;
        cursor: pointer;
        font: inherit;
        font-size: 14px;
        font-weight: 600;
        transition: transform .12s ease, filter .12s ease, background .12s ease;
        white-space: nowrap;
      }

      button.action:hover {
        filter: brightness(1.07);
      }

      button.action:active {
        transform: translateY(1px);
      }

      button.action.ask {
        background: linear-gradient(180deg, #6d7cff 0%, var(--brand-experiment, #5865f2) 100%);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .16), 0 8px 18px rgba(88, 101, 242, .2);
      }

      button.action.insert {
        border-color: rgba(88, 101, 242, .5);
        background: rgba(88, 101, 242, .18);
        color: #e1e6ff;
      }

      button.action.reply {
        border-color: rgba(35, 165, 90, .5);
        background: rgba(35, 165, 90, .18);
        color: #d8f7e6;
      }

      button.action.copy {
        border-color: rgba(52, 152, 219, .5);
        background: rgba(52, 152, 219, .18);
        color: #d7edff;
      }

      button.action.clear {
        border-color: rgba(218, 55, 60, .5);
        background: rgba(218, 55, 60, .16);
        color: #ffd9dc;
      }

      button.action.insert:hover {
        background: rgba(88, 101, 242, .3);
      }

      button.action.reply:hover {
        background: rgba(35, 165, 90, .3);
      }

      button.action.copy:hover {
        background: rgba(52, 152, 219, .3);
      }

      button.action.clear:hover {
        background: rgba(218, 55, 60, .28);
      }

      .status-row {
        min-height: 22px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        color: var(--muted);
        font-size: 12px;
        line-height: 16px;
        font-weight: 600;
        padding: 0 20px 14px;
        background: var(--panel-elevated);
      }

      .hint {
        max-width: 230px;
        text-align: right;
        color: var(--muted);
      }

      .answer-shell {
        display: none;
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: var(--panel);
        margin: 0 20px 18px;
      }

      .answer-shell.visible {
        display: block;
      }

      .answer-header {
        padding: 9px 11px;
        border-bottom: 1px solid var(--border);
        color: var(--muted);
        font-size: 12px;
        line-height: 16px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .answer {
        max-height: none;
        overflow: visible;
        padding: 12px;
        color: var(--text);
        font-size: 14px;
        line-height: 20px;
      }

      .answer p {
        margin: 0 0 10px;
      }

      .answer p:last-child,
      .answer ul:last-child,
      .answer ol:last-child,
      .answer .ai-code-block:last-child {
        margin-bottom: 0;
      }

      .answer strong {
        color: var(--text-strong);
        font-weight: 700;
      }

      .answer em {
        font-style: italic;
      }

      .answer a {
        color: var(--brand);
        text-decoration: none;
      }

      .answer a:hover {
        text-decoration: underline;
      }

      .answer code:not(.answer-code) {
        border: 1px solid var(--border);
        border-radius: 4px;
        background: var(--input);
        color: var(--text-strong);
        font-family: Consolas, "Courier New", monospace;
        font-size: 12px;
        padding: 1px 4px;
      }

      .answer ul,
      .answer ol {
        margin: 0 0 10px;
        padding-left: 22px;
      }

      .answer li {
        margin: 3px 0;
      }

      .answer-heading {
        margin: 12px 0 8px;
        color: var(--text-strong);
        font-size: 15px;
        line-height: 20px;
        font-weight: 700;
      }

      .answer-heading:first-child {
        margin-top: 0;
      }

      .ai-code-block {
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, .08);
        border-radius: 18px;
        background: #101111;
        margin: 12px 0;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .03);
      }

      .ai-code-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 42px;
        padding: 10px 14px 8px 18px;
        color: #f2f3f5;
      }

      .ai-code-title {
        display: inline-flex;
        align-items: center;
        min-width: 0;
        gap: 10px;
        font-size: 14px;
        line-height: 18px;
        font-weight: 600;
      }

      .ai-code-icon {
        width: 18px;
        color: #f2f3f5;
        font-family: Consolas, "Courier New", monospace;
        font-size: 13px;
        font-weight: 700;
        line-height: 18px;
      }

      .ai-code-copy {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: #dbdee1;
        cursor: pointer;
        padding: 0;
      }

      .ai-code-copy:hover {
        background: rgba(255, 255, 255, .08);
        color: #fff;
      }

      .ai-code-copy-icon {
        width: 18px;
        height: 18px;
        background: currentColor;
        -webkit-mask: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='black' d='M6.75 2.25h7.5c.83 0 1.5.67 1.5 1.5v7.5c0 .83-.67 1.5-1.5 1.5h-1.5v1.5c0 .83-.67 1.5-1.5 1.5h-7.5c-.83 0-1.5-.67-1.5-1.5v-7.5c0-.83.67-1.5 1.5-1.5h1.5v-1.5c0-.83.67-1.5 1.5-1.5zm0 1.5v7.5h7.5v-7.5h-7.5zm-3 3v7.5h7.5v-1.5h-4.5c-.83 0-1.5-.67-1.5-1.5v-4.5h-1.5z'/%3E%3C/svg%3E") center / contain no-repeat;
        mask: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='black' d='M6.75 2.25h7.5c.83 0 1.5.67 1.5 1.5v7.5c0 .83-.67 1.5-1.5 1.5h-1.5v1.5c0 .83-.67 1.5-1.5 1.5h-7.5c-.83 0-1.5-.67-1.5-1.5v-7.5c0-.83.67-1.5 1.5-1.5h1.5v-1.5c0-.83.67-1.5 1.5-1.5zm0 1.5v7.5h7.5v-7.5h-7.5zm-3 3v7.5h7.5v-1.5h-4.5c-.83 0-1.5-.67-1.5-1.5v-4.5h-1.5z'/%3E%3C/svg%3E") center / contain no-repeat;
      }

      .ai-code-scroll {
        overflow: auto;
        overscroll-behavior: contain;
        max-height: min(420px, calc(100vh - 260px));
        scrollbar-width: thin;
        scrollbar-color: var(--scrollbar-auto-thumb, #1a1b1e) transparent;
      }

      .ai-code-scroll pre {
        margin: 0;
        padding: 2px 22px 18px;
        min-width: max-content;
      }

      .answer-code {
        display: block;
        color: #f2f3f5;
        font-family: Consolas, "Courier New", monospace;
        font-size: 12px;
        line-height: 20px;
        white-space: pre;
        tab-size: 2;
      }

      .answer-bottom-button {
        position: absolute;
        left: 50%;
        bottom: 14px;
        z-index: 5;
        display: none;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 34px;
        border: 1px solid rgba(255, 255, 255, .08);
        border-radius: 999px;
        background: var(--background-floating, #111214);
        color: var(--text-normal, #dbdee1);
        cursor: pointer;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
        line-height: 16px;
        padding: 8px 12px;
        box-shadow: 0 10px 28px rgba(0, 0, 0, .38);
        transform: translateX(-50%);
      }

      .answer-bottom-button.visible {
        display: inline-flex;
      }

      .answer-bottom-button::before {
        content: "";
        width: 16px;
        height: 16px;
        background: currentColor;
        -webkit-mask: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='black' d='M8 12.25a.9.9 0 01-.64-.26l-4.1-4.1a.9.9 0 111.28-1.28L7.1 9.18V2.8a.9.9 0 111.8 0v6.38l2.56-2.57a.9.9 0 111.28 1.28l-4.1 4.1a.9.9 0 01-.64.26zM3 13.2c0-.5.4-.9.9-.9h8.2a.9.9 0 110 1.8H3.9a.9.9 0 01-.9-.9z'/%3E%3C/svg%3E") center / contain no-repeat;
        mask: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='black' d='M8 12.25a.9.9 0 01-.64-.26l-4.1-4.1a.9.9 0 111.28-1.28L7.1 9.18V2.8a.9.9 0 111.8 0v6.38l2.56-2.57a.9.9 0 111.28 1.28l-4.1 4.1a.9.9 0 01-.64.26zM3 13.2c0-.5.4-.9.9-.9h8.2a.9.9 0 110 1.8H3.9a.9.9 0 01-.9-.9z'/%3E%3C/svg%3E") center / contain no-repeat;
      }

      .answer-bottom-button:hover {
        background: #1e1f22;
        color: var(--text-strong);
      }

      .meta-footer {
        border-top: 1px solid var(--border);
        background: var(--panel-elevated);
        padding: 14px 20px 18px;
      }

      .source-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .source-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 34px;
        border: 1px solid rgba(255, 255, 255, .06);
        border-radius: 8px;
        background: var(--background-floating, #111214);
        color: var(--text-normal, #dbdee1);
        cursor: pointer;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
        line-height: 16px;
        padding: 8px 12px;
        transition: background .12s ease, border-color .12s ease, transform .12s ease;
      }

      .source-button:hover {
        border-color: rgba(88, 101, 242, .45);
        background: #1e1f22;
      }

      .source-button:active {
        transform: translateY(1px);
      }

      .source-icon {
        width: 16px;
        height: 16px;
        background: currentColor;
        flex: 0 0 auto;
      }

      .source-icon.website {
        -webkit-mask: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='8' cy='8' r='6.25' stroke='black' stroke-width='1.5'/%3E%3Cpath d='M1.75 8h12.5M8 1.75c1.9 1.78 2.85 3.86 2.85 6.25S9.9 12.47 8 14.25C6.1 12.47 5.15 10.39 5.15 8S6.1 3.53 8 1.75Z' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat;
        mask: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='8' cy='8' r='6.25' stroke='black' stroke-width='1.5'/%3E%3Cpath d='M1.75 8h12.5M8 1.75c1.9 1.78 2.85 3.86 2.85 6.25S9.9 12.47 8 14.25C6.1 12.47 5.15 10.39 5.15 8S6.1 3.53 8 1.75Z' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat;
      }

      .source-icon.github {
        -webkit-mask: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='black' d='M8 .9a7.1 7.1 0 00-2.24 13.84c.35.06.48-.15.48-.34v-1.22c-1.94.42-2.35-.84-2.35-.84-.32-.8-.78-1.02-.78-1.02-.64-.43.05-.42.05-.42.7.05 1.07.72 1.07.72.63 1.07 1.64.76 2.04.58.06-.45.25-.76.45-.94-1.55-.18-3.18-.78-3.18-3.45 0-.76.27-1.38.72-1.87-.07-.18-.31-.9.07-1.84 0 0 .58-.19 1.92.71A6.6 6.6 0 018 4.57c.6 0 1.18.08 1.74.23 1.33-.9 1.91-.71 1.91-.71.38.94.14 1.66.07 1.84.45.49.72 1.11.72 1.87 0 2.68-1.63 3.27-3.19 3.44.25.22.48.65.48 1.31v1.95c0 .19.13.4.49.34A7.1 7.1 0 008 .9z'/%3E%3C/svg%3E") center / contain no-repeat;
        mask: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='black' d='M8 .9a7.1 7.1 0 00-2.24 13.84c.35.06.48-.15.48-.34v-1.22c-1.94.42-2.35-.84-2.35-.84-.32-.8-.78-1.02-.78-1.02-.64-.43.05-.42.05-.42.7.05 1.07.72 1.07.72.63 1.07 1.64.76 2.04.58.06-.45.25-.76.45-.94-1.55-.18-3.18-.78-3.18-3.45 0-.76.27-1.38.72-1.87-.07-.18-.31-.9.07-1.84 0 0 .58-.19 1.92.71A6.6 6.6 0 018 4.57c.6 0 1.18.08 1.74.23 1.33-.9 1.91-.71 1.91-.71.38.94.14 1.66.07 1.84.45.49.72 1.11.72 1.87 0 2.68-1.63 3.27-3.19 3.44.25.22.48.65.48 1.31v1.95c0 .19.13.4.49.34A7.1 7.1 0 008 .9z'/%3E%3C/svg%3E") center / contain no-repeat;
      }

      .authors-block {
        margin-top: 14px;
      }

      .authors-title {
        color: var(--text-strong);
        font-size: 16px;
        line-height: 20px;
        font-weight: 700;
        margin-bottom: 8px;
      }

      .authors-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .author-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 32px;
        border-radius: 999px;
        background: var(--background-floating, #111214);
        color: var(--text-normal, #dbdee1);
        padding: 4px 10px 4px 4px;
        font-size: 13px;
        font-weight: 700;
        text-decoration: none;
        transition: background .12s ease, color .12s ease;
      }

      .author-chip:hover {
        background: #1e1f22;
        color: var(--text-strong);
      }

      .author-avatar {
        display: grid;
        place-items: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        color: #fff;
        font-size: 11px;
        font-weight: 800;
        background: linear-gradient(135deg, #5865f2, #9b84ff);
        overflow: hidden;
      }

      .author-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      @media (max-width: 520px) {
        .grid,
        .actions {
          grid-template-columns: 1fr;
        }

        .attachments-toolbar {
          align-items: stretch;
          flex-direction: column;
        }

        .hint {
          display: none;
        }
      }
    </style>

    <button class="fab"><span class="magic-wand-icon" aria-hidden="true"></span></button>
    <section class="panel">
      <div class="header">
        <div class="brand">
          <div class="mark"><span class="magic-wand-icon" aria-hidden="true"></span></div>
          <div>
            <div class="title" data-i18n="title"></div>
            <div class="subtitle" data-i18n="subtitle"></div>
          </div>
        </div>
        <button class="close">x</button>
      </div>

      <div class="body">
        <div class="group">
          <div class="grid">
            <div class="control">
              <div class="label-with-info">
                <label data-i18n="language"></label>
                <button class="info-button" type="button" data-info-i18n="infoLanguage"></button>
              </div>
              <select data-setting="locale">
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>
            <div class="control">
              <div class="label-with-info">
                <label data-i18n="provider"></label>
                <button class="info-button" type="button" data-info-i18n="infoProvider"></button>
              </div>
              <select data-setting="provider">
                <option value="openrouter">OpenRouter</option>
                <option value="openai">OpenAI</option>
                <option value="groq">Groq</option>
                <option value="mistral">Mistral</option>
                <option value="deepseek">DeepSeek</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div class="control full">
              <div class="label-with-info">
                <label data-i18n="model"></label>
                <button class="info-button" type="button" data-info-i18n="infoModel"></button>
              </div>
              <select data-setting="modelPreset">
                <option value="openrouter/auto">OpenRouter Auto</option>
                <option value="gpt-4o-mini">OpenAI GPT-4o mini</option>
                <option value="gpt-4o">OpenAI GPT-4o</option>
                <option value="llama-3.3-70b-versatile">Groq Llama 3.3 70B</option>
                <option value="mistral-large-latest">Mistral Large Latest</option>
                <option value="deepseek-chat">DeepSeek Chat</option>
                <option value="custom">Custom model ID</option>
              </select>
            </div>
            <div class="control full">
              <div class="label-with-info">
                <label data-i18n="apiKey"></label>
                <button class="info-button" type="button" data-info-i18n="infoApiKey"></button>
              </div>
              <div class="api-key-shell">
                <input data-setting="apiKey" type="password" autocomplete="off" spellcheck="false" data-placeholder="apiKeyPlaceholder">
                <button class="api-key-eye" type="button">
                  <span class="api-key-eye-icon" aria-hidden="true"></span>
                </button>
              </div>
            </div>
            <div class="control full custom-endpoint">
              <div class="label-with-info">
                <label data-i18n="customEndpoint"></label>
                <button class="info-button" type="button" data-info-i18n="infoCustomEndpoint"></button>
              </div>
              <input data-setting="customEndpoint" data-placeholder="endpointPlaceholder">
            </div>
            <div class="control full custom-model">
              <div class="label-with-info">
                <label data-i18n="customModel"></label>
                <button class="info-button" type="button" data-info-i18n="infoCustomModel"></button>
              </div>
              <input data-setting="customModel" data-placeholder="customModelPlaceholder">
            </div>
          </div>
        </div>

        <div class="group">
          <div class="group-title" data-i18n="generation"></div>
          <div class="grid">
            <div class="control full">
              <div class="label-with-info">
                <label data-i18n="systemPrompt"></label>
                <button class="info-button" type="button" data-info-i18n="infoSystemPrompt"></button>
              </div>
              <textarea data-setting="systemPrompt" data-placeholder="systemPromptPlaceholder"></textarea>
            </div>
            <div class="control">
              <div class="label-with-info">
                <label data-i18n="temperature"></label>
                <button class="info-button" type="button" data-info-i18n="infoTemperature"></button>
              </div>
              <input data-setting="temperature" type="number" min="0" max="2" step="0.1">
            </div>
            <div class="control">
              <div class="label-with-info">
                <label data-i18n="contextMessages"></label>
                <button class="info-button" type="button" data-info-i18n="infoContextMessages"></button>
              </div>
              <input data-setting="contextMessages" type="number" min="0" max="20" step="1">
            </div>
            <div class="control">
              <div class="label-with-info">
                <label data-i18n="maxTokens"></label>
                <button class="info-button" type="button" data-info-i18n="infoMaxTokens"></button>
              </div>
              <input data-setting="maxTokens" type="number" min="1" max="8192" step="1">
            </div>
            <div class="control full">
              <div class="label-with-info">
                <label data-i18n="memory"></label>
                <button class="info-button" type="button" data-info-i18n="infoMemory"></button>
              </div>
              <label class="switch-row">
                <input data-setting="memoryEnabled" type="checkbox">
                <span data-i18n="memoryEnabledText"></span>
              </label>
            </div>
          </div>
        </div>

        <div class="prompt-area">
          <div class="label-with-info">
            <label data-i18n="prompt"></label>
            <button class="info-button" type="button" data-info-i18n="infoPrompt"></button>
          </div>
          <textarea class="prompt" data-placeholder="promptPlaceholder"></textarea>
          <div class="attachments-toolbar">
            <button class="attach-button" type="button" data-i18n="attachFiles"></button>
            <div class="attachments-hint" data-i18n="attachmentsHint"></div>
            <input class="file-input" type="file" multiple>
          </div>
          <div class="attachments-list"></div>
        </div>

        <div class="actions">
          <button class="action ask" data-i18n="ask"></button>
          <button class="action secondary insert" data-i18n="insert"></button>
          <button class="action secondary reply" data-i18n="reply"></button>
          <button class="action secondary copy" data-i18n="copy"></button>
          <button class="action danger clear" data-i18n="clear"></button>
        </div>

        <div class="status-row">
          <div class="status"></div>
          <div class="hint" data-i18n="hotkey"></div>
        </div>

        <div class="answer-shell">
          <div class="answer-header" data-i18n="answer"></div>
          <div class="answer"></div>
        </div>

        <div class="meta-footer">
          <div class="source-actions">
            <button class="source-button" type="button" data-open-url="https://equicord.org">
              <span class="source-icon website" aria-hidden="true"></span>
              <span data-i18n="website"></span>
            </button>
            <button class="source-button" type="button" data-open-url="https://github.com/Equicord/Equicord">
              <span class="source-icon github" aria-hidden="true"></span>
              <span data-i18n="sourceCode"></span>
            </button>
          </div>

          <div class="authors-block">
            <div class="authors-title" data-i18n="authors"></div>
            <div class="authors-list">
              <a class="author-chip" data-author-link href="https://github.com/ress1zen" target="_blank" rel="noopener noreferrer">
                <span class="author-avatar">
                  <img data-author-avatar src="https://github.com/ress1zen.png?size=96" alt="ress1zen">
                </span>
                <span data-author-name>ress1zen</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      <button class="answer-bottom-button" type="button" data-i18n="scrollToAnswer"></button>
    </section>
  `;

  const panel = shadow.querySelector(".panel");
  const body = shadow.querySelector(".body");
  const fab = shadow.querySelector(".fab");
  const close = shadow.querySelector(".close");
  const status = shadow.querySelector(".status");
  const answer = shadow.querySelector(".answer");
  const answerShell = shadow.querySelector(".answer-shell");
  const answerBottomButton = shadow.querySelector(".answer-bottom-button");
  const prompt = shadow.querySelector(".prompt");
  const promptArea = shadow.querySelector(".prompt-area");
  const fileInput = shadow.querySelector(".file-input");
  const attachmentsList = shadow.querySelector(".attachments-list");
  const apiKeyInput = shadow.querySelector('[data-setting="apiKey"]');
  const apiKeyEye = shadow.querySelector(".api-key-eye");
  const authorLink = shadow.querySelector("[data-author-link]");
  const authorAvatar = shadow.querySelector("[data-author-avatar]");
  const authorName = shadow.querySelector("[data-author-name]");
  let lastAnswerText = "";

  shadow.querySelectorAll(".magic-wand-icon").forEach(icon => {
    icon.style.webkitMaskImage = `url("${magicWandIconDataUri}")`;
    icon.style.maskImage = `url("${magicWandIconDataUri}")`;
  });

  function locale() {
    return settings.locale === "en" ? "en" : "ru";
  }

  function t(key) {
    return strings[locale()][key] || strings.en[key] || key;
  }

  function tf(key, values = {}) {
    return t(key).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? "");
  }

  function setAuthorProfile(profile = {}) {
    const login = profile.login || authorLogin;
    const url = profile.html_url || authorProfileUrl;
    const avatarUrl = profile.avatar_url || authorAvatarUrl;

    authorName.textContent = login;
    authorLink.href = url;
    authorAvatar.src = avatarUrl;
    authorAvatar.alt = login;
  }

  async function refreshAuthorProfile() {
    setAuthorProfile();

    try {
      const response = await fetch(authorApiUrl, {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store"
      });

      if (!response.ok) throw new Error(`GitHub profile request failed: ${response.status}`);
      setAuthorProfile(await response.json());
    } catch (error) {
      console.warn("[AI Assistant] Could not refresh author profile", error);
    }
  }

  function setStatus(key) {
    status.textContent = t(key);
  }

  function appendInlineMarkdown(parent, text) {
    const pattern = /(\*\*[\s\S]+?\*\*|__[\s\S]+?__|`[^`\n]+`|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\))/g;
    let index = 0;
    let match;

    while ((match = pattern.exec(text))) {
      if (match.index > index) {
        parent.appendChild(document.createTextNode(text.slice(index, match.index)));
      }

      const token = match[0];
      if (token.startsWith("**") && token.endsWith("**")) {
        const strong = document.createElement("strong");
        strong.textContent = token.slice(2, -2);
        parent.appendChild(strong);
      } else if (token.startsWith("__") && token.endsWith("__")) {
        const strong = document.createElement("strong");
        strong.textContent = token.slice(2, -2);
        parent.appendChild(strong);
      } else if (token.startsWith("`") && token.endsWith("`")) {
        const code = document.createElement("code");
        code.textContent = token.slice(1, -1);
        parent.appendChild(code);
      } else {
        const linkMatch = token.match(/^\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)$/);
        if (linkMatch) {
          const link = document.createElement("a");
          link.href = linkMatch[2];
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = linkMatch[1];
          parent.appendChild(link);
        } else {
          parent.appendChild(document.createTextNode(token));
        }
      }

      index = match.index + token.length;
    }

    if (index < text.length) {
      parent.appendChild(document.createTextNode(text.slice(index)));
    }
  }

  function appendTextWithBreaks(parent, text) {
    text.split("\n").forEach((line, index) => {
      if (index) parent.appendChild(document.createElement("br"));
      appendInlineMarkdown(parent, line);
    });
  }

  function appendMarkdownText(text) {
    text
      .replace(/\r\n/g, "\n")
      .split(/\n{2,}/)
      .forEach(block => {
        const trimmed = block.trim();
        if (!trimmed) return;

        const lines = trimmed.split("\n");
        if (lines.every(line => /^[-*]\s+/.test(line.trim()))) {
          const list = document.createElement("ul");
          lines.forEach(line => {
            const item = document.createElement("li");
            appendTextWithBreaks(item, line.trim().replace(/^[-*]\s+/, ""));
            list.appendChild(item);
          });
          answer.appendChild(list);
          return;
        }

        if (lines.every(line => /^\d+\.\s+/.test(line.trim()))) {
          const list = document.createElement("ol");
          lines.forEach(line => {
            const item = document.createElement("li");
            appendTextWithBreaks(item, line.trim().replace(/^\d+\.\s+/, ""));
            list.appendChild(item);
          });
          answer.appendChild(list);
          return;
        }

        const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
          const title = document.createElement("div");
          title.className = "answer-heading";
          appendInlineMarkdown(title, heading[2]);
          answer.appendChild(title);
          return;
        }

        const paragraph = document.createElement("p");
        appendTextWithBreaks(paragraph, trimmed);
        answer.appendChild(paragraph);
      });
  }

  function formatCodeLanguage(language) {
    const clean = language.trim().replace(/[^\w#+.-]/g, "");
    if (!clean) return "Code";
    const names = {
      js: "JavaScript",
      jsx: "React JSX",
      ts: "TypeScript",
      tsx: "React TSX",
      py: "Python",
      rs: "Rust",
      cs: "C#",
      cpp: "C++",
      csharp: "C#",
      powershell: "PowerShell",
      ps1: "PowerShell",
      sh: "Shell",
      bash: "Bash"
    };
    return names[clean.toLowerCase()] || clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  function createCodeBlock(codeText, language) {
    const block = document.createElement("div");
    block.className = "ai-code-block";

    const header = document.createElement("div");
    header.className = "ai-code-header";

    const title = document.createElement("div");
    title.className = "ai-code-title";

    const icon = document.createElement("span");
    icon.className = "ai-code-icon";
    icon.textContent = "</>";

    const label = document.createElement("span");
    label.textContent = formatCodeLanguage(language);

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "ai-code-copy";
    copy.setAttribute("aria-label", t("copy"));
    copy.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      await navigator.clipboard.writeText(codeText);
      setStatus("copied");
    });

    const copyIcon = document.createElement("span");
    copyIcon.className = "ai-code-copy-icon";
    copy.appendChild(copyIcon);

    const scroller = document.createElement("div");
    scroller.className = "ai-code-scroll";
    scroller.addEventListener("wheel", event => {
      if (scroller.scrollHeight > scroller.clientHeight || scroller.scrollWidth > scroller.clientWidth) {
        event.stopPropagation();
      }
    }, { passive: true });

    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.className = "answer-code";
    code.textContent = codeText;

    title.append(icon, label);
    header.append(title, copy);
    pre.appendChild(code);
    scroller.appendChild(pre);
    block.append(header, scroller);
    return block;
  }

  function renderAnswerMarkdown(text) {
    answer.replaceChildren();

    const normalized = text.replace(/\r\n/g, "\n");
    const codeBlockPattern = /```([^\n`]*)\n?([\s\S]*?)```/g;
    let index = 0;
    let match;

    while ((match = codeBlockPattern.exec(normalized))) {
      if (match.index > index) {
        appendMarkdownText(normalized.slice(index, match.index));
      }

      answer.appendChild(createCodeBlock(match[2].replace(/\n$/, ""), match[1] || ""));
      index = match.index + match[0].length;
    }

    if (index < normalized.length) {
      appendMarkdownText(normalized.slice(index));
    }
  }

  function isBodyNearBottom(distance = 80) {
    return body.scrollHeight - body.scrollTop - body.clientHeight <= distance;
  }

  function updateAnswerBottomButton() {
    const shouldShow = panel.classList.contains("open")
      && answerShell.classList.contains("visible")
      && body.scrollHeight - body.scrollTop - body.clientHeight > 120;

    answerBottomButton.classList.toggle("visible", shouldShow);
  }

  function scrollAnswerToBottom() {
    body.scrollTo({
      top: body.scrollHeight,
      behavior: "smooth"
    });
    window.setTimeout(updateAnswerBottomButton, 180);
  }

  function setAnswer(text) {
    const stickToBottom = isBodyNearBottom();
    lastAnswerText = text;
    renderAnswerMarkdown(text);
    answerShell.classList.toggle("visible", Boolean(text.trim()));
    requestAnimationFrame(() => {
      if (stickToBottom) body.scrollTop = body.scrollHeight;
      updateAnswerBottomButton();
    });
  }

  function clearPromptAndAttachments() {
    prompt.value = "";
    attachments = [];
    renderAttachments();
  }

  function applyLocale() {
    shadow.querySelectorAll("[data-i18n]").forEach(node => {
      node.textContent = t(node.dataset.i18n);
    });

    shadow.querySelectorAll("[data-placeholder]").forEach(input => {
      input.placeholder = t(input.dataset.placeholder);
    });

    shadow.querySelectorAll("[data-info-i18n]").forEach(node => {
      const text = t(node.dataset.infoI18n);
      node.dataset.tooltip = text;
      node.removeAttribute("title");
      node.setAttribute("aria-label", text);
    });

    fab.title = t("openTitle");
    close.title = t("closeTitle");
    updateApiKeyEye();
    panel.setAttribute("aria-label", t("title"));
  }

  function updateApiKeyEye() {
    const key = apiKeyInput.type === "password" ? "showApiKey" : "hideApiKey";
    apiKeyEye.title = t(key);
    apiKeyEye.setAttribute("aria-label", t(key));
  }

  function fillForm() {
    shadow.querySelectorAll("[data-setting]").forEach(input => {
      const value = settings[input.dataset.setting];
      if (input.type === "checkbox") {
        input.checked = Boolean(value);
      } else {
        input.value = value ?? "";
      }
    });

    updateVisibility();
    applyLocale();
    setStatus("ready");
  }

  function updateVisibility() {
    shadow.querySelector(".custom-endpoint").style.display = settings.provider === "custom" ? "block" : "none";
    shadow.querySelector(".custom-model").style.display = settings.modelPreset === "custom" ? "block" : "none";
  }

  function saveForm() {
    shadow.querySelectorAll("[data-setting]").forEach(input => {
      const key = input.dataset.setting;
      if (input.type === "checkbox") {
        settings[key] = input.checked;
      } else {
        settings[key] = input.type === "number" ? Number(input.value) : input.value;
      }
    });

    writeSettings(settings);
    updateVisibility();
    applyLocale();
  }

  let saveFormTimer = 0;
  function saveFormSoon() {
    clearTimeout(saveFormTimer);
    saveFormTimer = window.setTimeout(saveForm, 0);
  }

  function currentApiKey() {
    const fieldValue = apiKeyInput?.value?.trim() || "";
    const settingsValue = settings.apiKey?.trim?.() || "";
    const backupValue = localStorage.getItem(apiKeyStorageKey)?.trim() || "";
    const apiKey = fieldValue || settingsValue || backupValue;

    if (apiKey) {
      settings.apiKey = apiKey;
      if (apiKeyInput && apiKeyInput.value !== apiKey) apiKeyInput.value = apiKey;
      writeSettings(settings);
    }

    return apiKey;
  }

  const maxMemoryMessages = 12;
  const maxMemoryContentChars = 4000;

  function cleanMemoryContent(text) {
    return String(text || "").trim().slice(0, maxMemoryContentChars);
  }

  function readMemory() {
    if (!settings.memoryEnabled) return [];

    try {
      const stored = JSON.parse(localStorage.getItem(memoryStorageKey) || "[]");
      if (!Array.isArray(stored)) return [];

      return stored
        .filter(item => (item?.role === "user" || item?.role === "assistant") && typeof item.content === "string")
        .map(item => ({ role: item.role, content: cleanMemoryContent(item.content) }))
        .filter(item => item.content)
        .slice(-maxMemoryMessages);
    } catch {
      return [];
    }
  }

  function writeMemory(items) {
    try {
      localStorage.setItem(memoryStorageKey, JSON.stringify(items.slice(-maxMemoryMessages)));
    } catch (error) {
      console.warn("[AI Assistant] Could not write memory", error);
    }
  }

  function rememberExchange(userText, assistantText) {
    if (!settings.memoryEnabled) return;

    const userContent = cleanMemoryContent(userText || t("attachmentOnlyPrompt"));
    const assistantContent = cleanMemoryContent(assistantText);
    if (!userContent || !assistantContent) return;

    writeMemory([
      ...readMemory(),
      { role: "user", content: userContent },
      { role: "assistant", content: assistantContent }
    ]);
  }

  function openPanel(prefill) {
    panel.classList.add("open");
    if (prefill) prompt.value = prefill;
    prompt.focus();
    requestAnimationFrame(updateAnswerBottomButton);
  }

  function closePanel() {
    panel.classList.remove("open");
    answerBottomButton.classList.remove("visible");
  }

  function togglePanel(prefill) {
    if (panel.classList.contains("open")) {
      closePanel();
      return;
    }

    openPanel(prefill);
  }

  function endpoint() {
    return settings.provider === "custom" ? settings.customEndpoint.trim() : providers[settings.provider];
  }

  function model() {
    return settings.modelPreset === "custom" ? settings.customModel.trim() : settings.modelPreset.trim();
  }

  const maxAttachments = 8;
  const maxImageBytes = 12 * 1024 * 1024;
  const maxTextBytes = 768 * 1024;
  const maxTextChars = 24000;
  let attachments = [];

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const value = bytes / (1024 ** index);
    return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
  }

  function fileExtension(name) {
    return String(name || "").split(".").pop()?.toLowerCase() || "";
  }

  function isTextLikeFile(file) {
    const type = String(file.type || "").toLowerCase();
    const extension = fileExtension(file.name);
    return type.startsWith("text/")
      || [
        "txt", "md", "markdown", "json", "jsonl", "js", "jsx", "ts", "tsx", "css", "scss",
        "html", "htm", "xml", "svg", "csv", "tsv", "yml", "yaml", "toml", "ini", "log",
        "py", "java", "c", "cpp", "cs", "go", "rs", "php", "rb", "sql", "sh", "bat", "ps1"
      ].includes(extension);
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("File read failed"));
      reader.readAsDataURL(file);
    });
  }

  async function readFileAsText(file) {
    if (typeof file.text === "function") return file.text();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("File read failed"));
      reader.readAsText(file);
    });
  }

  function renderAttachments() {
    attachmentsList.textContent = "";
    attachmentsList.classList.toggle("visible", attachments.length > 0);

    attachments.forEach((attachment, index) => {
      const item = document.createElement("div");
      item.className = "attachment-item";

      const kind = document.createElement("div");
      kind.className = "attachment-kind";
      kind.textContent = attachment.kind === "image" ? "IMG" : attachment.kind === "text" ? "TXT" : "FILE";

      const meta = document.createElement("div");
      meta.className = "attachment-meta";

      const name = document.createElement("div");
      name.className = "attachment-name";
      name.textContent = attachment.name;

      const size = document.createElement("div");
      size.className = "attachment-size";
      size.textContent = `${formatBytes(attachment.size)} · ${attachment.mime || attachment.extension || attachment.kind}`;

      const remove = document.createElement("button");
      remove.className = "attachment-remove";
      remove.type = "button";
      remove.title = t("removeAttachment");
      remove.setAttribute("aria-label", t("removeAttachment"));
      remove.addEventListener("click", () => {
        attachments.splice(index, 1);
        renderAttachments();
        setStatus("attachmentRemoved");
      });

      meta.append(name, size);
      item.append(kind, meta, remove);
      attachmentsList.appendChild(item);
    });
  }

  async function addFiles(files) {
    const incoming = Array.from(files || []).slice(0, Math.max(0, maxAttachments - attachments.length));
    if (!incoming.length) return;

    let added = 0;
    for (const file of incoming) {
      const mime = file.type || "application/octet-stream";
      const extension = fileExtension(file.name);

      try {
        if (mime.startsWith("image/")) {
          if (file.size > maxImageBytes) {
            status.textContent = tf("attachmentTooLarge", { name: file.name });
            continue;
          }

          attachments.push({
            kind: "image",
            name: file.name,
            size: file.size,
            mime,
            extension,
            dataUrl: await readFileAsDataUrl(file)
          });
          added += 1;
          continue;
        }

        if (isTextLikeFile(file)) {
          if (file.size > maxTextBytes) {
            status.textContent = tf("attachmentTooLarge", { name: file.name });
            continue;
          }

          let text = await readFileAsText(file);
          let truncated = false;
          if (text.length > maxTextChars) {
            text = text.slice(0, maxTextChars);
            truncated = true;
          }

          attachments.push({
            kind: "text",
            name: file.name,
            size: file.size,
            mime,
            extension,
            text,
            truncated
          });
          added += 1;
          if (truncated) status.textContent = tf("attachmentTextTruncated", { name: file.name });
          continue;
        }

        attachments.push({
          kind: "file",
          name: file.name,
          size: file.size,
          mime,
          extension
        });
        added += 1;
        status.textContent = tf("attachmentUnsupported", { name: file.name });
      } catch (error) {
        console.error("[Dorion AI Assistant] attachment read failed", error);
        status.textContent = tf("attachmentReadFailed", { name: file.name });
      }
    }

    renderAttachments();
    if (added) status.textContent = tf("attachmentAdded", { count: added });
  }

  function attachmentsContextText(attachedFiles) {
    if (!attachedFiles.length) return "";

    const lines = ["Attached files:"];
    const imageFiles = attachedFiles.filter(file => file.kind === "image");
    const textFiles = attachedFiles.filter(file => file.kind === "text");
    const metadataFiles = attachedFiles.filter(file => file.kind === "file");

    if (imageFiles.length) {
      lines.push("", "Images:");
      imageFiles.forEach(file => lines.push(`- ${file.name} (${file.mime}, ${formatBytes(file.size)})`));
    }

    textFiles.forEach(file => {
      lines.push(
        "",
        `Text file: ${file.name} (${file.mime || file.extension}, ${formatBytes(file.size)})${file.truncated ? " [truncated]" : ""}`,
        "```",
        file.text,
        "```"
      );
    });

    if (metadataFiles.length) {
      lines.push("", "Other files available only as metadata:");
      metadataFiles.forEach(file => lines.push(`- ${file.name} (${file.mime || file.extension}, ${formatBytes(file.size)})`));
    }

    return lines.join("\n");
  }

  function buildUserMessageContent(content, attachedFiles = []) {
    let text = (content || "").trim() || t("attachmentOnlyPrompt");
    const context = attachmentsContextText(attachedFiles);
    if (context) text = `${text}\n\n${context}`;

    const imageParts = attachedFiles
      .filter(file => file.kind === "image" && file.dataUrl)
      .map(file => ({
        type: "image_url",
        image_url: { url: file.dataUrl }
      }));

    if (!imageParts.length) return text;
    return [{ type: "text", text }, ...imageParts];
  }

  function appendReminderToUserMessage(message, reminder) {
    if (Array.isArray(message.content)) {
      const textPart = message.content.find(part => part?.type === "text");
      if (textPart) {
        textPart.text = `${textPart.text || ""}\n\n${reminder}`.trim();
      } else {
        message.content.unshift({ type: "text", text: reminder });
      }
      return;
    }

    message.content = `${message.content || ""}\n\n${reminder}`.trim();
  }

  function responseLanguageInstruction() {
    return locale() === "ru"
      ? "ВАЖНО: отвечай строго на русском языке. Даже если вопрос сложный, технический или содержит английские термины, основной ответ должен быть на русском. Не переходи на английский, если пользователь явно не попросил перевод на английский."
      : "IMPORTANT: answer strictly in English. Even if the question is difficult, technical, or contains Russian terms, the main answer must be in English. Do not switch to Russian unless the user explicitly asks for a Russian translation.";
  }

  function responseLanguageReminder() {
    return locale() === "ru"
      ? "Ответь строго на русском языке."
      : "Answer strictly in English.";
  }

  function messagesWithLanguage(messages) {
    const instruction = responseLanguageInstruction();
    const normalized = Array.isArray(messages) ? [...messages] : [];
    const firstSystem = normalized.find(message => message?.role === "system");
    const lastUser = [...normalized].reverse().find(message => message?.role === "user");

    if (firstSystem) {
      firstSystem.content = `${instruction}\n\n${firstSystem.content || ""}\n\n${instruction}`.trim();
    } else {
      normalized.unshift({ role: "system", content: instruction });
    }

    if (lastUser) {
      appendReminderToUserMessage(lastUser, responseLanguageReminder());
    }

    return normalized;
  }

  async function requestAssistant(content, options = {}) {
    const onDelta = typeof options.onDelta === "function" ? options.onDelta : null;
    const attachedFiles = Array.isArray(options.attachments) ? options.attachments : [];
    const apiKey = currentApiKey();
    if (!apiKey) {
      return { statusKey: "missingKey" };
    }

    if (!content && !attachedFiles.length) {
      return { statusKey: "emptyPrompt" };
    }

    if (!endpoint() || !model()) {
      return { statusKey: "missingProvider" };
    }

    try {
      const memoryMessages = options.useMemory ? readMemory() : [];
      const messages = options.messages || [
        { role: "system", content: settings.systemPrompt || defaults.systemPrompt },
        ...memoryMessages,
        { role: "user", content: buildUserMessageContent(content, attachedFiles) }
      ];
      const requestMessages = messagesWithLanguage(messages);

      const response = await fetch(endpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://discord.com",
          "X-Title": "Dorion AI Assistant"
        },
        body: JSON.stringify({
          model: model(),
          messages: requestMessages,
          temperature: Number.isFinite(Number(settings.temperature)) ? Number(settings.temperature) : defaults.temperature,
          max_tokens: Math.max(1, Math.min(8192, Number(settings.maxTokens) || defaults.maxTokens)),
          stream: Boolean(onDelta)
        })
      });

      if (onDelta && response.body) {
        if (!response.ok) {
          const raw = await response.text();
          return { statusText: raw || `HTTP ${response.status}` };
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let output = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const payload = trimmed.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;

            try {
              const data = JSON.parse(payload);
              if (data.error) return { statusText: data.error?.message || String(data.error) };

              const delta = data.choices?.[0]?.delta?.content
                || data.choices?.[0]?.message?.content
                || data.choices?.[0]?.text
                || "";

              if (!delta) continue;
              output += delta;
              onDelta(output);
            } catch {}
          }
        }

        if (!output.trim() && buffer.trim()) {
          try {
            const data = JSON.parse(buffer.trim());
            if (data.error) return { statusText: data.error?.message || String(data.error) };
            output = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || "";
            if (output) onDelta(output);
          } catch {}
        }

        return { text: output.trim() || t("emptyResponse") };
      }

      const raw = await response.text();
      let data = {};

      try {
        data = JSON.parse(raw);
      } catch {}

      if (!response.ok || data.error) {
        return { statusText: data.error?.message || raw || `HTTP ${response.status}` };
      }

      const text = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || "";
      return { text: text.trim() || t("emptyResponse") };
    } catch (error) {
      console.error("[Dorion AI Assistant]", error);
      return { statusKey: "requestFailed" };
    }
  }

  function showAssistantResult(result) {
    if (result.statusText) {
      status.textContent = result.statusText;
      return;
    }

    if (result.statusKey) {
      setStatus(result.statusKey);
      return;
    }

    setAnswer(result.text || t("emptyResponse"));
    setStatus("done");
  }

  async function ask() {
    saveForm();
    const userPrompt = prompt.value.trim();
    if (!userPrompt && !attachments.length) {
      setStatus("emptyPrompt");
      return;
    }

    triggerScreenGlow();
    setAnswer("");
    if (await tryHandleAppAction(userPrompt)) {
      clearPromptAndAttachments();
      return;
    }

    if (!currentApiKey()) {
      setStatus("missingKey");
      return;
    }

    if (!endpoint() || !model()) {
      setStatus("missingProvider");
      return;
    }

    const requestAttachments = [...attachments];
    clearPromptAndAttachments();

    setStatus("thinking");
    const result = await requestAssistant(userPrompt, { onDelta: setAnswer, attachments: requestAttachments, useMemory: true });
    showAssistantResult(result);
    if (result.text && !result.statusKey && !result.statusText) {
      rememberExchange(userPrompt || t("attachmentOnlyPrompt"), result.text);
    }
  }

  let webpackRequireCache = null;
  let componentDispatchCache = null;

  function getWebpackRequire() {
    if (webpackRequireCache) return webpackRequireCache;

    const chunks = window.webpackChunkdiscord_app || window.webpackChunkdiscordapp;
    if (!Array.isArray(chunks) || typeof chunks.push !== "function") return null;

    const chunkId = `dorion-ai-assistant-${Date.now()}`;
    try {
      chunks.push([[chunkId], {}, req => {
        webpackRequireCache = req;
      }]);
    } catch (error) {
      console.error("[Dorion AI Assistant] webpack require lookup failed", error);
    }

    return webpackRequireCache;
  }

  function hasProps(target, props) {
    return target && props.every(prop => typeof target[prop] !== "undefined");
  }

  function findWebpackModuleByProps(...props) {
    const vencordWebpack = window.Vencord?.Webpack;
    if (vencordWebpack?.findByProps) {
      try {
        const found = vencordWebpack.findByProps(...props);
        if (found) return found;
      } catch {}
    }

    const req = getWebpackRequire();
    if (!req?.c) return null;

    for (const module of Object.values(req.c)) {
      const exports = module?.exports;
      if (!exports) continue;
      if (hasProps(exports, props)) return exports;
      if (hasProps(exports.default, props)) return exports.default;

      if (typeof exports === "object") {
        for (const value of Object.values(exports)) {
          if (hasProps(value, props)) return value;
        }
      }
    }

    return null;
  }

  function getComponentDispatch() {
    if (componentDispatchCache) return componentDispatchCache;

    componentDispatchCache =
      window.Vencord?.Webpack?.Common?.ComponentDispatch
      || window.Vencord?.Webpack?.Common?.ComponentDispatchActions
      || findWebpackModuleByProps("dispatchToLastSubscribed");

    return componentDispatchCache;
  }

  function insertWithComponentDispatch(text) {
    const componentDispatch = getComponentDispatch();
    if (!componentDispatch?.dispatchToLastSubscribed) return false;

    componentDispatch.dispatchToLastSubscribed("INSERT_TEXT", {
      rawText: text,
      plainText: text
    });
    return true;
  }

  function findChatEditor() {
    const focused = document.activeElement?.matches?.('[role="textbox"][data-slate-editor="true"], [role="textbox"][contenteditable="true"]')
      ? document.activeElement
      : null;

    return focused
      || document.querySelector('[role="textbox"][data-slate-editor="true"], [role="textbox"][contenteditable="true"]');
  }

  function fallbackPasteIntoEditor(editor, text) {
    editor.focus();

    try {
      const data = new DataTransfer();
      data.setData("text/plain", text);
      data.setData("text", text);
      const pasteEvent = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: data
      });

      if (!editor.dispatchEvent(pasteEvent)) return true;
    } catch {}

    try {
      const beforeInput = new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: text
      });
      editor.dispatchEvent(beforeInput);
    } catch {}

    document.execCommand("insertText", false, text);
    editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    return true;
  }

  function insertIntoChat(text) {
    if (!text) {
      setStatus("noAnswerToInsert");
      return false;
    }

    const editor = findChatEditor();
    if (!editor) {
      setStatus("chatMissing");
      return false;
    }

    if (!insertWithComponentDispatch(text) && editor) {
      fallbackPasteIntoEditor(editor, text);
    }

    setStatus("inserted");
    return true;
  }

  function channelCanReceiveText(channel) {
    if (!channel) return false;
    const type = Number(channel.type);
    return [0, 1, 3, 5, 10, 11, 12].includes(type)
      || Boolean(channel.isDM?.())
      || Boolean(channel.isGroupDM?.());
  }

  function insertAnswerIntoCurrentChat(text) {
    if (!text) {
      setStatus("noAnswerToInsert");
      return false;
    }

    const channel = getCurrentDiscordChannel();
    if (!channelCanReceiveText(channel) || !findChatEditor()) {
      setStatus("chatMissing");
      return false;
    }

    return insertIntoChat(text);
  }

  function getDiscordCommon(name, ...props) {
    return window.Vencord?.Webpack?.Common?.[name] || findWebpackModuleByProps(...props);
  }

  function cleanCommandValue(value) {
    return String(value || "")
      .trim()
      .replace(/^["'«“”]+|["'«»“”]+$/g, "")
      .trim();
  }

  function cleanTargetName(value) {
    return cleanCommandValue(value)
      .replace(/^@+/, "")
      .replace(/[.!?,;:]+$/g, "")
      .trim();
  }

  function normalizedSearch(value) {
    return String(value || "")
      .normalize("NFKC")
      .toLowerCase()
      .replace(/^@+/, "")
      .trim();
  }

  function parseNicknameCommand(text) {
    const patterns = [
      /^(?:измени|поменяй|смени|установи|поставь)\s+(?:мой\s+)?(?:ник|никнейм)(?:\s+на)?\s+(.+)$/i,
      /^(?:change|set)\s+(?:my\s+)?nick(?:name)?(?:\s+to)?\s+(.+)$/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) return cleanCommandValue(match[1]).slice(0, 32);
    }

    return "";
  }

  function parseWriteCommand(text) {
    const patterns = [
      { pattern: /^напиши\s+(.+?)\s+пользовател[юья]\s+(.+)$/i, targetFirst: false },
      { pattern: /^напиши\s+пользовател[юья]\s+(.+?)\s+(.+)$/i, targetFirst: true },
      { pattern: /^(?:write|message)\s+(.+?)\s+to\s+(?:user\s+)?(.+)$/i, targetFirst: false },
      { pattern: /^(?:write|message)\s+(?:user\s+)?(.+?)\s+(.+)$/i, targetFirst: true }
    ];

    for (const { pattern, targetFirst } of patterns) {
      const match = text.match(pattern);
      if (!match?.[1] || !match?.[2]) continue;

      if (targetFirst) {
        return {
          type: "dmDraft",
          target: cleanTargetName(match[1]),
          message: cleanCommandValue(match[2])
        };
      }

      return {
        type: "dmDraft",
        target: cleanTargetName(match[2]),
        message: cleanCommandValue(match[1])
      };
    }

    const currentChatMatch = text.match(/^(?:напиши|insert|write)\s+(.+)$/i);
    if (currentChatMatch?.[1]) {
      return {
        type: "chatDraft",
        message: cleanCommandValue(currentChatMatch[1])
      };
    }

    return null;
  }

  function parseSendCommand(text) {
    const patterns = [
      { pattern: /^(?:отправь|отправить)\s+(.+?)\s+пользовател[юья]\s+(.+)$/i, targetType: "user", targetFirst: false },
      { pattern: /^(?:отправь|отправить)\s+пользовател[юья]\s+(.+?)\s+(.+)$/i, targetType: "user", targetFirst: true },
      { pattern: /^(?:отправь|отправить)\s+(.+?)\s+в\s+(?:чат|канал)\s+(.+)$/i, targetType: "channel", targetFirst: false },
      { pattern: /^(?:отправь|отправить)\s+(?:в\s+)?(?:чат|канал)\s+(.+?)\s+(.+)$/i, targetType: "channel", targetFirst: true },
      { pattern: /^send\s+(.+?)\s+to\s+(?:chat|channel)\s+(.+)$/i, targetType: "channel", targetFirst: false },
      { pattern: /^send\s+(?:to\s+)?(?:chat|channel)\s+(.+?)\s+(.+)$/i, targetType: "channel", targetFirst: true },
      { pattern: /^send\s+(.+?)\s+to\s+user\s+(.+)$/i, targetType: "user", targetFirst: false }
    ];

    for (const { pattern, targetType, targetFirst } of patterns) {
      const match = text.match(pattern);
      if (!match?.[1] || !match?.[2]) continue;

      return {
        type: "send",
        targetType,
        target: cleanTargetName(targetFirst ? match[1] : match[2]),
        message: cleanCommandValue(targetFirst ? match[2] : match[1])
      };
    }

    return null;
  }

  function isBlockedBulkAction(text) {
    const value = normalizedSearch(text);
    return /(выйд|покин|удал).*(все|всех).*(сервер|гильд)/i.test(value)
      || /(leave|exit|quit).*(all|every).*(server|guild)/i.test(value);
  }

  function getCurrentDiscordChannel() {
    const selectedChannelStore = getDiscordCommon("SelectedChannelStore", "getChannelId", "getVoiceChannelId");
    const channelStore = getDiscordCommon("ChannelStore", "getChannel", "getDMFromUserId");
    const channelId = selectedChannelStore?.getChannelId?.();
    return channelId ? channelStore?.getChannel?.(channelId) : null;
  }

  function getCurrentGuildId() {
    const selectedGuildStore = getDiscordCommon("SelectedGuildStore", "getGuildId", "getLastSelectedGuildId");
    const guildId = selectedGuildStore?.getGuildId?.();
    if (guildId) return guildId;

    const channel = getCurrentDiscordChannel();
    return channel?.guild_id || channel?.getGuildId?.() || null;
  }

  function findCachedUserByName(name) {
    const target = normalizedSearch(name);
    if (!target) return null;

    const userStore = getDiscordCommon("UserStore", "getCurrentUser", "getUsers", "getUser");
    const relationshipStore = getDiscordCommon("RelationshipStore", "getNickname");
    const users = Object.values(userStore?.getUsers?.() || {});

    const namesForUser = user => [
      user?.id,
      user?.username,
      user?.globalName,
      user?.displayName,
      relationshipStore?.getNickname?.(user?.id),
      user?.username && user?.discriminator ? `${user.username}#${user.discriminator}` : ""
    ].filter(Boolean).map(normalizedSearch);

    return users.find(user => namesForUser(user).some(candidate => candidate === target))
      || users.find(user => namesForUser(user).some(candidate => candidate.startsWith(target)))
      || users.find(user => namesForUser(user).some(candidate => candidate.includes(target)))
      || null;
  }

  async function openDmWithUser(userId) {
    const channelActionCreators = getDiscordCommon("ChannelActionCreators", "openPrivateChannel");
    const channelStore = getDiscordCommon("ChannelStore", "getChannel", "getDMFromUserId");
    const channelRouter = getDiscordCommon("ChannelRouter", "transitionToChannel");

    const existingDmId = channelStore?.getDMFromUserId?.(userId);
    if (existingDmId) {
      channelRouter?.transitionToChannel?.(existingDmId);
      return existingDmId;
    }

    if (!channelActionCreators?.openPrivateChannel) return false;

    let channelId = null;
    const waitForDmChannel = () => new Promise(resolve => {
      const startedAt = Date.now();
      const check = () => {
        const dmId = channelStore?.getDMFromUserId?.(userId);
        if (dmId || Date.now() - startedAt > 2200) {
          resolve(dmId || null);
          return;
        }
        window.setTimeout(check, 100);
      };
      check();
    });

    try {
      const result = await Promise.resolve(channelActionCreators.openPrivateChannel({
        recipientIds: [userId],
        location: "DorionAIAssistant",
        navigateToChannel: true
      }));
      if (typeof result === "string") channelId = result;
    } catch {}

    if (!channelId) {
      try {
        const result = await Promise.resolve(channelActionCreators.openPrivateChannel(userId));
        if (typeof result === "string") channelId = result;
      } catch {}
    }

    channelId ||= channelStore?.getDMFromUserId?.(userId);
    channelId ||= await waitForDmChannel();
    if (!channelId) return false;

    channelRouter?.transitionToChannel?.(channelId);
    return channelId;
  }

  function addKnownChannel(value, seen, channels) {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach(entry => addKnownChannel(entry, seen, channels));
      return;
    }

    const channel = value.channel || value;
    if (!channel?.id || seen.has(channel.id)) return;

    const canReceiveMessage = channelCanReceiveText(channel);

    if (!canReceiveMessage) return;

    seen.add(channel.id);
    channels.push(channel);
  }

  function getAllKnownChannels() {
    const channelStore = getDiscordCommon("ChannelStore", "getChannel", "getDMFromUserId");
    const guildStore = getDiscordCommon("GuildStore", "getGuild", "getGuilds");
    const guildChannelStore = getDiscordCommon("GuildChannelStore", "getChannels");
    const seen = new Set();
    const channels = [];

    try {
      channelStore?.getChannelIds?.()?.forEach(id => addKnownChannel(channelStore.getChannel(id), seen, channels));
    } catch {}

    try {
      Object.values(channelStore?.getMutablePrivateChannels?.() || {}).forEach(value => addKnownChannel(value, seen, channels));
    } catch {}

    try {
      channelStore?.getSortedPrivateChannels?.()?.forEach(value => {
        const id = typeof value === "string" ? value : value?.id || value?.channelId;
        addKnownChannel(value?.channel || (id ? channelStore.getChannel(id) : value), seen, channels);
      });
    } catch {}

    try {
      Object.values(guildStore?.getGuilds?.() || {}).forEach(guild => {
        Object.values(channelStore?.getMutableGuildChannelsForGuild?.(guild.id) || {}).forEach(value => addKnownChannel(value, seen, channels));
        Object.values(guildChannelStore?.getChannels?.(guild.id) || {}).forEach(value => addKnownChannel(value, seen, channels));
      });
    } catch {}

    const current = getCurrentDiscordChannel();
    addKnownChannel(current, seen, channels);

    return channels;
  }

  function channelDisplayName(channel) {
    const userStore = getDiscordCommon("UserStore", "getCurrentUser", "getUsers", "getUser");
    const guildStore = getDiscordCommon("GuildStore", "getGuild", "getGuilds");

    if (channel?.isDM?.() || Number(channel?.type) === 1) {
      const recipient = userStore?.getUser?.(channel.recipients?.[0]);
      return recipient ? `@${recipient.globalName || recipient.username}` : "DM";
    }

    if (channel?.isGroupDM?.() || Number(channel?.type) === 3) {
      return channel.name || "Group DM";
    }

    const guild = channel?.guild_id ? guildStore?.getGuild?.(channel.guild_id) : null;
    return `${guild?.name ? `${guild.name} / ` : ""}#${channel?.name || channel?.id || "channel"}`;
  }

  function channelSearchNames(channel) {
    const base = [
      channel?.id,
      channel?.name,
      channel?.name ? `#${channel.name}` : "",
      channelDisplayName(channel)
    ];

    return base.filter(Boolean).map(value => normalizedSearch(value).replace(/^#/, ""));
  }

  function channelScore(target, channel) {
    const normalizedTarget = normalizedSearch(target).replace(/^#/, "");
    if (!normalizedTarget) return 0;

    const selectedGuildId = getCurrentGuildId();
    const names = channelSearchNames(channel);
    let score = 0;

    for (const name of names) {
      if (name === normalizedTarget) score = Math.max(score, 100);
      else if (name.startsWith(normalizedTarget)) score = Math.max(score, 70);
      else if (name.includes(normalizedTarget)) score = Math.max(score, 40);
    }

    if (score > 0 && selectedGuildId && channel?.guild_id === selectedGuildId) score += 12;
    return score;
  }

  function findChannelByName(target) {
    const normalizedTarget = normalizedSearch(target);
    if (/^(этот|текущий)\s+(чат|канал)$|^current\s+(chat|channel)$|^this\s+(chat|channel)$/i.test(normalizedTarget)) {
      return getCurrentDiscordChannel();
    }

    return getAllKnownChannels()
      .map(channel => ({ channel, score: channelScore(target, channel) }))
      .filter(entry => entry.score > 0)
      .sort((left, right) => right.score - left.score || channelDisplayName(left.channel).localeCompare(channelDisplayName(right.channel)))[0]?.channel || null;
  }

  async function sendMessageToChannelId(channelId, content) {
    const messageActions = getDiscordCommon("MessageActions", "editMessage", "sendMessage");
    if (messageActions?.sendMessage) {
      await Promise.resolve(messageActions.sendMessage(channelId, {
        content,
        invalidEmojis: [],
        tts: false,
        validNonShortcutEmojis: []
      }, true, {}));
      return true;
    }

    const restApi = getDiscordCommon("RestAPI", "del", "put", "post");
    if (!restApi?.post) return false;

    await Promise.resolve(restApi.post({
      url: `/channels/${channelId}/messages`,
      body: {
        content,
        nonce: String(Date.now()),
        tts: false,
        type: 0
      }
    }));
    return true;
  }

  async function changeCurrentNickname(nick) {
    const guildId = getCurrentGuildId();
    if (!guildId) {
      setStatus("actionNoGuild");
      return true;
    }

    if (!window.confirm(tf("actionNickConfirm", { nick }))) {
      setStatus("actionCancelled");
      return true;
    }

    const restApi = getDiscordCommon("RestAPI", "del", "put", "patch");
    if (!restApi?.patch) {
      setStatus("actionUnavailable");
      return true;
    }

    try {
      await Promise.resolve(restApi.patch({
        url: `/guilds/${guildId}/members/@me`,
        body: { nick }
      }));
      status.textContent = tf("actionNickChanged", { nick });
    } catch (error) {
      console.error("[Dorion AI Assistant] nickname action failed", error);
      status.textContent = error?.body?.message || error?.message || t("actionUnavailable");
    }

    return true;
  }

  async function handleSendCommand(command) {
    if (!command?.message || !command?.target) return false;

    let channel = null;
    let targetLabel = command.target;

    if (command.targetType === "user") {
      const user = findCachedUserByName(command.target);
      if (!user?.id) {
        status.textContent = tf("actionChannelNotFound", { target: command.target });
        return true;
      }

      const channelId = await openDmWithUser(user.id);
      if (!channelId) {
        setStatus("actionUnavailable");
        return true;
      }

      const channelStore = getDiscordCommon("ChannelStore", "getChannel", "getDMFromUserId");
      channel = channelStore?.getChannel?.(channelId);
      targetLabel = `@${user.globalName || user.username || command.target}`;
    } else {
      channel = findChannelByName(command.target);
      if (!channel?.id) {
        status.textContent = tf("actionChannelNotFound", { target: command.target });
        return true;
      }

      targetLabel = channelDisplayName(channel);
    }

    if (!window.confirm(tf("actionSendConfirm", { target: targetLabel, message: command.message }))) {
      setStatus("actionCancelled");
      return true;
    }

    try {
      await sendMessageToChannelId(channel.id, command.message);
      const channelRouter = getDiscordCommon("ChannelRouter", "transitionToChannel");
      channelRouter?.transitionToChannel?.(channel.id);
      status.textContent = tf("actionSent", { target: targetLabel });
    } catch (error) {
      console.error("[Dorion AI Assistant] send action failed", error);
      status.textContent = error?.body?.message || error?.message || t("actionSendFailed");
    }

    return true;
  }

  async function handleDraftCommand(command) {
    if (!command?.message) return false;

    if (command.type === "chatDraft") {
      insertIntoChat(command.message);
      setStatus("actionDraftInserted");
      return true;
    }

    const user = findCachedUserByName(command.target);
    if (!user?.id) {
      insertIntoChat(command.message);
      status.textContent = tf("actionUserNotFound", { user: command.target });
      return true;
    }

    setStatus("actionOpeningDm");
    const opened = await openDmWithUser(user.id);
    if (!opened) {
      setStatus("actionUnavailable");
      return true;
    }

    window.setTimeout(() => {
      insertIntoChat(command.message);
      setStatus("actionDraftInserted");
    }, 350);
    return true;
  }

  async function tryHandleAppAction(text) {
    if (isBlockedBulkAction(text)) {
      setStatus("actionBlocked");
      return true;
    }

    const nick = parseNicknameCommand(text);
    if (nick) return changeCurrentNickname(nick);

    const sendCommand = parseSendCommand(text);
    if (sendCommand) return handleSendCommand(sendCommand);

    const writeCommand = parseWriteCommand(text);
    if (writeCommand) return handleDraftCommand(writeCommand);

    return false;
  }

  let activeMessageContext = null;

  const quickActions = [
    { id: "answer", labelKey: "quickAnswer" },
    { id: "reply", labelKey: "quickReply", insertAsReply: true },
    { id: "explain", labelKey: "quickExplain" },
    { id: "rewrite", labelKey: "quickRewrite" },
    { id: "shorten", labelKey: "quickShorten" },
    { id: "translate", labelKey: "quickTranslate" }
  ];

  function messageElementFromToolbar(toolbar) {
    return toolbar.closest('li[id^="chat-messages-"], [data-list-item-id^="chat-messages"], [class*="messageListItem_"], [id^="chat-messages-"]');
  }

  function messageTextFromElement(message) {
    if (!message) return "";

    const contentNodes = message.querySelectorAll('[id^="message-content-"], [class*="messageContent_"], [class*="markup_"]');
    const texts = Array.from(contentNodes)
      .map(node => (node.innerText || node.textContent || "").trim())
      .filter(Boolean);

    return Array.from(new Set(texts)).join("\n").trim();
  }

  function messageFromToolbar(toolbar) {
    return messageTextFromElement(messageElementFromToolbar(toolbar));
  }

  function visibleMessageElements() {
    const selector = 'li[id^="chat-messages-"], [data-list-item-id^="chat-messages"], [class*="messageListItem_"]';
    return Array.from(document.querySelectorAll(selector))
      .filter((message, index, list) => list.indexOf(message) === index && messageTextFromElement(message));
  }

  function recentContextForMessage(message) {
    const count = Math.max(0, Math.min(20, Number(settings.contextMessages) || 0));
    if (!count || !message) return "";

    const messages = visibleMessageElements();
    const index = messages.indexOf(message);
    if (index < 0) return "";

    return messages
      .slice(Math.max(0, index - count), index + 1)
      .map((node, idx) => `${idx + 1}. ${messageTextFromElement(node)}`)
      .join("\n");
  }

  function messageActionPrompt(actionId, messageText, contextText) {
    const taskByAction = {
      answer: "If the selected message is a question, answer it directly. If it is a request, fulfill it. If it needs a reply, suggest a useful reply.",
      reply: "Write a concise Discord reply that can be sent directly. Return only the reply text.",
      explain: "Explain the selected message clearly and briefly. Include the useful meaning, not unnecessary detail.",
      rewrite: "Rewrite the selected message in a cleaner, more natural style. Return only the rewritten text.",
      shorten: "Make the selected message shorter while preserving the meaning. Return only the shortened text.",
      translate: "Translate the selected message. If it is Russian, translate to English. Otherwise translate to Russian. Return only the translation."
    };

    return [
      "You are helping inside Discord.",
      "Use the recent channel context only when it helps understand the selected message.",
      "Keep the answer practical and concise.",
      "",
      contextText ? `Recent channel context:\n${contextText}\n` : "",
      `Selected message:\n${messageText}`,
      "",
      `Task:\n${taskByAction[actionId] || taskByAction.answer}`
    ].filter(Boolean).join("\n");
  }

  function setActiveMessageContext(toolbar) {
    const message = messageElementFromToolbar(toolbar);
    activeMessageContext = {
      toolbar,
      message,
      text: messageTextFromElement(message)
    };

    return activeMessageContext;
  }

  function findReplyButton(toolbar) {
    if (!toolbar?.isConnected) return null;

    return Array.from(toolbar.querySelectorAll("button, [role='button']"))
      .find(button => /reply|ответ/.test(`${button.getAttribute("aria-label") || ""} ${button.getAttribute("title") || ""}`.toLowerCase()));
  }

  function startReplyFromToolbar(toolbar) {
    const replyButton = findReplyButton(toolbar);
    if (!replyButton) {
      setStatus("noReplyTarget");
      return false;
    }

    replyButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    return true;
  }

  function insertAsReply(text) {
    if (!text) {
      setStatus("noAnswerToInsert");
      return false;
    }

    if (!activeMessageContext?.toolbar || !startReplyFromToolbar(activeMessageContext.toolbar)) {
      return false;
    }

    window.setTimeout(() => {
      insertIntoChat(text);
      setStatus("insertedAsReply");
    }, 80);
    return true;
  }

  async function runMessageAction(toolbar, actionId = "answer") {
    const context = setActiveMessageContext(toolbar);
    const messageText = context.text;
    openPanel(messageText);
    prompt.value = messageText;

    if (!messageText) {
      setStatus("emptyPrompt");
      return;
    }

    const shouldInsertAsReply = actionId === "reply";
    const replyStarted = shouldInsertAsReply ? startReplyFromToolbar(toolbar) : false;
    const contextText = recentContextForMessage(context.message);
    const aiPrompt = messageActionPrompt(actionId, messageText, contextText);

    saveForm();
    triggerScreenGlow();
    setStatus("thinking");
    setAnswer("");
    const result = await requestAssistant(aiPrompt, { onDelta: setAnswer });
    showAssistantResult(result);

    if (shouldInsertAsReply && replyStarted && result.text) {
      window.setTimeout(() => {
        insertIntoChat(result.text);
        setStatus("insertedAsReply");
      }, 80);
    }
  }

  function toolbarLooksLikeMessageToolbar(toolbar) {
    if (!toolbar || toolbar.querySelector("[data-dorion-ai-assistant-toolbar-button]")) return false;
    if (!messageFromToolbar(toolbar)) return false;

    const labels = Array.from(toolbar.querySelectorAll("[aria-label], [title]"))
      .map(node => `${node.getAttribute("aria-label") || ""} ${node.getAttribute("title") || ""}`.toLowerCase())
      .join(" ");

    return /reply|ответ|reaction|реакц|more|ещ|copy|ссыл|forward|пересл/.test(labels);
  }

  function patchToolbar(toolbar) {
    if (toolbar.matches('[role="toolbar"]') && toolbar.querySelector('[class*="buttonsInner_"], [class*="buttonsInner-"]')) return;
    if (!toolbarLooksLikeMessageToolbar(toolbar)) return;

    const template = toolbar.querySelector("button, [role='button']");
    const button = document.createElement(template?.tagName?.toLowerCase() === "button" ? "button" : "div");
    if (template instanceof HTMLElement) button.className = template.className;

    button.classList.add("dorion-ai-assistant-toolbar-button");
    button.dataset.dorionAiAssistantToolbarButton = "true";
    button.setAttribute("role", "button");
    button.setAttribute("aria-label", "Answer With AI");
    button.tabIndex = 0;
    if (button instanceof HTMLButtonElement) button.type = "button";

    const icon = document.createElement("span");
    icon.className = "dorion-ai-assistant-sparkles-icon";
    button.appendChild(icon);

    button.addEventListener("pointerenter", () => showToolbarTooltip(button));
    button.addEventListener("pointerleave", hideToolbarTooltip);
    button.addEventListener("focus", () => showToolbarTooltip(button));
    button.addEventListener("blur", hideToolbarTooltip);

    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      hideToolbarTooltip();
      showQuickActionMenu(button, toolbar);
    });

    button.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      hideToolbarTooltip();
      showQuickActionMenu(button, toolbar);
    });

    const buttons = Array.from(toolbar.children);
    const moreButton = buttons.find(child => /more|ещ/.test(`${child.getAttribute("aria-label") || ""} ${child.textContent || ""}`.toLowerCase()));
    toolbar.insertBefore(button, toolbar.firstElementChild);
  }

  function patchToolbars() {
    document.querySelectorAll('[role="toolbar"], [class*="buttonsInner_"], [class*="buttonsInner-"]').forEach(patchToolbar);
  }

  const toolbarStyle = document.createElement("style");
  toolbarStyle.id = `${pluginId}-toolbar-style`;
  toolbarStyle.textContent = `
    .dorion-ai-assistant-toolbar-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      min-width: 24px;
      min-height: 24px;
      padding: 0;
      color: var(--interactive-normal, #b8bed8);
      cursor: pointer;
    }

    .dorion-ai-assistant-toolbar-button:hover .dorion-ai-assistant-sparkles-icon {
      background: var(--interactive-hover, #dbdee1);
    }

    .dorion-ai-assistant-sparkles-icon {
      display: block;
      width: 20px;
      height: 20px;
      background: var(--interactive-normal, #b8bed8);
      -webkit-mask: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 2l1.7 5.1L19 9l-5.3 1.9L12 16l-1.7-5.1L5 9l5.3-1.9L12 2zM19 14l.9 2.6L22 17.5l-2.1.9L19 21l-.9-2.6-2.1-.9 2.1-.9L19 14zM5 13l1.1 3.1L9 17.2l-2.9 1.1L5 21.5l-1.1-3.2L1 17.2l2.9-1.1L5 13z' fill='black'/%3E%3C/svg%3E") center / contain no-repeat;
      mask: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 2l1.7 5.1L19 9l-5.3 1.9L12 16l-1.7-5.1L5 9l5.3-1.9L12 2zM19 14l.9 2.6L22 17.5l-2.1.9L19 21l-.9-2.6-2.1-.9 2.1-.9L19 14zM5 13l1.1 3.1L9 17.2l-2.9 1.1L5 21.5l-1.1-3.2L1 17.2l2.9-1.1L5 13z' fill='black'/%3E%3C/svg%3E") center / contain no-repeat;
      pointer-events: none;
    }

    .dorion-ai-assistant-quick-menu {
      position: fixed;
      z-index: 2147483647;
      display: none;
      min-width: 178px;
      padding: 8px;
      border: 1px solid rgba(0, 0, 0, .28);
      border-radius: 4px;
      background: var(--background-floating, #111214);
      box-shadow: var(--elevation-high, 0 12px 32px rgba(0, 0, 0, .42));
      color: var(--text-normal, #dbdee1);
      font-family: var(--font-primary, "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif);
    }

    .dorion-ai-assistant-quick-menu.open {
      display: block;
      animation: dorion-ai-assistant-menu-in 90ms ease-out;
    }

    .dorion-ai-assistant-quick-menu button {
      width: 100%;
      min-height: 32px;
      display: flex;
      align-items: center;
      gap: 8px;
      border: 0;
      border-radius: 2px;
      background: transparent;
      color: var(--text-normal, #dbdee1);
      padding: 6px 8px;
      cursor: pointer;
      font: inherit;
      font-size: 14px;
      font-weight: 500;
      line-height: 18px;
      text-align: left;
    }

    .dorion-ai-assistant-quick-menu button:hover,
    .dorion-ai-assistant-quick-menu button:focus-visible {
      background: var(--brand-experiment, #5865f2);
      color: #fff;
      outline: none;
    }

    .dorion-ai-assistant-quick-menu button:hover .spark,
    .dorion-ai-assistant-quick-menu button:focus-visible .spark {
      background: #fff;
    }

    .dorion-ai-assistant-quick-menu .spark {
      width: 16px;
      height: 16px;
      flex: 0 0 auto;
      background: var(--interactive-normal, #b8bed8);
      -webkit-mask: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 2l1.7 5.1L19 9l-5.3 1.9L12 16l-1.7-5.1L5 9l5.3-1.9L12 2zM19 14l.9 2.6L22 17.5l-2.1.9L19 21l-.9-2.6-2.1-.9 2.1-.9L19 14zM5 13l1.1 3.1L9 17.2l-2.9 1.1L5 21.5l-1.1-3.2L1 17.2l2.9-1.1L5 13z' fill='black'/%3E%3C/svg%3E") center / contain no-repeat;
      mask: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 2l1.7 5.1L19 9l-5.3 1.9L12 16l-1.7-5.1L5 9l5.3-1.9L12 2zM19 14l.9 2.6L22 17.5l-2.1.9L19 21l-.9-2.6-2.1-.9 2.1-.9L19 14zM5 13l1.1 3.1L9 17.2l-2.9 1.1L5 21.5l-1.1-3.2L1 17.2l2.9-1.1L5 13z' fill='black'/%3E%3C/svg%3E") center / contain no-repeat;
    }

    @keyframes dorion-ai-assistant-menu-in {
      from { opacity: 0; transform: translateY(4px) scale(.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .dorion-ai-assistant-toolbar-tooltip {
      position: fixed;
      z-index: 2147483647;
      pointer-events: none;
      opacity: 0;
      transform: translateY(3px) scale(.985);
      transition: opacity 80ms ease, transform 80ms ease;
      min-height: 0;
      padding: 6px 9px;
      border-radius: 8px;
      background: var(--background-floating, #2d3144);
      color: var(--text-muted, #c9cee7);
      box-shadow: 0 8px 20px rgba(0, 0, 0, .34);
      font-family: var(--font-primary, "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif);
      font-size: 13px;
      font-weight: 600;
      line-height: 16px;
      white-space: nowrap;
    }

    .dorion-ai-assistant-toolbar-tooltip.info {
      max-width: 260px;
      min-width: 190px;
      padding: 8px 10px;
      color: var(--text-normal, #dbdee1);
      font-size: 12px;
      font-weight: 500;
      line-height: 16px;
      text-align: left;
      white-space: normal;
    }

    .dorion-ai-assistant-toolbar-tooltip.active {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    .dorion-ai-assistant-toolbar-tooltip::after {
      content: "";
      position: absolute;
      left: 50%;
      bottom: -5px;
      width: 9px;
      height: 9px;
      background: var(--background-floating, #2d3144);
      transform: translateX(-50%) rotate(45deg);
      border-radius: 2px;
    }

    .dorion-ai-assistant-screen-glow {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      pointer-events: none;
      opacity: 0;
      background: transparent;
      transition: opacity 180ms ease;
      filter: saturate(1.22);
    }

    .dorion-ai-assistant-screen-glow::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 0;
      box-shadow:
        inset 0 0 0 1px rgba(210, 235, 255, .55),
        inset 0 0 14px rgba(126, 200, 255, .68),
        inset 0 0 34px rgba(96, 164, 255, .38),
        inset 0 0 72px rgba(119, 125, 255, .18);
      animation: dorion-ai-assistant-edge-breathe 1800ms ease-in-out infinite;
    }

    .dorion-ai-assistant-screen-glow::before {
      content: "";
      position: absolute;
      inset: 0;
      box-shadow:
        inset 18px 0 28px rgba(92, 198, 255, .28),
        inset -18px 0 28px rgba(133, 125, 255, .24),
        inset 0 18px 28px rgba(110, 225, 255, .2),
        inset 0 -18px 30px rgba(112, 146, 255, .28);
      animation: dorion-ai-assistant-edge-wave 2100ms ease-in-out infinite;
    }

    .dorion-ai-assistant-screen-glow.active {
      opacity: 1;
      animation: dorion-ai-assistant-glow-pulse 2600ms cubic-bezier(.2, .8, .2, 1) both;
    }

    @keyframes dorion-ai-assistant-glow-pulse {
      0% { opacity: 0; transform: translate3d(0, 0, 0); }
      9% { opacity: 1; transform: translate3d(-.8px, .4px, 0); }
      15% { transform: translate3d(.9px, -.6px, 0); }
      23% { transform: translate3d(-.5px, .8px, 0); }
      34% { transform: translate3d(.4px, .2px, 0); }
      52% { opacity: .9; transform: translate3d(0, 0, 0); }
      78% { opacity: .62; }
      100% { opacity: 0; transform: translate3d(0, 0, 0); }
    }

    @keyframes dorion-ai-assistant-edge-breathe {
      0%, 100% {
        box-shadow:
          inset 0 0 0 1px rgba(210, 235, 255, .45),
          inset 0 0 12px rgba(126, 200, 255, .56),
          inset 0 0 30px rgba(96, 164, 255, .3),
          inset 0 0 62px rgba(119, 125, 255, .14);
      }
      50% {
        box-shadow:
          inset 0 0 0 1px rgba(232, 247, 255, .7),
          inset 0 0 18px rgba(112, 220, 255, .82),
          inset 0 0 42px rgba(110, 158, 255, .44),
          inset 0 0 86px rgba(136, 119, 255, .24);
      }
    }

    @keyframes dorion-ai-assistant-edge-wave {
      0% {
        box-shadow:
          inset 22px 0 34px rgba(99, 206, 255, .34),
          inset -12px 0 24px rgba(126, 118, 255, .16),
          inset 0 12px 24px rgba(109, 228, 255, .16),
          inset 0 -16px 28px rgba(112, 146, 255, .24);
      }
      25% {
        box-shadow:
          inset 12px 0 22px rgba(99, 206, 255, .18),
          inset -16px 0 26px rgba(126, 118, 255, .2),
          inset 0 22px 36px rgba(109, 228, 255, .34),
          inset 0 -12px 24px rgba(112, 146, 255, .16);
      }
      50% {
        box-shadow:
          inset 12px 0 22px rgba(99, 206, 255, .16),
          inset -22px 0 34px rgba(126, 118, 255, .32),
          inset 0 12px 24px rgba(109, 228, 255, .16),
          inset 0 -16px 28px rgba(112, 146, 255, .22);
      }
      75% {
        box-shadow:
          inset 14px 0 24px rgba(99, 206, 255, .2),
          inset -14px 0 24px rgba(126, 118, 255, .18),
          inset 0 12px 24px rgba(109, 228, 255, .16),
          inset 0 -24px 38px rgba(112, 146, 255, .34);
      }
      100% {
        box-shadow:
          inset 22px 0 34px rgba(99, 206, 255, .34),
          inset -12px 0 24px rgba(126, 118, 255, .16),
          inset 0 12px 24px rgba(109, 228, 255, .16),
          inset 0 -16px 28px rgba(112, 146, 255, .24);
      }
    }
  `;

  const glowOverlay = document.createElement("div");
  glowOverlay.className = "dorion-ai-assistant-screen-glow";

  const toolbarTooltip = document.createElement("div");
  toolbarTooltip.className = "dorion-ai-assistant-toolbar-tooltip";
  toolbarTooltip.textContent = "Answer With AI";

  const quickMenu = document.createElement("div");
  quickMenu.className = "dorion-ai-assistant-quick-menu";

  function showFloatingTooltip(anchor, text, options = {}) {
    toolbarTooltip.classList.remove("active");
    toolbarTooltip.classList.toggle("info", options.kind === "info");
    toolbarTooltip.textContent = text;
    toolbarTooltip.style.left = "0px";
    toolbarTooltip.style.top = "0px";
    toolbarTooltip.style.maxWidth = options.kind === "info" ? "260px" : "";

    const buttonRect = anchor.getBoundingClientRect();
    const tooltipRect = toolbarTooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width || (options.kind === "info" ? 220 : 116);
    const tooltipHeight = tooltipRect.height || (options.kind === "info" ? 48 : 32);
    const preferredLeft = options.align === "left"
      ? buttonRect.right - tooltipWidth
      : buttonRect.left + buttonRect.width / 2 - tooltipWidth / 2;
    const left = Math.max(8, Math.min(window.innerWidth - tooltipWidth - 8, preferredLeft));
    let top = buttonRect.top - tooltipHeight - 10;
    if (top < 8) top = buttonRect.bottom + 10;

    toolbarTooltip.style.left = `${left}px`;
    toolbarTooltip.style.top = `${top}px`;
    toolbarTooltip.classList.add("active");
  }

  function showToolbarTooltip(button) {
    showFloatingTooltip(button, "Answer With AI");
  }

  function showInfoTooltip(button) {
    const text = button.dataset.tooltip || button.getAttribute("aria-label") || "";
    if (!text) return;
    const rect = button.getBoundingClientRect();
    showFloatingTooltip(button, text, {
      kind: "info",
      align: rect.right > window.innerWidth - 180 ? "left" : "center"
    });
  }

  function hideToolbarTooltip() {
    toolbarTooltip.classList.remove("active");
  }

  function hideQuickMenu() {
    quickMenu.classList.remove("open");
  }

  function showQuickActionMenu(button, toolbar) {
    hideToolbarTooltip();
    setActiveMessageContext(toolbar);
    quickMenu.textContent = "";

    quickActions.forEach(action => {
      const item = document.createElement("button");
      item.type = "button";
      item.dataset.action = action.id;

      const icon = document.createElement("span");
      icon.className = "spark";
      item.appendChild(icon);
      item.append(document.createTextNode(t(action.labelKey)));

      item.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        hideQuickMenu();
        runMessageAction(toolbar, action.id);
      });

      quickMenu.appendChild(item);
    });

    quickMenu.classList.add("open");
    const buttonRect = button.getBoundingClientRect();
    const menuRect = quickMenu.getBoundingClientRect();
    const menuWidth = menuRect.width || 170;
    const menuHeight = menuRect.height || 210;
    const left = Math.max(8, Math.min(window.innerWidth - menuWidth - 8, buttonRect.left));
    let top = buttonRect.top - menuHeight - 8;
    if (top < 8) top = buttonRect.bottom + 8;

    quickMenu.style.left = `${left}px`;
    quickMenu.style.top = `${top}px`;
  }

  let glowTimer = 0;
  function triggerScreenGlow() {
    glowOverlay.classList.remove("active");
    void glowOverlay.offsetWidth;
    glowOverlay.classList.add("active");
    clearTimeout(glowTimer);
    glowTimer = window.setTimeout(() => glowOverlay.classList.remove("active"), 2900);
  }

  let toolbarPatchScheduled = false;
  function scheduleToolbarPatch() {
    if (toolbarPatchScheduled) return;
    toolbarPatchScheduled = true;
    requestAnimationFrame(() => {
      toolbarPatchScheduled = false;
      patchToolbars();
    });
  }

  const toolbarObserver = new MutationObserver(scheduleToolbarPatch);

  function eventComesFromAssistant(event) {
    return event.composedPath?.().includes(root);
  }

  function editableFieldFromEvent(event) {
    const target = event.composedPath?.()[0];
    if (target instanceof HTMLTextAreaElement) return target;
    if (target instanceof HTMLInputElement && !["button", "checkbox", "radio", "submit"].includes(target.type)) return target;
    return null;
  }

  function pasteIntoField(field, text) {
    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? field.value.length;

    if (typeof field.setRangeText === "function") {
      field.setRangeText(text, start, end, "end");
    } else {
      field.value = `${field.value.slice(0, start)}${text}${field.value.slice(end)}`;
    }

    field.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      composed: true,
      inputType: "insertFromPaste",
      data: text
    }));
  }

  function filesFromClipboard(clipboardData) {
    const files = Array.from(clipboardData?.files || []);
    const fromItems = Array.from(clipboardData?.items || [])
      .filter(item => item.kind === "file")
      .map(item => item.getAsFile?.())
      .filter(Boolean);

    const seen = new Set();
    return [...files, ...fromItems].filter(file => {
      const key = `${file.name}:${file.size}:${file.type}:${file.lastModified}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function protectAssistantInputEvent(event) {
    if (!eventComesFromAssistant(event)) return;
    if (event.type === "drop" && event.composedPath?.().includes(promptArea)) return;

    if (event.type === "paste") {
      const field = editableFieldFromEvent(event);
      const text = event.clipboardData?.getData("text");
      const files = filesFromClipboard(event.clipboardData);

      if (files.length) {
        event.preventDefault();
        void addFiles(files);
      }

      if (field && typeof text === "string" && text) {
        event.preventDefault();
        pasteIntoField(field, text);
        saveFormSoon();
      }
    }

    if (event.type === "keydown") {
      if (event.ctrlKey && event.shiftKey && event.code === "KeyY") {
        event.preventDefault();
        togglePanel(String(window.getSelection?.() || "").trim());
      } else if (
        event.key === "Enter"
        && !event.shiftKey
        && !event.ctrlKey
        && !event.altKey
        && !event.metaKey
        && !event.isComposing
        && event.composedPath?.().includes(prompt)
      ) {
        event.preventDefault();
        void ask();
      } else if (event.key === "Escape" && panel.classList.contains("open")) {
        event.preventDefault();
        closePanel();
        hideQuickMenu();
      }
    }

    event.stopPropagation();
    event.stopImmediatePropagation?.();
  }

  const protectedAssistantEventTypes = ["keydown", "keypress", "keyup", "beforeinput", "paste", "copy", "cut", "drop"];

  function onKeyDown(event) {
    if (event.ctrlKey && event.shiftKey && event.code === "KeyY") {
      event.preventDefault();
      togglePanel(String(window.getSelection?.() || "").trim());
      return;
    }

    if (event.key === "Escape" && panel.classList.contains("open")) {
      event.preventDefault();
      closePanel();
      hideQuickMenu();
      return;
    }

    if (event.key === "Escape" && quickMenu.classList.contains("open")) {
      event.preventDefault();
      hideQuickMenu();
    }
  }

  function containAssistantPointerEvent(event) {
    if (!eventComesFromAssistant(event)) return;
    event.stopPropagation();
  }

  function containQuickMenuEvent(event) {
    if (!quickMenu.contains(event.target)) return;
    event.stopPropagation();
  }

  function onDocumentPointerDown(event) {
    const path = event.composedPath?.() || [];
    if (path.some(node => node instanceof HTMLElement && node.dataset?.dorionAiAssistantToolbarButton === "true")) return;
    if (quickMenu.contains(event.target)) return;
    hideQuickMenu();
  }

  function onBeforeUnload() {
    saveForm();
  }

  function onVisibilityChange() {
    if (document.visibilityState === "hidden") saveForm();
  }

  fab.addEventListener("click", () => togglePanel(String(window.getSelection?.() || "").trim()));
  close.addEventListener("click", closePanel);
  apiKeyEye.addEventListener("click", () => {
    apiKeyInput.type = apiKeyInput.type === "password" ? "text" : "password";
    updateApiKeyEye();
    apiKeyInput.focus();
  });

  shadow.querySelectorAll("[data-setting]").forEach(input => {
    input.addEventListener("change", saveForm);
    input.addEventListener("input", saveForm);
    input.addEventListener("paste", saveFormSoon);
    input.addEventListener("cut", saveFormSoon);
    input.addEventListener("drop", saveFormSoon);
    input.addEventListener("blur", saveForm);
  });

  shadow.querySelectorAll(".info-button").forEach(button => {
    button.addEventListener("pointerenter", () => showInfoTooltip(button));
    button.addEventListener("pointerleave", hideToolbarTooltip);
    button.addEventListener("focus", () => showInfoTooltip(button));
    button.addEventListener("blur", hideToolbarTooltip);
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      showInfoTooltip(button);
    });
  });

  shadow.querySelectorAll("[data-open-url]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      const url = button.dataset.openUrl;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    });
  });

  ["pointerdown", "pointerup", "mousedown", "mouseup", "click", "dblclick", "contextmenu"].forEach(type => {
    shadow.addEventListener(type, containAssistantPointerEvent);
    quickMenu.addEventListener(type, containQuickMenuEvent);
  });

  shadow.querySelector(".ask").addEventListener("click", ask);
  answerBottomButton.addEventListener("click", scrollAnswerToBottom);
  body.addEventListener("scroll", updateAnswerBottomButton);
  shadow.querySelector(".attach-button").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    await addFiles(fileInput.files);
    fileInput.value = "";
  });
  promptArea.addEventListener("dragover", event => {
    if (!Array.from(event.dataTransfer?.types || []).includes("Files")) return;
    event.preventDefault();
    event.stopPropagation();
    promptArea.classList.add("dragging");
  });
  promptArea.addEventListener("dragleave", event => {
    if (promptArea.contains(event.relatedTarget)) return;
    promptArea.classList.remove("dragging");
  });
  promptArea.addEventListener("drop", async event => {
    const files = event.dataTransfer?.files;
    if (!files?.length) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    promptArea.classList.remove("dragging");
    await addFiles(files);
  });
  shadow.querySelector(".insert").addEventListener("click", () => insertIntoChat(lastAnswerText.trim()));
  shadow.querySelector(".reply").addEventListener("click", () => insertAnswerIntoCurrentChat(lastAnswerText.trim()));
  shadow.querySelector(".copy").addEventListener("click", async () => {
    const text = lastAnswerText.trim();
    if (!text) {
      setStatus("noAnswerToCopy");
      return;
    }

    await navigator.clipboard.writeText(text);
    setStatus("copied");
  });
  shadow.querySelector(".clear").addEventListener("click", () => {
    clearPromptAndAttachments();
    setAnswer("");
    setStatus("ready");
  });

  fillForm();
  refreshAuthorProfile();
  document.documentElement.appendChild(root);
  document.head.appendChild(toolbarStyle);
  document.documentElement.appendChild(glowOverlay);
  document.documentElement.appendChild(toolbarTooltip);
  document.documentElement.appendChild(quickMenu);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("pointerdown", onDocumentPointerDown);
  window.addEventListener("beforeunload", onBeforeUnload);
  window.addEventListener("resize", updateAnswerBottomButton);
  document.addEventListener("visibilitychange", onVisibilityChange);
  protectedAssistantEventTypes.forEach(type => window.addEventListener(type, protectAssistantInputEvent, true));
  toolbarObserver.observe(document.body, { childList: true, subtree: true });
  patchToolbars();

  window.DorionAIAssistant = {
    destroy() {
      saveForm();
      clearTimeout(saveFormTimer);
      clearTimeout(glowTimer);
      body.removeEventListener("scroll", updateAnswerBottomButton);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onDocumentPointerDown);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("resize", updateAnswerBottomButton);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      protectedAssistantEventTypes.forEach(type => window.removeEventListener(type, protectAssistantInputEvent, true));
      toolbarObserver.disconnect();
      toolbarStyle.remove();
      glowOverlay.remove();
      toolbarTooltip.remove();
      quickMenu.remove();
      root.remove();
    },
    open: openPanel,
    close: closePanel,
    toggle: togglePanel
  };

  console.log("[Dorion AI Assistant] loaded");
})();
