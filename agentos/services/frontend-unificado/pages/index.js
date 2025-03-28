import { useTheme } from '../contexts/ThemeContext'
import StripeCard from '../components/StripeCard'
import NotionBlock from '../components/NotionBlock'
import GitKrakenPanel from '../components/GitKrakenPanel'
import SuperhumanFeedback from '../components/SuperhumanFeedback'
import CommandPalette from '../components/CommandPalette'
import { useRouter } from 'next/router'

export default function Home() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const handleCommand = (cmd) => {
    if (cmd.includes('notion')) setTheme('notion')
    if (cmd.includes('stripe')) setTheme('stripe')
    if (cmd.includes('gitkraken')) setTheme('gitkraken')
    if (cmd.includes('superhuman')) setTheme('superhuman')
    if (cmd.includes('default')) setTheme('default')
  }

  return (
    <div className={
      theme === 'stripe' ? 'bg-stripeBlue text-white p-16 font-stripe' :
      theme === 'gitkraken' ? 'bg-[#121212] text-green-400 p-16' :
      theme === 'notion' ? 'bg-notionGray text-black p-16 font-notion' :
      theme === 'superhuman' ? 'bg-white text-gray-800 p-16 font-super' :
      'bg-white text-black p-16'
    }>
      <h1 className="text-4xl font-bold mb-8">face-agent: modo {theme || 'default'}</h1>

      {theme === 'stripe' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StripeCard title="Stripe Connect" content="Conecte com segurança e escale com confiança." />
          <StripeCard title="Stripe Atlas" content="Lance sua startup de qualquer lugar." />
        </div>
      )}

      {theme === 'notion' && (
        <div className="space-y-4">
          <NotionBlock title="Bloco de Texto" content="Este é um conteúdo editável com aparência Notion." />
          <NotionBlock title="Tarefa" content="✅ Finalizar layout do agente." />
        </div>
      )}

      {theme === 'gitkraken' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GitKrakenPanel title="Branch: main" status="Último commit: ✅ deploy" />
          <GitKrakenPanel title="Pipeline" status="Build em progresso..." />
        </div>
      )}

      {theme === 'superhuman' && (
        <div className="space-y-3">
          <SuperhumanFeedback message="✓ Mensagem enviada com sucesso." />
          <SuperhumanFeedback message="⌘K para abrir o Command Palette." />
        </div>
      )}

      {!theme || theme === 'default' && (
        <p className="mt-8 text-base">Use <code>?theme=stripe</code>, <code>?theme=notion</code>, <code>?theme=gitkraken</code> ou <code>?theme=superhuman</code> na URL.</p>
      )}

      <CommandPalette onCommand={handleCommand} />
    </div>
  )
}