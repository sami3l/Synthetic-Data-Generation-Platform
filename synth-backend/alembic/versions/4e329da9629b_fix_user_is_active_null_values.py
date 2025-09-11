"""fix_user_is_active_null_values

Revision ID: 4e329da9629b
Revises: 8fb50e8259e4
Create Date: 2025-08-11 17:26:39.645205

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4e329da9629b'
down_revision: Union[str, Sequence[str], None] = '8fb50e8259e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Fix NULL values in users.is_active column."""
    # Mettre à jour toutes les valeurs NULL en True (par défaut)
    op.execute("UPDATE users SET is_active = true WHERE is_active IS NULL")
    
    # Rendre la colonne NOT NULL pour éviter les futurs problèmes
    op.alter_column('users', 'is_active', 
                   existing_type=sa.Boolean(),
                   nullable=False,
                   server_default=sa.text('true'))


def downgrade() -> None:
    """Downgrade schema - Allow NULL values again."""
    # Autoriser les valeurs NULL à nouveau
    op.alter_column('users', 'is_active',
                   existing_type=sa.Boolean(),
                   nullable=True,
                   server_default=None)
