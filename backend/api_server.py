# api_server.py - Lightweight API server for auth and emergency requests
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi import Query
import json
import asyncio
from typing import Dict, Set
import threading
import time

# Import auth/emergency router
from auth_emergency import router as auth_emergency_router

app = FastAPI()
app.include_router(auth_emergency_router)

# Signal status management
signal_status: Dict[str, str] = {}  # junction -> active_direction
signal_subscribers: Dict[str, Set] = {}  # junction -> set of queues for SSE
signal_lock = threading.Lock()

def initialize_signals():
    """Initialize default signal states for all junctions"""
    junctions = ['01_', '02_', '05_', 'rifatuslu_']
    for junction in junctions:
        signal_status[junction] = 'north'
        signal_subscribers[junction] = set()

# Initialize on startup
initialize_signals()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API Server - Authentication and Emergency Request endpoints"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "api_server"}

@app.get("/junction_signal_status")
def get_signal_status_sse(junction: str = Query(...)):
    """Server-Sent Events endpoint for real-time signal status"""
    def event_stream():
        # Create a queue for this client
        import queue
        client_queue = queue.Queue()
        
        with signal_lock:
            signal_subscribers[junction].add(client_queue)
            # Send current status immediately
            current_status = signal_status.get(junction, 'north')
        
        try:
            # Send initial status
            yield f"data: {json.dumps({'active_signal': current_status})}\n\n"
            
            # Keep sending updates
            while True:
                try:
                    # Wait for updates with timeout
                    status = client_queue.get(timeout=30)
                    yield f"data: {json.dumps({'active_signal': status})}\n\n"
                except queue.Empty:
                    # Send keepalive
                    yield f"data: {json.dumps({'active_signal': signal_status.get(junction, 'north')})}\n\n"
        finally:
            # Clean up when client disconnects
            with signal_lock:
                signal_subscribers[junction].discard(client_queue)
    
    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.post("/junction_signal_status")
def update_signal_status(junction: str = Query(...), direction: str = Query(...)):
    """Update signal status and notify all subscribers"""
    with signal_lock:
        signal_status[junction] = direction
        # Notify all subscribers for this junction
        if junction in signal_subscribers:
            for client_queue in signal_subscribers[junction].copy():
                try:
                    client_queue.put_nowait(direction)
                except:
                    # Remove dead queues
                    signal_subscribers[junction].discard(client_queue)
    
    return {"success": True, "junction": junction, "active_signal": direction}

if __name__ == "__main__":
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)