import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { LlmConfig } from './LlmConfig';
import { systemConfigApi } from '../../api/systemConfigApi';

vi.mock('../../api/systemConfigApi', () => ({
  systemConfigApi: {
    getLlmConfig: vi.fn(),
    updateLlmConfig: vi.fn(),
  },
}));

describe('LlmConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads masked api key as placeholder and does not resubmit it when unchanged', async () => {
    vi.mocked(systemConfigApi.getLlmConfig).mockResolvedValue({
      apiUrl: 'https://api.example.com',
      apiKey: 'sk***89',
      model: 'gpt-test',
    });
    vi.mocked(systemConfigApi.updateLlmConfig).mockResolvedValue();

    const { container } = render(<LlmConfig fullPage />);

    const apiUrlInput = await screen.findByDisplayValue('https://api.example.com');
    const modelInput = await screen.findByDisplayValue('gpt-test');
    const passwordInput = container.querySelector('input[placeholder="sk***89"]');

    expect(apiUrlInput).toBeInTheDocument();
    expect(modelInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();

    fireEvent.change(apiUrlInput, { target: { value: 'https://api.changed.com' } });
    fireEvent.click(screen.getByRole('button', { name: '保存配置' }));

    await waitFor(() => {
      expect(systemConfigApi.updateLlmConfig).toHaveBeenCalledWith({
        apiUrl: 'https://api.changed.com',
        model: 'gpt-test',
      });
    });
  });
});
