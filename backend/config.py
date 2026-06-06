from decouple import config

MODE = config('MODE', 'dev')
if MODE == 'dev':
    MSG91_AUTH_KEY = config('MSG91_AUTH_KEY_dev', '')
    MSG91_EMAIL_FROM = config('MSG91_EMAIL_FROM_dev', '')
    MSG91_EMAIL_DOMAIN = config('MSG91_EMAIL_DOMAIN_dev', '')
    DATABASE_URL = config('DATABASE_URL_dev', 'sqlite:///./payroll.db')
    ALLOWED_ORIGINS = config('ALLOWED_ORIGINS_dev', '')
    ALLOW_ALL_CORS = config('ALLOW_ALL_CORS_dev', '')
    CORS_ORIGINS = config('CORS_ORIGINS_dev', '')
    ALLOWED_EMAILS = config('ALLOWED_EMAILS_dev', '')
else:
    MSG91_AUTH_KEY = config('MSG91_AUTH_KEY', '')
    MSG91_EMAIL_FROM = config('MSG91_EMAIL_FROM', '')
    MSG91_EMAIL_DOMAIN = config('MSG91_EMAIL_DOMAIN', '')
    DATABASE_URL = config('DATABASE_URL', '')
    ALLOWED_ORIGINS = config('ALLOWED_ORIGINS', '')
    ALLOW_ALL_CORS = config('ALLOW_ALL_CORS', '')
    CORS_ORIGINS = config('CORS_ORIGINS', '')
    ALLOWED_EMAILS = config('ALLOWED_EMAILS', '')

JWT_SECRET = config('JWT_SECRET', '')
