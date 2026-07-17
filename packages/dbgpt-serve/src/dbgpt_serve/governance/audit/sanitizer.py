"""Whitelisted audit sanitization utilities."""

import hashlib
import re
from typing import Optional

_SENSITIVE_KEY_PATTERN = re.compile(
    r"(?i)(password|passwd|pwd|token|secret|api[_-]?key|cookie|authorization)"
)
_ASSIGNMENT_PATTERN = re.compile(
    r"(?i)\b(password|passwd|pwd|token|secret|api[_-]?key|cookie|authorization)\b"
    r"\s*[:=]\s*('[^']*'|\"[^\"]*\"|[^,\s]+)"
)
_CONNECTION_URI_PATTERN = re.compile(
    r"(?i)\b([a-z][a-z0-9+.-]*://)([^:\s/@]+):([^@\s]+)@"
)
_STRING_LITERAL_PATTERN = re.compile(r"'([^']|'')*'|\"([^\"]|\"\")*\"")
_NUMBER_LITERAL_PATTERN = re.compile(r"\b\d+(?:\.\d+)?\b")


def sanitize_audit_detail(detail: Optional[str]) -> Optional[str]:
    """Remove obvious credentials and tokens from audit detail text."""
    if not detail:
        return detail
    sanitized = _CONNECTION_URI_PATTERN.sub(r"\1***:***@", detail)
    sanitized = _ASSIGNMENT_PATTERN.sub(
        lambda match: f"{match.group(1)}=***", sanitized
    )
    if _SENSITIVE_KEY_PATTERN.search(sanitized):
        sanitized = _SENSITIVE_KEY_PATTERN.sub("***", sanitized)
    return sanitized[:2048]


def sql_audit_summary(sql_text: Optional[str]) -> Optional[str]:
    """Return a fingerprint plus redacted template instead of raw SQL."""
    if not sql_text:
        return None
    template = _STRING_LITERAL_PATTERN.sub("?", sql_text)
    template = _NUMBER_LITERAL_PATTERN.sub("?", template)
    template = re.sub(r"\s+", " ", template).strip()
    digest = hashlib.sha256(template.encode("utf-8")).hexdigest()
    return f"sha256:{digest}; template:{template[:512]}"
