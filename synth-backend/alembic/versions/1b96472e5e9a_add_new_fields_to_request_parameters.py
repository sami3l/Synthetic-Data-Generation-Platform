"""add_new_fields_to_request_parameters

Revision ID: 1b96472e5e9a
Revises: b9df63f92c67
Create Date: 2025-08-06 16:46:46.731093

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1b96472e5e9a'
down_revision: Union[str, Sequence[str], None] = 'b9df63f92c67'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Ajouter les nouveaux champs à la table request_parameters
    op.add_column('request_parameters', sa.Column('sample_size', sa.Integer(), nullable=True, default=1000))
    op.add_column('request_parameters', sa.Column('mode', sa.String(), nullable=True, default='simple'))
    op.add_column('request_parameters', sa.Column('generator_lr', sa.Float(), nullable=True))
    op.add_column('request_parameters', sa.Column('discriminator_lr', sa.Float(), nullable=True))
    
    # Renommer le champ optimization_search_type en optimization_method
    op.alter_column('request_parameters', 'optimization_search_type', 
                   new_column_name='optimization_method', existing_type=sa.String())


def downgrade() -> None:
    """Downgrade schema."""
    # Supprimer les nouveaux champs
    op.drop_column('request_parameters', 'sample_size')
    op.drop_column('request_parameters', 'mode')
    op.drop_column('request_parameters', 'generator_lr')
    op.drop_column('request_parameters', 'discriminator_lr')
    
    # Restaurer l'ancien nom du champ
    op.alter_column('request_parameters', 'optimization_method', 
                   new_column_name='optimization_search_type', existing_type=sa.String())
