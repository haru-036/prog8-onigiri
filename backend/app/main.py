from fastapi import FastAPI, Request, HTTPException, Depends, Query, Path, UploadFile, File
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv
import os
from authlib.integrations.base_client.errors import MismatchingStateError
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Annotated, List, Optional, Literal
from .models import User, Invitation, Middle, Group, Task, Comment
from .database import get_db, Base, engine
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import uuid
from pydantic import BaseModel, Field, field_validator, EmailStr
from datetime import datetime,date, timedelta
from sqlalchemy.orm import joinedload
from fastapi.middleware.cors import CORSMiddleware
from google import generativeai as genai
import re
from docx import Document
import io
import fitz  # PyMuPDF
import pdfplumber
from fastapi.responses import JSONResponse
import json

load_dotenv()

# DBのテーブル作成（Baseを継承したモデルが読み込まれた後で）
Base.metadata.create_all(bind=engine)

app = FastAPI()


origins = [
    "https://meetask.harurahu.workers.dev",  # フロントエンドのオリジン
    "http://localhost:5173",  # ローカル開発環境のオリジン
]
# CORSミドルウェアの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # どのオリジンからのリクエストも許可
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SessionMiddleware(=セッションのやり取りの管理窓口)の設定
app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SECRET_KEY"),# クッキー署名に使う秘密鍵
    session_cookie="session",  # クライアントsessionという名前のクッキーを渡すし、参照する
    https_only=True, # HTTP でもクッキーを送信できるように。本番環境ではTrueにする
)
# max_ageを指定していないのでsessionクッキーはブラウザをと知ると消える -> ログイン状態はブラウザを開いている限り続く   


# AuthlibのOAuthクラスをインスタンス化し、複数プロバイダをまとめて管理できる窓口を作成
oauth = OAuth()
# GoogleをOIDCプロバイダーとして登録
oauth.register(
    name="google",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    # これを指定するとAuthlibが認可エンドポイント、トークンエンドポイント、ユーザー情報取得エンドポイントを読み取ってくれる
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    client_kwargs={
        "scope": "openid email profile"
    }
    #認可リクエスト時に付与するスコープ
)

db_dependency=Annotated[Session, Depends(get_db)]

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")  # フロントエンドのURLを環境変数から取得

priority_List=["high","middle","low"]
status_List=["not-started-yet","in-progress","done"]

# BaseModelを継承したクラスとしてデータモデルを宣言
class TodoRequest(BaseModel):
    title: str=Field(min_length=3, max_length=100)
    description: str=Field(min_length=1)
    deadline: datetime
    priority: str
    assign: int=Field(gt=0)
    status: str

    @field_validator("priority")
    def priority_name_check(cls, priority): # 第１引数はクラス、第２引数にチェックしたい値
        if priority in priority_List:
            return priority
        else: 
            raise ValueError("Select 'high', 'middle', or 'low'")
        
    @field_validator("status")
    def status_name_check(cls, status): # 第１引数はクラス、第２引数にチェックしたい値
        if status in status_List:
            return status
        else: 
            raise ValueError("Select 'not-started-yet', 'in-progress', or 'done'")

    model_config={
        "json_schema_extra":{
            "example":{
                "title":"報告書作成",
                "description":"前期の報告書",
                "deadline": "2025-06-25T17:29:00.815Z",
                "priority":"high",
                "assign": 1,
                "status":"not-started-yet"
            }
        }
    }

class CommentRequest(BaseModel):
    contents: str=Field(min_length=1, max_length=100)

class InviteRequest(BaseModel):
    email: EmailStr


class GroupNameRequest(BaseModel):
    name: str=Field(min_length=1)

class MembersResponse(BaseModel):
    id: int
    user_name: str
    picture: str

    class Config:
        from_attributes = True

class UserInformationResponse(BaseModel):
    id: int
    user_name: str
    picture: str
    role: Optional[str]=None

    class Config:
        from_attributes = True

class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    deadline: datetime
    priority: str
    assigned_user: UserInformationResponse
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class CommentResponse(BaseModel):
    id: int
    contents: str
    created_at: datetime
    commenter: UserInformationResponse

    class Config:
        from_attributes = True

class UpdateTaskRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, min_length=1)
    deadline: Optional[datetime] = None
    status: Optional[Literal["not-started-yet", "in-progress", "done"]] = None
    priority: Optional[Literal["high", "middle", "low"]] = None
    assign: Optional[int] = Field(default=None, gt=0)

