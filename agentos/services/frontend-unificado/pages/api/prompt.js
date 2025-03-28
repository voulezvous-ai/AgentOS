export default function handler(req, res) {
  const { prompt } = req.body
  const response = `Recebido: "${prompt}". Esta é uma resposta gerada pelo PromptOS.`
  res.status(200).json({ response })
}