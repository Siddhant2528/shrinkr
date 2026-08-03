<p align="center">
  <img src="screenshots/banner.png" alt="Shrinkr Banner" width="100%">
</p>

<h1 align="center">🔗 Shrinkr</h1>

<p align="center">
<b>A production-ready URL Shortener with Real-Time Analytics built using FastAPI, Next.js, PostgreSQL and Redis.</b>
</p>

<p align="center">
<img src="https://img.shields.io/badge/FastAPI-0.136-009688?style=for-the-badge&logo=fastapi">
<img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js">
<img src="https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql">
<img src="https://img.shields.io/badge/Redis-7-red?style=for-the-badge&logo=redis">
<img src="https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker">
<img src="https://img.shields.io/badge/GitHub%20Actions-CI-2088FF?style=for-the-badge&logo=github-actions">
<img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge">
</p>

<p align="center">
<a href="https://shrinkr-frontend.vercel.app">🌐 Live Demo</a> •
<a href="https://shrinkr-w57o.onrender.com/docs">📚 API Docs</a> •
<a href="https://github.com/Siddhant2528/shrinkr/issues">🐛 Report Bug</a> •
<a href="https://github.com/Siddhant2528/shrinkr/issues">💡 Request Feature</a>
</p>

---

# 📖 Overview

Shrinkr is a **production-ready full-stack URL shortening platform** inspired by services like **Bitly**, **TinyURL**, and **Dub.co**. It enables users to create secure, customizable short URLs while providing detailed analytics, authentication, API access, QR code generation, and a modern dashboard for managing links.

Rather than focusing only on shortening URLs, Shrinkr emphasizes **real-world backend engineering practices**: REST API design, JWT authentication, Redis caching and rate limiting, Dockerized deployment, automated testing, CI pipelines, and scalable, maintainable architecture.

This project was built as a portfolio project to explore how modern backend systems are designed, implemented, tested, and deployed.

---

# 🏆 Project Highlights

- 🔗 Full-stack URL shortening platform
- 📊 Real-time analytics dashboard (country, device, browser, time-series)
- 🔐 JWT Authentication & Email OTP Verification
- 🔑 API Key Management
- 🚦 Redis sliding-window rate limiting
- 📱 QR Code generation
- 🌐 Custom domain support
- 🐳 Docker & Docker Compose
- 🧪 Automated backend + frontend testing
- ⚡ Load tested with Locust (0 failures at 200 concurrent users)
- 🔄 GitHub Actions CI
- ☁️ Cloud deployment via Render & Vercel

---

# 🏆 Engineering Practices

- RESTful API Design
- JWT Authentication
- Dockerized Development
- Automated Testing
- Load Testing with Locust
- PostgreSQL Database Design
- Redis Caching & Rate Limiting
- GitHub Actions CI
- Cloud Deployment

---

# ✨ Features

## 🔗 URL Management
- Shorten long URLs instantly
- Create custom aliases
- Set expiration dates
- Automatic redirection
- Public and authenticated shortening
- Archive & favourite links
- Organize links using tags

## 📊 Analytics
- Total Click Count
- Country-wise Analytics
- Device Breakdown
- Browser Breakdown
- Daily Click Trends
- Top Performing Links
- Recent Click Activity
- Admin Analytics Dashboard

## 🔐 Authentication & Security
- JWT Authentication
- Email Verification using OTP
- Forgot Password / Reset / Change Password
- API Keys
- Secure Password Hashing (bcrypt)
- Rate Limiting using Redis
- Security Headers
- Protected Routes

## 📱 QR Code Generation
Every shortened URL can generate its own downloadable QR Code — great for business cards, posters, events, and product packaging.

## 🌐 Custom Domains
Connect your own domain for branded short links:
```
https://go.company.com/summer-sale   instead of   https://shrinkr.xyz/abc123
```

## 🚀 Developer Features
- REST API with interactive Swagger documentation
- Docker & Docker Compose support
- GitHub Actions CI
- Automated testing (Pytest + Vitest)
- Load testing using Locust
- Alembic database migrations
- Environment-based configuration

---

# 🏗️ System Architecture

