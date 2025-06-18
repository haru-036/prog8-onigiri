from fastapi import FastAPI, Request, HTTPException, Depends
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv
import os
from authlib.integrations.base_client.errors import MismatchingStateError
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Annotated
from .models import User
from .database import get_db, Base, engine

load_dotenv()

# DBのテーブル作成（Baseを継承したモデルが読み込まれた後で）
Base.metadata.create_all(bind=engine)

app = FastAPI()

# SessionMiddleware(=セッションのやり取りの管理窓口)の設定
app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SECRET_KEY"),# クッキー署名に使う秘密鍵
    session_cookie="session",  # クライアントに保存、取得するクッキーの名前を指定
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


# ログインページ
@app.get("/login")
async def login(request: Request):
    #既存のセッションデータをクリーンにする
    request.session.clear()
    print("LOGIN SESSION ID:", request.cookies.get("session")) 

    redirect_uri = os.getenv("REDIRECT_URI")

    #SessionMiddlewareはrequest.session={}のような空の辞書を作る

    response = await oauth.google.authorize_redirect(request, redirect_uri)
    # Authlibがstateを生成してrequest.sessionの["_state_google_<state>"]に書き込む
    # SessionMiddlewareはレスポンスを渡す前にrequest.sessionの中身(state)の中身をクッキーに保存
    #　→レスポンスはGoogleに飛ばす302リダイレクト命令
    print("LOGIN STATE:", dict(request.session))
    return response
# ユーザーがGoogleで認可を出すとリダイレクトURIにクエリパラメータとして認可コードとstateをつけて戻ってくる

# Googleログイン後にリダイレクトされる認証完了後エンドポイントで、ユーザー情報の取得
@app.get("/api/auth")
async def auth(request: Request, db: db_dependency):
    print("AUTH SESSION ID:", request.cookies.get("session"))  
    print("AUTH STATE:", dict(request.session))
    try:
        token = await oauth.google.authorize_access_token(request)
        # クエリパラメータのcode(認可コード)とstateを取り出してブラウザのセッションクッキーのstateと比較
        #一致しないとMismatchinhStateErrorに飛ばす
        #一致したらGoogleの認可サーバーのトークンエンドポイントにPostリクエスト(アクセストークンとIDトークンをください)
        # scope に "openid" が含まれていれば、id_tokenを Authlibが内部で署名検証・デコード → その中身を token["userinfo"] にセット
        print("TOKEN内容:", token)
    except MismatchingStateError:
        request.session.clear()  # セッション初期化
        print("state mismatch. セッション破棄して /login にリダイレクト")
        # 安全のため際ログインに誘導
        return RedirectResponse(url="/login")
    
    # ユーザー情報をuserinfoから取得
    user = token["userinfo"]

    request.session["user"]={
        "id": user["sub"],
        "name": user.get("name"),# getしてないのは値がない可能性があるから
    }

    google_id = user["sub"]
    existing_user = db.query(User).filter(User.sub==google_id).first()
    
    # ユーザーの新規登録
    if not existing_user:
        new_user = User(
            sub = user["sub"],
            user_name = user.get("name"),
            email = user.get("email"),
            picture = user.get("picture")
        )
        db.add(new_user)
        db.commit()
    
    return {"message": "User authenticated", "user": user}
        

    
    
    
    


#　ログインできてるかの確認
# @app.get("/me")
# async def get_current_user(request: Request):
#     user=request.session.get("user")
#     if not user:
#         raise HTTPException(status_code=401, detail="not authenticated")
#     return user

# ログアウトする
@app.get("/logout")
async def logout(request: Request):
    request.session.clear() # セッション情報を消す
    return RedirectResponse(url="/login") # ログイン画面に戻す
    