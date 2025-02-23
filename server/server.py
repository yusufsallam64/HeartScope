from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import List, Dict, Any
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

inference_model = None
visualizer = None

def init_model():
    """Initialize the YOLO model and visualizer with error handling"""
    global inference_model, visualizer
    try:
        MODEL_PATH = os.getenv('YOLO_WEIGHTS_PATH', "models/segment-1.pt")
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
        
        inference_model = OptimizedYOLOInference(MODEL_PATH)
        visualizer = YOLOVisualizer(MODEL_PATH)
        return True
    except Exception as e:
        print(f"Error initializing model: {e}")
        return False

def ensure_rgb(image: np.ndarray) -> np.ndarray:
    """Ensure image is in RGB format, matching test.py implementation"""
    if image is None:
        raise ValueError("Input image is None")
        
    # If image is BGR (from cv2.imread), convert to RGB
    if len(image.shape) == 3 and image.shape[2] == 3:
        return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    elif len(image.shape) == 2:  # Grayscale
        return cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
    elif len(image.shape) == 3 and image.shape[2] == 4:  # RGBA
        return cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
    
    return image

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
        # Process batch
        results = []
        for file in files:
            try:
                # Read file content
                content = await file.read()
                
                # Convert to numpy array using OpenCV (matching test.py)
                nparr = np.frombuffer(content, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if image is None:
                    raise ValueError(f"Failed to decode image: {file.filename}")
                
                # Convert to RGB (matching test.py processing)
                processed_image = ensure_rgb(image)
                
                # Debug print for image shape and type
                print(f"Processing {file.filename}: shape={processed_image.shape}, dtype={processed_image.dtype}")
                
                # Get annotations
                annotations = inference_model.get_annotations(processed_image)
                
                # Debug print annotations
                print(f"Annotations for {file.filename}:")
                print(f"Raw annotations: {annotations}")
                
                # Always save an image, whether or not there are annotations
                os.makedirs("temp", exist_ok=True)
                temp_path = f"/temp/{file.filename}"
                
                if annotations and len(annotations) > 0:
                    # If there are annotations, create visualization
                    visualized_image = visualizer.plot_boxes_and_masks(processed_image, annotations)
                    # Convert back to BGR for saving
                    visualized_image = cv2.cvtColor(visualized_image, cv2.COLOR_RGB2BGR)
                    cv2.imwrite(f".{temp_path}", visualized_image)
                else:
                    # If no annotations, save the original image (in BGR for consistency)
                    cv2.imwrite(f".{temp_path}", cv2.cvtColor(processed_image, cv2.COLOR_RGB2BGR))
                
                # Convert numpy types to Python native types
                formatted_annotations = {}
                if annotations:
                    for key, value in annotations.items():
                        if isinstance(value, np.ndarray):
                            formatted_annotations[key] = value.tolist()
                        elif isinstance(value, (np.int64, np.int32, np.float64, np.float32)):
                            formatted_annotations[key] = value.item()
                        else:
                            formatted_annotations[key] = value

                results.append({
                    "filename": file.filename,
                    "annotations": formatted_annotations,
                    "visualization_path": temp_path
                })
                
            except Exception as e:
                print(f"Error processing file {file.filename}: {str(e)}")
                import traceback
                print(traceback.format_exc())
                results.append({
                    "filename": file.filename,
                    "error": str(e),
                    "annotations": {},
                    "visualization_path": None
                })
        
        return {"results": results}
        
    except Exception as e:
        print(f"Server error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint with model status"""
    return {
        "status": "healthy",
        "model_loaded": inference_model is not None and visualizer is not None,
        "device": str(inference_model.device) if inference_model else None
    }

@app.get("/temp/{filename}")
async def get_image(filename: str):
    """Serve temporary images"""
    file_path = f"temp/{filename}"
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="Image not found")