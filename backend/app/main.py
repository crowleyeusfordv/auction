import secrets

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.user import User
from app.schemas.user import GuestUserCreate, GuestUserOut, UserCreate, UserOut

app = FastAPI()


def generate_guest_name() -> str:
    return f"Guest_{secrets.randbelow(100_000_000):08d}"


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/users", response_model=UserOut)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = User(name=payload.name, role=payload.role)
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="User name already exists")


@app.post("/users/guest", response_model=GuestUserOut)
def create_guest_user(payload: GuestUserCreate, db: Session = Depends(get_db)):
    for _ in range(10):
        user = User(name=generate_guest_name(), role=payload.role)
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
            return user
        except IntegrityError:
            db.rollback()

    raise HTTPException(status_code=500, detail="Could not generate a unique guest name")


@app.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users
