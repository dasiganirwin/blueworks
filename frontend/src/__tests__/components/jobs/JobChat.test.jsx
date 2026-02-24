import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobChat } from '@/components/jobs/JobChat';

jest.mock('@/lib/api', () => ({
  jobsApi: {
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
  },
}));

jest.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: jest.fn(),
}));

import { jobsApi } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';

const MSG_ME    = { id: 'm-1', sender_id: 'user-001', sender_name: 'Jane',  content: 'Hello!' };
const MSG_OTHER = { id: 'm-2', sender_id: 'worker-1', sender_name: 'Pedro', content: 'On the way.' };

beforeEach(() => {
  jest.clearAllMocks();
  // Re-establish safe defaults after clearAllMocks
  useWebSocket.mockReturnValue({ subscribeToJob: jest.fn() });
  jobsApi.getMessages.mockResolvedValue({ data: { data: [] } });
});

describe('JobChat', () => {
  it('renders empty state when no messages', async () => {
    render(<JobChat jobId="job-1" currentUserId="user-001" />);
    await waitFor(() => expect(screen.getByText('No messages yet.')).toBeInTheDocument());
  });

  it('renders messages after load', async () => {
    jobsApi.getMessages.mockResolvedValue({ data: { data: [MSG_ME, MSG_OTHER] } });
    render(<JobChat jobId="job-1" currentUserId="user-001" />);
    await waitFor(() => expect(screen.getByText('Hello!')).toBeInTheDocument());
    expect(screen.getByText('On the way.')).toBeInTheDocument();
  });

  it('shows sender name for messages from others', async () => {
    jobsApi.getMessages.mockResolvedValue({ data: { data: [MSG_OTHER] } });
    render(<JobChat jobId="job-1" currentUserId="user-001" />);
    await waitFor(() => expect(screen.getByText('Pedro')).toBeInTheDocument());
  });

  it('does not show own sender name', async () => {
    jobsApi.getMessages.mockResolvedValue({ data: { data: [MSG_ME] } });
    render(<JobChat jobId="job-1" currentUserId="user-001" />);
    await waitFor(() => expect(screen.getByText('Hello!')).toBeInTheDocument());
    expect(screen.queryByText('Jane')).not.toBeInTheDocument();
  });

  it('calls getMessages and subscribeToJob on mount', async () => {
    const subscribeToJob = jest.fn();
    useWebSocket.mockReturnValue({ subscribeToJob });

    render(<JobChat jobId="job-1" currentUserId="user-001" />);
    await waitFor(() => expect(jobsApi.getMessages).toHaveBeenCalledWith('job-1'));
    expect(subscribeToJob).toHaveBeenCalledWith('job-1');
  });

  it('sends a message and clears the input', async () => {
    jobsApi.sendMessage.mockResolvedValue({
      data: { id: 'm-3', sender_id: 'user-001', content: 'New msg', sender_name: 'Jane' },
    });

    render(<JobChat jobId="job-1" currentUserId="user-001" />);
    await waitFor(() => screen.getByPlaceholderText(/type a message/i));

    const input = screen.getByPlaceholderText(/type a message/i);
    await userEvent.type(input, 'New msg');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(jobsApi.sendMessage).toHaveBeenCalledWith('job-1', 'New msg'));
    expect(input).toHaveValue('');
  });

  it('Send button is disabled when input is empty', async () => {
    render(<JobChat jobId="job-1" currentUserId="user-001" />);
    await waitFor(() => screen.getByRole('button', { name: /send/i }));
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('appends a message received via WebSocket', async () => {
    let wsHandler;
    useWebSocket.mockImplementation((handlers) => {
      wsHandler = handlers['message.received'];
      return { subscribeToJob: jest.fn() };
    });

    render(<JobChat jobId="job-1" currentUserId="user-001" />);
    await waitFor(() => expect(screen.getByText('No messages yet.')).toBeInTheDocument());

    act(() => {
      wsHandler({ message: { id: 'm-ws', sender_id: 'worker-1', sender_name: 'Pedro', content: 'WS message!' } });
    });

    expect(screen.getByText('WS message!')).toBeInTheDocument();
  });
});
