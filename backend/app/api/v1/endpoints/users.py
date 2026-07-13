import hashlib
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserUpdate, UserLogin

router = APIRouter()


@router.get("", response_model=list[UserRead])
def list_users(
    q: str | None = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
) -> list[User]:
    statement = select(User).order_by(User.display_name)
    if active_only:
        statement = statement.where(User.is_active.is_(True))
    if q:
        pattern = f"%{q}%"
        statement = statement.where(
            User.display_name.ilike(pattern) | User.email.ilike(pattern) | User.position.ilike(pattern)
        )
    return list(db.scalars(statement).all())


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    existing = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email user sudah terdaftar")

    user = User(**payload.model_dump(exclude={"email"}), email=str(payload.email).lower())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int, db: Session = Depends(get_db)) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User tidak ditemukan")
    return user


@router.patch("/{user_id}", response_model=UserRead)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User tidak ditemukan")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=UserRead)
def login_user(payload: UserLogin, db: Session = Depends(get_db)) -> User:
    user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
        )
    
    hashed_input = hashlib.sha256(payload.password.encode()).hexdigest()
    if user.hashed_password != hashed_input:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda dinonaktifkan",
        )
        
    return user
