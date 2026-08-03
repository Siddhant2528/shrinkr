# Database Index Rationale

This document explains **every index** added to the Shrinkr schema beyond the default primary-key and `unique` constraints. It answers the question: *why does this index exist, and what query does it accelerate?*

---

## Background

PostgreSQL performs a **sequential scan** (reads every row) when there is no index on a filtered column. For small tables this is fine, but as data grows, sequential scans become the dominant cost for read-heavy workloads like a URL shortener.

All indexes below were identified by mapping each API endpoint to its underlying SQL `WHERE` clause and checking whether a supporting index existed.

---

## Index Table

| Index name | Table | Column(s) | Reason |
|---|---|---|---|
| `ix_urls_user_id` | `urls` | `user_id` | `GET /my-links` |
| `ix_clicks_url_id` | `clicks` | `url_id` | `GET /analytics/{code}` |
| `ix_clicks_clicked_at` | `clicks` | `clicked_at` | `GET /analytics/{code}/timeseries` |
| `ix_api_keys_user_id` | `api_keys` | `user_id` | `GET /api-keys` |
| `ix_tags_user_id` | `tags` | `user_id` | `GET /tags` |
| `ix_custom_domains_user_id` | `custom_domains` | `user_id` | `GET /domains` |

---

## Detailed Rationale

### `ix_urls_user_id` — `urls.user_id`

**Query accelerated:**
```sql
SELECT * FROM urls
WHERE  user_id = $1
  AND  is_archived = FALSE
ORDER  BY created_at DESC
LIMIT  50 OFFSET 0;
```

`GET /my-links` is the most-hit authenticated endpoint: every dashboard page load executes this query. Without an index, PostgreSQL must scan the entire `urls` table to find rows belonging to one user. With this index, the lookup is `O(log n)` using the B-tree.

---

### `ix_clicks_url_id` — `clicks.url_id`

**Query accelerated:**
```sql
SELECT  country, device, browser, COUNT(*) AS count
FROM    clicks
WHERE   url_id = $1
GROUP   BY country, device, browser;
```

Every analytics page executes this aggregation. The `clicks` table will become the largest table by far (one row per redirect). Without an index on `url_id`, every analytics call performs a full table scan.

---

### `ix_clicks_clicked_at` — `clicks.clicked_at`

**Query accelerated:**
```sql
SELECT  DATE(clicked_at), COUNT(*)
FROM    clicks
WHERE   url_id = $1
  AND   clicked_at >= NOW() - INTERVAL '30 days'
GROUP   BY DATE(clicked_at)
ORDER   BY DATE(clicked_at);
```

The timeseries endpoint (`GET /analytics/{code}/timeseries`) filters clicks within a date range. A B-tree index on `clicked_at` allows PostgreSQL to skip straight to the relevant date range rather than scanning all click rows for a URL.

> **Note:** For very high-traffic links an additional **composite index** `(url_id, clicked_at)` would be even more efficient as it covers both predicates. Add this if analytics p99 latency becomes an issue.

---

### `ix_api_keys_user_id` — `api_keys.user_id`

**Query accelerated:**
```sql
SELECT * FROM api_keys WHERE user_id = $1 AND is_active = TRUE;
```

`GET /api-keys` lists all keys for the authenticated user. Executed on every API key management page load. Without an index, each request scans all API keys across all users.

---

### `ix_tags_user_id` — `tags.user_id`

**Query accelerated:**
```sql
SELECT * FROM tags WHERE user_id = $1;
```

`GET /tags` lists all tags for the authenticated user, executed every time the link creation form or link list loads (tags are shown as filter chips). Without an index, each request scans all tags.

---

### `ix_custom_domains_user_id` — `custom_domains.user_id`

**Query accelerated:**
```sql
SELECT * FROM custom_domains WHERE user_id = $1;
```

`GET /domains` and the domain verification flow both filter by user. Since users may eventually accumulate multiple domain records, an index avoids scanning all custom domain rows.

---

## Pre-existing Indexes (for reference)

These indexes already existed before this change and are documented here for completeness:

| Column | Table | How created |
|---|---|---|
| `id` (PK) | all tables | Automatic with `primary_key=True` |
| `short_code` | `urls` | `unique=True, index=True` in model |
| `email` | `users` | `unique=True, index=True` in model |
| `username` | `users` | `unique=True, index=True` in model |
| `key_hash` | `api_keys` | `unique=True` in model |
| `domain` | `custom_domains` | `unique=True, index=True` in model |

---

## Running the Migration

```bash
# Inside the running backend container or with Postgres accessible:
alembic upgrade head

# To roll back this migration only:
alembic downgrade b1c2d3e4f5a6-1
```
