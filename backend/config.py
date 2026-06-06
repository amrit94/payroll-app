from decouple import config

MODE = config('MODE', 'dev')
MSG91_AUTH_KEY = config('MSG91_AUTH_KEY', '')
MSG91_EMAIL_FROM = config('MSG91_EMAIL_FROM', '')
MSG91_EMAIL_DOMAIN = config('MSG91_EMAIL_DOMAIN', '')
MSG91_TEMPLATE_ID = config('MSG91_TEMPLATE_ID', '')
JWT_SECRET = config('JWT_SECRET', '')
