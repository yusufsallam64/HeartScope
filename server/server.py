from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import List
import numpy as np
import cv2
import io
from PIL import Image
import os
from pathlib import Path
import torch

from inference import OptimizedYOLOInference
from annotate import YOLOVisualizer

app = FastAPI(title="Image Analysis API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models as None
inference_model = None
visualizer = None

def init_model():
    """Initialize the YOLO model and visualizer with error handling"""
    global inference_model, visualizer
    try:
        MODEL_PATH = os.getenv('YOLO_WEIGHTS_PATH', "models/best.pt")
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
        
        inference_model = OptimizedYOLOInference(MODEL_PATH)
        visualizer = YOLOVisualizer(MODEL_PATH)
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
    """Analyze multiple images and return detected objects with visualizations"""
    if inference_model is None or visualizer is None:
        raise HTTPException(status_code=503, detail="Model not initialized")
        
    try:
        results = []
        for file in files:
            # Read image
            content = await file.read()
            image = Image.open(io.BytesIO(content))
            image_array = np.array(image)
            
            # Convert to RGB if needed
            if len(image_array.shape) == 3 and image_array.shape[2] == 3:
                image_rgb = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
            else:
                image_rgb = image_array
            
            # Get annotations
            annotations = inference_model.get_annotations(image_rgb)
            
            # Create visualization if annotations exist
            visualized_image = None
            if annotations:
                visualized_image = visualizer.plot_boxes_and_masks(image_rgb, annotations)
                visualized_image = cv2.cvtColor(visualized_image, cv2.COLOR_RGB2BGR)
                
                # Save visualization temporarily
                temp_path = f"temp_{file.filename}"
                cv2.imwrite(temp_path, visualized_image)
            
            results.append({
                "filename": file.filename,
                "annotations": annotations,
                "visualization_path": temp_path if annotations else None
            })
            
        return {"results": results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint with model status"""
    return {
        "status": "healthy",
        "model_loaded": inference_model is not None and visualizer is not None,
        "device": inference_model.device if inference_model else None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)