def styled_response(result: dict):
    if result["success"]:
        return {"status": "✅ Feito", "message": result["message"]}
    else:
        return {"status": "⚠️ Falhou", "message": result["message"]}