import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionForm from '../components/TransactionForm';

vi.mock('../api/client', () => ({
  api: {
    getStocks: vi.fn(),
    addStock: vi.fn(),
    addTransaction: vi.fn(),
  },
}));

import { api } from '../api/client';

const mockedApi = vi.mocked(api);

describe('TransactionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.getStocks.mockResolvedValue([]);
  });

  it('auto-registers ticker and saves transaction with success message', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    mockedApi.addStock.mockResolvedValue({
      stock: {
        id: 1,
        ticker: 'AAPL',
        name: 'Apple Inc.',
        market: 'US',
        currency: 'USD',
        created_at: '2024-01-01',
      },
      validationWarning: 'offline',
    });

    mockedApi.addTransaction.mockResolvedValue({
      id: 10,
      stock_id: 1,
      type: 'BUY',
      quantity: 3,
      price: 100,
      fee: 0,
      traded_at: '2024-06-01T00:00:00.000Z',
      memo: null,
      stock_name: 'Apple Inc.',
      currency: 'USD',
    });

    render(<TransactionForm onSuccess={onSuccess} />);

    await user.type(screen.getByPlaceholderText(/새 종목 티커/), 'AAPL');
    await user.type(screen.getByLabelText('수량'), '3');
    await user.type(screen.getByLabelText('단가'), '100');
    await user.click(screen.getByRole('button', { name: '거래 저장' }));

    await waitFor(() => {
      expect(mockedApi.addStock).toHaveBeenCalledWith({ ticker: 'AAPL' });
      expect(mockedApi.addTransaction).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });

    expect(screen.getByRole('status')).toHaveTextContent(/저장되었습니다/);
  });

  it('shows error when quantity and price are missing', async () => {
    const user = userEvent.setup();
    render(<TransactionForm onSuccess={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '거래 저장' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/수량과 가격/);
    expect(mockedApi.addTransaction).not.toHaveBeenCalled();
  });
});
