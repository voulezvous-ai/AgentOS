import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")

async def interpret_prompt(prompt: str) -> str:
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": f"Qual a intenção deste comando?: '{prompt}'"}],
        max_tokens=20
    )
    intent = response.choices[0].message.content.strip().lower()
    return intent