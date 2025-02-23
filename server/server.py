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
        MODEL_PATH = os.getenv('YOLO_WEIGHTS_PATH', "models/best.pt")
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
        
        inference_model = OptimizedYOLOInference(MODEL_PATH)
        visualizer = YOLOVisualizer(MODEL_PATH)
        return True
    except Exception as e:
        print(f"Error initializing model: {e}")
        return False

def ensure_rgb(image: np.ndarray) -> np.ndarray:
    """Ensure image is in RGB format"""
    if len(image.shape) == 2:  # Grayscale
        return cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
    elif len(image.shape) == 3:
        if image.shape[2] == 4:  # RGBA
            return cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
        elif image.shape[2] == 3:  # Already RGB/BGR
            if image.dtype != np.uint8:
                image = (image * 255).astype(np.uint8)
            return image
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
        # Create batch of images
        batch_images = []
        for file in files:
            content = await file.read()
            image = Image.open(io.BytesIO(content)).convert('RGB')
            image_array = np.array(image)
            batch_images.append(image_array)

        # Process batch
        results = []
        for idx, (file, image_array) in enumerate(zip(files, batch_images)):
            try:
                # Process single image
                processed_image = ensure_rgb(image_array)
                
                # Get annotations for single image
                annotations = inference_model.get_annotations(processed_image)
                
                # Create visualization if annotations exist
                temp_path = None
                if annotations and len(annotations) > 0:
                    os.makedirs("temp", exist_ok=True)
                    visualized_image = visualizer.plot_boxes_and_masks(processed_image, annotations)
                    temp_path = f"/temp/{file.filename}"
                    cv2.imwrite(f".{temp_path}", cv2.cvtColor(visualized_image, cv2.COLOR_RGB2BGR))
                
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)