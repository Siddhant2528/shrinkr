"""
Shrinkr Load Test — Locust script

Simulates realistic user traffic across the main usage patterns:
  1. Anonymous redirect traffic  (highest weight — most common production traffic)
  2. Authenticated power users   (shorten + view links + analytics)

AUTHENTICATION FOR LOAD TESTS
-----------------------------
To run authenticated load tests safely without modifying application authentication
or disabling email/OTP verification:
  1. Create a dedicated load test account once (e.g., loadtest@example.com)
  2. Verify its OTP code once manually.
  3. Pass credentials via environment variables:
     $env:LOAD_TEST_EMAIL="loadtest@example.com"
     $env:LOAD_TEST_PASSWORD="your-test-password"

HOW TO RUN
----------
# 1. Install Locust (if not already installed):
pip install -r requirements-dev.txt

# 2. Set environment variables (PowerShell example):
$env:LOAD_TEST_EMAIL="loadtest@example.com"
$env:LOAD_TEST_PASSWORD="your-test-password"

# 3. Run Locust web UI:
locust -f tests/load_testing/locustfile.py --host http://localhost:8000

# 4. Open http://localhost:8089 in your browser to configure users/ramp rate.

# Headless / CI mode:
locust -f tests/load_testing/locustfile.py \
    --host http://localhost:8000 \
    --headless -u 50 -r 5 -t 30s \
    --csv=tests/load_testing/results/report
"""
import os
import random
import string
import uuid

from locust import HttpUser, TaskSet, between, task

LOAD_TEST_EMAIL = os.getenv("LOAD_TEST_EMAIL")
LOAD_TEST_PASSWORD = os.getenv("LOAD_TEST_PASSWORD")

if not LOAD_TEST_EMAIL or not LOAD_TEST_PASSWORD:
    raise RuntimeError(
        "LOAD_TEST_EMAIL and LOAD_TEST_PASSWORD must be set before running Locust."
    )


# ─── Shared test fixtures ─────────────────────────────────────────────────────

# A small pool of pre-shortened codes to use for redirect tests.
_SHORT_CODES: list[str] = []

SAMPLE_URLS = [
    "https://example.com",
    "https://github.com/trending",
    "https://docs.python.org/3/",
    "https://fastapi.tiangolo.com",
    "https://news.ycombinator.com",
]


# ─── Task Sets ────────────────────────────────────────────────────────────────


class AnonymousRedirectTaskSet(TaskSet):
    """
    Simulates anonymous visitors following short links.
    This is the dominant traffic pattern for a URL shortener.
    """

    def on_start(self) -> None:
        """Seed a short code by shortening a random URL anonymously."""
        with self.client.post(
            "/shorten",
            json={"original_url": random.choice(SAMPLE_URLS)},
            name="/shorten [setup]",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 201):
                resp.success()
                code = resp.json().get("short_code")
                if code and code not in _SHORT_CODES:
                    _SHORT_CODES.append(code)
            elif resp.status_code == 429:
                resp.success()  # Rate limit hit — legitimate protection

    @task(10)
    def follow_redirect(self) -> None:
        """Follow an existing short link (cache-warmed or cold)."""
        if not _SHORT_CODES:
            return
        code = random.choice(_SHORT_CODES)
        # allow_redirects=False so Locust doesn't leave the domain.
        # FastAPI returns 307 Temporary Redirect for redirects.
        with self.client.get(
            f"/{code}",
            allow_redirects=False,
            name="/{short_code}",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 301, 302, 307, 308):
                resp.success()
            elif resp.status_code == 429:
                resp.success()  # Rate limiter protection
            else:
                resp.failure(f"Unexpected status code: {resp.status_code}")

    @task(1)
    def shorten_anonymous(self) -> None:
        """Anonymous shortening — rate limited, lower frequency."""
        with self.client.post(
            "/shorten",
            json={"original_url": random.choice(SAMPLE_URLS)},
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 201):
                resp.success()
                code = resp.json().get("short_code")
                if code and code not in _SHORT_CODES:
                    _SHORT_CODES.append(code)
            elif resp.status_code == 429:
                resp.success()  # Rate limiter protection

    @task(2)
    def health_check(self) -> None:
        self.client.get("/health")


class AuthenticatedUserTaskSet(TaskSet):
    """
    Simulates an authenticated power user: shorten, list, view analytics.
    Uses dedicated verified test account credentials provided via environment variables.
    """

    token: str | None = None
    my_codes: list[str]

    def on_start(self) -> None:
        self.my_codes = []
        # Login using pre-verified load-test account credentials
        login = self.client.post(
            "/auth/login",
            data={"username": LOAD_TEST_EMAIL, "password": LOAD_TEST_PASSWORD},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            name="/auth/login [setup]",
        )
        if login.status_code == 200:
            self.token = login.json().get("access_token")
        else:
            self.token = None

    def _auth_headers(self) -> dict:
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}

    @task(5)
    def shorten_authenticated(self) -> None:
        with self.client.post(
            "/shorten",
            json={"original_url": random.choice(SAMPLE_URLS)},
            headers=self._auth_headers(),
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 201):
                resp.success()
                code = resp.json().get("short_code")
                if code:
                    self.my_codes.append(code)
                    if code not in _SHORT_CODES:
                        _SHORT_CODES.append(code)
            elif resp.status_code == 429:
                resp.success()  # Rate limit protection

    @task(8)
    def list_my_links(self) -> None:
        self.client.get(
            "/my-links?page=1&limit=20",
            headers=self._auth_headers(),
        )

    @task(3)
    def view_analytics(self) -> None:
        if not self.my_codes:
            return
        code = random.choice(self.my_codes)
        self.client.get(
            f"/analytics/{code}",
            headers=self._auth_headers(),
            name="/analytics/{short_code}",
        )

    @task(2)
    def view_timeseries(self) -> None:
        if not self.my_codes:
            return
        code = random.choice(self.my_codes)
        self.client.get(
            f"/analytics/{code}/timeseries?days=30",
            headers=self._auth_headers(),
            name="/analytics/{short_code}/timeseries",
        )

    @task(1)
    def view_my_stats(self) -> None:
        self.client.get("/auth/my-stats", headers=self._auth_headers())


# ─── User classes ─────────────────────────────────────────────────────────────


class AnonymousUser(HttpUser):
    """
    Represents the typical anonymous visitor who just clicks short links.
    Highest spawn weight — most real production traffic.
    """
    tasks = [AnonymousRedirectTaskSet]
    weight = 3
    wait_time = between(0.5, 2.0)


class AuthenticatedUser(HttpUser):
    """
    Represents a signed-in user managing their links and reading analytics.
    """
    tasks = [AuthenticatedUserTaskSet]
    weight = 1
    wait_time = between(1.0, 4.0)
