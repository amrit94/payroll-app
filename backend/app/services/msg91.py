import os
import sys
import json
import logging
import requests

# Resolve backend directory in search path to import config module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
import config as backend_config

logger = logging.getLogger("uvicorn.error")

def send_otp_email(email: str, otp: str):
    auth_key = backend_config.MSG91_AUTH_KEY
    email_from = backend_config.MSG91_EMAIL_FROM
    email_domain = backend_config.MSG91_EMAIL_DOMAIN
    msg91_otp_template_id = "global_otp"
    
    # Check if MSG91 is properly configured
    if not auth_key:
        # Development fallback mode
        logger.info(f"\n============================================\n*** [DEV MODE OTP] Send OTP to: {email} -> {otp} ***\n============================================\n")
        return True
        
    # Standard modern MSG91 API Payload
    url = "https://control.msg91.com/api/v5/email/send"
    
    # Extract domain from from_email if domain is not set explicitly
    if not email_domain and "@" in email_from:
        email_domain = email_from.split("@")[1]
        
    payload = {
        "recipients": [
            {
                "to": [{"email": email}],
                "variables": {"otp": otp}
            }
        ],
        "from": {
            "email": email_from
        },
        "domain": email_domain,
        "template_id": msg91_otp_template_id
    }
    
    headers = {
        'accept': 'application/json',
        "Content-Type": "application/JSON",
        "authkey": auth_key
    }
    
    try:
        data = json.dumps(payload)
        response = requests.post(url, headers=headers, data=data, timeout=10)
        logger.info(f"MSG91 Email API Response status: {response.status_code}, response: {response.text}")
        response.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Failed to send email OTP via MSG91 API: {str(e)}")
        # Print fallback to console so developers/users don't get locked out
        logger.info(f"\n============================================\n*** [FALLBACK MODE OTP] Send OTP to: {email} -> {otp} (Msg91 Error) ***\n============================================\n")
        return True
