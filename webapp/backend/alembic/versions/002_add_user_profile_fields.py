"""Add user avatar_url and working_repo_id

Revision ID: 002
Revises: 001
Create Date: 2025-10-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('working_repo_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        'users_working_repo_id_fkey', 'users', 'repos', ['working_repo_id'], ['id'],
    )


def downgrade() -> None:
    op.drop_constraint('users_working_repo_id_fkey', 'users', type_='foreignkey')
    op.drop_column('users', 'working_repo_id')
