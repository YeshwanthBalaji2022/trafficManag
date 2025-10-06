#!/usr/bin/env python3

import asyncio
import aiohttp
import json

async def test_sse():
    url = "http://localhost:8002/drone/junction_vehicle_count/north?junction=normal_01"
    
    print(f"Testing SSE endpoint: {url}")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers={'Accept': 'text/event-stream'}) as response:
                print(f"Response status: {response.status}")
                print(f"Response headers: {dict(response.headers)}")
                
                count = 0
                async for line in response.content:
                    line_str = line.decode('utf-8').strip()
                    if line_str:
                        print(f"Received: {line_str}")
                        count += 1
                        if count >= 3:  # Only get first 3 messages
                            break
                        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_sse())