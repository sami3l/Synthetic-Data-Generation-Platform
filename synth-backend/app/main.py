from fastapi import FastAPI
from app.db.database import Base, engine
from app.routers import admin , data , auth , notification

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(data.router)
app.include_router(notification.router)