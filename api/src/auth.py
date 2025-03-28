
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import requests

# Configuração do Google OAuth2
google_client_id = "your_google_client_id"  # Coloque seu Client ID do Google
google_client_secret = "your_google_client_secret"  # Coloque seu Client Secret do Google

app = FastAPI()

# Função de autenticação com Google
def authenticate_google_user(authorization_code: str):
    # Enviar requisição para o Google API para pegar o token
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        'code': authorization_code,
        'client_id': google_client_id,
        'client_secret': google_client_secret,
        'redirect_uri': "http://localhost:8000/login/callback",  # URL de redirecionamento
        'grant_type': 'authorization_code'
    }
    token_response = requests.post(token_url, data=token_data)
    token_json = token_response.json()
    
    # Obter informações do usuário com o token
    if token_json.get("access_token"):
        user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        user_info_response = requests.get(user_info_url, headers={
            "Authorization": f"Bearer {token_json['access_token']}"
        })
        user_info = user_info_response.json()
        
        # Retornar os dados do usuário autenticado
        return user_info
    else:
        raise HTTPException(status_code=400, detail="Failed to authenticate with Google")

# Rota de login com Google
@app.get("/login/google")
def login_with_google(code: str):
    try:
        user_info = authenticate_google_user(code)
        return JSONResponse(content=user_info)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Google login failed: {str(e)}")

# Outras rotas de autenticação com JWT
@app.post("/api/login")
def login(user: User):
    if user.email == "admin@example.com" and user.password == "password":
        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")
