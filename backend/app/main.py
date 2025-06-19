from fastapi import FastAPI, Request, HTTPException, Depends
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv
import os
from authlib.integrations.base_client.errors import MismatchingStateError
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Annotated
from .models import User, Invitation
from .database import get_db, Base, engine
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import uuid


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


#招待メール送信関数
def send_invite_email(receiver_email: str, group_id: int, invite_link: str):
    # Gmailの送信者情報
    sender_email = "341117lisamilet@gmail.com"
    app_password = "hmyhpfojiygmsezv"  # アプリパスワード

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

    request.session["user"]={
        "id": user["sub"],
        "name": user.get("name"),# getするのは値がない可能性があるから
    }

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
        db.add(new_user)
        db.commit()
    
    # グループに入っているかどうか
    if existing_user.group_id:
        return{"message":"Move your task screen"}
    
    # 招待メールから来てる場合招待トークンを持ってる
    invite_token = request.session.get("invite_token")
    if invite_token:
        invitation = db.query(Invitation).filter(Invitation.token == invite_token).first()
        if invitation and not invitation.is_accepted:# 招待されて参加済みじゃないか
            # email一致を確認 -> 
            if invitation.email == user.get("email"):
                # ユーザーを検索
                user = db.query(User).filter(User.email == user.get("email")).first()
                # 招待済みユーザーのグループIDを登録、参加済みを編集
                if user:
                    user.group_id = invitation.group_id
                    invitation.is_accepted = True
                    user.role = "member"
                    db.commit()
                    # 完了後にグループ画面にリダイレクト
                    return {"message" : "User joined invited group."} 
    # グループに入ってないし、招待された人でもない -> 「新しくグループを作るオーナーだ」
    return {"message": "Move new group making screen"}



# ログアウトする
@app.get("/logout")
async def logout(request: Request):
    request.session.clear() # セッション情報を消す
    return RedirectResponse(url="/login") # ログイン画面に戻す
    

# 招待メールを送る
@app.post("/groups/{group_id}/invite")
async def invite_user(group_id: int, email: str, db: db_dependency):
    # どのユーザーをどのグループに招待したか
    token = str(uuid.uuid4())  # UUID(University Unique identifier)=ランダムな一意識別子を生成する関数
    # 保存
    invitation_model = Invitation(email=email, group_id=group_id, token=token)
    db.add(invitation_model)
    db.commit()
    invite_link = f"http://localhost:8000/join?token={token}"  # トークンは本来ランダム生成
    send_invite_email(email, group_id, invite_link)
    return {"message": "招待メールを送信しました"}

@app.get("/join")
async def join_group(token: str, db: db_dependency, request: Request):
    invitation = db.query(Invitation).filter(Invitation.token == token).first()
    if not invitation or invitation.is_accepted:
        raise HTTPException(status_code=400, detail="無効なまたは使用済みのトークンです")
    # 招待トークンをセッションに保存
    request.session["invite_token"]=token
    # /login にリダイレクト（Googleログインを開始させるため）
    return RedirectResponse(url="/login")
    