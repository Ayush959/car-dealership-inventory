from decimal import Decimal
from pydantic import BaseModel, ConfigDict, EmailStr, Field, StrictInt


class InputModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Register(InputModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class Login(InputModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class VehicleInput(InputModel):
    make: str = Field(min_length=1, max_length=80)
    model: str = Field(min_length=1, max_length=120)
    category: str = Field(min_length=1, max_length=60)
    price: Decimal = Field(ge=0, le=1_000_000_000, max_digits=12, decimal_places=2)
    quantity: StrictInt = Field(ge=0, le=1_000_000)


class Restock(InputModel):
    quantity: StrictInt = Field(gt=0, le=1_000_000)
