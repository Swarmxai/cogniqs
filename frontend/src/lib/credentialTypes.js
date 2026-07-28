/**
 * Credential type definitions — ported from Mindscrybe provider vault.
 * Each type declares dynamic form fields stored encrypted in `data`.
 */

import {
  OpenAILogo, AzureLogo, AnthropicLogo, GeminiLogo,
  GroqLogo, DeepSeekLogo, MistralLogo, SelfHostedLogo,
} from '../components/credentials/ProviderLogos'

export const CREDENTIAL_PURPOSES = [
  { value: 'general', label: 'General Purpose', description: 'Use for any task (chat, embedding, vision, etc.)' },
  { value: 'chat', label: 'Chat / Completion', description: 'LLM inference, chat completions, text generation' },
  { value: 'embedding', label: 'Embedding', description: 'Text embedding and vector search' },
  { value: 'vision', label: 'Vision', description: 'Image understanding and multimodal tasks' },
]

/** Node / legacy type aliases → vault UI type */
export const TYPE_ALIAS = {
  openaiApiKey: 'openai',
  azureOpenAiApiKey: 'azure_openai',
  azureOpenAI: 'azure_openai',
  azureOpenAiEmbedding: 'azure_openai_embedding',
  anthropicApiKey: 'anthropic',
  googleAiApiKey: 'google_gemini',
  google: 'google_gemini',
  groqApiKey: 'groq',
  mistralApiKey: 'mistral',
  deepseekApiKey: 'deepseek',
  ollama: 'self_hosted',
  azureVisionOcr: 'azure_vision_ocr',
}

export const resolveCredType = (t) => TYPE_ALIAS[t] || t

export const CREDENTIAL_TYPES = [
  {
    value: 'openai',
    label: 'OpenAI',
    icon: OpenAILogo,
    color: '#10a37f',
    description: 'GPT-4o, GPT-4, GPT-3.5 and DALL·E models',
    agentProviders: ['openai'],
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'sk-...', secret: true, required: true },
      { key: 'organization', label: 'Organization ID', placeholder: 'org-... (optional)', secret: false, required: false },
    ],
  },
  {
    value: 'azure_openai',
    label: 'Azure OpenAI (Chat / Vision)',
    icon: AzureLogo,
    color: '#0078d4',
    description: 'GPT-4o, GPT-4o-mini — chat, completion, and vision on Azure',
    agentProviders: ['azure'],
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Azure API key', secret: true, required: true },
      { key: 'endpoint', label: 'Endpoint', placeholder: 'https://xxx.openai.azure.com/', secret: false, required: true },
      { key: 'deployment', label: 'Deployment Name', placeholder: 'gpt-4o-mini', secret: false, required: true },
      { key: 'apiVersion', label: 'API Version', placeholder: '2023-05-15', secret: false, required: false, defaultValue: '2024-02-01' },
    ],
  },
  {
    value: 'azure_openai_embedding',
    label: 'Azure OpenAI (Embedding)',
    icon: AzureLogo,
    color: '#005a9e',
    description: 'text-embedding-ada-002, text-embedding-3-small on Azure',
    agentProviders: [],
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Azure API key', secret: true, required: true },
      { key: 'endpoint', label: 'Endpoint', placeholder: 'https://xxx.openai.azure.com/', secret: false, required: true },
      { key: 'deployment', label: 'Deployment Name', placeholder: 'text-embedding-3-small', secret: false, required: true },
      { key: 'apiVersion', label: 'API Version', placeholder: '2023-05-15', secret: false, required: false, defaultValue: '2024-02-01' },
    ],
  },
  {
    value: 'azure_vision_ocr',
    label: 'Azure Document Intelligence (OCR)',
    icon: AzureLogo,
    color: '#0284c7',
    description: 'Form Recognizer Read API — extracts printed and handwritten text from images, PDFs, and documents',
    agentProviders: [],
    fields: [
      { key: 'apiKey', label: 'Subscription Key', placeholder: 'Form Recognizer subscription key', secret: true, required: true },
      { key: 'endpoint', label: 'Endpoint', placeholder: 'https://xxx.cognitiveservices.azure.com/', secret: false, required: true },
      { key: 'apiVersion', label: 'API Version', placeholder: '2024-11-30', secret: false, required: false, defaultValue: '2024-11-30' },
    ],
  },
  {
    value: 'anthropic',
    label: 'Anthropic',
    icon: AnthropicLogo,
    color: '#d97706',
    description: 'Claude 3.5 Sonnet, Claude 3 Opus, Haiku',
    agentProviders: ['anthropic'],
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'sk-ant-...', secret: true, required: true },
    ],
  },
  {
    value: 'google_gemini',
    label: 'Google Gemini',
    icon: GeminiLogo,
    color: '#4285f4',
    description: 'Gemini Pro, Flash, and multimodal models',
    agentProviders: ['gemini'],
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'AI...', secret: true, required: true },
      { key: 'projectId', label: 'Project ID', placeholder: 'my-gcp-project (optional)', secret: false, required: false },
    ],
  },
  {
    value: 'groq',
    label: 'Groq',
    icon: GroqLogo,
    color: '#f55036',
    description: 'Llama 3, Mixtral — fast inference on Groq LPUs',
    agentProviders: ['groq'],
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'gsk_...', secret: true, required: true },
    ],
  },
  {
    value: 'deepseek',
    label: 'DeepSeek',
    icon: DeepSeekLogo,
    color: '#4D6BFE',
    description: 'DeepSeek-V3, DeepSeek-Coder, DeepSeek-R1',
    agentProviders: ['deepseek'],
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'sk-...', secret: true, required: true },
    ],
  },
  {
    value: 'mistral',
    label: 'Mistral AI',
    icon: MistralLogo,
    color: '#ff7000',
    description: 'Mistral Large, Codestral, Pixtral',
    agentProviders: ['mistral'],
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'API key from console.mistral.ai', secret: true, required: true },
    ],
  },
  {
    value: 'self_hosted',
    label: 'Self-Hosted',
    icon: SelfHostedLogo,
    color: '#3ab54a',
    description: 'Ollama, vLLM, LM Studio — any OpenAI-compatible endpoint',
    agentProviders: ['ollama'],
    fields: [
      { key: 'baseUrl', label: 'Base URL', placeholder: 'http://localhost:11434/v1', secret: false, required: true, defaultValue: 'http://localhost:11434/v1' },
      { key: 'apiKey', label: 'API Key', placeholder: 'Optional for local models', secret: true, required: false },
      { key: 'model', label: 'Default Model', placeholder: 'llama3.2, mistral, etc.', secret: false, required: false },
    ],
  },
]

export function getCredTypeDef(typeValue) {
  return CREDENTIAL_TYPES.find((t) => t.value === resolveCredType(typeValue))
}

export function credentialsForAgentProvider(provider, creds) {
  return creds.filter((c) => {
    const def = getCredTypeDef(c.type)
    return def?.agentProviders?.includes(provider)
  })
}
