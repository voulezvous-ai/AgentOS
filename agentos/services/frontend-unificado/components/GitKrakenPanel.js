export default function GitKrakenPanel({ title, status }) {
  return (
    <div className="bg-gitkrakenBg text-gitGreen border border-green-500 rounded p-4 shadow-lg font-mono">
      <h3 className="text-base font-bold">{title}</h3>
      <p className="text-xs mt-1 text-green-300">{status}</p>
    </div>
  )
}