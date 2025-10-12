"""Add default_role to companies

Revision ID: 003
Revises: 002
Create Date: 2025-10-12 00:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('companies', sa.Column('default_role', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('companies', 'default_role')

