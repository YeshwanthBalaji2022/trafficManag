#!/usr/bin/env python3
"""
Script to create 4 junction videos from drone dataset frames:
- 2 normal videos (Junction 1 & 2)
- 2 horizontally flipped videos (Junction 3 & 4)

This allows for better YOLO detection performance using non-fisheye footage.
"""

import cv2
import os
import glob
import numpy as np
from pathlib import Path
import json
from tqdm import tqdm

# Original hexagonal points for each direction (North, East, West, South)
ORIGINAL_HEXAGONAL_POINTS = {
    'north': [(5, 8), (5, 144), (426, 445), (979, 182), (549, 8), (12, 8)],
    'east': [(1060, 181), (1502, 376), (1914, 290), (1913, 145), (1537, 126), (1071, 180)],
    'west': [(4, 867), (442, 475), (881, 790), (562, 1072), (18, 1075), (7, 882)],
    'south': [(988, 832), (1520, 382), (1911, 579), (1911, 1064), (1291, 1074), (1000, 843)]
}

def flip_horizontal_points(points, img_width):
    """Flip hexagonal points horizontally for flipped videos"""
    flipped_points = []
    for x, y in points:
        new_x = img_width - x
        flipped_points.append((new_x, y))
    return flipped_points

def get_sorted_frame_paths(frames_dir):
    """Get sorted list of all drone frame paths"""
    pattern = os.path.join(frames_dir, "seq3-drone_*.jpg")
    frame_paths = glob.glob(pattern)
    
    # Sort by frame number
    frame_paths.sort(key=lambda x: int(x.split('_')[-1].split('.')[0]))
    return frame_paths

def create_video_from_frames(frame_paths, output_path, fps=30, flip_horizontal=False, max_frames=None):
    """Create video from frame paths with optional horizontal flip"""
    
    if not frame_paths:
        print(f"No frames found for video creation")
        return False
    
    # Limit frames if specified
    if max_frames:
        frame_paths = frame_paths[:max_frames]
    
    # Read first frame to get dimensions
    first_frame = cv2.imread(frame_paths[0])
    if first_frame is None:
        print(f"Could not read first frame: {frame_paths[0]}")
        return False
    
    height, width = first_frame.shape[:2]
    
    # Create video writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    print(f"Creating video: {output_path}")
    print(f"Processing {len(frame_paths)} frames...")
    
    try:
        for frame_path in tqdm(frame_paths, desc="Processing frames"):
            frame = cv2.imread(frame_path)
            if frame is None:
                print(f"Warning: Could not read frame {frame_path}")
                continue
            
            # Flip horizontally if needed
            if flip_horizontal:
                frame = cv2.flip(frame, 1)
            
            out.write(frame)
        
        out.release()
        print(f"Successfully created video: {output_path}")
        return True
        
    except Exception as e:
        print(f"Error creating video: {e}")
        out.release()
        return False

def save_hexagonal_points_config(output_dir, img_width):
    """Save hexagonal points configuration for all junctions"""
    
    # Create config for normal and flipped videos
    config = {
        'junction_01_normal': {
            'video_file': 'junction_01_normal.mp4',
            'flip_horizontal': False,
            'hexagonal_points': ORIGINAL_HEXAGONAL_POINTS
        },
        'junction_02_normal': {
            'video_file': 'junction_02_normal.mp4', 
            'flip_horizontal': False,
            'hexagonal_points': ORIGINAL_HEXAGONAL_POINTS
        },
        'junction_03_flipped': {
            'video_file': 'junction_03_flipped.mp4',
            'flip_horizontal': True,
            'hexagonal_points': {
                direction: flip_horizontal_points(points, img_width)
                for direction, points in ORIGINAL_HEXAGONAL_POINTS.items()
            }
        },
        'junction_04_flipped': {
            'video_file': 'junction_04_flipped.mp4',
            'flip_horizontal': True, 
            'hexagonal_points': {
                direction: flip_horizontal_points(points, img_width)
                for direction, points in ORIGINAL_HEXAGONAL_POINTS.items()
            }
        }
    }
    
    config_path = os.path.join(output_dir, 'drone_junctions_config.json')
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"Saved hexagonal points configuration: {config_path}")
    return config

def main():
    # Paths
    frames_dir = "/Users/yeshwanthbalaji/Desktop/Sem-7/full_stack_dev/trafficManag/backend/datasets/archive2/Drone/frames"
    output_dir = "/Users/yeshwanthbalaji/Desktop/Sem-7/full_stack_dev/trafficManag/backend/drone_videos"
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Get all frame paths
    print("Finding drone frames...")
    frame_paths = get_sorted_frame_paths(frames_dir)
    print(f"Found {len(frame_paths)} frames")
    
    if not frame_paths:
        print("No frames found! Please check the frames directory.")
        return
    
    # Get image dimensions for point flipping
    sample_frame = cv2.imread(frame_paths[0])
    img_height, img_width = sample_frame.shape[:2]
    print(f"Frame dimensions: {img_width}x{img_height}")
    
    # Split frames into 4 parts for 4 different videos
    frames_per_video = len(frame_paths) // 4
    
    video_configs = [
        {
            'name': 'junction_01_normal',
            'frames': frame_paths[0:frames_per_video],
            'flip': False
        },
        {
            'name': 'junction_02_normal', 
            'frames': frame_paths[frames_per_video:2*frames_per_video],
            'flip': False
        },
        {
            'name': 'junction_03_flipped',
            'frames': frame_paths[2*frames_per_video:3*frames_per_video],
            'flip': True
        },
        {
            'name': 'junction_04_flipped',
            'frames': frame_paths[3*frames_per_video:],
            'flip': True
        }
    ]
    
    # Create videos
    print(f"\nCreating 4 videos with ~{frames_per_video} frames each...")
    
    for config in video_configs:
        output_path = os.path.join(output_dir, f"{config['name']}.mp4")
        success = create_video_from_frames(
            config['frames'], 
            output_path, 
            fps=30, 
            flip_horizontal=config['flip']
        )
        
        if not success:
            print(f"Failed to create video: {config['name']}")
        else:
            print(f"✓ Created: {config['name']}.mp4")
    
    # Save hexagonal points configuration
    print(f"\nSaving hexagonal points configuration...")
    config = save_hexagonal_points_config(output_dir, img_width)
    
    print(f"\n✅ All done! Videos and configuration saved to: {output_dir}")
    print(f"\nCreated videos:")
    for video_config in video_configs:
        print(f"  - {video_config['name']}.mp4 ({'flipped' if video_config['flip'] else 'normal'})")

if __name__ == "__main__":
    main()