```mermaid
flowchart TD

A[Client / Browser] --> B[FastAPI Application]

B --> C[(Redis - Cache + Rate Limit)]
B --> D[Email Service - OTP Verification]
B --> E[(PostgreSQL - URLs, Clicks, Users, Keys)]

E --> F[Analytics Aggregation - GeoIP2, Device, Time-Series]
F --> G[Dashboard API Endpoints - Charts, Exports, QR Codes]

subgraph Infra [Infrastructure Layer]
  H[Docker Compose]
  I[Alembic Migrations]
  J[Pytest + Coverage]
  K[Locust Load Tests]
end
```

> Note: the "Analytics Aggregation" stage is a logical layer within the FastAPI service (query + aggregation code over PostgreSQL data), not a separate microservice.

---

# 🛠 Tech Stack

| Category | Technologies |
|---|---|
| **Backend** | FastAPI, SQLAlchemy, PostgreSQL, Alembic, Uvicorn |
| **Frontend** | Next.js 16, React 19, Tailwind CSS, Recharts, Lucide Icons, next-themes |
| **Cache / Rate Limiting** | Redis |
| **Authentication** | JWT |
| **Analytics** | GeoIP2, QRCode, Pillow |
| **DevOps** | Docker, Docker Compose, GitHub Actions |
| **Deployment** | Render (backend), Vercel (frontend) |

---

## 📸 Screenshots

| Landing Page | Dashboard |
|---------------|-----------|
| ![](screenshots/home.png) | ![](screenshots/dashboard.png) |

| Analytics | QR Code |
|------------|---------|
| ![](screenshots/analytics.png) | ![](screenshots/qr-code.png) |

| Swagger | CI Pipeline |
|----------|-------------|
| ![](screenshots/swagger.png) | ![](screenshots/ci.png) |

# 📂 Project Structure

```text
shrinkr/
│
├── backend/
│   ├── app/
│   │   ├── api/                 # REST API endpoints
│   │   ├── core/                # Config, Security, Middleware
│   │   ├── models/               # SQLAlchemy Models
│   │   ├── schemas/               # Pydantic Schemas
│   │   ├── services/              # Business Logic
│   │   ├── utils/                  # Helper Functions
│   │   └── main.py                 # FastAPI Entry Point
│   │
│   ├── tests/                   # Backend Tests
│   ├── alembic/                 # Database Migrations
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── public/
│   ├── tests/
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── render.yaml
├── README.md
└── LICENSE
```

---

# ⚙️ Getting Started

## Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 15+
- Redis
- Docker Desktop (recommended)
- Git

```bash
python --version
node --version
docker --version
git --version
```

## Clone the Repository
```bash
git clone https://github.com/Siddhant2528/shrinkr.git
cd shrinkr
```

## 🐍 Backend Setup
```bash
cd backend
python -m venv .venv
```

Activate the environment:

```bash
# Windows
.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

## 🌐 Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`

---

# 🔐 Environment Variables

