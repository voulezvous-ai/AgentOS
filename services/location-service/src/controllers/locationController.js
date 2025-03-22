
const { Location } = require('../models/Location');

/**
 * O estafeta dá consentimento para rastreamento apenas uma vez.
 */
async function giveTrackingConsent(req, res) {
  const { courierId } = req.body;

  if (!courierId) {
    return res.status(400).json({ error: 'courierId é obrigatório.' });
  }

  try {
    await Location.findOneAndUpdate(
      { courierId },
      { consentGiven: true },
      { upsert: true, new: true }
    );

    res.json({ message: 'Consentimento salvo. Rastreamento ativado.' });
  } catch (error) {
    console.error('Erro ao registrar consentimento:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

module.exports = { giveTrackingConsent };
