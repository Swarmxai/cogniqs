/**
 * Cogniqs node & category branding — names, icons, colors, and panel order.
 */

export const PANEL_SECTIONS = [
  {
    id: 'build',
    title: 'Build with intelligence',
    categories: ['ai', 'ml', 'analysis'],
  },
  {
    id: 'automate',
    title: 'Automate & connect',
    categories: ['action', 'transform', 'logic', 'core'],
  },
  {
    id: 'govern',
    title: 'Govern & launch',
    categories: ['human_review', 'trigger'],
  },
]

/** Main picker categories — reordered and renamed for Cogniqs */
export const CATEGORY_BRAND = {
  ai: {
    key: 'ai',
    label: 'Intelligent agents',
    icon: 'brain',
    color: '#6366f1',
    description: 'Autonomous agents, document Q&A, and generative workflows',
  },
  ml: {
    key: 'ml',
    label: 'Model studio',
    icon: 'rocket',
    color: '#8b5cf6',
    description: 'Open Auto ML to train models, or add training blocks from here',
  },
  analysis: {
    key: 'analysis',
    label: 'Data insights',
    icon: 'line-chart',
    color: '#f97316',
    description: 'Explore, compare, detect anomalies, and evaluate forecasts',
  },
  action: {
    key: 'action',
    label: 'App connectors',
    icon: 'globe',
    color: '#2563eb',
    description: 'Sync with Slack, email, sheets, and external services',
  },
  transform: {
    key: 'transform',
    label: 'Data shaping',
    icon: 'shuffle',
    color: '#f59e0b',
    description: 'Filter, map, merge, and reshape records in flight',
  },
  logic: {
    key: 'logic',
    label: 'Control flow',
    icon: 'git-branch',
    color: '#a855f7',
    description: 'Branch, loop, merge paths, and orchestrate decisions',
  },
  core: {
    key: 'core',
    label: 'Primitives',
    icon: 'terminal',
    color: '#64748b',
    description: 'HTTP calls, custom code, variables, and webhooks',
  },
  human_review: {
    key: 'human_review',
    label: 'Human gate',
    icon: 'check-circle',
    color: '#14b8a6',
    description: 'Pause for approval in Slack, Teams, or chat before continuing',
  },
  trigger: {
    key: 'trigger',
    label: 'Extra starters',
    icon: 'radio',
    color: '#6366f1',
    description: 'Add another entry point to this workflow',
  },
}

export const POPULAR_BRAND = {
  label: 'Quick picks',
  icon: 'star',
  color: '#f59e0b',
  description: 'Hand-picked blocks to get productive fast',
}

/** AI drill-down — reordered */
export const AI_SUB_BRAND = [
  { key: 'ai_agent', label: 'Agent cores', description: 'Planner agents and supervisors', icon: 'bot', color: '#6366f1', filter: (n) => n.name === 'ai_agent' || n.name === 'supervisor_agent' },
  { key: 'ai_model', label: 'Language models', description: 'OpenAI, Gemini, Groq, Ollama, Azure', icon: 'cpu', color: '#06b6d4', filter: (n) => n.group === 'ai_model' },
  { key: 'ai_chains', label: 'Reasoning chains', description: 'QA, RAG, summarization, classification, OCR', icon: 'activity', color: '#7c6cff', filter: (n) => ['basic_llm_chain', 'qa_chain', 'summarization_chain', 'information_extractor', 'text_classifier', 'sentiment_analysis', 'rag_document_qa', 'document_ingest', 'multimodal_ingest', 'multimodal_rag_qa', 'vision_ocr'].includes(n.name) },
  { key: 'ai_tool', label: 'Toolkits', description: 'HTTP, code, calculators, and utilities', icon: 'wrench', color: '#10b981', filter: (n) => n.group === 'ai_tool' },
  { key: 'ai_memory', label: 'Context memory', description: 'Short and long-term conversation stores', icon: 'database', color: '#ec4899', filter: (n) => n.group === 'ai_memory' },
  { key: 'ai_embedding', label: 'Embeddings', description: 'Turn text into searchable vectors', icon: 'layers', color: '#14b8a6', filter: (n) => n.group === 'ai_embedding' },
  { key: 'ai_vectorStore', label: 'Vector vaults', description: 'Persist and query embedding indexes', icon: 'hard-drive', color: '#8b5cf6', filter: (n) => n.group === 'ai_vectorStore' },
  { key: 'ai_retriever', label: 'Retrievers', description: 'Fetch the most relevant context chunks', icon: 'search', color: '#f59e0b', filter: (n) => n.group === 'ai_retriever' },
  { key: 'ai_outputParser', label: 'Output shaping', description: 'Structured JSON and list parsers', icon: 'code', color: '#0ea5e9', filter: (n) => n.group === 'ai_outputParser' },
]

