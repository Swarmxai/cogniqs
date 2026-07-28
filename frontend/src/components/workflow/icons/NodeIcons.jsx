/**
 * NodeIcons — Icon mapping for workflow nodes (ported from mindscrybe).
 */

import {
  Play,
  MousePointer2,
  Globe,
  Pencil,
  GitBranch,
  Code,
  Shuffle,
  GitMerge,
  Link,
  Clock,
  CornerDownLeft,
  Bot,
  BrainCircuit,
  Database,
  FileText,
  Scissors,
  Search,
  MessageSquare,
  MessageCircle,
  Zap,
  StickyNote,
  Mail,
  Webhook,
  Settings,
  Cpu,
  Wrench,
  HardDrive,
  Activity,
  Calculator,
  BookOpen,
  Filter,
  ArrowUpDown,
  Repeat,
  Lock,
  Layers,
  AlertTriangle,
  Terminal,
  Tag,
  Minus,
  XCircle,
  Copy,
  Briefcase,
  CheckCircle,
  Server,
  Rocket,
  Download,
  BarChart3,
  LineChart,
  TrendingUp,
  SlidersHorizontal,
  ShoppingCart,
  Gauge,
  Radio,
  Star,
  Sparkles,
  Gem,
  Cloud,
  Wind,
  Box,
  Eye,
} from 'lucide-react';

/* ─── Custom brand SVG icons ─────────────────────────────────────────────── */

/* ─── Provider logos (PNG assets in /public/providers/, same as mindscrybe) ─ */

function ProviderLogo({ src, alt, size = 18 }) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ borderRadius: Math.max(4, size * 0.22), objectFit: 'contain' }}
    />
  );
}

function OpenAIIcon({ size = 18 }) {
  return <ProviderLogo src="/providers/openai.png" alt="OpenAI" size={size} />;
}

function AnthropicIcon({ size = 18 }) {
  return <ProviderLogo src="/providers/anthropic.png" alt="Anthropic" size={size} />;
}

function GoogleIcon({ size = 18 }) {
  return <ProviderLogo src="/providers/gemini.png" alt="Google Gemini" size={size} />;
}

function AzureIcon({ size = 18 }) {
  return <ProviderLogo src="/providers/azure-openai.png" alt="Azure OpenAI" size={size} />;
}

function GroqIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#f55036" />
      <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="system-ui, sans-serif">G</text>
    </svg>
  );
}

function DeepSeekIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#4D6BFE" />
      <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="system-ui, sans-serif">DS</text>
    </svg>
  );
}

function MistralIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#ff7000" />
      <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="system-ui, sans-serif">M</text>
    </svg>
  );
}

function OllamaIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#3ab54a" />
      <rect x="5" y="5" width="14" height="5" rx="1.5" fill="#fff" opacity=".9" />
      <rect x="5" y="14" width="14" height="5" rx="1.5" fill="#fff" opacity=".9" />
      <circle cx="8" cy="7.5" r="1" fill="#3ab54a" />
      <circle cx="8" cy="16.5" r="1" fill="#3ab54a" />
      <rect x="11" y="7" width="5" height="1" rx=".5" fill="#3ab54a" opacity=".4" />
      <rect x="11" y="16" width="5" height="1" rx=".5" fill="#3ab54a" opacity=".4" />
    </svg>
  );
}

function SlackIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z" fill="#ECB22E"/>
      <path d="M6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#ECB22E"/>
      <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834z" fill="#2EB67D"/>
      <path d="M8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#2EB67D"/>
      <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834z" fill="#E01E5A"/>
      <path d="M17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#E01E5A"/>
      <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52z" fill="#36C5F0"/>
      <path d="M15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#36C5F0"/>
    </svg>
  );
}

function TelegramIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#0088cc"/>
      <path d="M5.5 11.8l2.9 1.1 1.1 3.6c.1.2.3.3.5.2l1.6-1.3 3.1 2.3c.2.2.5.1.6-.2l2.2-9.1c.1-.3-.2-.6-.5-.5L5.2 11c-.3.1-.3.5.3.8zm3.9 1.5l5.7-3.5-3.7 4c-.1.1-.1.2-.1.3l-.2 1.4-.7-2.2h-1z" fill="#ffffff"/>
    </svg>
  );
}

function LangChainIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill={color} opacity="0.15" />
      <path d="M15.5 7.5C15.5 7.5 14 6 12 6s-4 2-4 4.5c0 2 1 3 1 3l-1.5 1.5s-1 1.5 0 3 3 1 3 1l1.5-1.5s1.5.5 3-.5 1.5-3 1.5-3l1-2s.5-2-.5-3l-1.5-1z" fill={color} opacity="0.7" />
      <circle cx="10.5" cy="10" r="1" fill={color} />
      <path d="M8 16l1-1m6-6l1.5-1.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function MicrosoftTeamsIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.5 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" fill="#5059C9"/>
      <path d="M17 10h3.25C21.216 10 22 10.784 22 11.75v5.5C22 19.321 20.321 21 18.25 21h-.016C16.216 21 14.5 19.284 14.5 17.234V11a1 1 0 0 1 1-1h1.5z" fill="#5059C9"/>
      <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="#7B83EB"/>
      <path d="M14 12H4a1 1 0 0 0-1 1v5.5C3 20.538 4.343 22 6 22h6c1.657 0 3-1.462 3-3.25V13a1 1 0 0 0-1-1z" fill="#7B83EB"/>
      <path opacity="0.1" d="M9.5 11H14a1 1 0 0 1 1 1v6.25C15 20.321 13.321 22 11.25 22H6c-.195 0-.388-.014-.578-.04A3.251 3.251 0 0 0 8 20.25v-7.5A1.75 1.75 0 0 1 9.5 11z" fill="#000"/>
    </svg>
  );
}

function MicrosoftOutlookIcon({ size = 18 }) {
  return (
    <img src="/providers/outlook.png" width={size} height={size} alt="Outlook" style={{ objectFit: 'contain' }} />
  );
}

/* ─── Icon map ───────────────────────────────────────────────────────────── */

const ICON_MAP = {
  'play-circle': Play,
  play: Play,
  'mouse-pointer-2': MousePointer2,
  globe: Globe,
  'edit-3': Pencil,
  edit: Pencil,
  'git-branch': GitBranch,
  code: Code,
  shuffle: Shuffle,
  'git-merge': GitMerge,
  link: Link,
  clock: Clock,
  'corner-down-left': CornerDownLeft,
  activity: Activity,

  bot: Bot,
  brain: BrainCircuit,
  'message-square': MessageSquare,
  'message-circle': MessageCircle,
  cpu: Cpu,
  eye: Eye,
  box: Box,

  wrench: Wrench,
  calculator: Calculator,
  'book-open': BookOpen,
  server: Server,

  database: Database,
  'hard-drive': HardDrive,
  'file-text': FileText,
  scissors: Scissors,
  search: Search,
  'bar-chart': BarChart3,
  'bar-chart-2': BarChart3,
  'line-chart': LineChart,
  'trending-up': TrendingUp,
  'sliders-horizontal': SlidersHorizontal,
  'shopping-cart': ShoppingCart,
  gauge: Gauge,
  radio: Radio,
  'scatter-chart': Activity,

  filter: Filter,
  'arrow-up-down': ArrowUpDown,
  layers: Layers,
  copy: Copy,
  tag: Tag,

  repeat: Repeat,
  'alert-triangle': AlertTriangle,
  'x-circle': XCircle,
  minus: Minus,
  terminal: Terminal,
  lock: Lock,

  rocket: Rocket,
  download: Download,

  zap: Zap,
  'sticky-note': StickyNote,
  mail: Mail,
  webhook: Webhook,
  settings: Settings,
  briefcase: Briefcase,
  'check-circle': CheckCircle,
  star: Star,
  sparkles: Sparkles,
  gem: Gem,
  cloud: Cloud,
  wind: Wind,

  openai: OpenAIIcon,
  slack: SlackIcon,
  telegram: TelegramIcon,
  langchain: LangChainIcon,
  anthropic: AnthropicIcon,
  google: GoogleIcon,
  gemini: GoogleIcon,
  groq: GroqIcon,
  ollama: OllamaIcon,
  azure: AzureIcon,
  mistral: MistralIcon,
  deepseek: DeepSeekIcon,
  'microsoft-teams': MicrosoftTeamsIcon,
  'microsoft-outlook': MicrosoftOutlookIcon,
};

export function NodeIcon({ name, size = 18, color, className }) {
  const IconComponent = ICON_MAP[name] || Zap;
  return <IconComponent size={size} color={color} className={className} />;
}

export default ICON_MAP;
