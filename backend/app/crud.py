from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from . import models, schemas

async def get_user_by_sub(db: AsyncSession, sub: str):
    result = await db.execute(select(models.User).where(models.User.sub == sub))
    return result.scalars().first()

# async def create_user(db: AsyncSession, user: schemas.UserCreate):
#     db_user = models.User(**user.dict())
#     db.add(db_user)
#     await db.commit()
#     await db.refresh(db_user)
#     return db_user