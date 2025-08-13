"""add_admin_func

Revision ID: c5eca3855210
Revises: 618882b56e26
Create Date: 2025-08-11 11:26:12.946938

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5eca3855210'
down_revision: Union[str, Sequence[str], None] = '618882b56e26'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
