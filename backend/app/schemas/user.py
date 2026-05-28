from typing import Literal
from uuid import UUID

from app.schemas.base import SnakeModel, snake_config


class UserCreate(SnakeModel):
    name: str
    role: Literal["seller", "buyer"]


class GuestUserCreate(SnakeModel):
    role: Literal["seller", "buyer"]


class UserOut(SnakeModel):
    id: UUID
    name: str
    role: str
    model_config = snake_config(from_attributes=True)


class GuestUserOut(SnakeModel):
    id: UUID
    name: str
    model_config = snake_config(from_attributes=True)
