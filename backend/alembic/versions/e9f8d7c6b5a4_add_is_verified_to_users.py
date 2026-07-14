"""add_is_verified_to_users

Revision ID: e9f8d7c6b5a4
Revises: a1b2c3d4e5f6
Create Date: 2026-07-12 19:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e9f8d7c6b5a4'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add is_verified column to users table."""
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), server_default=sa.text('false'), nullable=False))


def downgrade() -> None:
    """Remove is_verified column from users table."""
    op.drop_column('users', 'is_verified')