class MinutesTextRequest(BaseModel):
    text: str

#招待メール送信関数
def send_invite_email(receiver_email: str, group_name: str, invite_link: str):
    # Gmailの送信者情報
    sender_email = "341117lisamilet@gmail.com"
    app_password = os.getenv("APP_PASSWORD")  # アプリパスワード

    # メールの内容
    subject = f"【MeeTask】{group_name}グループに招待されています"
    body = f"""
    タスク管理アプリMeeTaskで、
    あなたは【{group_name}】に招待されました！

    下のリンクをクリックしてグループに参加してください：
    {invite_link}

    ※このメールは MeeTask のグループ管理機能を通じて自動送信されています。
    ご不明な点がある場合は、招待者にご確認ください。
    ___

    【MeeTask】
    https://MeeTask-app.example.com
    """

    # MIME構造の作成
    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = receiver_email
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain"))

    # SMTPサーバーに接続
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(sender_email, app_password)
        server.send_message(msg)

    print("招待メールを送信しました。")






#　ログインしているユーザーの情報を取得
def get_current_user(request: Request):
    user=request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="not authenticated")
    return user

#　オーナーかどうか
def authorize_owner(user_id: int, group_id: int, db: Session):
    middle = db.query(Middle).filter(
        Middle.user_id == user_id,
        Middle.group_id == group_id
    ).first()
    if not middle or middle.role != "owner":
        raise HTTPException(status_code=403, detail="You are not authorized.")



# ユーザー情報取得に必要な認可コード取得のためのリダイレクト処理
@app.get("/login")
async def login(request: Request):

    # 「招待リンクを踏んだユーザーがログインにリダイレクトしてくる」 or 「普通にログイン」
    if not request.session.get("invite_token"):
        #　「普通にログイン」ならサーバー側のセッションを念のためクリアにする(state mismatchエラーなどを防ぐ)
        request.session.clear()
    print("LOGIN SESSION ID:", request.cookies.get("session")) # クライアントのリクエストのsessionクッキーをprint

    redirect_uri = os.getenv("REDIRECT_URI")

    #SessionMiddlewareはrequest.session={}のような空の辞書を作る

    response = await oauth.google.authorize_redirect(request, redirect_uri)
    # Authlibがstateを生成してrequest.sessionの["_state_google_<state>"]に書き込む & Googleの認可URLにパラメータとして入れる
    # SessionMiddlewareはレスポンスを渡す前にrequest.sessionの中身(state)の中身をクッキーに保存
    #　→レスポンスはGoogleに飛ばす(302リダイレクト命令)
    print("LOGIN STATE:", dict(request.session))
    return response

# ユーザーがGoogleで認可を出すとリダイレクトURIにクエリパラメータとして認可コードとstateをつけて戻ってくる

