"""add_performance_indexes: index FKs and clicked_at for faster queries

Revision ID: b1c2d3e4f5a6
Revises: a3f2e1d0c9b8
Create Date: 2026-07-23 09:00:00.000000

WHY THESE INDEXES EXIST
-----------------------
See docs/indexing_rationale.md for the full rationale.  Short version:

  ix_urls_user_id        — used by every /my-links query (WHERE user_id = ?)
  ix_clicks_url_id       — used by analytics queries   (WHERE url_id   = ?)
  ix_clicks_clicked_at   — used by time-series queries (WHERE clicked_at BETWEEN ? AND ?)
  ix_api_keys_user_id    — used by GET /api-keys       (WHERE user_id   = ?)
  ix_tags_user_id        — used by GET /tags           (WHERE user_id   = ?)
  ix_custom_domains_uid  — used by domain ownership checks (WHERE user_id = ?)
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, Sequence[str], None] = 'a3f2e1d0c9b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── urls ──────────────────────────────────────────────────────────────────
    # Accelerates: GET /my-links   →  WHERE url.user_id = ?
    op.create_index('ix_urls_user_id', 'urls', ['user_id'])

    # ── clicks ────────────────────────────────────────────────────────────────
    # Accelerates: analytics / timeseries  →  WHERE click.url_id = ?
    op.create_index('ix_clicks_url_id', 'clicks', ['url_id'])
    # Accelerates: timeseries date-range   →  WHERE click.clicked_at BETWEEN ? AND ?
    op.create_index('ix_clicks_clicked_at', 'clicks', ['clicked_at'])

    # ── api_keys ──────────────────────────────────────────────────────────────
    # Accelerates: GET /api-keys  →  WHERE api_key.user_id = ?
    op.create_index('ix_api_keys_user_id', 'api_keys', ['user_id'])

    # ── tags ──────────────────────────────────────────────────────────────────
    # Accelerates: GET /tags  →  WHERE tag.user_id = ?
    op.create_index('ix_tags_user_id', 'tags', ['user_id'])

    # ── custom_domains ────────────────────────────────────────────────────────
    # Accelerates: GET /domains  →  WHERE custom_domain.user_id = ?
    op.create_index('ix_custom_domains_user_id', 'custom_domains', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_custom_domains_user_id', table_name='custom_domains')
    op.drop_index('ix_tags_user_id', table_name='tags')
    op.drop_index('ix_api_keys_user_id', table_name='api_keys')
    op.drop_index('ix_clicks_clicked_at', table_name='clicks')
    op.drop_index('ix_clicks_url_id', table_name='clicks')
    op.drop_index('ix_urls_user_id', table_name='urls')
