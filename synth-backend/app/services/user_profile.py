from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.UserProfile import UserProfile
from app.models.user import User
from app.schemas.user_profile import UserProfileUpdate, UserProfileResponse


def update_user_profile(db: Session, user_id: int, profile_data: UserProfileUpdate) -> UserProfileResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)

    for field, value in profile_data.dict(exclude_unset=True).items():
        setattr(profile, field, value)

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return UserProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        full_name=profile.full_name,
        organization=profile.organization,
        usage_purpose=profile.usage_purpose,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )
