"""
Security utilities for the online store application.
Provides encryption, input sanitization, and file upload validation.
"""

import os
import re
import magic
import hashlib
from functools import wraps
from django.conf import settings
from cryptography.fernet import Fernet
import bleach


# =============================================================================
# ENCRYPTION UTILITIES
# =============================================================================

def get_encryption_key():
    """Get or generate encryption key from settings."""
    key = getattr(settings, 'ENCRYPTION_KEY', None)
    if not key:
        key = os.environ.get('ENCRYPTION_KEY')
    if not key:
        raise ValueError("ENCRYPTION_KEY must be set in settings or environment")
    return key.encode() if isinstance(key, str) else key


def encrypt_data(data: str) -> str:
    """
    Encrypt sensitive data using Fernet symmetric encryption.

    Args:
        data: Plain text data to encrypt

    Returns:
        Encrypted data as base64 string
    """
    if not data:
        return ""

    fernet = Fernet(get_encryption_key())
    encrypted = fernet.encrypt(data.encode())
    return encrypted.decode()


def decrypt_data(encrypted_data: str) -> str:
    """
    Decrypt data that was encrypted with encrypt_data.

    Args:
        encrypted_data: Encrypted base64 string

    Returns:
        Decrypted plain text
    """
    if not encrypted_data:
        return ""

    fernet = Fernet(get_encryption_key())
    decrypted = fernet.decrypt(encrypted_data.encode())
    return decrypted.decode()


def hash_sensitive_data(data: str, salt: str = None) -> str:
    """
    Create a one-way hash of sensitive data (for data that doesn't need decryption).

    Args:
        data: Data to hash
        salt: Optional salt (uses SECRET_KEY if not provided)

    Returns:
        SHA-256 hash of the data
    """
    if not data:
        return ""

    if salt is None:
        salt = settings.SECRET_KEY

    salted_data = f"{salt}{data}"
    return hashlib.sha256(salted_data.encode()).hexdigest()


# =============================================================================
# INPUT SANITIZATION
# =============================================================================

# Allowed HTML tags for rich text fields (minimal set for security)
ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'span'
]

ALLOWED_ATTRIBUTES = {
    'a': ['href', 'title'],
    'span': ['class'],
}

# Allowed protocols for links
ALLOWED_PROTOCOLS = ['http', 'https', 'mailto']


def sanitize_html(text: str, allow_tags: list = None) -> str:
    """
    Sanitize HTML input to prevent XSS attacks.

    Args:
        text: Raw HTML text
        allow_tags: Optional list of allowed tags (uses ALLOWED_TAGS if not provided)

    Returns:
        Sanitized HTML string
    """
    if not text:
        return ""

    tags = allow_tags if allow_tags is not None else ALLOWED_TAGS

    return bleach.clean(
        text,
        tags=tags,
        attributes=ALLOWED_ATTRIBUTES,
        protocols=ALLOWED_PROTOCOLS,
        strip=True
    )


