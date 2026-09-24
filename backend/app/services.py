from io import BytesIO
from PIL import Image
import requests

def process_image(image_url: str, width: int, quality: int) -> BytesIO:
    # Download image from URL
    response = requests.get(image_url, timeout=10)
    response.raise_for_status()
    
    # Open with Pillow
    img = Image.open(BytesIO(response.content))
    
    # Maintain aspect ratio for height
    orig_width, orig_height = img.size
    height = int((width / orig_width) * orig_height)
    
    # Resize image
    img_resized = img.resize((width, height), Image.Resampling.LANCZOS)
    
    # Compress and convert to WebP in memory
    output = BytesIO()
    img_resized.save(output, format="WEBP", quality=quality)
    output.seek(0)
    
    return output