#!/usr/bin/env python3
"""
Enhanced YOLO Detection Server for Drone Videos with Hexagonal Clustering

This server extends the existing fisheye detection system to support normal drone videos
with improved detection accuracy using hexagonal clustering.
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import json
import os
import numpy as np
from ultralytics import YOLO
import asyncio
from typing import Dict, List, Any, Optional
import logging
import requests
import time

# Import our hexagonal clustering (will handle missing shapely gracefully)
try:
    from hexagonal_clustering import HexagonalCluster
    CLUSTERING_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Clustering not available - {e}")
    CLUSTERING_AVAILABLE = False
    
    class HexagonalCluster:
        def __init__(self, *args, **kwargs):
            pass
        def get_vehicle_counts(self, detections, junction_name):
            return {'north': 0, 'east': 0, 'west': 0, 'south': 0}

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Enhanced YOLO Detection Server")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
yolo_model = None
hexagonal_cluster = None
drone_videos = {}
drone_config = {}

# Paths
BACKEND_DIR = "/Users/yeshwanthbalaji/Desktop/Sem-7/full_stack_dev/trafficManag/backend"
DRONE_VIDEOS_DIR = os.path.join(BACKEND_DIR, "drone_videos")
YOLO_MODEL_PATH = os.path.join(BACKEND_DIR, "yolov8n.pt")
DRONE_CONFIG_PATH = os.path.join(DRONE_VIDEOS_DIR, "drone_junctions_config.json")

def load_yolo_model():
    """Load YOLO model"""
    global yolo_model
    try:
        if os.path.exists(YOLO_MODEL_PATH):
            yolo_model = YOLO(YOLO_MODEL_PATH)
            logger.info("✅ YOLO model loaded successfully")
        else:
            logger.error(f"❌ YOLO model not found at {YOLO_MODEL_PATH}")
    except Exception as e:
        logger.error(f"❌ Error loading YOLO model: {e}")

def load_drone_config():
    """Load drone video configuration and hexagonal clustering"""
    global drone_config, hexagonal_cluster, drone_videos
    
    try:
        if os.path.exists(DRONE_CONFIG_PATH):
            with open(DRONE_CONFIG_PATH, 'r') as f:
                drone_config = json.load(f)
            
            # Initialize hexagonal clustering
            if CLUSTERING_AVAILABLE:
                hexagonal_cluster = HexagonalCluster(DRONE_CONFIG_PATH)
                logger.info("✅ Hexagonal clustering initialized")
            else:
                hexagonal_cluster = HexagonalCluster()
                logger.warning("⚠️ Hexagonal clustering not fully available")
            
            # Load video captures
            for junction_name, config in drone_config.items():
                video_path = os.path.join(DRONE_VIDEOS_DIR, config['video_file'])
                if os.path.exists(video_path):
                    drone_videos[junction_name] = cv2.VideoCapture(video_path)
                    logger.info(f"✅ Loaded video: {config['video_file']}")
                else:
                    logger.warning(f"⚠️ Video not found: {video_path}")
        else:
            logger.warning(f"⚠️ Drone config not found at {DRONE_CONFIG_PATH}")
    except Exception as e:
        logger.error(f"❌ Error loading drone config: {e}")

def detect_vehicles_in_frame(frame: np.ndarray) -> List[Dict]:
    """Detect vehicles in a single frame using YOLO"""
    if yolo_model is None:
        return []
    
    try:
        results = yolo_model(frame)
        detections = []
        
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    # Get detection data
                    xyxy = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0].cpu().numpy())
                    class_id = int(box.cls[0].cpu().numpy())
                    
                    # Filter for vehicle classes (assuming COCO classes)
                    # Vehicle classes: car(2), motorcycle(3), bus(5), truck(7)
                    vehicle_classes = [2, 3, 5, 7]
                    if class_id in vehicle_classes and confidence > 0.5:
                        # Convert to bbox format [x, y, width, height]
                        x1, y1, x2, y2 = xyxy
                        bbox = [float(x1), float(y1), float(x2-x1), float(y2-y1)]
                        
                        detections.append({
                            'bbox': bbox,
                            'confidence': confidence,
                            'class_id': class_id
                        })
        
        return detections
    except Exception as e:
        logger.error(f"Error in vehicle detection: {e}")
        return []

def get_junction_mapping():
    """Map junction identifiers to drone video junction names"""
    mapping = {
        'normal_01': 'junction_01_normal',
        'normal_02': 'junction_02_normal', 
        'flipped_03': 'junction_03_flipped',
        'flipped_04': 'junction_04_flipped'
    }
    return mapping

@app.on_event("startup")
async def startup_event():
    """Initialize models and configurations on startup"""
    logger.info("🚀 Starting Enhanced YOLO Detection Server...")
    load_yolo_model()
    load_drone_config()
    logger.info("✅ Server startup complete")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Enhanced YOLO Detection Server", 
        "status": "running",
        "yolo_loaded": yolo_model is not None,
        "clustering_available": CLUSTERING_AVAILABLE,
        "drone_junctions": list(drone_config.keys()) if drone_config else []
    }

@app.get("/drone/junctions")
async def get_drone_junctions():
    """Get available drone junction configurations"""
    return {
        "junctions": list(drone_config.keys()),
        "mapping": get_junction_mapping(),
        "clustering_available": CLUSTERING_AVAILABLE
    }

@app.get("/drone/junction_vehicle_count/{direction}")
async def get_drone_vehicle_count(direction: str, junction: str = "normal_01"):
    """Get vehicle count for a specific direction in drone footage"""
    
    # Map junction identifier to config name
    junction_mapping = get_junction_mapping()
    junction_name = junction_mapping.get(junction, junction)
    
    if junction_name not in drone_videos:
        raise HTTPException(status_code=404, message=f"Junction {junction} not found")
    
    async def generate_count():
        cap = drone_videos[junction_name]
        
        while True:
            try:
                ret, frame = cap.read()
                if not ret:
                    # Reset video to beginning
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                
                # Detect vehicles
                detections = detect_vehicles_in_frame(frame)
                
                # Get vehicle counts using hexagonal clustering
                counts = hexagonal_cluster.get_vehicle_counts(detections, junction_name)
                
                # Get count for requested direction
                vehicle_count = counts.get(direction, 0)
                
                # Prepare response data
                data = {
                    "junction": junction,
                    "direction": direction,
                    "vehicles": vehicle_count,
                    "total_detections": len(detections),
                    "all_directions": counts,
                    "timestamp": cv2.getTickCount()
                }
                
                yield f"data: {json.dumps(data)}\n\n"
                await asyncio.sleep(1)  # Update every second
                
            except Exception as e:
                logger.error(f"Error in drone vehicle count: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                await asyncio.sleep(1)
    
    return StreamingResponse(
        generate_count(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true"
        }
    )

@app.get("/drone/junction_signal_status")
async def get_drone_signal_status(junction: str = "normal_01"):
    """Get signal status for drone junction from API server"""
    
    try:
        # Map junction names to API server format
        junction_map = {
            'junction_01_normal': '01_',
            'junction_02_normal': '02_',
            'junction_03_flipped': '05_',
            'junction_04_flipped': 'rifatuslu_',
            'normal_01': '01_',
            'normal_02': '02_',
            'flipped_03': '05_',
            'flipped_04': 'rifatuslu_'
        }
        
        api_junction = junction_map.get(junction, junction)
        
        # Make SSE request to api_server to get current signal status
        import requests
        response = requests.get(f"http://localhost:8000/junction_signal_status?junction={api_junction}", 
                              timeout=2, stream=True)
        
        if response.status_code == 200:
            # Parse the first SSE message to get current status
            for line in response.iter_lines(decode_unicode=True):
                if line.startswith('data: '):
                    data = json.loads(line[6:])  # Remove 'data: ' prefix
                    return {
                        "junction": junction,
                        "active_direction": data.get('active_signal', 'north'),
                        "timestamp": int(time.time())
                    }
                    break
    except Exception as e:
        logger.warning(f"Failed to get signal status from API server: {e}")
    
    # Fallback to simulated cycling if API server is unavailable
    directions = ['north', 'east', 'south', 'west']
    import time
    current_time = int(time.time())
    active_direction = directions[(current_time // 30) % len(directions)]
    
    return {
        "junction": junction,
        "active_direction": active_direction,
        "timestamp": current_time
    }

@app.get("/drone/video_stream/{junction}")
async def get_drone_video_stream(junction: str):
    """Stream processed drone video with detection overlays"""
    
    junction_mapping = get_junction_mapping()
    junction_name = junction_mapping.get(junction, junction)
    
    if junction_name not in drone_videos:
        raise HTTPException(status_code=404, detail=f"Junction {junction} not found")
    
    async def generate_stream():
        cap = drone_videos[junction_name]
        
        while True:
            try:
                ret, frame = cap.read()
                if not ret:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                
                # Detect vehicles
                detections = detect_vehicles_in_frame(frame)
                
                # Draw hexagonal zones if clustering is available
                if CLUSTERING_AVAILABLE and hexagonal_cluster:
                    frame = hexagonal_cluster.draw_hexagonal_zones(frame, junction_name)
                    frame = hexagonal_cluster.draw_detections_with_clusters(frame, detections, junction_name)
                else:
                    # Simple bounding box drawing
                    for detection in detections:
                        bbox = detection['bbox']
                        x1, y1, w, h = bbox
                        cv2.rectangle(frame, (int(x1), int(y1)), (int(x1+w), int(y1+h)), (0, 255, 0), 2)
                
                # Encode frame
                _, buffer = cv2.imencode('.jpg', frame)
                frame_bytes = buffer.tobytes()
                
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                
                await asyncio.sleep(1/30)  # ~30 FPS
                
            except Exception as e:
                logger.error(f"Error in video stream: {e}")
                break
    
    return StreamingResponse(
        generate_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)