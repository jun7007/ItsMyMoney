import { Router } from 'express';
import { ContractIds, sendContract, sendContractError } from 'shared/contracts';
import {
  listTransactions,
  createTransaction,
  deleteTransaction,
} from '../services/transactionsService.js';

const router = Router();

router.get('/', (req, res) => {
  const transactions = listTransactions({
    stock_id: req.query.stock_id,
    from: req.query.from,
    to: req.query.to,
  });
  sendContract(res, ContractIds.TRANSACTIONS_LIST, transactions);
});

router.post('/', (req, res) => {
  const result = createTransaction(req.body);
  if (!result.ok) {
    return sendContractError(res, ContractIds.TRANSACTIONS_CREATE, result.error, result.status);
  }
  sendContract(res, ContractIds.TRANSACTIONS_CREATE, result.transaction, 201);
});

router.delete('/:id', (req, res) => {
  const result = deleteTransaction(req.params.id);
  if (!result.ok) {
    return sendContractError(res, ContractIds.TRANSACTIONS_DELETE, result.error, result.status);
  }
  sendContract(res, ContractIds.TRANSACTIONS_DELETE, { success: true });
});

export default router;
