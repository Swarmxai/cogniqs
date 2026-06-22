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
} from 'lucide-react';

/* ─── Custom brand SVG icons ─────────────────────────────────────────────── */

function OpenAIIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.042 6.042 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.998 5.998 0 0 0 3.997-2.9 6.042 6.042 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"
        fill={color}
      />
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

function AnthropicIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.827 3.52h3.404L24 20.48h-3.404L13.827 3.52zM6.769 3.52L0 20.48h3.45l1.404-3.588h7.08l1.404 3.588h3.45L10.018 3.52H6.769zm.627 10.642L9.394 8.2l1.998 5.962H7.396z" fill={color} />
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

function GoogleIcon({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill={color || '#4285F4'} />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill={color || '#34A853'} />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill={color || '#FBBC05'} />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill={color || '#EA4335'} />
    </svg>
  );
}

/* ─── Icon map ───────────────────────────────────────────────────────────── */

const ICON_MAP = {
  'play-circle': Play,
  'mouse-pointer-2': MousePointer2,
  globe: Globe,
  'edit-3': Pencil,
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
  cpu: Cpu,

  wrench: Wrench,
  calculator: Calculator,
  'book-open': BookOpen,
  server: Server,

  database: Database,
  'hard-drive': HardDrive,
  'file-text': FileText,
  scissors: Scissors,
  search: Search,
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

  openai: OpenAIIcon,
  slack: SlackIcon,
  telegram: TelegramIcon,
  langchain: LangChainIcon,
  anthropic: AnthropicIcon,
  google: GoogleIcon,
  'microsoft-teams': MicrosoftTeamsIcon,
  'microsoft-outlook': MicrosoftOutlookIcon,
};

export function NodeIcon({ name, size = 18, color, className }) {
  const IconComponent = ICON_MAP[name] || Zap;
  return <IconComponent size={size} color={color} className={className} />;
}

export default ICON_MAP;