# Googleログイン後にリダイレクトされる「認証完了エンドポイント」で「ユーザー情報の取得」
@app.get("/api/auth")
async def auth(request: Request, db: db_dependency):
    print("AUTH SESSION ID:", request.cookies.get("session"))  
    print("AUTH STATE:", dict(request.session))
    #初ログイン後ならstateのみ、招待リンクからきたらstateとinvite_token、この後user情報が入る
    
    # ユーザー認証&IDトークンのデコード
    try:
        token = await oauth.google.authorize_access_token(request)
        # クエリパラメータのcode(認可コード)とstateを取り出してsessionクッキーのstateと比較
        #一致しないとMismatchinhStateErrorに飛ばす
        #一致したらGoogleの認可サーバーのトークンエンドポイントにPostリクエスト(アクセストークンとIDトークンをください)してレスポンスを受け取る
        # scope に "openid" が含まれていれば、「id_tokenを Authlibが内部で署名検証・デコード → その中身を token["userinfo"] にセット」
        
        print("TOKEN内容:", token)
        # アクセストークン、IDトークン、userinfoなどが入ってるはず

    except MismatchingStateError:
        request.session.clear()  # セッション初期化
        print("state mismatch. セッション破棄して /login にリダイレクト")
        # 安全のため再ログインに誘導
        return RedirectResponse(url="/login")
    
    # ユーザー情報をuserinfoから取得
    user = token["userinfo"]

    # request.session["user"]={
    #     "sub": user["sub"],
    #     "name": user.get("name") # getするのは値がない可能性があるから
    # }

    google_id = user["sub"]
    existing_user = db.query(User).filter(User.sub==google_id).first()
    
    # まだ登録されてないならユーザーの新規登録
    if not existing_user:
        new_user = User(
            sub = user["sub"],
            user_name = user.get("name"),
            email = user.get("email"),
            picture = user.get("picture")
        )
        db.add(new_user) #db.add() は「新しく追加する（＝セッションに知られていない）オブジェクト」に使う
        db.commit()
        db.refresh(new_user) 
        existing_user = new_user
    
    request.session["user"]={
        "id": existing_user.id,
        "sub": existing_user.sub,
        "user_name": existing_user.user_name,
        "picture": existing_user.picture
    }

    # 招待メールから来てる場合招待トークンを持ってる
    invite_token = request.session.get("invite_token")
    if invite_token:
        invitation = db.query(Invitation).filter(Invitation.token == invite_token).first()
        if invitation and not invitation.is_accepted:# 招待されて参加済みじゃないか
            # email一致を確認 -> 「招待リンクを踏んできた人は招待した人だ」
            if invitation.email == user.get("email"):
                # すでにMiddleに登録されているか確認(何回も招待リンクを踏むと重複して登録される)
                existing_middle = db.query(Middle).filter(
                    Middle.user_id == existing_user.id,
                    Middle.group_id == invitation.group_id
                ).first()

                    # 招待済みユーザーのグループIDを登録、参加済みを編集
                if not existing_middle:
                    new_middle_model=Middle(
                        user_id=existing_user.id,
                        role="member",
                        group_id=invitation.group_id
                    )
                    db.add(new_middle_model)
                    invitation.is_accepted = True
                    db.commit() # .query() で取得した既存オブジェクトなので、もうセッションに「いる」＝ addしなくていい
                    # 完了後にグループ一覧画面(招待されたグループだけしかないけど)にリダイレクト
                    return RedirectResponse(url=frontend_url + "/groups")
    # グループに入ってないし、招待された人でもない -> 「新しくグループを作るオーナーだ」
    return RedirectResponse(url=frontend_url + "/groups") # グループ一覧画面にリダイレクト


# グループ作成
@app.post("/groups")
async def create_group(group_name_request: GroupNameRequest, request: Request, db: db_dependency):
    user=get_current_user(request)

    new_group=Group(**group_name_request.model_dump())
    db.add(new_group)
    db.commit()
    db.refresh(new_group) # ID取得のため

    new_middle_model=Middle(
        user_id=user["id"],
        role="owner",
        group_id=new_group.id
    )
    db.add(new_middle_model)
    db.commit()

    return {"message": f"グループ'{new_group.name}'を作成し、オーナーとして登録しました。"}

# グループ一覧取得(グループ名＆ユーザーのrole)
@app.get("/groups")
async def get_assigned_groups(request: Request,db: db_dependency):
    user=get_current_user(request)
    results=(
        db.query(Middle, Group, User).join(Group, Middle.group_id == Group.id)
        .join(User, Middle.user_id == User.id)
        .filter(Middle.user_id == user["id"])
        .all()
    )
    groups=[]
    for middle, group, user in results:
        member_pictures=[
            member_user.picture
            for member_user in db.query(User)
            .join(Middle, User.id == Middle.user_id)
            .filter(Middle.group_id == group.id)
            .all()
        ]
        member_length = len(member_pictures)
        group_object = {
            "id":group.id,
            "name": group.name,
            "role": middle.role,
            "member_length": member_length,
            "member_pictures": member_pictures,
        }
        groups.append(group_object)
    return groups

#タスク作成
@app.post("/groups/{group_id}/tasks")
async def create_task(group_id: int, request: Request, todo_request: TodoRequest, db: db_dependency):
    user=get_current_user(request)
    #このユーザーはこのグループに所属しているか
    middle_model=db.query(Middle).filter(Middle.group_id==group_id).filter(Middle.user_id==user["id"]).first()
    if not middle_model:
        raise HTTPException(status_code=403, detail="あなたはこのグループに所属していないので作成できません")
    #assignされているメンバーはこのグループに所属しているか
    assign_check=db.query(Middle).filter(Middle.group_id==group_id).filter(Middle.user_id==todo_request.assign).first()
    if not assign_check:
         raise HTTPException(status_code=403, detail="指定したユーザーはこのグループに所属していないのでタスクをアサインできません")       
    todo_model=Task(**todo_request.model_dump(),group_id=group_id)
    db.add(todo_model)
    db.commit()
    return {"message":"タスクを作成しました"}

