from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # ✅ You missed this import
from app.db.database import Base, engine
from app.routers import admin, data, auth, notification

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["exp://192.168.45.161:8081", "http://localhost:8081"],#You can specify allowed origins here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(data.router)
app.include_router(notification.router)
