import Person from './models/personModel.js';
import Attendance from './models/attendanceModel.js';
import Shift from './models/shiftModel.js';
import Checklist from './models/checklistModel.js';
import Stock from './models/stockModel.js';
import Money from './models/moneyModel.js';
import Payment from './models/paymentModel.js';
import { AppError } from '../../common/utils/errorHandler.js';

/* ----- COLABORADORES ----- */

export async function getPeople(req, res, next) {
  try {
    const people = await Person.find();
    res.json(people);
  } catch (error) {
    next(new AppError('Erro ao buscar pessoas', 500));
  }
}

export async function createPerson(req, res, next) {
  try {
    const { name, email, rfid, role, accountNumber } = req.body;
    const newPerson = new Person({ name, email, rfid, role, accountNumber });
    await newPerson.save();
    res.status(201).json(newPerson);
  } catch (error) {
    next(new AppError('Erro ao criar pessoa', 500));
  }
}

export async function rfidAuthenticate(req, res, next) {
  try {
    const { rfid } = req.body;
    if (!rfid) return next(new AppError("RFID não fornecido", 400));
    const person = await Person.findOne({ rfid });
    if (person) {
      res.json({ success: true, message: "Pessoa autenticada via RFID", person });
    } else {
      next(new AppError("Pessoa não encontrada", 404));
    }
  } catch (error) {
    next(new AppError("Erro na autenticação via RFID", 500));
  }
}

export async function checkin(req, res, next) {
  try {
    const { user_id } = req.body;
    // Aqui o Vox pode disparar o comando para registrar o check-in via Attendance.
    res.status(201).json({ success: true, message: `Check-in realizado para ${user_id}` });
  } catch (error) {
    next(new AppError('Erro ao registrar check-in', 500));
  }
}

export async function checkout(req, res, next) {
  try {
    const { user_id } = req.body;
    res.json({ success: true, message: `Check-out realizado para ${user_id}` });
  } catch (error) {
    next(new AppError('Erro ao registrar check-out', 500));
  }
}

export async function rfidCheckin(req, res, next) {
  try {
    const { rfid, confirmations, shiftId } = req.body;
    if (!rfid || confirmations === undefined) {
      return next(new AppError("RFID e confirmações são obrigatórios.", 400));
    }
    const person = await Person.findOne({ rfid });
    if (!person) return next(new AppError("RFID não encontrado.", 404));

    let minConfirmations = 2;
    if (confirmations >= 10) {
      minConfirmations = 1;
    } else if (confirmations < 5) {
      minConfirmations = 3;
    }

    if (confirmations >= minConfirmations) {
      const attendance = new Attendance({
        shiftId,
        userId: person._id,
        checkInTime: new Date()
      });
      await attendance.save();
      return res.status(201).json({
        success: true,
        message: `Check-in realizado para ${person.name} com ${confirmations} confirmações (mínimo exigido: ${minConfirmations}).`,
        attendance
      });
    } else {
      return next(new AppError(`Confirmações insuficientes: ${confirmations} (mínimo exigido: ${minConfirmations}).`, 400));
    }
  } catch (error) {
    next(new AppError("Erro ao registrar check-in via RFID", 500));
  }
}

/* ----- TURNOS (SHIFT) ----- */

export async function getShifts(req, res, next) {
  try {
    const shifts = await Shift.find().populate('assignedTo');
    res.json(shifts);
  } catch (error) {
    next(new AppError('Erro ao buscar turnos', 500));
  }
}

export async function createShift(req, res, next) {
  try {
    const { date, startTime, endTime, role, assignedTo } = req.body;
    const shift = new Shift({ date, startTime, endTime, role, assignedTo });
    await shift.save();
    res.status(201).json(shift);
  } catch (error) {
    next(new AppError('Erro ao criar turno', 500));
  }
}

