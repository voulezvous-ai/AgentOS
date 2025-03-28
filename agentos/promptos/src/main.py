from fastapi import FastAPI, Request
from .engine import process_prompt
from .feedback import styled_response
from .mongo import log_action
from .voice import speak

app = FastAPI()

@app.post("/prompt")
async def handle_prompt(request: Request):
    body = await request.json()
    user_input = body.get("input")

    result = await process_prompt(user_input)
    await log_action(user_input, result)

    if result.get("speak"):
        speak(result.get("message"))

    return styled_response(result)