# コメント投稿
@app.post("/tasks/{task_id}/comments")
async def post_comment(task_id:int, comment_request: CommentRequest,request: Request, db: db_dependency):
    #ユーザー情報取ってくる
    user=get_current_user(request)
    #このタスクはタスクDBに存在するか
    task=db.query(Task).filter(Task.id==task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="タスクが存在しません")
    # アクセスしているユーザーがこのtaskを作成したグループのメンバーか -> Middleテーブルでuserのidと一致するカラムを絞り込む＆その中からこのタスクを作成したグループのidと一致するものがあるか
    middle_model=db.query(Middle).filter(Middle.user_id==user["id"]).filter(Middle.group_id==task.group_id).first()
    if not middle_model:
        raise HTTPException(status_code=403, detail="このグループに所属していないためコメントできません")
    comment_model=Comment(**comment_request.model_dump(), task_id=task_id, user_id=user["id"])
    db.add(comment_model)
    db.commit()
    return {"message":"コメントを投稿しました"}

# コメント取得
@app.get("/tasks/{task_id}/comments", response_model=List[CommentResponse])
async def get_comments(request: Request, db: db_dependency, task_id: int=Path(gt=0)):
    user=get_current_user(request)
    task=db.query(Task).filter(Task.id==task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="タスクが存在しません")
    # アクセスしているユーザーがこのtaskを作成したグループのメンバーか -> Middleテーブルでuserのidと一致するカラムを絞り込む＆その中からこのタスクを作成したグループのidと一致するものがあるか
    middle_model=db.query(Middle).filter(Middle.user_id==user["id"]).filter(Middle.group_id==task.group_id).first()
    if not middle_model:
        raise HTTPException(status_code=403, detail="このグループに所属していないためコメントできません")
    comment_model=db.query(Comment).options(joinedload(Comment.commenter)).filter(Comment.task_id==task_id).all()
    return comment_model

# タスク更新
@app.put("/tasks/{task_id}")
async def update_tasks(update_task_request: UpdateTaskRequest, request:Request, db: db_dependency, task_id: int=Path(gt=0)):
    user=get_current_user(request)
    task_model=db.query(Task).filter(Task.id==task_id).first()
    if not task_model:
        raise HTTPException(status_code=404, detail="このタスクは存在しません")
    #ユーザーがこのグループのメンバーか
    middle_model=db.query(Middle).filter(Middle.group_id==task_model.group_id).filter(Middle.user_id==user["id"]).first()
    if not middle_model:
        raise HTTPException(status_code=403, detail="このグループに所属していないため更新できません")
    if update_task_request.title is not None:
        task_model.title = update_task_request.title
    if update_task_request.description is not None:
        task_model.description = update_task_request.description
    if update_task_request.deadline is not None:
        task_model.deadline = update_task_request.deadline
    if update_task_request.status is not None:
        task_model.status = update_task_request.status
    if update_task_request.priority is not None:
        task_model.priority = update_task_request.priority
    if update_task_request.assign is not None:
        task_model.assign = update_task_request.assign

    db.commit()
    db.refresh(task_model)
    return {"message":"更新しました"}

# 自分のグループのタスク一覧取得
@app.get("/groups/{group_id}/tasks",response_model=List[TaskResponse])
async def get_all_tasks(
    request: Request, 
    db: db_dependency, 
    group_id: int=Path(gt=0),
    status: Optional[Literal["not-started-yet", "in_progress", "done"]]=Query(None),
    priority: Optional[Literal["high", "middle", "low"]]=Query(None),
    assign: Optional[int]=Query(None, gt=0)
    ):
    user = get_current_user(request)
    #このユーザーはこのグループに所属しているのか
    middle_model=db.query(Middle).filter(Middle.user_id==user["id"]).filter(Middle.group_id==group_id).first()
    if not middle_model:
        raise HTTPException(status_code=403, detail="このグループに所属していないのでタスクを取得できませんでした")
    # query=db.query(Task).filter(Task.group_id==group_id)
    query = db.query(Task).options(joinedload(Task.assigned_user)).filter(Task.group_id == group_id)
    #statusで絞り込む
    if status:
        query=query.filter(Task.status==status)
    # priorityで絞り込む
    if priority:
        query=query.filter(Task.priority==priority)
    # assignで絞り込む
    if assign:
        query=query.filter(Task.assign==assign)
    tasks=query.all()
    
    return tasks

