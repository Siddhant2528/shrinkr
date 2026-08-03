import geoip2.database
import geoip2.errors
import os
import ipaddress
import logging

logger = logging.getLogger(__name__)

GEOIP_DB_PATH = os.path.join(os.path.dirname(
    __file__), "..", "data", "GeoLite2-Country.mmdb")

_reader = None


def get_reader():
    global _reader
    if _reader is None:
        if not os.path.exists(GEOIP_DB_PATH):
            logger.warning(
                "GeoIP database file not found at %s. Country lookup disabled.",
                GEOIP_DB_PATH
            )
            return None
        try:
            _reader = geoip2.database.Reader(GEOIP_DB_PATH)
        except Exception as e:
            logger.error("Failed to initialize GeoIP reader: %s", e)
            return None
    return _reader


def get_country(ip_address: str | None) -> str | None:
    if not ip_address:
        return None

    # Handle loopback / private IP ranges
    try:
        ip_obj = ipaddress.ip_address(ip_address)
        if ip_obj.is_private or ip_obj.is_loopback:
            return "Local"
    except ValueError:
        pass

    try:
        reader = get_reader()
        if reader is None:
            return None

        response = reader.country(ip_address)
        if response and response.country and response.country.name:
            return response.country.name
        if response and response.registered_country and response.registered_country.name:
            return response.registered_country.name
    except (geoip2.errors.AddressNotFoundError, ValueError):
        return None
    except Exception as e:
        logger.warning("Error looking up country for IP %s: %s", ip_address, e)
        return None

    return None
