// services/controllers.js
export function authenticateAccess(req, res) {
  res.json({ success: true, message: 'Acesso autorizado' });
}
