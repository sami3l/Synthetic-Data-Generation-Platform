from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_async_db
from app.models.user import User
from app.dependencies.auth import get_current_user
from fastapi.security import OAuth2PasswordRequestForm
from app.models.UserProfile import UserProfile 

from app.schemas.user_profile import UserProfileUpdate
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.auth.jwt import create_access_token
from passlib.context import CryptContext

from app.schemas.user_profile import UserProfileResponse
from app.services.user_profile import update_user_profile

router = APIRouter(prefix="/auth", tags=["Authentication"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


# @router.post("/signup")
# def signup(user: UserCreate, db: Session = Depends(get_db)):
#     existing_user = db.query(User).filter(User.email == user.email).first()
#     if existing_user:
#         raise HTTPException(status_code=400, detail="Email already registered")

#     hashed_pwd = get_password_hash(user.password)
#     new_user = User(email=user.email, hashed_password=hashed_pwd)
#     db.add(new_user)
#     db.commit()
#     db.refresh(new_user)

#     return {"message": "User created successfully", "user": new_user.email}

@router.post("/signup")
async def signup(user: UserCreate, db: AsyncSession = Depends(get_async_db)):
    # Vérifier si l'utilisateur existe déjà
    result = await db.execute(select(User).where(User.email == user.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pwd = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        hashed_password=hashed_pwd,
        username=user.username
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    user_profile = UserProfile(user_id=new_user.id)
    db.add(user_profile)
    await db.commit()

    return {"message": "User created successfully", "user": new_user.username}

    

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_async_db)):
    # Interpret username as email
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create JWT with subject = user email
    access_token = create_access_token(data={"sub": user.email})
    
    # Return token with user info directly
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "username": user.username,
            "is_active": user.is_active
        }
    }


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(db: AsyncSession = Depends(get_async_db), user: User = Depends(get_current_user)):
    try:
        # Chercher le profil existant
        result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
        profile = result.scalar_one_or_none()
        
        # Si le profil n'existe pas, retourner un profil par défaut sans l'enregistrer
        if not profile:
            return UserProfileResponse(
                id=0,  # ID temporaire
                user_id=user.id,
                full_name=None,
                organization=None,
                usage_purpose=None,
                role=user.role,  # Récupérer le rôle depuis l'objet User
                created_at=None,
                updated_at=None
            )
        
        # S'assurer que le rôle du profil est synchronisé avec l'objet User
        if profile.role != user.role:
            profile.role = user.role
            await db.commit()
            await db.refresh(profile)
        
        return profile
    except Exception as e:
        print(f"Error in get_profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to load profile: {str(e)}")


@router.put("/profile", response_model=UserProfileResponse, status_code=status.HTTP_200_OK)
async def update_profile(
    profile_data: UserProfileUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    return await update_user_profile(db=db, user_id=current_user.id, profile_data=profile_data)





