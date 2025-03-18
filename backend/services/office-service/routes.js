import express from 'express';
import {
  getPeople,
  createPerson,
  rfidAuthenticate,
  checkin,
  checkout,
  rfidCheckin,
  getChecklist,
  updateChecklist,
  getStockStatus,
  getMoneyStatus,
  recordDeposit,
  getShifts,
  createShift,
  updateShift,
  getPayments,
  createPayment,
  updatePaymentStatus
} from './controllers.js';

const router = express.Router();

// Rotas de colaboradores
router.get('/people', getPeople);
router.post('/people', createPerson);
router.post('/people/rfid', rfidAuthenticate);
router.post('/people/checkin', checkin);
router.post('/people/checkout', checkout);
router.post('/people/rfid-checkin', rfidCheckin);

// Rotas de Checklist
router.get('/checklist', getChecklist);
router.post('/checklist', updateChecklist);

// Rotas de Estoque (Estoque Raio X)
router.get('/stock', getStockStatus);

// Rotas de Controle Financeiro
router.get('/money', getMoneyStatus);
router.post('/money/deposit', recordDeposit);

// Rotas de Turnos (Horários)
router.get('/shifts', getShifts);
router.post('/shifts', createShift);
router.put('/shifts/:id', updateShift);

// Rotas de Pagamentos
router.get('/payments', getPayments);
router.post('/payments', createPayment);
router.put('/payments/:id', updatePaymentStatus);

export default router;