export async function updateShift(req, res, next) {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const shift = await Shift.findByIdAndUpdate(id, updatedData, { new: true });
    if (!shift) return next(new AppError('Turno não encontrado', 404));
    res.json(shift);
  } catch (error) {
    next(new AppError('Erro ao atualizar turno', 500));
  }
}

/* ----- CHECKLIST ----- */

export async function getChecklist(req, res, next) {
  try {
    const { userId, date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    const checklist = await Checklist.findOne({
      userId,
      date: {
        $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
        $lte: new Date(queryDate.setHours(23, 59, 59, 999))
      }
    });
    res.json(checklist || { message: "Checklist não encontrado para hoje." });
  } catch (error) {
    next(new AppError("Erro ao buscar checklist", 500));
  }
}

export async function updateChecklist(req, res, next) {
  try {
    const { userId, tasks } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checklist = await Checklist.findOneAndUpdate(
      { userId, date: { $gte: today, $lte: new Date(today.getTime() + 86399999) } },
      { tasks },
      { upsert: true, new: true }
    );
    res.json(checklist);
  } catch (error) {
    next(new AppError("Erro ao atualizar checklist", 500));
  }
}

/* ----- ESTOQUE (STOCK) ----- */

export async function getStockStatus(req, res, next) {
  try {
    const stock = await Stock.findOne().sort({ date: -1 });
    res.json(stock || { message: "Dados de estoque não disponíveis." });
  } catch (error) {
    next(new AppError("Erro ao buscar status do estoque", 500));
  }
}

/* ----- CONTROLE FINANCEIRO (MONEY) ----- */

export async function getMoneyStatus(req, res, next) {
  try {
    const money = await Money.findOne().sort({ date: -1 });
    res.json({
      currentCash: money ? money.currentCash : 0,
      details: money
    });
  } catch (error) {
    next(new AppError("Erro ao buscar status financeiro", 500));
  }
}

export async function recordDeposit(req, res, next) {
  try {
    const { amount } = req.body;
    if (amount <= 0) return next(new AppError("Valor de depósito inválido.", 400));
    let money = await Money.findOne().sort({ date: -1 });
    if (!money) return next(new AppError("Registro financeiro não encontrado.", 404));
    money.deposit += amount;
    await money.save();
    res.json({ success: true, message: "Depósito registrado.", currentCash: money.currentCash });
  } catch (error) {
    next(new AppError("Erro ao registrar depósito", 500));
  }
}

/* ----- PAGAMENTOS ----- */

export async function getPayments(req, res, next) {
  try {
    const { userId } = req.query;
    const query = userId ? { userId } : {};
    const payments = await Payment.find(query).populate('userId').populate('shiftId');
    res.json(payments);
  } catch (error) {
    next(new AppError("Erro ao buscar pagamentos", 500));
  }
}

export async function createPayment(req, res, next) {
  try {
    const { userId, shiftId, amount } = req.body;
    if (!userId || !amount) return next(new AppError("Dados insuficientes para registrar pagamento", 400));
    const payment = new Payment({ userId, shiftId, amount });
    await payment.save();
    res.status(201).json(payment);
  } catch (error) {
    next(new AppError("Erro ao criar pagamento", 500));
  }
}

export async function updatePaymentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['pendente', 'pago'].includes(status)) {
      return next(new AppError("Status de pagamento inválido", 400));
    }
    const payment = await Payment.findByIdAndUpdate(id, { status }, { new: true });
    if (!payment) return next(new AppError("Pagamento não encontrado", 404));
    res.json(payment);
  } catch (error) {
    next(new AppError("Erro ao atualizar pagamento", 500));
  }
}

/* 
  IMPORTANTE: O Vox é o controlador central que orquestra todas as operações.
  Por meio do Vox, comandos de voz ou texto disparam as rotas deste módulo, que
  integram cadastro, autenticação, registro de presença, escalas, checklists,
  estoque, controle financeiro e pagamentos, fornecendo uma visão unificada do escritório.
*/