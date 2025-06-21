from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv
load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"), echo=True)
# echo=True は、SQLAlchemy に 実行されるすべての SQL 文をログとして表示させるためのオプション

SessionLocal = sessionmaker(
    bind=engine, 
    autocommit=False,
    autoflush=False
)

# Baseにメタデータ(テーブル定義の集まり)とマッピング機能を持たせる
# これを継承する子クラスはそのテーブルのカラム定義をBase.metadataに登録する
Base = declarative_base()

def get_db():
    db=SessionLocal() 
    try:
        yield db
    finally:
        db.close()
