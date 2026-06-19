import geoip2.database
import geoip2.errors
import os

GEOIP_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "GeoLite2-Country.mmdb")

_reader = None

def get_reader():
    global _reader
    if _reader is None:
        _reader = geoip2.database.Reader(GEOIP_DB_PATH)
    return _reader

def get_country(ip_address: str) -> str | None:
    try:
        reader = get_reader()
        response = reader.country(ip_address)
        return response.country.name
    except (geoip2.errors.AddressNotFoundError, ValueError):
        return None