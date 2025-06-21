from google import generativeai as genai
import os
from dotenv import load_dotenv
from pydantic import BaseModel


load_dotenv()
# --- GenerativeModel クラス ---
# 1. APIキーを設定
API_KEY=os.getenv("GEMINI_API_KEY")

# configureでシンプルにセットアップ
genai.configure(api_key=API_KEY)

try:
    from google.generativeai import Client
    client = Client(api_key="API_KEY")
    print("Client initialized:", client)
except Exception as e:
    print("Error occurred:", e)