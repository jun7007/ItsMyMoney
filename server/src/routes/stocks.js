import { Router } from 'express';
import { ContractIds, sendContract, sendContractError } from 'shared/contracts';
import { listStocks, getStockById, createStock, deleteStock } from '../services/stocksService.js';

const router = Router();

router.get('/', (_req, res) => {
  sendContract(res, ContractIds.STOCKS_LIST, listStocks());
});

router.get('/:id', (req, res) => {
  const stock = getStockById(req.params.id);
  if (!stock) {
    return sendContractError(res, ContractIds.STOCKS_GET, 'Stock not found', 404);
  }
  sendContract(res, ContractIds.STOCKS_GET, stock);
});

router.post('/', async (req, res) => {
  const result = await createStock(req.body);
  if (!result.ok) {
    return sendContractError(res, ContractIds.STOCKS_CREATE, result.error, result.status);
  }
  sendContract(
    res,
    ContractIds.STOCKS_CREATE,
    { stock: result.stock, validationWarning: result.validationWarning },
    201,
  );
});

router.delete('/:id', (req, res) => {
  const result = deleteStock(req.params.id);
  if (!result.ok) {
    return sendContractError(res, ContractIds.STOCKS_DELETE, result.error, result.status);
  }
  sendContract(res, ContractIds.STOCKS_DELETE, { success: true });
});

export default router;
