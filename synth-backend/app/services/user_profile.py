from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from app.models.UserProfile import UserProfile
from app.models.user import User
from app.schemas.user_profile import UserProfileUpdate, UserProfileResponse


async def update_user_profile(db: AsyncSession, user_id: int, profile_data: UserProfileUpdate) -> UserProfileResponse:
    # Vérifier si l'utilisateur existe
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Récupérer ou créer le profil
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = UserProfile(user_id=user_id)

    # Mettre à jour les champs fournis
    for field, value in profile_data.dict(exclude_unset=True).items():
        setattr(profile, field, value)

    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    return UserProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        full_name=profile.full_name,
        organization=profile.organization,
        usage_purpose=profile.usage_purpose,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )
