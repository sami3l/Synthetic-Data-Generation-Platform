from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.dependencies.auth import get_current_user
from fastapi.security import OAuth2PasswordRequestForm
from app.models.UserProfile import UserProfile 

from app.schemas.user_profile import UserProfileUpdate
from app.schemas.user import UserCreate, UserLogin
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
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pwd = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        hashed_password=hashed_pwd,
        username=user.username
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    user_profile = UserProfile(user_id=new_user.id)
    db.add(user_profile)
    db.commit()

    return {"message": "User created successfully", "user": new_user.username}

    

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Interpret username as email
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create JWT with subject = user email
    access_token = create_access_token(data={"sub": user.email})
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/profile", response_model=UserProfileResponse)
def get_profile(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile  # ✅ correct object


@router.put("/profile", response_model=UserProfileResponse, status_code=status.HTTP_200_OK)
def update_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return update_user_profile(db=db, user_id=current_user.id, profile_data=profile_data)





