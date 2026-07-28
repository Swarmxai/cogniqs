/** Provider brand marks — PNG assets from /public/providers/ (Mindscrybe parity) */

export const ProviderImg = ({ src, alt }) => (
  <img src={src} alt={alt} width="24" height="24" style={{ borderRadius: 5, objectFit: 'cover' }} />
)

export const OpenAILogo = () => <ProviderImg src="/providers/openai.png" alt="OpenAI" />
export const AzureLogo = () => <ProviderImg src="/providers/azure-openai.png" alt="Azure OpenAI" />
export const AnthropicLogo = () => <ProviderImg src="/providers/anthropic.png" alt="Anthropic" />
export const GeminiLogo = () => <ProviderImg src="/providers/gemini.png" alt="Google Gemini" />

export const GroqLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect width="24" height="24" rx="6" fill="#f55036" />
    <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="system-ui">G</text>
  </svg>
)

export const DeepSeekLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect width="24" height="24" rx="6" fill="#4D6BFE" />
    <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700" fontFamily="system-ui">DS</text>
  </svg>
)

export const MistralLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect width="24" height="24" rx="6" fill="#ff7000" />
    <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="system-ui">M</text>
  </svg>
)

export const SelfHostedLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect width="24" height="24" rx="6" fill="#3ab54a" />
    <rect x="5" y="5" width="14" height="5" rx="1.5" fill="#fff" opacity=".9" />
    <rect x="5" y="14" width="14" height="5" rx="1.5" fill="#fff" opacity=".9" />
  </svg>
)
