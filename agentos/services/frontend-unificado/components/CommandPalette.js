import { useEffect, useState } from 'react'

export default function CommandPalette({ onCommand }) {
  const [open, setOpen] = useState(false)
  const [command, setCommand] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    onCommand(command)
    setOpen(false)
    setCommand('')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-md shadow-lg p-6">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Digite um comando..."
            className="w-full border border-gray-300 rounded px-4 py-2"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            autoFocus
          />
        </form>
      </div>
    </div>
  )
}