#グループのメンバー一覧取得
@app.get("/groups/{group_id}/members", response_model=List[MembersResponse])
async def get_all_member(db: db_dependency, group_id:int=Path(gt=0)):
    middle_model=db.query(Middle).filter(Middle.group_id==group_id).all()
    if not middle_model:
        raise HTTPException(status_code=404, detail="グループが存在しません")
    users=[m.user_id for m in middle_model]
    user_model=db.query(User).filter(User.id.in_(users)).all()
    return user_model

# タスク詳細取得
@app.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task_detail(request: Request, db: db_dependency, task_id: int=Path(gt=0)):
    user=get_current_user(request)
    #このタスクはあるのか
    task_model = db.query(Task).options(joinedload(Task.assigned_user)).filter(Task.id == task_id).first()
    # task_model=db.query(Task).filter(Task.id==task_id).first()
    if not task_model:
        raise HTTPException(status_code=404, detail="タスクが見つかりません")
    #このユーザーはこのタスクのグループメンバーかどうか
    middle_model=db.query(Middle).filter(Middle.group_id==task_model.group_id).filter(Middle.user_id==user["id"]).first()
    if not middle_model:
        raise HTTPException(status_code=403, detail="このタスクのグループに所属していないため取得できませんでした")
    return task_model

#タスク削除(認可：リーダーとアサインされてるメンバーだけ)
@app.delete("/tasks/{task_id}")
async def delete_task(request: Request, db: db_dependency,task_id: int=Path(gt=0)):
    task_model=db.query(Task).filter(Task.id==task_id).first()
    if not task_model:
        raise HTTPException(status_code=404, detail="タスクが見つかりません")
    user=get_current_user(request)
    #ユーザーがこのタスクのグループのメンバーか
    middle_model=db.query(Middle).filter(Middle.group_id==task_model.group_id).filter(Middle.user_id==user["id"]).first()
    if not middle_model:
        raise HTTPException(status_code=403, detail="このタスクのグループに所属していないので削除できません")
    if middle_model.role=="owner" or task_model.assign==user["id"]:
        db.delete(task_model)
        db.commit()
        return {"message":"タスクを削除しました"}
    else:
        raise HTTPException(status_code=403, detail="このタスクを削除する権限がありません")

#グループ削除
@app.delete("/group/{group_id}")
async def delete_group(request: Request, db: db_dependency, group_id: int=Path(gt=0)):
    group_model=db.query(Group).filter(Group.id==group_id).first()
    if not group_model:
        raise HTTPException(status_code=404, detail="グループが見つかりません")
    user=get_current_user(request)
    #ユーザーがこのタスクに所属しているか
    middle_model=db.query(Middle).filter(Middle.group_id==group_id).filter(Middle.user_id==user["id"]).first()
    if not middle_model:
        raise HTTPException(status_code=403, detail="このタスクのグループに所属していないので削除できません")
    #オーナーかどうか
    if middle_model.role!="owner":
        raise HTTPException(status_code=403, detail="このグループのオーナーではないので削除できません")
    db.delete(group_model)

    #削除したグループの中間テーブルを全部削除
    middle_delete_model=db.query(Middle).filter(Middle.group_id==group_id).all()
    for m in middle_delete_model:
        db.delete(m)

    #削除したグループのタスクを全部削除したい
    task_delete_model=db.query(Task).filter(Task.group_id==group_id).all()
    #削除するタスクに含まれるコメントも全部削除したいので削除したい全タスクのidを取得
    task_ids = [t.id for t in task_delete_model]
    comment_delete_model=db.query(Comment).filter(Comment.task_id.in_(task_ids)).all()
    #コメント削除
    for c in comment_delete_model:
        db.delete(c)
    #タスクも削除
    for t in task_delete_model:
        db.delete(t)
    db.commit()
    
    return {"message":"グループを削除しました"}


