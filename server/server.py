from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import numpy as np
import io
from PIL import Image
import os
from pathlib import Path
import torch

from inference import OptimizedYOLOInference

app = FastAPI(title="Image Analysis API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model as None
inference_model = None

def init_model():
    """Initialize the YOLO model with error handling"""
    global inference_model
    try:
        MODEL_PATH = os.getenv('YOLO_WEIGHTS_PATH', "models/best.pt")
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
        
        inference_model = OptimizedYOLOInference(MODEL_PATH)
        return True
    except Exception as e:
        print(f"Error initializing model: {e}")
        return False

@app.on_event("startup")
async def startup_event():
    """Initialize model on startup"""
    if not init_model():
        raise RuntimeError("Failed to initialize model")

@app.post("/analyze")
async def analyze_images(files: List[UploadFile] = File(...)):
    """Analyze multiple images and return detected objects"""
    if inference_model is None:
        raise HTTPException(status_code=503, detail="Model not initialized")
        
    try:
        results = []
        for file in files:
            content = await file.read()
            image = Image.open(io.BytesIO(content))
            image_array = np.array(image)
            
            annotations = inference_model.get_annotations(image_array)
            
            results.append({
                "filename": file.filename,
                "annotations": annotations
            })
            
        return {"results": results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint with model status"""
    return {
        "status": "healthy",
        "model_loaded": inference_model is not None,
        "device": inference_model.device if inference_model else None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
    
    # uvicorn server:app --host 0.0.0.0 --port 8000