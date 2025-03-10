import aiosmtplib
from email.message import EmailMessage
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from loguru import logger

from ..config import settings

async def send_email(
    to: str,
    subject: str,
    text: Optional[str] = None,
    html: Optional[str] = None
):
    if not (settings.smtp.host and settings.smtp.username and settings.smtp.password and settings.smtp.email):
        raise ValueError("SMTP settings are not configured: check smtp.host, smtp.username, smtp.password, and smtp.email")

    # If both text and html are provided, use MIMEMultipart
    if text and html:
        message = MIMEMultipart("alternative")
        message["From"] = settings.smtp.email
        message["To"] = to
        message["Subject"] = subject
        
        # Add text part
        text_part = MIMEText(text, "plain")
        message.attach(text_part)
        
        # Add html part
        html_part = MIMEText(html, "html")
        message.attach(html_part)
    
    # If only text is provided, use EmailMessage
    elif text:
        message = EmailMessage()
        message["From"] = settings.smtp.email
        message["To"] = to
        message["Subject"] = subject
        message.set_content(text)
        
    # If only HTML is provided, use EmailMessage with content_type
    elif html:
        message = EmailMessage()
        message["From"] = settings.smtp.email
        message["To"] = to
        message["Subject"] = subject
        message.set_content(html, subtype='html')
    
    else:
        raise ValueError("Either text or html content must be provided")
    
    logger.debug(f"Sending email to {to} with subject: {subject}")
        
    # Send the message
    await aiosmtplib.send(
        message,
        hostname=settings.smtp.host,
        port=25,
        username=settings.smtp.username,
        password=settings.smtp.password,
    )