# メンバー削除
@app.delete("/groups/{group_id}/members/{member_id}")
async def delete_member(request: Request, db: db_dependency, group_id: int=Path(gt=0), member_id: int = Path(gt=0)):
    #グループが存在するか
    group_model=db.query(Group).filter(Group.id==group_id).first()
    if not group_model:
        raise HTTPException(status_code=404, detail="グループが見つかりません")
    #ユーザーが存在するか
    user_model=db.query(User).filter(User.id==member_id).first()
    if not user_model:
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
    
    user=get_current_user(request)
    
    #クライアントがこのグループに所属しているか
    middle_client_model=db.query(Middle).filter(Middle.group_id==group_id).filter(Middle.user_id==user["id"]).first()
    if not middle_client_model:
        raise HTTPException(status_code=403, detail="このタスクのグループに所属していないので削除できません")
    #オーナーかどうか
    if middle_client_model.role!="owner":
        raise HTTPException(status_code=403, detail="このグループのオーナーではないので削除できません")
    
    #削除しようとしているユーザーがこのグループに所属しているか
    middle_model=db.query(Middle).filter(Middle.group_id==group_id).filter(Middle.user_id==member_id).first()
    if not middle_model:
        raise HTTPException(status_code=404, detail="削除しようとしているユーザーはこのグループに所属していません")
    
    #オーナー自身の削除を防止
    if member_id==user["id"]:
        raise HTTPException(status_code=400, detail="あなたはオーナーなのでこのグループから削除することはできません")

    #メンバーを外す(中間テーブル)
    db.delete(middle_model)

    #このユーザーがこのグループで持ってたタスクも消す
    task_model=db.query(Task).filter(Task.group_id==group_id).filter(Task.assign==member_id).all()

    #コメントを消すタスクについてるコメントを先に消す
    for t in task_model:
        comment_models=db.query(Comment).filter(Comment.task_id==t.id).all()
        for c in comment_models:
            db.delete(c)
        db.delete(t)

    db.commit()
    return {"message": "メンバーをこのグループから削除しました"}

    
    
# カレントユーザー情報の取得
@app.get("/me", response_model=UserInformationResponse)
async def get_current_user_information(request: Request, db: db_dependency, group_id: Optional[int]=None):
    user=get_current_user(request)
    if group_id:
        middle_model=db.query(Middle).filter(Middle.group_id==group_id).filter(Middle.user_id==user["id"]).first()
        if middle_model:
            user["role"]=middle_model.role
    return user


# ログアウトする
@app.get("/logout")
async def logout(request: Request):
    request.session.clear() # セッション情報を消す
    return RedirectResponse(url="/login") # ログイン画面に戻す
    

# 招待エンドポイント
@app.post("/groups/{group_id}/invite")
async def invite_user(group_id: int, db: db_dependency, request: Request, invite_request: InviteRequest):
    group_model=db.query(Group).filter(Group.id==group_id).first()
    if not group_model:
        raise HTTPException(status_code=404, detail="グループが見つかりません")
    #招待者がオーナーかどうか
    user=get_current_user(request)
    authorize_owner(user["id"],group_id, db)
    token = str(uuid.uuid4())  # UUID(University Unique identifier)=ランダムな一意識別子を生成する関数
    # invitationテーブルに保存
    invitation_model = Invitation(**invite_request.model_dump(), group_id=group_id, token=token)
    db.add(invitation_model)
    db.commit()
    invite_link = f"http://localhost:8000/join?token={token}"  # トークンは本来ランダム生成
    group_name=group_model.name
    send_invite_email(invite_request.email, group_name, invite_link)
    return {"message": "招待メールを送信しました"}


# 招待されたグループに参加
@app.get("/join")
async def join_group(token: str, db: db_dependency, request: Request):
    invitation = db.query(Invitation).filter(Invitation.token == token).first()
    if not invitation or invitation.is_accepted:
        raise HTTPException(status_code=400, detail="無効なまたは使用済みのトークンです")
    # 招待トークンをセッションに保存
    request.session["invite_token"]=token
    # /login にリダイレクト（Googleログインを開始させるため）
    return RedirectResponse(url="/login")
    




#AIタスク抽出機能追加


# --- APIキーの設定 ---
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY not set in environment")

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

# --- リクエスト/レスポンスのデータモデル ---

class TaskItem(BaseModel):
    title: str
    description: str
    deadline: Optional[str] = None
    priority: Optional[Literal["high", "middle", "low"]] = None
    assign: Optional[int] = None
    status: str="not-started-yet"

class MeetingMinutes(BaseModel):
    text: str


# --- ファイル読み取り関数 ---
def extract_text_from_file(file: UploadFile) -> str:
    ext = file.filename.split('.')[-1].lower()
    content = file.file.read()

    if ext == "txt":
        return content.decode("utf-8")
    elif ext == "docx":
        doc = Document(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs)
    elif ext == "pdf":
        text = ""
        with fitz.open(stream=content, filetype="pdf") as doc:
            for page in doc:
                text += page.get_text()
        return text
    else:
        raise HTTPException(status_code=400, detail="対応していないファイル形式です（.txt/.docx/.pdf）")