Create `backend/.env` using `backend/.env.example`.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT secret key |
| `FRONTEND_URL` | Frontend URL |
| `BASE_URL` | Backend URL |
| `REDIS_HOST` | Redis host |
| `REDIS_PORT` | Redis port |
| `REDIS_PASSWORD` | Redis password |
| `SMTP_USER` | Email username |
| `SMTP_PASSWORD` | Email password |
| `DEFAULT_ADMIN_EMAIL` | Default admin email |
| `DEFAULT_ADMIN_PASSWORD` | Default admin password |

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/shrinkr
SECRET_KEY=your-secret-key
BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
DEBUG=True
```

---

# 🗄 Database Migration
```bash
alembic upgrade head
```

# ▶ Running the Backend
```bash
uvicorn app.main:app --reload
```
- Backend: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

# 🐳 Docker

```bash
docker compose up --build                    # start all services
docker compose up -d                         # detached mode
docker compose down                          # stop containers
docker compose up --build --force-recreate   # rebuild
```

| Service | Description |
|---|---|
| Backend | FastAPI |
| Frontend | Next.js |
| PostgreSQL | Database |
| Redis | Cache & Rate Limiting |

---

# 📡 API Overview

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login |
| POST | `/auth/verify-otp` | Verify OTP |
| POST | `/auth/forgot-password` | Forgot password |
| POST | `/auth/reset-password` | Reset password |
| POST | `/auth/change-password` | Change password |
| GET | `/auth/me` | Current user |

### URL APIs
| Method | Endpoint |
|---|---|
| POST | `/shorten` |
| POST | `/shorten/protected` |
| GET | `/my-links` |
| PATCH | `/my-links/{code}` |
| DELETE | `/my-links/{code}` |
| GET | `/analytics/{code}` |
| GET | `/analytics/{code}/timeseries` |
| GET | `/qr/{code}` |
| GET | `/{code}` |

### API Keys
| Method | Endpoint |
|---|---|
| GET | `/api-keys` |
| POST | `/api-keys` |
| DELETE | `/api-keys/{id}` |

### Admin
| Method | Endpoint |
|---|---|
| GET | `/dashboard` |
| GET | `/dashboard/summary` |
| GET | `/dashboard/top-links` |
| GET | `/dashboard/countries` |
| GET | `/dashboard/devices` |
| GET | `/dashboard/recent` |

---

# 🧪 Testing

**Backend (Pytest)**
```bash
cd backend
pytest
pytest -v
pytest --cov=app --cov-report=term
```

**Frontend (Vitest)**
```bash
cd frontend
npm test
npm run test:coverage
```

Coverage includes: Authentication, URL Shortening, Redirects, Analytics, API Keys, Tags, Dashboard APIs, Utility Functions.

---

# ⚡ Load Testing

Shrinkr was load tested using **Locust** against the Dockerized backend, using a mix of anonymous and authenticated traffic, to see how the API behaves under concurrent load.

### Test Configuration

| Parameter | Value |
|---|---|
| Tool | Locust |
| Traffic Mix | Anonymous + authenticated requests |
| User Levels Tested | 10 → 50 → 100 → 200 concurrent users |
| Target Host | Dockerized backend (`localhost:8000`) |

Example command:

```bash
locust -f tests/load_testing/locustfile.py \
  --host http://localhost:8000 \
  --headless \
  -u 200 \
  -r 10 \
  -t 60s \
  --csv=tests/load_testing/results/report
