from pydantic import BaseModel

class UserCreate(BaseModel):
    sub: str
    user_name: str
    email: str