# --- プロンプトテンプレート ---
def generate_prompt(meeting_text: str, group_id:int, db: db_dependency) -> str:
    middle_model=db.query(Middle).filter(Middle.group_id==group_id).all()
    user_ids=[]
    for m in middle_model:
        user_ids.append(m.user_id)
    # ユーザーモデルをまとめて取得（効率的に）
    user_models = db.query(User).filter(User.id.in_(user_ids)).all()
    # JSON形式のリストを作成
    users_json = [{"name": user.user_name, "id": user.id} for user in user_models]

    user_json_example = {
        "users": [
            {"name": "田中晴人", "id": 1},
            {"name": "Hnako Ymamoto", "id": 2},
            {"name": "Ito Kenji", "id": 3},
            {"name": "Nakamura Yui", "id": 4}, 
        ]
    }

    user_json_str = json.dumps(user_json_example, ensure_ascii=False, indent=2)
    
    return f"""
あなたはプロジェクトマネージャーのアシスタントAIです。  
会議議事録から、必要なタスクを抽出し、それぞれに以下の形式で詳細なJSONオブジェクトとして出力してください。
議事録は、直接テキストで入力される場合と、ファイル（.txt / .md / .docx）としてアップロードされる場合があります。
ファイルが渡されている場合はその内容を優先的に読み取り、議事録本文として扱ってください。
テキスト入力がある場合は、それをそのまま議事録とみなしてください。
いずれの場合も同じ出力フォーマットでタスクを抽出してください。

特に `description` には、議事録内に記載された**タスクの背景、目的、注意点、何をなぜやるのかなど**をできるだけ詳細に含めてください。  
改行を含む複数行の説明でも問題ありません。

priority は以下の基準で分類してください：
- "high": 緊急対応、3日以内の納期、対外的な影響がある業務
- "middle": 期限はあるが緊急でない通常タスク
- "low": 期限未定、下準備・補助タスク、他タスク依存のもの
割り当ては realistic に行い、すべてを high にしないでください。

締め切り（deadline）は、議事録内に「来週中」「7月頭」「6月末ごろ」などの曖昧な表現がある場合でも、できる限り具体的な ISO 日付（YYYY-MM-DD）形式に変換してください。

変換ルールの例：
- 「来週中」→ 会議日から数えて最初の月曜日〜金曜日の範囲内の日付（例:会議が6/18なら「来週中」は6/24〜6/28のいずれか）
- 「7月頭」→ 7月1日〜7月5日あたり（デフォルトは7月3日）
- 「6月末」→ 6月30日（月末）
- 「近日中」「今週中」→ 会議日から数えて3営業日以内
- 「〇日までに」などがあればそのまま使う
もし特定が難しい場合は `null` にしてください。

以下の users_json は、現在このプロジェクトに参加しているメンバーの情報です。

議事録中で担当者が登場した場合、その名前に対応する `id` を `assign` に指定してください。

ユーザー一覧のnameは敬称なしフルネームです。議事録中の敬称つき名前を適切に紐づけてassignにidを入れてください。
一致する名前が存在しない場合は `null` としてください。
【users_json】
---
{users_json}

出力形式（JSON):
[
  {{
    "name": "タスクのタイトル（短く簡潔に）",
    "description": "このタスクの詳細な説明をここに記述。\\n必要があれば改行して段落として整理してください。",
    "deadline": "2025-06-25" または null,
    "priority": "low" | "middle" | "high",
    "assign": user.id または null
  }}
]

例（議事録）:
・新商品キャンペーンに向けた資料を来週中に田中さんが作成。ターゲットは20代女性で、SNS投稿も意識するようにとの指示あり。
・山本さんは、主要競合のSNS運用調査を6月25日までに行うことに。過去3か月の投稿分析を含めてほしいとのこと。

例 (user_json):
{user_json_str}

出力: json
[
  {{
    "title": "キャンペーン資料の作成",
    "description": "田中さんには、新商品キャンペーンに向けた資料を来週中に作成してもらいます。\\n対象は20代女性で、特にSNSでの拡散を意識したトーンと内容にするように指示がありました。\\n既存資料のテンプレートは使わず、自由な構成で作成して問題ありません。",
    "deadline": null,
    "priority": "middle",
    "assign": 1
  }},
  {{
    "title": "競合SNS運用の調査",
    "description": "山本さんは、主要競合（A社、B社）のSNS運用状況について調査を行います。\\n締切は6月25日。\\n調査内容には、過去3か月の投稿傾向・反応・キャンペーン施策の分析を含める必要があります。\\n参考資料は共有フォルダにあります。",
    "deadline": "2025-06-25",
    "priority": "high",
    "assign": 2
  }}
]
【議事録】
---
{meeting_text}
"""


