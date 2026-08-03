import pytest
from unittest.mock import MagicMock
from app.core.network import get_client_ip
from app.services.geo_service import get_country


def test_get_client_ip_cf_connecting_ip():
    request = MagicMock()
    request.headers = {"cf-connecting-ip": "203.0.113.195"}
    assert get_client_ip(request) == "203.0.113.195"


def test_get_client_ip_x_real_ip():
    request = MagicMock()
    request.headers = {"x-real-ip": "198.51.100.42"}
    assert get_client_ip(request) == "198.51.100.42"


def test_get_client_ip_x_forwarded_for_chain():
    request = MagicMock()
    # Chain: client, proxy1, proxy2
    request.headers = {"x-forwarded-for": "203.0.113.195, 10.0.0.1, 172.16.0.1"}
    assert get_client_ip(request) == "203.0.113.195"


def test_get_client_ip_x_forwarded_for_all_private():
    request = MagicMock()
    request.headers = {"x-forwarded-for": "10.0.0.5, 192.168.1.1"}
    # Should return first IP in chain if all are private
    assert get_client_ip(request) == "10.0.0.5"


def test_get_client_ip_fallback_to_client_host():
    request = MagicMock()
    request.headers = {}
    request.client.host = "192.168.1.100"
    assert get_client_ip(request) == "192.168.1.100"


def test_get_country_loopback_and_private():
    assert get_country("127.0.0.1") == "Local"
    assert get_country("::1") == "Local"
    assert get_country("192.168.1.1") == "Local"
    assert get_country("10.0.0.1") == "Local"


def test_get_country_none():
    assert get_country(None) is None
    assert get_country("") is None
