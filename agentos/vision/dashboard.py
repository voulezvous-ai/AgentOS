
from services.mongo import get_latest_events

def get_dashboard_data():
    events = get_latest_events()
    return {
        "total_events": len(events),
        "latest": events[:5]
    }
