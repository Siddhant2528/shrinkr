"""add_user_id_to_api_keys

Revision ID: a1b2c3d4e5f6
Revises: 0aafccd6ac9d
Create Date: 2026-07-12 10:27:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '0aafccd6ac9d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add user_id column to api_keys table."""
    op.add_column('api_keys', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_api_keys_user_id',
        'api_keys', 'users',
        ['user_id'], ['id'],
    )


def downgrade() -> None:
    """Remove user_id column from api_keys table."""
    op.drop_constraint('fk_api_keys_user_id', 'api_keys', type_='foreignkey')
    op.drop_column('api_keys', 'user_id')
