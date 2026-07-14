"""add features: is_archived, is_favorite, tags, link_tags, custom_domains

Revision ID: a3f2e1d0c9b8
Revises: e9f8d7c6b5a4
Create Date: 2026-07-12 18:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f2e1d0c9b8'
down_revision: Union[str, Sequence[str], None] = 'e9f8d7c6b5a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Extend urls table
    op.add_column('urls', sa.Column('is_archived', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('urls', sa.Column('is_favorite', sa.Boolean(), nullable=False, server_default='false'))

    # 2. Create tags table
    op.create_table(
        'tags',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('color', sa.String(), nullable=False, server_default='#6366f1'),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
    )

    # 3. Create link_tags join table
    op.create_table(
        'link_tags',
        sa.Column('link_id', sa.Integer(), sa.ForeignKey('urls.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('tag_id', sa.Integer(), sa.ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True),
    )

    # 4. Create custom_domains table
    op.create_table(
        'custom_domains',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('domain', sa.String(), unique=True, nullable=False, index=True),
        sa.Column('verification_token', sa.String(), nullable=False),
        sa.Column('verification_type', sa.String(), nullable=False, server_default='txt'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('custom_domains')
    op.drop_table('link_tags')
    op.drop_table('tags')
    op.drop_column('urls', 'is_favorite')
    op.drop_column('urls', 'is_archived')
