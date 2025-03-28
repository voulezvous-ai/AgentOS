
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dashboard import get_dashboard_data

app = FastAPI(title="AgentOS Vision")

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    data = get_dashboard_data()
    return templates.TemplateResponse("dashboard.html", {"request": request, "data": data})
