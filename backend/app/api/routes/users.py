from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db.session import get_db
from app.models import User
from app.models.enums import UserRole
from app.schemas.auth import UserOut

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/sales", response_model=list[UserOut])
def list_sales_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(User).filter(User.role == UserRole.sales, User.is_active.is_(True)).order_by(User.name).all()