# Equicord AI Assistant

AI Assistant для Discord-клиентов на базе Equicord и Dorion. Плагин добавляет личного ИИ-помощника с выбором провайдера, модели, локализации и API-ключа.

## Возможности

- выбор провайдера: OpenRouter, OpenAI, Groq, Mistral, DeepSeek или custom endpoint;
- выбор модели или свой `custom model ID`;
- локализация интерфейса на русском и английском;
- сохранение API-ключа локально в клиенте;
- прикрепление изображений и файлов к запросу;
- Markdown-ответы и отдельные блоки кода с кнопкой копирования;
- кнопка AI в тулбаре сообщений;
- вставка ответа в текущий чат;
- локальная память последних запросов и ответов;
- быстрые действия для сообщений: ответить, объяснить, переписать, сократить, перевести.
- Equicord-версия содержит автора `ress1zen`, ссылки на сайт/исходный код/профиль автора и те же основные AI-настройки, что Dorion-версия.

## Установка в Dorion

Скопируйте файл:

```text
dorion/ai-assistant.js
```

в папку плагинов Dorion:

```text
C:\Users\nemce\dorion\plugins\ai-assistant.js
```

Затем откройте `Dorion Settings -> Plugins`, включите `ai-assistant.js` и перезапустите Dorion.

## Установка в Equicord

Через скрипт:

```powershell
.\install-to-equicord.ps1 "C:\path\to\Equicord"
```

После этого в папке Equicord выполните:

```powershell
corepack pnpm install
corepack pnpm build
```

Если сборка Equicord не видит `pnpm`, временно добавьте wrapper из этого проекта в `PATH`:

```powershell
$env:PATH = "C:\path\to\EquicordAIAssistant\tools;$env:PATH"
corepack pnpm build
```

После сборки перезапустите Discord/Equicord и включите `AIAssistant` в настройках плагинов.

## Настройка

В меню плагина укажите:

- язык интерфейса;
- провайдера;
- модель;
- API-ключ;
- системный промпт;
- температуру;
- лимит токенов;
- включена ли локальная память.

Для OpenRouter обычно достаточно выбрать `OpenRouter` и модель `openrouter/auto`.

## Безопасность

API-ключ хранится только локально в настройках клиента. Не публикуйте свои локальные настройки, скриншоты с ключом или сборки, куда уже вручную вписан ключ.

Некоторые провайдеры могут блокировать прямые client-side запросы из-за CORS. Если запросы не проходят, используйте OpenRouter или свой OpenAI-compatible proxy endpoint.

## Проверка перед публикацией

```powershell
node --check .\dorion\ai-assistant.js
git status --short
```

## Автор

[ress1zen](https://github.com/ress1zen)
