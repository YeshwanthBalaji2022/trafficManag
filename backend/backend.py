# import asyncio
# import json
# import traci
# import traci.constants as tc
# from fastapi import FastAPI, WebSocket
# import uvicorn
# import os

# SUMO_BINARY = "sumo"  # or "sumo-gui" if you want GUI
# SUMO_CONFIG = "traciii.sumocfg"  # your config file path

# app = FastAPI()

# @app.on_event("startup")
# async def startup_event():
#     # Start SUMO as a TraCI server
#     if not traci.isLoaded():
#         traci.start([SUMO_BINARY, "-c", SUMO_CONFIG, "--start", "--quit-on-end"])

# @app.websocket("/ws")
# async def websocket_endpoint(ws: WebSocket):
#     await ws.accept()
#     step = 0
#     try:
#         while traci.simulation.getMinExpectedNumber() > 0:
#             traci.simulationStep()
#             step += 1

#             vehicles = []
#             for vid in traci.vehicle.getIDList():
#                 x, y = traci.vehicle.getPosition(vid)
#                 speed = traci.vehicle.getSpeed(vid)
#                 vehicles.append({"id": vid, "x": x, "y": y, "speed": speed})

#             await ws.send_text(json.dumps({"step": step, "vehicles": vehicles}))
#             await asyncio.sleep(0.1)  # control refresh rate
#     except Exception as e:
#         print("WebSocket closed:", e)
#     finally:
#         traci.close()

# if __name__ == "__main__":
#     uvicorn.run("backend:app", host="0.0.0.0", port=8002, reload=True)


# backend.py
import os
import traci
import asyncio
import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, File, UploadFile, Query
from fastapi.responses import StreamingResponse, JSONResponse
import cv2
import shutil
from ultralytics import YOLO
import tempfile
import numpy as np
import json

# Import auth/emergency router
from auth_emergency import router as auth_emergency_router

# # make sure SUMO_HOME is set
# if "SUMO_HOME" not in os.environ:
#     # os.environ["SUMO_HOME"] = "/usr/share/sumo"  # adjust if different
#     pass
# from sumolib import checkBinary


app = FastAPI()
app.include_router(auth_emergency_router)

# allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLOv8n model (pretrained on COCO)
model = YOLO('yolov8n.pt')

# @app.websocket("/ws")
# async def websocket_endpoint(websocket: WebSocket):
#     await websocket.accept()

#     # start SUMO in TraCI mode
#     sumo_binary = checkBinary("sumo")  # or "sumo-gui"
#     traci.start([sumo_binary, "-c", "traciii.sumocfg"])

#     try:
#         step = 0
#         while traci.simulation.getMinExpectedNumber() > 0:
#             traci.simulationStep()

#             vehicles = traci.vehicle.getIDList()
#             data = []
#             for vid in vehicles:
#                 x, y = traci.vehicle.getPosition(vid)
#                 data.append({"id": vid, "x": x, "y": y})

#             # send vehicle positions
#             await websocket.send_json({"step": step, "vehicles": data})
#             step += 1
#             await asyncio.sleep(0.1)  # ~10 FPS
#     finally:
#         traci.close()

@app.post("/detect_vehicles_video/")
async def detect_vehicles_video(file: UploadFile = File(...)):
    # Save uploaded video to a temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_video:
        shutil.copyfileobj(file.file, temp_video)
        temp_video_path = temp_video.name

    cap = cv2.VideoCapture(temp_video_path)
    frame_results = []
    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        # Run detection
        results_list = model(frame)
        count = 0
        for det in results_list[0].boxes.cls:
            if int(det) in [2, 3, 5, 7]:
                count += 1
        frame_results.append({"frame": frame_idx, "vehicles": count})
        frame_idx += 1
    cap.release()
    os.remove(temp_video_path)
    return JSONResponse(content={"vehicle_counts": frame_results})

# Helper: MJPEG video stream generator
def generate_video_stream(video_path):
    cap = cv2.VideoCapture(video_path)
    import time
    frame_delay = 0.1  # 0.05s per frame = 10 FPS (adjust as needed)
    while True:
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # Loop: restart video
            continue
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(frame_delay)
    cap.release()

# Helper: SSE vehicle count per frame
def frame_vehicle_counter(video_path, model):
    cap = cv2.VideoCapture(video_path)
    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        results_list = model(frame)
        count = 0
        for det in results_list[0].boxes.cls:
            if int(det) in [2, 3, 5, 7]:
                count += 1
        yield f"data: {{\"frame\": {frame_idx}, \"vehicles\": {count}}}\n\n"
        frame_idx += 1
    cap.release()

@app.get("/junction_video_feed/{direction}")
def junction_video_feed(direction: str, junction: str = Query(...)):
    # Accept both single and double underscore naming for compatibility
    video_path1 = f"joined_videos/{junction}_{direction}.mp4"
    video_path2 = f"joined_videos/{junction}__{direction}.mp4"
    video_path = video_path1 if os.path.exists(video_path1) else video_path2
    if not os.path.exists(video_path):
        return JSONResponse(content={"error": "Video not found"}, status_code=404)
    return StreamingResponse(generate_video_stream(video_path), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/junction_vehicle_count/{direction}")
def junction_vehicle_count(direction: str, junction: str = Query(...)):
    video_path1 = f"joined_videos/{junction}_{direction}.mp4"
    video_path2 = f"joined_videos/{junction}__{direction}.mp4"
    video_path = video_path1 if os.path.exists(video_path1) else video_path2
    if not os.path.exists(video_path):
        return JSONResponse(content={"error": "Video not found"}, status_code=404)
    def event_stream():
        yield from frame_vehicle_counter(video_path, model)
    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.get("/stitched_video_feed/{prefix}")
def stitched_video_feed(prefix: str):
    video_path = f"stitched_videos/{prefix}.mp4"
    if not os.path.exists(video_path):
        return JSONResponse(content={"error": "Video not found"}, status_code=404)
    return StreamingResponse(generate_video_stream(video_path), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/")
def root():
    return {"message": "Use /junction_video_feed/{direction}?junction=01_ for video, /junction_vehicle_count/{direction}?junction=01_ for real-time vehicle count."}

if __name__ == "__main__":
    uvicorn.run("backend:app", host="0.0.0.0", port=8000, reload=True)
