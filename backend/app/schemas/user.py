from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict
class UserCreate(BaseModel):
    name: str
    role: Literal["seller", "buyer"]
class UserOut(BaseModel):
    id: UUID
    name: str
    role: str
    model_config = ConfigDict(from_attributes=True)