from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

class OrderOut(BaseModel):
    id: UUID
    productName: str
    productImage: str | None = None
    winnerName: str
    dateSold: datetime
    price: float

    class Config:
        from_attributes = True