export const TRIGGER_OPTIONS_BRAND = [
  { id: 'manual', label: 'On-demand run', nodeName: 'manual_trigger', icon: 'play-circle', showArrow: false, description: 'Start the flow with a single click — ideal for testing.' },
  { id: 'chat', label: 'Chat message', nodeName: 'chat_trigger', icon: 'message-square', showArrow: false, description: 'Kick off when a user sends a message to your assistant.' },
  { id: 'schedule', label: 'Scheduled run', nodeName: 'schedule_trigger', icon: 'clock', showArrow: false, description: 'Run on a cron, interval, or daily timetable.' },
  { id: 'webhook', label: 'Inbound webhook', nodeName: 'webhook_trigger', icon: 'webhook', showArrow: false, description: 'Listen for HTTP POST payloads from any system.' },
  { id: 'api', label: 'API gateway', nodeName: 'api_trigger', icon: 'zap', showArrow: false, description: 'Expose a REST entrypoint for programmatic triggers.' },
  { id: 'app-event', label: 'App event (soon)', nodeName: null, icon: 'activity', showArrow: true, description: 'React to Notion, Airtable, Telegram, and more.' },
  { id: 'form', label: 'Form submit (soon)', nodeName: null, icon: 'file-text', showArrow: false, description: 'Collect form responses and pipe them into the flow.' },
  { id: 'subworkflow', label: 'Nested workflow (soon)', nodeName: null, icon: 'git-merge', showArrow: false, description: 'Invoked from another Cogniqs workflow.' },
  { id: 'teams', label: 'Teams signal (soon)', nodeName: null, icon: 'microsoft-teams', showArrow: false, description: 'Microsoft Teams integration coming soon.' },
  { id: 'other', label: 'Error & misc', nodeName: 'error_trigger', icon: 'alert-triangle', showArrow: true, description: 'Catch workflow faults and alternate entry paths.' },
]

/** Canvas node group labels */
export const GROUP_BRAND = {
  trigger: { label: 'Starter', color: '#6366f1' },
  action: { label: 'Connector', color: '#2563eb' },
  transform: { label: 'Shaping', color: '#f59e0b' },
  logic: { label: 'Control', color: '#a855f7' },
  ai_model: { label: 'LLM', color: '#06b6d4' },
  ai_tool: { label: 'Toolkit', color: '#10b981' },
  ai_memory: { label: 'Memory', color: '#ec4899' },
  ai_embedding: { label: 'Embed', color: '#14b8a6' },
  ai_vectorStore: { label: 'Vectors', color: '#8b5cf6' },
  ai_retriever: { label: 'Retrieve', color: '#f59e0b' },
  ai_outputParser: { label: 'Parser', color: '#0ea5e9' },
  analysis: { label: 'Insight', color: '#f97316' },
  ml: { label: 'Model', color: '#8b5cf6' },
  human_review: { label: 'Human gate', color: '#14b8a6' },
}

export const AI_SLOT_BRAND = {
  ai_languageModel: { label: 'Language model', color: '#06b6d4' },
  ai_agent: { label: 'Agent core', color: '#6366f1' },
  ai_tool: { label: 'Toolkit', color: '#10b981' },
  ai_memory: { label: 'Memory', color: '#ec4899' },
  ai_outputParser: { label: 'Parser', color: '#0ea5e9' },
  ai_embedding: { label: 'Embeddings', color: '#14b8a6' },
  ai_embeddings: { label: 'Embeddings', color: '#14b8a6' },
  ai_vectorStore: { label: 'Vector vault', color: '#8b5cf6' },
  ai_retriever: { label: 'Retriever', color: '#f59e0b' },
}