```

### Results — Full Scaling Curve (10 → 50 → 100 → 200 Users)

| Metric | 10 users | 50 users | 100 users | 200 users |
|---|---|---|---|---|
| Requests | 167 | 1,781 | 20,103 | 7,319 |
| Failures | 0 ✅ | 0 ✅ | 0 ✅ | 0 ✅ |
| Current RPS | 7 | 33.4 | 67.1 | 135.2 |
| Median | 13 ms | 12 ms | 11 ms | 13 ms |
| Average | 28.09 ms | 19.58 ms | 13.7 ms | 37.53 ms |
| p95 | 64 ms | 27 ms | 23 ms | 120 ms |
| p99 | 440 ms | 260 ms | 60 ms | 620 ms |
| Max | 459 ms | 840 ms | 1,099 ms | 1,683 ms |

**Redirect path (`GET /{short_code}`)** — the most important endpoint for Shrinkr — held up well across every concurrency level:

| Metric | 10 users | 50 users | 100 users | 200 users |
|---|---|---|---|---|
| Requests | 94 | 1,188 | 13,532 | — |
| Median | 14 ms | 14 ms | 12 ms | — |
| Average | 17.47 ms | 19.02 ms | 15.92 ms | — |
| p95 | 30 ms | 25 ms | 24 ms | 130 ms |
| p99 | 110 ms | 67 ms | 59 ms | 500 ms |
| Failures | 0 | 0 | 0 | 0 |

The target of **redirect p95 < 500 ms** was comfortably met at every concurrency level tested, including 200 concurrent users.

**Authentication (`POST /auth/login`)** consistently showed up as the slowest endpoint, as expected:

| Metric | 10 users | 50 users | 100 users | 200 users |
|---|---|---|---|---|
| Average | 335 ms | 267 ms | 310.6 ms | — |
| p95 | 440 ms | 590 ms | 490 ms | ~890 ms |
| Failures | 0 | 0 | 0 | 0 |

This is expected and by design — bcrypt password hashing is intentionally CPU-expensive for security, so login will always be the slowest endpoint relative to cached/indexed reads like redirects.

### Key Findings

- ✅ **0 failures** at every concurrency level tested (10 → 200 users)
- ✅ Throughput scaled well with load — RPS climbed from 7 → 33.4 → 67.1 → 135.2 as concurrent users increased
- ✅ No 500 errors and no 429 (rate-limit) responses observed at any concurrency level
- ⚠️ Tail latency (p95/p99) is not perfectly linear with user count — it stayed low through 100 users but grew noticeably by 200 users, most visibly on `POST /auth/login` (p95 rising to ~890 ms), since bcrypt hashing is CPU-bound and competes for resources under concurrent load
- `GET /my-links` showed occasional latency spikes (p99 up to 520 ms at 50 users) even while its median stayed low — an early signal worth watching as concurrency increases further
- The redirect endpoint — the core user-facing path — stayed well within target latency throughout, even at 200 concurrent users

### Takeaway

The service handles growing concurrent traffic without errors, but authentication is the first bottleneck to show up under load — a useful signal for where to focus future performance work (e.g. tuning bcrypt cost factor, connection pooling, or horizontal scaling) rather than guessing. The goal of this testing wasn't just to confirm "Shrinkr works," but to find *where* its architecture begins to bottleneck as load increases — and login latency is the clearest answer so far.

---

# 🔄 Continuous Integration

GitHub Actions runs on every push and pull request:

✅ Install Dependencies → ✅ Build Backend → ✅ Build Frontend → ✅ Run Backend Tests → ✅ Run Frontend Tests → ✅ Validate Project

---

# 🚀 Deployment

**Backend — Render**: Docker deployment, automatic deploys, PostgreSQL, Redis, environment variables, health checks

**Frontend — Vercel**: Automatic deployment, CDN, HTTPS, preview deployments

---

# ⚡ Performance Optimizations

- **Database:** SQLAlchemy ORM, indexed queries, pagination, optimized relationships
- **Redis:** Rate limiting, OTP storage, temporary data
- **Backend:** Async endpoints, dependency injection, modular service layer
- **Frontend:** App Router, client-side caching, responsive UI, lazy rendering

---

# 📈 Scalability & Monitoring

**Scaling strategies:** Load balancer, horizontal backend scaling, dedicated Redis cluster, managed PostgreSQL, CDN integration, background workers, queue processing

**Current monitoring:** Request logs, error logs, API logs
**Planned:** Prometheus, Grafana, OpenTelemetry, Sentry

---

# 💡 Challenges Faced

- Designing a reliable, collision-free short URL generation strategy
- Implementing a Redis-based sliding window rate limiter
- Building analytics for country, browser, device, and time-series tracking without hurting redirect performance
- Managing JWT authentication securely
- Structuring a modular, maintainable backend
- Dockerizing multiple services with Docker Compose
- Configuring automated testing and GitHub Actions CI
- Managing environment configurations across local and production

---

# 📚 What I Learned

- REST API design with FastAPI
- Structuring scalable backend applications
- PostgreSQL database design with SQLAlchemy ORM
- JWT authentication & authorization
- Redis caching & rate limiting
- Alembic database migrations
- Docker & Docker Compose
- Automated testing with Pytest and Vitest
- Load and performance testing using Locust
- Continuous Integration using GitHub Actions
- Deployment using Render and Vercel
- Writing clean, modular, maintainable code

---

# 📌 Conclusion

Shrinkr demonstrates practical experience in designing and developing a production-oriented full-stack web application — combining authentication, real-time analytics, caching, database management, containerization, automated testing, and cloud deployment into a single cohesive system.

---

# 📄 License

This project is licensed under the MIT License. See the **LICENSE** file for details.

---

# 👤 Author

**Siddhant Bhandare**
B.Tech Information Technology Student
Backend Developer | Python | FastAPI | PostgreSQL | Redis | Docker

---

# 📬 Contact

- **GitHub:** [Siddhant2528](https://github.com/Siddhant2528)
- **LinkedIn:** [Siddhant Bhandare](https://linkedin.com/in/siddhant-bhandare-6a5325292)
- **Email:** <sbhandare0342@gmail.com>

---

# 🙏 Acknowledgements

Inspired by modern URL shortening platforms such as **Bitly**, **TinyURL**, and **Dub.co**. Thanks to the open-source community and maintainers of FastAPI, Next.js, PostgreSQL, Redis, SQLAlchemy, Docker, and GitHub Actions.

---

<p align="center">

⭐ If you found this project interesting, consider giving it a star on GitHub.

Built with ❤️ using FastAPI, Next.js, PostgreSQL, Redis, Docker and GitHub Actions.

</p>