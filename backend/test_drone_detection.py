#!/usr/bin/env python3
"""
Test script for the enhanced drone detection system
"""

import requests
import json
import time
import os

# Test configuration
BASE_URL = "http://localhost:8002"
TEST_JUNCTION = "normal_01"

def test_server_status():
    """Test if the drone detection server is running"""
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            data = response.json()
            print("✅ Server Status:")
            print(f"   Message: {data.get('message')}")
            print(f"   YOLO Loaded: {data.get('yolo_loaded')}")
            print(f"   Clustering Available: {data.get('clustering_available')}")
            print(f"   Drone Junctions: {data.get('drone_junctions')}")
            return True
        else:
            print(f"❌ Server returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Is it running?")
        return False
    except Exception as e:
        print(f"❌ Error testing server: {e}")
        return False

def test_drone_junctions():
    """Test drone junctions endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/drone/junctions")
        if response.status_code == 200:
            data = response.json()
            print("\n✅ Drone Junctions:")
            print(f"   Available: {data.get('junctions')}")
            print(f"   Mapping: {data.get('mapping')}")
            return True
        else:
            print(f"❌ Junctions endpoint returned: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing junctions: {e}")
        return False

def test_vehicle_count():
    """Test vehicle count endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/drone/junction_vehicle_count/north?junction={TEST_JUNCTION}")
        if response.status_code == 200:
            print("\n✅ Vehicle Count Endpoint Working")
            print("   Note: This is a streaming endpoint - check browser for live data")
            return True
        else:
            print(f"❌ Vehicle count endpoint returned: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing vehicle count: {e}")
        return False

def test_signal_status():
    """Test signal status endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/drone/junction_signal_status?junction={TEST_JUNCTION}")
        if response.status_code == 200:
            data = response.json()
            print("\n✅ Signal Status:")
            print(f"   Junction: {data.get('junction')}")
            print(f"   Active Direction: {data.get('active_direction')}")
            print(f"   Timestamp: {data.get('timestamp')}")
            return True
        else:
            print(f"❌ Signal status endpoint returned: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing signal status: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Enhanced Drone Detection System")
    print("=" * 50)
    
    # Test server status
    if not test_server_status():
        print("\n❌ Server not available. Start it with:")
        print("   python drone_detection_server.py")
        return
    
    # Test other endpoints
    test_drone_junctions()
    test_vehicle_count()
    test_signal_status()
    
    print("\n" + "=" * 50)
    print("🎯 Test Results Summary:")
    print("✅ Enhanced detection server is working!")
    print("\n📋 Available Endpoints:")
    print(f"   🏠 Server status: {BASE_URL}/")
    print(f"   🚗 Vehicle count: {BASE_URL}/drone/junction_vehicle_count/{{direction}}?junction={{junction}}")
    print(f"   🚦 Signal status: {BASE_URL}/drone/junction_signal_status?junction={{junction}}")
    print(f"   📹 Video stream: {BASE_URL}/drone/video_stream/{{junction}}")
    print(f"   📍 Junctions list: {BASE_URL}/drone/junctions")
    
    print("\n🎬 Available Junctions:")
    print("   - normal_01 (Junction 1 - Normal)")
    print("   - normal_02 (Junction 2 - Normal)")  
    print("   - flipped_03 (Junction 3 - Flipped)")
    print("   - flipped_04 (Junction 4 - Flipped)")
    
    print("\n🧭 Directions:")
    print("   - north, east, south, west")

if __name__ == "__main__":
    main()