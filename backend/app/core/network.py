import ipaddress
from fastapi import Request


def get_client_ip(request: Request) -> str:
    """
    Extract the real client IP address from request headers, handling reverse proxies
    (Render, Cloudflare, Nginx, AWS ELB, etc.).

    Priority:
      1. CF-Connecting-IP (Cloudflare)
      2. X-Real-IP (Nginx / HAProxy / Traefik)
      3. X-Forwarded-For (Render / AWS ALB / Heroku - first public IP in chain)
      4. request.client.host (fallback for direct connections in local dev)
    """
    # 1. Check Cloudflare header
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()

    # 2. Check X-Real-IP
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    # 3. Check X-Forwarded-For chain (client, proxy1, proxy2...)
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        ips = [ip.strip() for ip in x_forwarded_for.split(",") if ip.strip()]
        # Find the first non-private public IP in the chain
        for ip in ips:
            try:
                ip_obj = ipaddress.ip_address(ip)
                if not ip_obj.is_private and not ip_obj.is_loopback:
                    return ip
            except ValueError:
                continue
        # Fallback to first IP in chain if all are private
        if ips:
            return ips[0]

    # 4. Fallback to direct client host
    if request.client and request.client.host:
        return request.client.host

    return "127.0.0.1"
