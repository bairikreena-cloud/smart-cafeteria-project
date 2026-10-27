from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Role
from ..schemas import UserRegister, UserLogin, UserResponse, Token
from ..auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Resolve or create role
    role = db.query(Role).filter(Role.name == user_in.role_name).first()
    if not role:
        role = Role(name=user_in.role_name, description=f"{user_in.role_name.capitalize()} role")
        db.add(role)
        db.flush()

    new_user = User(
        full_name=user_in.full_name,
        email=user_in.email,
        student_staff_id=user_in.student_staff_id,
        phone_number=user_in.phone_number,
        hashed_password=get_password_hash(user_in.password),
        role_id=role.id,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserResponse(
        id=new_user.id,
        full_name=new_user.full_name,
        email=new_user.email,
        student_staff_id=new_user.student_staff_id,
        phone_number=new_user.phone_number,
        role_name=role.name,
        is_active=new_user.is_active,
        created_at=new_user.created_at
    )

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.name})
    user_resp = UserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        student_staff_id=user.student_staff_id,
        phone_number=user.phone_number,
        role_name=user.role.name,
        is_active=user.is_active,
        created_at=user.created_at
    )
    return Token(access_token=access_token, token_type="bearer", user=user_resp)

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        student_staff_id=current_user.student_staff_id,
        phone_number=current_user.phone_number,
        role_name=current_user.role.name if current_user.role else "customer",
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )
