// Set env vars before any module is loaded
process.env.NODE_ENV             = 'test';
process.env.JWT_ACCESS_SECRET    = 'test-access-secret';
process.env.JWT_REFRESH_SECRET   = 'test-refresh-secret';
process.env.SUPABASE_URL         = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.STRIPE_SECRET_KEY    = 'sk_test_fake';
process.env.STRIPE_WEBHOOK_SECRET= 'whsec_fake';
process.env.RESEND_API_KEY       = 're_fake';
process.env.EMAIL_FROM           = 'test@bluework.app';
process.env.APP_URL              = 'http://localhost:3000';
process.env.STORAGE_BUCKET       = 'test-bucket';
