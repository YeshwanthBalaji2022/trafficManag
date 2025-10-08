# video_server.py - Dedicated video processing server
import os
import uvicorn
from fastapi import FastAPI, File, UploadFile, Query
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import shutil
from ultralytics import YOLO
import tempfile
import numpy as np
import time

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLOv8n model (pretrained on COCO)
model = YOLO('yolov8n.pt')

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
    frame_delay = 0.1  # 0.1s per frame = 10 FPS (adjust as needed)
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
    return {"message": "Video Processing Server - Use /junction_video_feed/{direction}?junction=01_ for video, /junction_vehicle_count/{direction}?junction=01_ for real-time vehicle count."}

if __name__ == "__main__":
    uvicorn.run("video_server:app", host="0.0.0.0", port=8001, reload=True)