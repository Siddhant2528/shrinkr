import pytest
from unittest.mock import patch, MagicMock
from app.services.email_service import send_email_sync, settings

@pytest.fixture
def restore_settings():
    # Save original settings
    orig_brevo_key = settings.BREVO_API_KEY
    orig_smtp_user = settings.SMTP_USER
    orig_smtp_pass = settings.SMTP_PASSWORD
    orig_smtp_host = settings.SMTP_HOST
    orig_smtp_port = settings.SMTP_PORT
    orig_smtp_from = settings.SMTP_FROM
    yield
    # Restore original settings
    settings.BREVO_API_KEY = orig_brevo_key
    settings.SMTP_USER = orig_smtp_user
    settings.SMTP_PASSWORD = orig_smtp_pass
    settings.SMTP_HOST = orig_smtp_host
    settings.SMTP_PORT = orig_smtp_port
    settings.SMTP_FROM = orig_smtp_from

def test_send_email_brevo_success(restore_settings):
    settings.BREVO_API_KEY = "test_brevo_key"
    settings.SMTP_FROM = "test_sender@example.com"
    
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response
        
        send_email_sync("recipient@example.com", "Test Subject", "<p>Hello</p>")
        
        mock_post.assert_called_once_with(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "accept": "application/json",
                "api-key": "test_brevo_key",
                "content-type": "application/json",
            },
            json={
                "sender": {"name": settings.APP_NAME, "email": "test_sender@example.com"},
                "to": [{"email": "recipient@example.com"}],
                "subject": "Test Subject",
                "htmlContent": "<p>Hello</p>",
            },
            timeout=10,
        )

def test_send_email_brevo_error_logged(restore_settings):
    settings.BREVO_API_KEY = "test_brevo_key"
    
    with patch("requests.post") as mock_post, patch("app.services.email_service.logger") as mock_logger:
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = "Invalid API Key"
        mock_post.return_value = mock_response
        
        send_email_sync("recipient@example.com", "Test Subject", "<p>Hello</p>")
        
        mock_logger.error.assert_called_once()
        args, kwargs = mock_logger.error.call_args
        assert "Failed to send email" in args[0]

def test_send_email_smtp_fallback(restore_settings):
    settings.BREVO_API_KEY = ""
    settings.SMTP_USER = "smtp_user"
    settings.SMTP_PASSWORD = "smtp_password"
    settings.SMTP_HOST = "smtp.example.com"
    settings.SMTP_PORT = 587
    settings.SMTP_FROM = "sender@example.com"
    
    with patch("smtplib.SMTP") as mock_smtp:
        mock_server = MagicMock()
        mock_smtp.return_value = mock_server
        
        send_email_sync("recipient@example.com", "Test Subject", "<p>Hello</p>")
        
        mock_smtp.assert_called_once_with("smtp.example.com", 587)
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("smtp_user", "smtp_password")
        mock_server.sendmail.assert_called_once()
        mock_server.quit.assert_called_once()

def test_send_email_unconfigured_skips(restore_settings):
    settings.BREVO_API_KEY = ""
    settings.SMTP_USER = ""
    settings.SMTP_PASSWORD = ""
    
    with patch("requests.post") as mock_post, patch("smtplib.SMTP") as mock_smtp, patch("app.services.email_service.logger") as mock_logger:
        send_email_sync("recipient@example.com", "Test Subject", "<p>Hello</p>")
        
        mock_post.assert_not_called()
        mock_smtp.assert_not_called()
        mock_logger.warning.assert_called_once()
