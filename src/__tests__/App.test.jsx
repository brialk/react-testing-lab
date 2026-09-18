import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../components/App'; 
const mockTransactions = [
  { id: 1, description: 'Groceries', amount: 50.00, category: 'Food', date: '2026-09-01' },
  { id: 2, description: 'Gasoline', amount: 35.00, category: 'Transport', date: '2026-09-03' },
  { id: 3, description: 'Salary', amount: 2000.00, category: 'Income', date: '2026-09-01' }
];

describe('Banking Application Testing Suite', () => {
  let dynamicTransactions;

  beforeEach(() => {
    vi.restoreAllMocks();
    dynamicTransactions = [...mockTransactions];
    
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (!options || options.method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(dynamicTransactions),
        });
      }
      if (options.method === 'POST') {
        const body = JSON.parse(options.body);
        const newTransaction = { id: 4, ...body };
        dynamicTransactions.push(newTransaction);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(newTransaction),
        });
      }
      return Promise.reject(new Error('Unhandled Mock Request'));
    });
  });

  // ==========================================
  // 1. DISPLAY TRANSACTIONS TEST
  // ==========================================
  it('should display transactions on startup', async () => {
    render(<App />);

    const firstTransaction = await screen.findByText('Groceries');
    const secondTransaction = screen.getByText('Gasoline');

    expect(firstTransaction).toBeInTheDocument();
    expect(secondTransaction).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalled();
  });

  // ==========================================
  // 2. ADD TRANSACTIONS TEST
  // ==========================================
  it('should add a new transaction to the frontend and trigger a POST request', async () => {
    const { container } = render(<App />);
    
    await screen.findByText('Groceries');

    // Select the form element directly
    const formElement = container.querySelector('form.ui.form');

    // Fill out inputs using explicit placeholder text matchers
    const dateInput = container.querySelector('input[type="date"]');
    const descInput = screen.getByPlaceholderText('Description');
    const categoryInput = screen.getByPlaceholderText('Category');
    const amountInput = screen.getByPlaceholderText('Amount');

    fireEvent.change(dateInput, { target: { value: '2026-09-18' } });
    fireEvent.change(descInput, { target: { value: 'Coffee' } });
    fireEvent.change(categoryInput, { target: { value: 'Food' } });
    fireEvent.change(amountInput, { target: { value: '5.50' } });

    // Submit via the form element directly to ensure e.target properties are passed accurately
    fireEvent.submit(formElement);

    // Wait for the new element to render dynamically in the DOM table
    const newTransaction = await screen.findByText('Coffee');
    expect(newTransaction).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Coffee')
      })
    );
  });

  // ==========================================
  // 3. SEARCH & SORT TRANSACTIONS TEST
  // ==========================================
  it('should trigger a change event and update the page via search input filtering', async () => {
    render(<App />);
    
    await screen.findByText('Groceries');

    const searchInput = screen.getByPlaceholderText('Search your Recent Transactions');
    fireEvent.change(searchInput, { target: { value: 'Gas' } });

    expect(screen.getByText('Gasoline')).toBeInTheDocument();
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
  });
});
