#!/usr/bin/env python3
"""
Hexagonal clustering utility for vehicle detection in drone footage.
This module handles clustering vehicles detected by YOLO into directional zones 
(North, East, West, South) based on hexagonal boundary points.
"""

import cv2
import numpy as np
from shapely.geometry import Point, Polygon
from typing import List, Tuple, Dict, Any
import json
import os

class HexagonalCluster:
    """Handles hexagonal clustering for vehicle detection"""
    
    def __init__(self, config_path: str = None):
        """
        Initialize with hexagonal points configuration
        
        Args:
            config_path: Path to JSON config file with hexagonal points
        """
        self.config = {}
        self.polygons = {}
        
        if config_path and os.path.exists(config_path):
            self.load_config(config_path)
    
    def load_config(self, config_path: str):
        """Load hexagonal points configuration from JSON file"""
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        
        # Create polygons for each junction and direction
        for junction_name, junction_config in self.config.items():
            self.polygons[junction_name] = {}
            hex_points = junction_config['hexagonal_points']
            
            for direction, points in hex_points.items():
                # Create polygon from points
                polygon = Polygon(points)
                self.polygons[junction_name][direction] = polygon
    
    def set_manual_points(self, junction_name: str, hexagonal_points: Dict[str, List[Tuple[int, int]]]):
        """Manually set hexagonal points for a junction"""
        self.config[junction_name] = {
            'hexagonal_points': hexagonal_points
        }
        
        self.polygons[junction_name] = {}
        for direction, points in hexagonal_points.items():
            polygon = Polygon(points)
            self.polygons[junction_name][direction] = polygon
    
    def point_in_polygon(self, point: Tuple[int, int], polygon: Polygon) -> bool:
        """Check if a point is inside a polygon"""
        shapely_point = Point(point[0], point[1])
        return polygon.contains(shapely_point)
    
    def cluster_detections(self, detections: List[Dict], junction_name: str) -> Dict[str, List[Dict]]:
        """
        Cluster YOLO detections into directional zones
        
        Args:
            detections: List of YOLO detection dictionaries with 'bbox' and 'confidence'
            junction_name: Name of the junction to use for clustering
            
        Returns:
            Dict with directions as keys and lists of detections as values
        """
        if junction_name not in self.polygons:
            print(f"Warning: Junction {junction_name} not found in config")
            return {'north': [], 'east': [], 'west': [], 'south': []}
        
        clustered = {'north': [], 'east': [], 'west': [], 'south': []}
        junction_polygons = self.polygons[junction_name]
        
        for detection in detections:
            # Get center point of bounding box
            bbox = detection['bbox']
            center_x = int(bbox[0] + bbox[2] / 2)
            center_y = int(bbox[1] + bbox[3] / 2)
            center_point = (center_x, center_y)
            
            # Check which polygon contains this point
            assigned = False
            for direction, polygon in junction_polygons.items():
                if self.point_in_polygon(center_point, polygon):
                    clustered[direction].append(detection)
                    assigned = True
                    break
            
            # If not assigned to any polygon, could be in intersection - assign to closest
            if not assigned:
                closest_direction = self.find_closest_polygon(center_point, junction_polygons)
                if closest_direction:
                    clustered[closest_direction].append(detection)
        
        return clustered
    
    def find_closest_polygon(self, point: Tuple[int, int], polygons: Dict[str, Polygon]) -> str:
        """Find the closest polygon to a point"""
        shapely_point = Point(point[0], point[1])
        min_distance = float('inf')
        closest_direction = None
        
        for direction, polygon in polygons.items():
            distance = shapely_point.distance(polygon)
            if distance < min_distance:
                min_distance = distance
                closest_direction = direction
        
        return closest_direction
    
    def get_vehicle_counts(self, detections: List[Dict], junction_name: str) -> Dict[str, int]:
        """Get vehicle counts for each direction"""
        clustered = self.cluster_detections(detections, junction_name)
        return {direction: len(vehicles) for direction, vehicles in clustered.items()}
    
    def draw_hexagonal_zones(self, frame: np.ndarray, junction_name: str) -> np.ndarray:
        """Draw hexagonal zones on frame for visualization"""
        if junction_name not in self.config:
            return frame
        
        hex_points = self.config[junction_name]['hexagonal_points']
        colors = {
            'north': (0, 255, 0),    # Green
            'east': (255, 0, 0),     # Blue  
            'west': (0, 255, 255),   # Yellow
            'south': (255, 0, 255)   # Magenta
        }
        
        for direction, points in hex_points.items():
            color = colors.get(direction, (255, 255, 255))
            
            # Convert points to numpy array
            pts = np.array(points, np.int32)
            pts = pts.reshape((-1, 1, 2))
            
            # Draw polygon
            cv2.polylines(frame, [pts], True, color, 2)
            
            # Add direction label
            centroid_x = int(np.mean([p[0] for p in points]))
            centroid_y = int(np.mean([p[1] for p in points]))
            cv2.putText(frame, direction.upper(), (centroid_x-20, centroid_y), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        
        return frame
    
    def draw_detections_with_clusters(self, frame: np.ndarray, detections: List[Dict], 
                                    junction_name: str) -> np.ndarray:
        """Draw detections colored by their cluster assignment"""
        clustered = self.cluster_detections(detections, junction_name)
        
        colors = {
            'north': (0, 255, 0),    # Green
            'east': (255, 0, 0),     # Blue  
            'west': (0, 255, 255),   # Yellow
            'south': (255, 0, 255)   # Magenta
        }
        
        for direction, direction_detections in clustered.items():
            color = colors.get(direction, (255, 255, 255))
            
            for detection in direction_detections:
                bbox = detection['bbox']
                x1, y1, w, h = bbox
                x2, y2 = x1 + w, y1 + h
                
                # Draw bounding box
                cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                
                # Draw confidence score
                confidence = detection.get('confidence', 0.0)
                label = f"{direction}: {confidence:.2f}"
                cv2.putText(frame, label, (int(x1), int(y1-10)), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        
        return frame

def test_hexagonal_clustering():
    """Test function for hexagonal clustering"""
    
    # Test with manual points (your provided points)
    test_points = {
        'north': [(5, 8), (5, 144), (426, 445), (979, 182), (549, 8), (12, 8)],
        'east': [(1060, 181), (1502, 376), (1914, 290), (1913, 145), (1537, 126), (1071, 180)],
        'west': [(4, 867), (442, 475), (881, 790), (562, 1072), (18, 1075), (7, 882)],
        'south': [(988, 832), (1520, 382), (1911, 579), (1911, 1064), (1291, 1074), (1000, 843)]
    }
    
    # Create clustering instance
    cluster = HexagonalCluster()
    cluster.set_manual_points('test_junction', test_points)
    
    # Test with some mock detections
    mock_detections = [
        {'bbox': [100, 100, 50, 50], 'confidence': 0.85},  # Should be in north
        {'bbox': [1200, 200, 60, 40], 'confidence': 0.92}, # Should be in east
        {'bbox': [200, 900, 45, 55], 'confidence': 0.78},  # Should be in west
        {'bbox': [1100, 900, 55, 45], 'confidence': 0.88}  # Should be in south
    ]
    
    # Test clustering
    clustered = cluster.cluster_detections(mock_detections, 'test_junction')
    counts = cluster.get_vehicle_counts(mock_detections, 'test_junction')
    
    print("Test Results:")
    print(f"Vehicle counts: {counts}")
    for direction, vehicles in clustered.items():
        print(f"{direction}: {len(vehicles)} vehicles")
        for i, vehicle in enumerate(vehicles):
            print(f"  Vehicle {i+1}: bbox={vehicle['bbox']}, confidence={vehicle['confidence']}")

if __name__ == "__main__":
    test_hexagonal_clustering()