import qrcode
import io
from app.core.redis import redis_client

QR_CACHE_TTL = 86400

def generate_qr_bytes(url: str) -> bytes:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer.read()

def get_qr_code(short_code: str, short_url: str) -> bytes:
    cache_key = f"qr:{short_code}"

    cached = redis_client.get(cache_key)
    if cached:
        return cached.encode("latin-1")

    image_bytes = generate_qr_bytes(short_url)

    redis_client.setex(cache_key, QR_CACHE_TTL, image_bytes.decode("latin-1"))

    return image_bytes