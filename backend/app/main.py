from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut
app = FastAPI()
@app.get("/health")
def health():
    return {"status": "ok"}
@app.post("/users", response_model=UserOut)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = User(name=payload.name, role=payload.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
@app.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users