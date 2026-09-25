import os
import hashlib
from io import BytesIO
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import Response, JSONResponse
from PIL import Image
import requests
import redis
import boto3
from botocore.exceptions import ClientError

app = FastAPI()

# Environment configuration
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
redis_client = redis.Redis(host=REDIS_HOST, port=6379, db=0)

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "minioadmin")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "minioadmin")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "snapresize-bucket")
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL", "http://minio:9000")

# Initialize Boto3 S3 Client (pointing to local MinIO or AWS S3)
s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION,
    endpoint_url=S3_ENDPOINT_URL if S3_ENDPOINT_URL else None
)

# Ensure bucket exists on startup (for MinIO local development)
def ensure_bucket():
    try:
        s3_client.head_bucket(Bucket=S3_BUCKET_NAME)
    except ClientError:
        try:
            s3_client.create_bucket(Bucket=S3_BUCKET_NAME)
        except Exception:
            pass

ensure_bucket()

@app.get("/resize")
async def resize_image_endpoint(
    url: str = Query(..., description="The URL of the image to resize"),
    width: int = Query(400, ge=50, le=2000, description="Target width"),
    quality: int = Query(80, ge=10, le=100, description="Image quality")
):
    try:
        # 1. Download image from source URL with User-Agent header
        headers = {'User-Agent': 'SnapResizeApp/1.0 (Cloud Native Project)'}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        contents = response.content
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to download image from URL: {str(e)}")
    
    # 2. Generate unique hash for cache and object storage key naming
    image_hash = hashlib.md5(contents).hexdigest()
    cache_key = f"resized:{image_hash}:w{width}:q{quality}"
    s3_object_key = f"processed/{image_hash}_w{width}_q{quality}.jpg"

    # 3. Check Redis Cache
    cached_s3_url = redis_client.get(cache_key)
    if cached_s3_url:
        print("⚡ Cache hit! Serving S3 file reference from Redis...")
        return {"source": "cache", "storage_url": cached_s3_url.decode('utf-8')}

    print("🔄 Cache miss. Processing image and uploading to cloud storage...")
    
    # 4. Process image with Pillow
    try:
        img = Image.open(BytesIO(contents))
        orig_width, orig_height = img.size
        height = int((width / orig_width) * orig_height)
        
        img = img.resize((width, height), Image.Resampling.LANCZOS)
        
        output_io = BytesIO()
        img.save(output_io, format="JPEG", quality=quality)
        processed_bytes = output_io.getvalue()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image processing error: {str(e)}")

    # 5. Upload processed bytes to S3 / MinIO Object Storage
    try:
        s3_client.upload_fileobj(
            BytesIO(processed_bytes),
            S3_BUCKET_NAME,
            s3_object_key,
            ExtraArgs={"ContentType": "image/jpeg"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloud storage upload failed: {str(e)}")

    # Construct public/accessible storage URL
    storage_url = f"{S3_ENDPOINT_URL}/{S3_BUCKET_NAME}/{s3_object_key}"

    # 6. Cache the resulting storage reference in Redis for 1 hour
    redis_client.setex(cache_key, 3600, storage_url)

    return {"source": "computed", "storage_url": storage_url}