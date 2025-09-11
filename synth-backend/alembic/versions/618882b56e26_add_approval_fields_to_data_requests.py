"""add_approval_fields_to_data_requests

Revision ID: 618882b56e26
Revises: 5e18cbfff0d9
Create Date: 2025-08-07 17:40:02.796365

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '618882b56e26'
down_revision: Union[str, Sequence[str], None] = '5e18cbfff0d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add approval fields to data_requests table."""
    # Ajouter les nouveaux champs pour l'approbation
    op.add_column('data_requests', sa.Column('approved_by', sa.Integer(), nullable=True))
    op.add_column('data_requests', sa.Column('approved_at', sa.DateTime(), nullable=True))
    op.add_column('data_requests', sa.Column('rejection_reason', sa.Text(), nullable=True))
    
    # Ajouter la foreign key pour approved_by
    op.create_foreign_key(
        'fk_data_requests_approved_by', 
        'data_requests', 
        'users', 
        ['approved_by'], 
        ['id']
    )


def downgrade() -> None:
    """Downgrade schema - Remove approval fields from data_requests table."""
    # Supprimer la foreign key
    op.drop_constraint('fk_data_requests_approved_by', 'data_requests', type_='foreignkey')
    
    # Supprimer les colonnes
    op.drop_column('data_requests', 'rejection_reason')
    op.drop_column('data_requests', 'approved_at')
    op.drop_column('data_requests', 'approved_by')
