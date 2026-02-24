jest.mock('../../../config/supabase');
jest.mock('../../../config/resend');

const supabase = require('../../../config/supabase');
const resend   = require('../../../config/resend');
const { makeChain } = require('../../helpers/supabase.mock');

const authService = require('../../../services/auth.service');
const { AppError } = require('../../../utils/errors');

// Helper: configure supabase.from to return different results per table
function setupFrom(tableMap) {
  supabase.from.mockImplementation((table) => makeChain(tableMap[table] ?? { data: null, error: null }));
}

describe('auth.service — register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws PHONE_TAKEN when phone already exists', async () => {
    setupFrom({ users: { data: { id: 'existing' }, error: null } });

    await expect(authService.register({
      role: 'customer', name: 'Test', phone: '+63917', password: 'pass1234',
    })).rejects.toMatchObject({ code: 'PHONE_TAKEN' });
  });

  it('throws EMAIL_TAKEN when email already exists', async () => {
    supabase.from.mockImplementationOnce(() => makeChain({ data: null, error: null }))  // phone check
               .mockImplementationOnce(() => makeChain({ data: { id: 'x' }, error: null })); // email check

    await expect(authService.register({
      role: 'customer', name: 'Test', email: 'dup@test.com', phone: '+63917', password: 'pass1234',
    })).rejects.toMatchObject({ code: 'EMAIL_TAKEN' });
  });
});

describe('auth.service — login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws INVALID_CREDENTIALS when user is not found', async () => {
    setupFrom({ users: { data: null, error: null } });

    await expect(authService.login({ identifier: 'nobody@test.com', password: 'x' }))
      .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('throws INVALID_CREDENTIALS when password is wrong', async () => {
    setupFrom({
      users: { data: { id: '1', password_hash: '$2b$12$invalid', status: 'active', role: 'customer' }, error: null },
    });

    await expect(authService.login({ identifier: 'test@test.com', password: 'wrongpass' }))
      .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('throws ACCOUNT_SUSPENDED for suspended users', async () => {
    const bcrypt = require('bcrypt');
    const hash   = await bcrypt.hash('correct', 12);
    setupFrom({ users: { data: { id: '1', password_hash: hash, status: 'suspended', role: 'customer' }, error: null } });

    await expect(authService.login({ identifier: 'test@test.com', password: 'correct' }))
      .rejects.toMatchObject({ code: 'ACCOUNT_SUSPENDED' });
  });

  it('throws PENDING_APPROVAL for workers awaiting review', async () => {
    const bcrypt = require('bcrypt');
    const hash   = await bcrypt.hash('correct', 12);
    setupFrom({ users: { data: { id: '1', password_hash: hash, status: 'pending_approval', role: 'worker' }, error: null } });

    await expect(authService.login({ identifier: 'worker@test.com', password: 'correct' }))
      .rejects.toMatchObject({ code: 'PENDING_APPROVAL' });
  });
});

describe('auth.service — sendOTP', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws NOT_FOUND when phone is not registered', async () => {
    setupFrom({ users: { data: null, error: null } });

    await expect(authService.sendOTP('+63900000000'))
      .rejects.toMatchObject({ code: 'USER_NOT_FOUND' });
  });
});

describe('auth.service — forgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resend.emails = { send: jest.fn().mockResolvedValue({}) };
  });

  it('does NOT throw when email is not found (silent behaviour)', async () => {
    setupFrom({ users: { data: null, error: null } });
    await expect(authService.forgotPassword('nobody@test.com')).resolves.toBeUndefined();
    expect(resend.emails.send).not.toHaveBeenCalled();
  });

  it('sends an email when the user exists', async () => {
    supabase.from
      .mockImplementationOnce(() => makeChain({ data: { id: '1', name: 'Maria' }, error: null })) // user lookup
      .mockImplementationOnce(() => makeChain({ data: {}, error: null }));                         // insert token

    await authService.forgotPassword('maria@test.com');
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'maria@test.com', subject: expect.stringContaining('password') })
    );
  });
});

describe('auth.service — resetPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws INVALID_RESET_TOKEN when token is not found or expired', async () => {
    setupFrom({ password_reset_tokens: { data: null, error: null } });

    await expect(authService.resetPassword({ token: 'bad-token', password: 'NewPass1!' }))
      .rejects.toMatchObject({ code: 'INVALID_RESET_TOKEN' });
  });
});
