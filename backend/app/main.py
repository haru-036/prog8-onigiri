from fastapi import FastAPI, Request, HTTPException, Depends, Query, Path
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
from datetime import datetime


load_dotenv()

# DBのテーブル作成（Baseを継承したモデルが読み込まれた後で）
Base.metadata.create_all(bind=engine)

app = FastAPI()

# SessionMiddleware(=セッションのやり取りの管理窓口)の設定
app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SECRET_KEY"),# クッキー署名に使う秘密鍵
    session_cookie="session",  # クライアントsessionという名前のクッキーを渡すし、参照する
    https_only=False, # HTTP でもクッキーを送信できるように。本番環境ではTrueにする
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



priority_List=["high","middle","low"]
status_List=["not-started-yet","in-progress","done"]

# BaseModelを継承したクラスとしてデータモデルを宣言
class TodoRequest(BaseModel):
    title: str=Field(min_length=3, max_length=100)
    description: str=Field(min_length=3, max_length=100)
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
    contents: str=Field(min_length=3, max_length=100)

class InviteRequest(BaseModel):
    email: EmailStr

class TaskResponse(BaseModel):
    id: int
    title : str
    description :str
    deadline :datetime
    priority :str
    assign : int
    status : str
    group_id : int

class GroupNameRequest(BaseModel):
    name: str=Field(min_length=3)

class MembersResponse(BaseModel):
    id: int
    user_name: str
    picture: str

    class Config:
        orm_mode = True


#招待メール送信関数
def send_invite_email(receiver_email: str, group_id: int, invite_link: str):
    # Gmailの送信者情報
    sender_email = "341117lisamilet@gmail.com"
    app_password = os.getenv("APP_PASSWORD")  # アプリパスワード

    # メールの内容
    subject = f"{group_id}への招待"
    body = f"""
    あなたは{group_id}に招待されました！

    下のリンクから参加してください：
    {invite_link}

    ご利用ありがとうございます！
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
        "name": existing_user.user_name,
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
                    return {"message" : "Move your task screen."} 
    # グループに入ってないし、招待された人でもない -> 「新しくグループを作るオーナーだ」
    return {"message": "Move new group making screen"}



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
    get_current_user(request)
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

# 自分のグループのタスク一覧取得
@app.get("/groups/{group_id}/tasks",response_model=List[TaskResponse])
async def get_all_tasks(
    request: Request, 
    db: db_dependency, 
    group_id: int=Path(gt=0),
    status: Optional[Literal["todo", "in_progress", "done"]]=Query(None),
    priority: Optional[Literal["high", "middle", "low"]]=Query(None),
    assign: Optional[int]=Query(None, gt=0)
    ):
    user = get_current_user(request)
    #このユーザーはこのグループに所属しているのか
    middle_model=db.query(Middle).filter(Middle.user_id==user["id"]).filter(Middle.group_id==group_id).first()
    if not middle_model:
        raise HTTPException(status_code=403, detail="このグループに所属していないのでタスクを取得できませんでした")
    query=db.query(Task).filter(Task.group_id==group_id)
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


# ログアウトする
@app.get("/logout")
async def logout(request: Request):
    request.session.clear() # セッション情報を消す
    return RedirectResponse(url="/login") # ログイン画面に戻す
    

# 招待エンドポイント
@app.post("/groups/{group_id}/invite")
async def invite_user(group_id: int, db: db_dependency, request: Request, invite_request: InviteRequest):
    user=get_current_user(request)
    authorize_owner(user["id"],group_id, db)
    # どのユーザーをどのグループに招待したか
    token = str(uuid.uuid4())  # UUID(University Unique identifier)=ランダムな一意識別子を生成する関数
    # 保存
    invitation_model = Invitation(**invite_request.model_dump(), group_id=group_id, token=token)
    db.add(invitation_model)
    db.commit()
    invite_link = f"http://localhost:8000/join?token={token}"  # トークンは本来ランダム生成
    send_invite_email(invite_request.email, group_id, invite_link)
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
    