from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime, timezone

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    sub = Column(String, unique=True, index=True)  # Google ID
    user_name = Column(String)
    email = Column(String)
    picture = Column(String)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    # relationshipはSQLAlchemyで２つのテーブルがどう繋がっているかを表現する仕組み ->　オブジェクトとしてアクセスできるようになる
    # テーブルAの中にForeignKeyがあるだけでは「IDでつながってる」としかわからない
    assigned_tasks = relationship("Task", back_populates="assigned_user")

class Group(Base):
    __tablename__ = "groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

class Task(Base):
    __tablename__="tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    deadline = Column(DateTime)
    priority = Column(String)
    assign = Column(Integer, ForeignKey("users.id"))
    status = Column(String)
    group_id = Column(Integer, ForeignKey("groups.id"))
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    # back_populates="assigned_tasks" -> これは 2つのテーブルが "双方向に" 関係していることを示す
    assigned_user = relationship("User", back_populates="assigned_tasks", foreign_keys=[assign])  

class Comment(Base):
    __tablename__="comments"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    contents = Column(String)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    token = Column(String, unique=True, nullable=False)
    is_accepted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

# ユーザーがどのグループになんのroleで所属するのを関連づけるテーブル(ユーザー１人に対し、roleとgroup_idが複数存在)
class Middle(Base):
    __tablename__="middles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String, default=None)
    group_id = Column(Integer, ForeignKey("groups.id"), default=None)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
