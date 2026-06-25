import { describe, it, expect } from 'vitest';
import { ContractIds } from './ids';
import { isContractEnvelope, unwrapContract } from './response';

describe('contract response', () => {
  it('unwraps contract envelope', () => {
    const body = {
      contractId: ContractIds.TRANSACTIONS_LIST,
      data: [{ id: 1 }],
    };
    const data = unwrapContract<typeof body.data>(body, ContractIds.TRANSACTIONS_LIST);
    expect(data).toEqual([{ id: 1 }]);
  });

  it('detects contract envelope', () => {
    expect(isContractEnvelope({ contractId: 'x', data: {} })).toBe(true);
    expect(isContractEnvelope({ id: 1 })).toBe(false);
  });

  it('throws on contract mismatch', () => {
    const body = { contractId: ContractIds.STOCKS_LIST, data: [] };
    expect(() => unwrapContract(body, ContractIds.TRANSACTIONS_LIST)).toThrow(
      /Contract mismatch/,
    );
  });

  it('passes through legacy body without envelope', () => {
    expect(unwrapContract({ id: 1 })).toEqual({ id: 1 });
  });
});
