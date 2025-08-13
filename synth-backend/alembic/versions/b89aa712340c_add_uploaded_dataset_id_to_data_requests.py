"""add_uploaded_dataset_id_to_data_requests

Revision ID: b89aa712340c
Revises: c90333d6fdf8
Create Date: 2025-08-01 18:43:27.509608

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b89aa712340c'
down_revision: Union[str, Sequence[str], None] = 'c90333d6fdf8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add uploaded_dataset_id column to data_requests table
    op.add_column('data_requests', sa.Column('uploaded_dataset_id', sa.Integer(), nullable=True))
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_data_requests_uploaded_dataset_id',
        'data_requests', 
        'uploaded_datasets',
        ['uploaded_dataset_id'], 
        ['id']
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop foreign key constraint
    op.drop_constraint('fk_data_requests_uploaded_dataset_id', 'data_requests', type_='foreignkey')
    
    # Drop column
    op.drop_column('data_requests', 'uploaded_dataset_id')