# Markdownのコードブロックを除去する関数
def strip_markdown_code_block(text: str) -> str:
    if text.startswith("```json"):
        text = text[len("```json"):].strip()
    if text.endswith("```"):
        text = text[:-len("```")].strip()
    return text

# --- テキスト入力のエンドポイント ---
@app.post("/groups/{group_id}/minutes/tasks", response_model=List[TaskItem])
async def extract_tasks(meeting_minutes: MeetingMinutes, request: Request, db: db_dependency, group_id:int=Path(gt=0)):
    user=get_current_user(request)
    middle_model=db.query(Middle).filter(Middle.group_id==group_id).filter(Middle.user_id==user["id"]).first()
    if not middle_model:
        raise HTTPException(status_code=403, detail="このグループのメンバーではないためアクセスできません")
    if middle_model.role!="owner":
        raise HTTPException(status_code=403, detail="オーナーではないので議事録を書き込めません")
    if not meeting_minutes.text or len(meeting_minutes.text.strip()) < 50:
        raise HTTPException(status_code=400, detail="議事録テキストが短すぎるか空です。")

    # ユーザー入力の整形：制御文字をスペースに置換
    cleaned_text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', ' ', meeting_minutes.text)
    cleaned_text = cleaned_text.replace("\r", "")  # Windowsの改行コード対策

    prompt = generate_prompt(cleaned_text, group_id, db)
    raw_output = None

    try:
        response = model.generate_content(prompt)
        raw_output = response.text 
        # Markdownの ```json ... ``` を除去
        clean_output = strip_markdown_code_block(raw_output)

        return json.loads(clean_output)
    except json.JSONDecodeError:
    # 必要ならAIの出力を整形してリトライする処理を書く
        print("AIの出力:", raw_output)  # ログに出すだけで実用面が改善します
        raise HTTPException(status_code=500, detail="JSONパースに失敗しました")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

# --- ファイルアップロードのエンドポイント ---
@app.post("/groups/{group_id}/minutes/tasks-from-file", response_model=List[TaskItem])
async def extract_tasks_from_file(db: db_dependency, request: Request, group_id: int=Path(gt=0), file: UploadFile = File(...)):
    user=get_current_user(request)
    middle_model=db.query(Middle).filter(Middle.group_id==group_id).filter(Middle.user_id==user["id"]).first()
    
    if not middle_model:
        raise HTTPException(status_code=403, detail="このグループのメンバーではないためアクセスできません")
    if middle_model.role!="owner":
        raise HTTPException(status_code=403, detail="オーナーではないので議事録を書き込めません")

    try:
        meeting_text = extract_text_from_file(file)

        if not meeting_text or len(meeting_text.strip()) < 50:
            raise HTTPException(status_code=400, detail="議事録のテキストが短すぎるか空です。")
        
        prompt = generate_prompt(meeting_text,group_id, db)
        raw_output = None

        response = model.generate_content(prompt)
        raw_output = response.text 
        return json.loads(raw_output)
    except json.JSONDecodeError:
    # 必要ならAIの出力を整形してリトライする処理を書く
        print("AIの出力:", raw_output)  # ログに出すだけで実用面が改善します
        raise HTTPException(status_code=500, detail="JSONパースに失敗しました")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ファイルからのタスク抽出失敗: {str(e)}")

# --- DB保存用エンドポイント（依存関係がある前提） ---
@app.post("/groups/{group_id}/tasks/save", response_model=List[TaskItem])
async def save_tasks_to_db(request: Request, tasks: List[TaskItem], db: db_dependency, group_id: int=Path(gt=0)):
    
    user=get_current_user(request)
    middle_model=db.query(Middle).filter(Middle.group_id==group_id).filter(Middle.user_id==user["id"]).first()
    
    if not middle_model:
        raise HTTPException(status_code=403, detail="このグループのメンバーではないためアクセスできません")
    if middle_model.role!="owner":
        raise HTTPException(status_code=403, detail="オーナーではないので議事録を書き込めません")

    saved_tasks = []

    for task in tasks:
        task_record = Task(
            title=task.title,
            description=task.description,
            deadline=task.deadline,
            priority=task.priority,
            assign=task.assign,
            status=task.status or "not-started-yet",
        )
        db.add(task_record)
        saved_tasks.append(task)

    db.commit()
    return saved_tasks