/** Per-node display overrides */
export const NODE_BRAND = {
  // Triggers
  manual_trigger: { displayName: 'On-demand start', icon: 'play-circle', description: 'Begin the workflow manually from the editor.' },
  chat_trigger: { displayName: 'Chat opener', icon: 'message-square', description: 'Starts when a user sends a chat message.' },
  schedule_trigger: { displayName: 'Scheduler', icon: 'clock', description: 'Runs on a repeating timetable.' },
  webhook_trigger: { displayName: 'Webhook listener', icon: 'webhook', description: 'Accepts inbound HTTP requests.' },
  api_trigger: { displayName: 'API gateway', icon: 'zap', description: 'Expose a REST entrypoint for programmatic triggers.' },
  error_trigger: { displayName: 'Error catcher', icon: 'alert-triangle', description: 'Fires when another workflow step fails.' },
  slack_trigger: { displayName: 'Slack event', icon: 'slack', description: 'Starts on an inbound Slack message or event.' },
  telegram_trigger: { displayName: 'Telegram event', icon: 'telegram', description: 'Starts on an inbound Telegram update.' },

  // Data / shaping
  set_node: { displayName: 'Assign values', icon: 'tag', description: 'Set or merge fields on the payload.' },
  filter_node: { displayName: 'Filter items', icon: 'filter', description: 'Keep only items that match a condition.' },
  sort_node: { displayName: 'Sort items', icon: 'arrow-up-down', description: 'Order records by a field.' },
  limit_node: { displayName: 'Limit items', icon: 'layers', description: 'Cap how many items continue downstream.' },
  remove_duplicates_node: { displayName: 'Deduplicate', icon: 'copy', description: 'Drop duplicate records by key.' },
  aggregate_node: { displayName: 'Aggregate', icon: 'layers', description: 'Group and summarize item lists.' },
  document_loader: { displayName: 'Load document', icon: 'file-text', description: 'Load text or file content into the flow.' },
  text_splitter: { displayName: 'Split text', icon: 'scissors', description: 'Chunk long text for embeddings and RAG.' },

  // Logic / control
  if_node: { displayName: 'Branch gate', icon: 'git-branch', description: 'Route items down true or false paths.' },
  switch_node: { displayName: 'Switch routes', icon: 'git-branch', description: 'Multi-way branching on a value.' },
  merge_node: { displayName: 'Merge paths', icon: 'git-merge', description: 'Combine parallel branches.' },
  loop_node: { displayName: 'Loop over items', icon: 'repeat', description: 'Iterate a list item by item.' },
  code_node: { displayName: 'Custom script', icon: 'code', description: 'Run Python logic inline.' },
  wait_node: { displayName: 'Wait / delay', icon: 'clock', description: 'Pause the flow for a duration.' },
  noop_node: { displayName: 'No-op', icon: 'box', description: 'Pass-through placeholder block.' },
  stop_and_error_node: { displayName: 'Stop with error', icon: 'x-circle', description: 'Halt the run and raise an error.' },
  human_approval: { displayName: 'Human approval', icon: 'check-circle', description: 'Pause until a reviewer approves.' },

  // Integrations / connectors
  http_request: { displayName: 'HTTP call', icon: 'globe', description: 'Send REST requests to any API.' },
  database_query: { displayName: 'Database query', icon: 'database', description: 'Run SQL against a saved connection.' },
  email_send: { displayName: 'Send email', icon: 'mail', description: 'Deliver an outbound email message.' },
  email_read: { displayName: 'Read email', icon: 'mail', description: 'Fetch messages from an inbox.' },
  slack_send_message: { displayName: 'Slack message', icon: 'slack', description: 'Post a message to a Slack channel.' },
  telegram_send_message: { displayName: 'Telegram message', icon: 'telegram', description: 'Send a Telegram bot message.' },
  respond_webhook: { displayName: 'Webhook response', icon: 'webhook', description: 'Return an HTTP response to the caller.' },
  execute_workflow: { displayName: 'Run workflow', icon: 'play-circle', description: 'Invoke another Cogniqs workflow.' },

  // AI
  ai_agent: { displayName: 'Cogniqs agent', icon: 'bot', description: 'Autonomous multi-step reasoning block.' },
  supervisor_agent: { displayName: 'Supervisor agent', icon: 'bot', description: 'Coordinate multiple child agents.' },
  basic_llm_chain: { displayName: 'Prompt chain', icon: 'activity', description: 'Single-shot LLM prompt with template.' },
  qa_chain: { displayName: 'Q&A chain', icon: 'search', description: 'Answer a question with an LLM.' },
  summarization_chain: { displayName: 'Summarize', icon: 'file-text', description: 'Condense long text with an LLM.' },
  rag_document_qa: { displayName: 'Document Q&A', icon: 'book-open', description: 'Answer questions over ingested files.' },
  document_ingest: { displayName: 'Ingest docs', icon: 'file-text', description: 'Load PDFs and text into a vector index.' },
  multimodal_ingest: { displayName: 'Multimodal ingest', icon: 'layers', description: 'Index text plus image metadata.' },
  multimodal_rag_qa: { displayName: 'Multimodal Q&A', icon: 'search', description: 'Ask questions over multimodal collections.' },
  vision_ocr: { displayName: 'Azure Vision OCR', icon: 'eye', description: 'Extract printed and handwritten text with bounding boxes.' },
  information_extractor: { displayName: 'Extract fields', icon: 'scissors', description: 'Pull structured fields from free text.' },
  text_classifier: { displayName: 'Classify text', icon: 'filter', description: 'Label text into categories via LLM.' },
  sentiment_analysis: { displayName: 'Sentiment', icon: 'activity', description: 'Score positive / negative / neutral tone.' },

  // Tools / memory / vectors
  tool_calculator: { displayName: 'Calculator tool', icon: 'calculator', description: 'Evaluate math expressions for agents.' },
  tool_code: { displayName: 'Code tool', icon: 'code', description: 'Run sandboxed code as an agent tool.' },
  tool_wikipedia: { displayName: 'Wikipedia tool', icon: 'book-open', description: 'Look up Wikipedia summaries.' },
  http_tool: { displayName: 'HTTP tool', icon: 'globe', description: 'Let agents call an HTTP endpoint.' },
  memory_buffer: { displayName: 'Buffer memory', icon: 'database', description: 'Keep recent chat turns in memory.' },
  memory_token_buffer: { displayName: 'Token buffer', icon: 'database', description: 'Memory capped by token budget.' },
  conversation_memory: { displayName: 'Conversation memory', icon: 'message-square', description: 'Persist dialogue history.' },
  vector_store_in_memory: { displayName: 'In-memory vectors', icon: 'layers', description: 'Ephemeral vector index for the run.' },
  vector_store_chromadb: { displayName: 'ChromaDB store', icon: 'database', description: 'Persist embeddings in ChromaDB.' },
  retriever_vector_store: { displayName: 'Vector retriever', icon: 'search', description: 'Fetch top-k similar chunks.' },
  output_parser_list: { displayName: 'List parser', icon: 'layers', description: 'Parse LLM output into a list.' },
  output_parser_structured: { displayName: 'JSON parser', icon: 'code', description: 'Parse LLM output into structured JSON.' },

  // ML
  dataset_config: { displayName: 'Dataset config', icon: 'database', description: 'Bind an uploaded dataset into the flow.' },
  eda_report: { displayName: 'Explore dataset', icon: 'bar-chart-2', description: 'Automated EDA summary and charts.' },
  anomaly_detection: { displayName: 'Anomaly scan', icon: 'gauge', description: 'Flag outliers across numeric columns.' },
  time_series_forecast: { displayName: 'Forecast series', icon: 'trending-up', description: 'Project future values from history.' },
  time_series_studio: { displayName: 'Time series studio', icon: 'line-chart', description: 'Explore seasonal patterns and trends.' },
  clustering_suite: { displayName: 'Clustering', icon: 'git-branch', description: 'Group similar rows automatically.' },
  feature_transform: { displayName: 'Feature transform', icon: 'shuffle', description: 'Engineer features for modeling.' },
  data_preprocessing: { displayName: 'Preprocess data', icon: 'filter', description: 'Clean and prepare tabular data.' },
  dataset_merge: { displayName: 'Merge datasets', icon: 'git-merge', description: 'Join multiple datasets together.' },
  drift_monitor: { displayName: 'Drift monitor', icon: 'gauge', description: 'Detect distribution shifts over time.' },
  fft_analysis: { displayName: 'FFT analysis', icon: 'activity', description: 'Frequency-domain signal analysis.' },
  market_basket: { displayName: 'Market basket', icon: 'shopping-cart', description: 'Association-rule mining on baskets.' },
  model_evaluation: { displayName: 'Evaluate model', icon: 'check-circle', description: 'Score a trained model on holdout data.' },
  model_training: { displayName: 'Train model', icon: 'cpu', description: 'Kick off AutoML / tabular training.' },
  model_inference: { displayName: 'Run inference', icon: 'zap', description: 'Score new rows with a trained model.' },
  model_deployment: { displayName: 'Deploy model', icon: 'rocket', description: 'Publish a trained model endpoint.' },
}

