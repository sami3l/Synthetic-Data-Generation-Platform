from fastapi import FastAPI
from app.db.database import Base, engine
from app.routers import auth
from app.routers import admin

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth.router)
app.include_router(admin.router)