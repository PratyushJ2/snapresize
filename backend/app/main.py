import os
import hashlib
from io import BytesIO
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import Response
from PIL import Image
import requests
import redis

app = FastAPI()

# Connect to Redis using the hostname defined in docker-compose.yml
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
redis_client = redis.Redis(host=REDIS_HOST, port=6379, db=0)

@app.get("/resize")
async def resize_image_endpoint(
    url: str = Query(..., description="The URL of the image to resize"),
    width: int = Query(400, ge=50, le=2000, description="Target width"),
    quality: int = Query(80, ge=10, le=100, description="Image quality")
):
    try:
        # 1. Download the image from the provided URL with a User-Agent header
        headers = {'User-Agent': 'SnapResizeApp/1.0 (Educational Project)'}
        response = requests.get(url, headers=headers, timeout=10) # <-- Added headers here
        response.raise_for_status()
        contents = response.content
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to download image from URL: {str(e)}")
    
    # 2. Generate a unique cache key based on content, width, and quality
    image_hash = hashlib.md5(contents).hexdigest()
    cache_key = f"resized:{image_hash}:w{width}:q{quality}"

    # 3. Check if the processed image is already cached in Redis
    cached_image = redis_client.get(cache_key)
    if cached_image:
        print("⚡ Cache hit! Serving from Redis...")
        return Response(content=cached_image, media_type="image/jpeg")

    print("🔄 Cache miss. Processing image...")
    
    # 4. Process the image using Pillow (maintaining aspect ratio based on width)
    try:
        img = Image.open(BytesIO(contents))
        
        # Calculate proportional height to avoid distortion
        orig_width, orig_height = img.size
        height = int((width / orig_width) * orig_height)
        
        img = img.resize((width, height), Image.Resampling.LANCZOS)
        
        output_io = BytesIO()
        img.save(output_io, format="JPEG", quality=quality)
        processed_bytes = output_io.getvalue()
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format or processing error: {str(e)}")

    # 5. Store the processed image bytes in Redis (e.g., 1 hour / 3600 seconds)
    redis_client.setex(cache_key, 3600, processed_bytes)

    return Response(content=processed_bytes, media_type="image/jpeg")