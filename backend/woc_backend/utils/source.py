from fastapi import Request, Depends
from typing import Optional, Dict, Tuple
import ipaddress
from urllib.parse import urlparse
from ..config import settings


def get_client_info(request: Request) -> Dict[str, str]:
    """
    Best-effort dependency to extract client IP address and user agent,
    handling various proxy scenarios.

    Returns:
        Dict with 'request_ip' and 'user_agent' keys
    """
    # Get User-Agent
    user_agent = request.headers.get("User-Agent", "")

    # Try to get the real client IP by checking common proxy headers
    ip = _extract_real_ip(request)

    # read referrer from header
    referrer = request.headers.get("Referer", "")
    if referrer:
        # only keep the scheme and netloc
        _parsed = urlparse(referrer)
        referrer = f"{_parsed.scheme}://{_parsed.netloc}"

    return {"request_ip": ip, "user_agent": user_agent, "referrer": referrer}


def _extract_real_ip(request: Request) -> str:
    """
    Extract the real client IP from request headers, checking common proxy headers.

    Uses a fallback strategy checking headers in priority order.
    """
    # Priority ordered list of headers to check
    ip_headers = [
        "X-Forwarded-For",
        "CF-Connecting-IP",  # Cloudflare
        "True-Client-IP",
        "X-Real-IP",
        "X-Client-IP",
        "Forwarded",
        "X-Forwarded",
        "X-Cluster-Client-IP",
        "Fastly-Client-IP",
    ]

    # First try the standard headers
    for header in ip_headers:
        if header in request.headers:
            # X-Forwarded-For can contain multiple IPs - the client is the first one
            if header == "X-Forwarded-For":
                # Format is typically: client, proxy1, proxy2, ...
                ips = request.headers[header].split(",")
                # Get the first valid IP in the list
                for ip in ips:
                    ip = ip.strip()
                    if _is_valid_ip(ip):
                        return ip
            elif header == "Forwarded":
                # Parse the Forwarded header (more complex)
                parts = request.headers[header].split(";")
                for part in parts:
                    if part.lower().startswith("for="):
                        ip_part = part[4:].strip()  # Remove 'for=' prefix
                        # Handle quoted IPs or IPv6 with brackets
                        ip_part = ip_part.strip('"[]')
                        if _is_valid_ip(ip_part):
                            return ip_part
            else:
                # For other headers, just use the value directly
                ip = request.headers[header].strip()
                if _is_valid_ip(ip):
                    return ip

    # Fallback to the request client host
    return request.client.host if request.client else ""


def _is_valid_ip(ip: str) -> bool:
    """Validate if a string is a valid IP address (v4 or v6)."""
    ip = ip.strip()

    # Strip port if present
    if ":" in ip and ip.count(":") == 1:  # IPv4 with port
        ip = ip.split(":")[0]

    try:
        ipaddress.ip_address(ip)
        return True
    except ValueError:
        return False


def get_base_url(request: Request) -> Dict[str, str]:
    """
    Extract the base URL from the request, handling proxy headers.
    """
    if settings.get("base_url"):
        return settings.base_url

    # Get the original scheme determined by FastAPI
    scheme = request.url.scheme

    # Check for proxy headers that indicate the original scheme
    forwarded_proto = request.headers.get("X-Forwarded-Proto")
    forwarded_scheme = request.headers.get("X-Forwarded-Scheme")
    forwarded_ssl = request.headers.get("X-Forwarded-Ssl")

    # Standard Forwarded header (RFC 7239)
    forwarded = request.headers.get("Forwarded")

    # Determine the actual scheme based on headers
    if settings.get("scheme"):
        scheme = settings.scheme
    elif forwarded_proto:
        scheme = forwarded_proto.lower()
    elif forwarded_scheme:
        scheme = forwarded_scheme.lower()
    elif forwarded_ssl and forwarded_ssl.lower() == "on":
        scheme = "https"
    elif forwarded:
        # Parse the Forwarded header which could have a proto parameter
        parts = forwarded.split(";")
        for part in parts:
            if part.lower().startswith("proto="):
                proto_value = part[6:].strip().lower()  # Remove 'proto=' prefix
                scheme = proto_value.strip('"')
                break
    if not scheme:
        scheme = request.url.scheme

    # Get the host from headers if behind proxy
    if settings.get("host"):
        host = settings.host
    elif "X-Forwarded-Host" in request.headers:
        host = request.headers["X-Forwarded-Host"]
    elif "Host" in request.headers:
        host = request.headers["Host"]
    else:
        host = request.url.netloc

    # Build the base URL
    return f"{scheme}://{host}"
