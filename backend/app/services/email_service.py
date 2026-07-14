import smtplib
import random
import logging
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


def generate_otp() -> str:
    return "".join(random.choices("0123456789", k=6))


def send_email_sync(to_email: str, subject: str, html_content: str):
    # ─── Brevo HTTP API (Prioritized) ─────────────────────────────────────────
    if settings.BREVO_API_KEY:
        try:
            from_email = settings.SMTP_FROM or "onboarding@brevo.com"

            response = requests.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "accept": "application/json",
                    "api-key": settings.BREVO_API_KEY,
                    "content-type": "application/json",
                },
                json={
                    "sender": {"name": settings.APP_NAME, "email": from_email},
                    "to": [{"email": to_email}],
                    "subject": subject,
                    "htmlContent": html_content,
                },
                timeout=10,
            )
            if response.status_code >= 200 and response.status_code < 300:
                logger.info(
                    "Email sent successfully to %s via Brevo API", to_email)
            else:
                logger.error("Failed to send email to %s via Brevo API: %s %s",
                             to_email, response.status_code, response.text)
        except Exception as e:
            logger.error(
                "Failed to send email to %s via Brevo API: %s", to_email, e)
        return

    # ─── Legacy SMTP Fallback ─────────────────────────────────────────────────
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            "Neither Brevo nor SMTP credentials configured — skipping email to %s", to_email
        )
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = to_email

    part = MIMEText(html_content, "html")
    msg.attach(part)

    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(msg["From"], [to_email], msg.as_string())
        server.quit()
        logger.info("Email sent successfully to %s", to_email)
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, e)


def send_otp_email(to_email: str, username: str, otp: str):
    subject = f"{otp} is your verification code - {settings.APP_NAME}"

    if settings.DEBUG:
        # Only log OTP codes in development — never in production
        logger.debug("[DEV] Verification code for %s: %s", to_email, otp)

    html_content = f"""
    <html>
        <body style="font-family: sans-serif; background-color: #f8fafc; padding: 24px; margin: 0;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
                <div style="font-size: 28px; margin-bottom: 20px; text-align: center;">🛡️</div>
                <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-align: center;">Verify your email</h1>
                <p style="font-size: 14px; color: #64748b; margin-bottom: 24px; text-align: center;">Hi {username}, use the verification code below to verify your email address. This code will expire in 10 minutes.</p>
                <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center; letter-spacing: 6px; font-family: monospace; font-size: 32px; font-weight: 700; color: #1e3a8a;">
                    {otp}
                </div>
                <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
                    If you didn't request this code, you can safely ignore this email.
                </p>
            </div>
        </body>
    </html>
    """
    send_email_sync(to_email, subject, html_content)


def send_password_reset_email(to_email: str, username: str, otp: str):
    subject = f"{otp} is your password reset code - {settings.APP_NAME}"

    if settings.DEBUG:
        # Only log reset codes in development — never in production
        logger.debug("[DEV] Password reset code for %s: %s", to_email, otp)

    html_content = f"""
    <html>
        <body style="font-family: sans-serif; background-color: #f8fafc; padding: 24px; margin: 0;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
                <div style="font-size: 28px; margin-bottom: 20px; text-align: center;">🔑</div>
                <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-align: center;">Reset your password</h1>
                <p style="font-size: 14px; color: #64748b; margin-bottom: 24px; text-align: center;">Hi {username}, we received a request to reset your password. Use the verification code below to proceed. This code will expire in 15 minutes.</p>
                <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center; letter-spacing: 6px; font-family: monospace; font-size: 32px; font-weight: 700; color: #991b1b;">
                    {otp}
                </div>
                <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
                    If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
            </div>
        </body>
    </html>
    """
    send_email_sync(to_email, subject, html_content)
