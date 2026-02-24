class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

const Errors = {
  VALIDATION_ERROR:        (msg) => new AppError(400, 'VALIDATION_ERROR', msg),
  INVALID_OTP:             ()    => new AppError(400, 'INVALID_OTP', 'OTP is incorrect or expired.'),
  INVALID_RESET_TOKEN:     ()    => new AppError(400, 'INVALID_RESET_TOKEN', 'Reset token is invalid or expired.'),
  INVALID_TRANSITION:      ()    => new AppError(400, 'INVALID_TRANSITION', 'Status transition is not allowed from current state.'),
  JOB_NOT_COMPLETED:       ()    => new AppError(400, 'JOB_NOT_COMPLETED', 'Job must be completed before payment.'),
  NOT_CASH_PAYMENT:        ()    => new AppError(400, 'NOT_CASH_PAYMENT', 'Payment method is not cash.'),
  UNAUTHORIZED:            ()    => new AppError(401, 'UNAUTHORIZED', 'Authentication required.'),
  INVALID_CREDENTIALS:     ()    => new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.'),
  INVALID_REFRESH_TOKEN:   ()    => new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired.'),
  ACCOUNT_SUSPENDED:       ()    => new AppError(403, 'ACCOUNT_SUSPENDED', 'This account has been suspended.'),
  PENDING_APPROVAL:        ()    => new AppError(403, 'PENDING_APPROVAL', 'Worker account is pending admin approval.'),
  PENDING_VERIFICATION:    ()    => new AppError(403, 'PENDING_VERIFICATION', 'Please verify your phone number first.'),
  FORBIDDEN:               ()    => new AppError(403, 'FORBIDDEN', 'Access denied.'),
  NOT_FOUND:               (r)   => new AppError(404, `${r.toUpperCase()}_NOT_FOUND`, `${r} not found.`),
  NO_WORKERS_AVAILABLE:    ()    => new AppError(404, 'NO_WORKERS_AVAILABLE', 'No workers found in the area.'),
  OTP_EXPIRED:             ()    => new AppError(410, 'OTP_EXPIRED', 'OTP has expired.'),
  EMAIL_TAKEN:             ()    => new AppError(409, 'EMAIL_TAKEN', 'Email is already registered.'),
  PHONE_TAKEN:             ()    => new AppError(409, 'PHONE_TAKEN', 'Phone is already registered.'),
  ALREADY_PAID:            ()    => new AppError(409, 'ALREADY_PAID', 'Payment already processed for this job.'),
  JOB_ALREADY_TAKEN:       ()    => new AppError(409, 'JOB_ALREADY_TAKEN', 'Another worker has already accepted this job.'),
  DISPUTE_ALREADY_EXISTS:  ()    => new AppError(409, 'DISPUTE_ALREADY_EXISTS', 'A dispute already exists for this job.'),
  JOB_NOT_DISPUTABLE:      ()    => new AppError(422, 'JOB_NOT_DISPUTABLE', 'Job status does not allow disputes.'),
  JOB_CLOSED:              ()    => new AppError(422, 'JOB_CLOSED', 'This job is closed; chat is locked.'),
  CANCELLATION_WINDOW:     ()    => new AppError(422, 'CANCELLATION_WINDOW_EXPIRED', 'Job can no longer be cancelled.'),
  RATE_LIMITED:            ()    => new AppError(429, 'RATE_LIMITED', 'Too many requests. Please try again later.'),
};

module.exports = { AppError, Errors };
