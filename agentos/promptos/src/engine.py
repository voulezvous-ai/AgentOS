from .llm import interpret_prompt
from .actions import sync_env, push_zip, generate_architecture

async def process_prompt(prompt: str):
    intent = await interpret_prompt(prompt)

    if intent == "sync_env":
        return await sync_env.run()
    elif intent == "push_zip":
        return await push_zip.run()
    elif intent == "generate_architecture":
        return await generate_architecture.run()
    else:
        return {"message": f"Desculpa, não entendi como executar: '{prompt}'", "success": False}