import type { ContractId } from '../contracts/ids';

export interface ContractEnvelope<T> {
  contractId: ContractId;
  data: T;
}

export interface ContractErrorEnvelope {
  contractId: ContractId;
  error: string;
}

export function isContractEnvelope<T>(body: unknown): body is ContractEnvelope<T> {
  return (
    typeof body === 'object' &&
    body !== null &&
    'contractId' in body &&
    'data' in body
  );
}

export function unwrapContract<T>(body: unknown, expectedContractId?: ContractId): T {
  if (isContractEnvelope<T>(body)) {
    if (expectedContractId && body.contractId !== expectedContractId) {
      throw new Error(
        `Contract mismatch: expected ${expectedContractId}, got ${body.contractId}`,
      );
    }
    return body.data;
  }
  return body as T;
}