/** Distinct provider icons for language-model blocks (avoids repeated zap fallback). */
export const LLM_NODE_BRAND = {
  llm_openai: { icon: 'openai' },
  llm_anthropic: { icon: 'anthropic' },
  llm_gemini: { icon: 'google' },
  llm_groq: { icon: 'groq' },
  llm_ollama: { icon: 'ollama' },
  llm_azure: { icon: 'azure' },
  llm_mistral: { icon: 'mistral' },
  llm_deepseek: { icon: 'deepseek' },
}

export const POPULAR_NODE_NAMES = [
  'http_request', 'code_node', 'set_node', 'if_node', 'ai_agent',
  'llm_openai', 'webhook_trigger', 'schedule_trigger', 'basic_llm_chain',
  'eda_report', 'anomaly_detection', 'time_series_forecast',
]

export const ANALYSIS_NODE_NAMES = new Set([
  'eda_report', 'dataset_merge', 'feature_transform', 'clustering_suite',
  'anomaly_detection', 'drift_monitor', 'time_series_studio', 'time_series_forecast',
  'fft_analysis', 'market_basket', 'model_evaluation',
])

export const AI_CHAIN_NAMES = [
  'basic_llm_chain', 'qa_chain', 'summarization_chain', 'information_extractor',
  'text_classifier', 'sentiment_analysis', 'rag_document_qa', 'document_ingest',
  'multimodal_ingest', 'multimodal_rag_qa', 'vision_ocr',
]

export const AI_GROUPS = [
  'ai_model', 'ai_tool', 'ai_memory', 'ai_embedding',
  'ai_vectorStore', 'ai_retriever', 'ai_outputParser',
]

export function isAnalysisNode(desc) {
  return desc?.group === 'analysis' || ANALYSIS_NODE_NAMES.has(desc?.name)
}

/** Apply Cogniqs branding onto a node description from the API */
export function applyNodeBrand(meta) {
  if (!meta) return meta
  const brand = { ...(LLM_NODE_BRAND[meta.name] || {}), ...(NODE_BRAND[meta.name] || {}) }
  if (!Object.keys(brand).length) return meta
  return {
    ...meta,
    displayName: brand.displayName || meta.displayName,
    icon: brand.icon || meta.icon,
    description: brand.description || meta.description,
  }
}

export function getGroupBrand(group) {
  return GROUP_BRAND[group] || { label: 'Block', color: '#6366f1' }
}

export function getCategoryBrand(key) {
  return CATEGORY_BRAND[key] || { label: key, icon: 'zap', color: '#6366f1', description: '' }
}