def sanitize_text(text: str) -> str:
    """
    Strip all HTML tags from text (for plain text fields).

    Args:
        text: Raw text that might contain HTML

    Returns:
        Plain text with all HTML removed
    """
    if not text:
        return ""

    return bleach.clean(text, tags=[], strip=True)


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename to prevent path traversal attacks.

    Args:
        filename: Original filename

    Returns:
        Safe filename
    """
    if not filename:
        return ""

    # Remove path components
    filename = os.path.basename(filename)

    # Remove potentially dangerous characters
    filename = re.sub(r'[^\w\s\-\.]', '', filename)

    # Remove leading/trailing dots and spaces
    filename = filename.strip('. ')

    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:255-len(ext)] + ext

    return filename or 'unnamed_file'


def validate_email(email: str) -> bool:
    """
    Validate email format.

    Args:
        email: Email address to validate

    Returns:
        True if valid, False otherwise
    """
    if not email:
        return False

    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def sanitize_phone(phone: str) -> str:
    """
    Sanitize phone number - keep only digits and common separators.

    Args:
        phone: Raw phone number

    Returns:
        Sanitized phone number
    """
    if not phone:
        return ""

    # Keep only digits, spaces, dashes, parentheses, and plus sign
    return re.sub(r'[^\d\s\-\(\)\+]', '', phone)


# =============================================================================
# FILE UPLOAD VALIDATION
# =============================================================================

# Allowed MIME types for different upload categories
ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
]

ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

# Maximum file sizes (in bytes)
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024  # 10MB
MAX_INVOICE_SIZE = 2 * 1024 * 1024  # 2MB


class FileValidationError(Exception):
    """Exception raised for file validation errors."""
    pass


def validate_file_type(file, allowed_types: list) -> bool:
    """
    Validate file type using magic bytes (not just extension).

    Args:
        file: Django UploadedFile or file-like object
        allowed_types: List of allowed MIME types

    Returns:
        True if valid

    Raises:
        FileValidationError: If file type is not allowed
    """
    # Read first bytes to determine actual file type
    file.seek(0)
    file_header = file.read(2048)
    file.seek(0)

    # Use python-magic to detect actual MIME type
    mime_type = magic.from_buffer(file_header, mime=True)

    if mime_type not in allowed_types:
        raise FileValidationError(
            f"File type '{mime_type}' is not allowed. "
            f"Allowed types: {', '.join(allowed_types)}"
        )

    return True


def validate_file_size(file, max_size: int) -> bool:
    """
    Validate file size.

    Args:
        file: Django UploadedFile or file-like object
        max_size: Maximum allowed size in bytes

    Returns:
        True if valid

    Raises:
        FileValidationError: If file is too large
    """
    file.seek(0, 2)  # Seek to end
    size = file.tell()
    file.seek(0)  # Reset position

    if size > max_size:
        max_mb = max_size / (1024 * 1024)
        actual_mb = size / (1024 * 1024)
        raise FileValidationError(
            f"File size ({actual_mb:.2f}MB) exceeds maximum allowed size ({max_mb:.2f}MB)"
        )

    return True


def validate_image_upload(file) -> bool:
    """
    Validate an image upload (type and size).

    Args:
        file: Django UploadedFile

    Returns:
        True if valid

    Raises:
        FileValidationError: If validation fails
    """
    validate_file_type(file, ALLOWED_IMAGE_TYPES)
    validate_file_size(file, MAX_IMAGE_SIZE)
    return True


def validate_document_upload(file) -> bool:
    """
    Validate a document upload (type and size).

    Args:
        file: Django UploadedFile

    Returns:
        True if valid

    Raises:
        FileValidationError: If validation fails
    """
    validate_file_type(file, ALLOWED_DOCUMENT_TYPES)
    validate_file_size(file, MAX_DOCUMENT_SIZE)
    return True


def validate_invoice_upload(file) -> bool:
    """
    Validate an invoice upload (PDF only, smaller size limit).

    Args:
        file: Django UploadedFile

    Returns:
        True if valid

    Raises:
        FileValidationError: If validation fails
    """
    validate_file_type(file, ['application/pdf'])
    validate_file_size(file, MAX_INVOICE_SIZE)
    return True


def secure_file_path(instance, filename: str, upload_dir: str) -> str:
    """
    Generate a secure file path for uploads.

    Args:
        instance: Model instance
        filename: Original filename
        upload_dir: Base upload directory

    Returns:
        Secure file path
    """
    # Sanitize the filename
    safe_filename = sanitize_filename(filename)

    # Generate a unique prefix using hash
    unique_prefix = hashlib.md5(
        f"{instance.pk}{filename}{os.urandom(8).hex()}".encode()
    ).hexdigest()[:8]

    # Construct safe path
    name, ext = os.path.splitext(safe_filename)
    new_filename = f"{unique_prefix}_{name[:50]}{ext}"

    return os.path.join(upload_dir, new_filename)


# =============================================================================
# RATE LIMITING UTILITIES
# =============================================================================

def get_client_ip(request) -> str:
    """
    Get the client's IP address from the request.
    Handles proxied requests (X-Forwarded-For).

    Args:
        request: Django HttpRequest

    Returns:
        Client IP address
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # Take the first IP in the chain (client IP)
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
    return ip


# =============================================================================
# CARD DATA UTILITIES
# =============================================================================

def mask_card_number(card_number: str) -> str:
    """
    Mask a card number, showing only last 4 digits.

    Args:
        card_number: Full card number

    Returns:
        Masked card number (e.g., "****-****-****-1234")
    """
    if not card_number:
        return ""

    # Remove any non-digit characters
    digits = re.sub(r'\D', '', card_number)

    if len(digits) < 4:
        return "****"

    last_four = digits[-4:]
    return f"****-****-****-{last_four}"


def get_card_last_four(card_number: str) -> str:
    """
    Extract last 4 digits from card number.

    Args:
        card_number: Full card number

    Returns:
        Last 4 digits
    """
    if not card_number:
        return ""

    digits = re.sub(r'\D', '', card_number)
    return digits[-4:] if len(digits) >= 4 else digits
