from pathlib import Path
import os
import cv2
import numpy as np
from concurrent.futures import ProcessPoolExecutor
import gc
import torch
from inference import OptimizedYOLOInference
from annotate import YOLOVisualizer

def process_single_image(model_path: str, image_path: Path, output_dir: Path) -> Path:
    """Process a single image file with additional debugging"""
    try:
        # Initialize the model
        inferencer = OptimizedYOLOInference(model_path)
        visualizer = YOLOVisualizer(model_path)
        
        # Read the image
        image = cv2.imread(str(image_path))
        if image is None:
            print(f"Failed to read image: {image_path}")
            return None
            
        # Convert BGR to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Get annotations with debugging
        annotations = inferencer.get_annotations(image_rgb)
        
        # Debug print the annotations
        print(f"\nAnnotations for {image_path.name}:")
        print(f"Raw annotations: {annotations}")
        
        if annotations:
            # Plot boxes and masks (using correct method name)
            visualized_image = visualizer.plot_boxes_and_masks(image_rgb, annotations)
            
            # Convert back to BGR for saving
            visualized_image = cv2.cvtColor(visualized_image, cv2.COLOR_RGB2BGR)
            
            # Create output path
            output_path = output_dir / f"{image_path.stem}_pred{image_path.suffix}"
            
            # Save the image
            cv2.imwrite(str(output_path), visualized_image)
            
            print(f"Processed {image_path.name} -> {output_path}")
            return output_path
        else:
            print(f"No detections found in {image_path.name} (confidence threshold: {inferencer.conf_threshold})")
            return None
            
    except Exception as e:
        print(f"Error processing {image_path.name}: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return None
     
def main():
    # Configuration
    MODEL_PATH = os.getenv('YOLO_WEIGHTS_PATH', "models/segment-2.pt")
    IMAGE_DIR = Path("data/images")
    OUTPUT_DIR = Path("data/predictions")
    
    # Create output directory if it doesn't exist
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Verify input directory exists
    if not IMAGE_DIR.exists():
        print(f"Input directory not found: {IMAGE_DIR}")
        return
        
    # Get all image files
    image_files = list(IMAGE_DIR.glob("**/*.[jp][pn][g]"))  # matches .jpg, .png, .jpeg
    if not image_files:
        print(f"No images found in {IMAGE_DIR}")
        return
        
    print(f"\nFound {len(image_files)} images:")
    for img in image_files:
        print(f"  - {img.relative_to(IMAGE_DIR)}")
        
    # Configure parallel processing
    num_workers = min(4, max(2, os.cpu_count() - 2))  # Reduced number of workers
    print(f"\nProcessing images using {num_workers} parallel workers")
    
    # Process images in smaller batches
    batch_size = 3  # Reduced batch size
    for i in range(0, len(image_files), batch_size):
        batch_images = image_files[i:i + batch_size]
        print(f"\nProcessing batch {i//batch_size + 1} of {(len(image_files) + batch_size - 1)//batch_size}")
        
        with ProcessPoolExecutor(max_workers=num_workers) as executor:
            futures = []
            for image_file in batch_images:
                future = executor.submit(
                    process_single_image,
                    MODEL_PATH,
                    image_file,
                    OUTPUT_DIR
                )
                futures.append((image_file, future))
                
            # Process results as they complete
            for image_file, future in futures:
                try:
                    output_path = future.result()
                    if output_path:
                        print(f"Completed processing {image_file.name}")
                except Exception as e:
                    print(f"Error processing {image_file.name}: {e}")
                    
        # Memory management between batches
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        elif hasattr(torch.mps, 'empty_cache'):
            torch.mps.empty_cache()

if __name__ == "__main__":
    main()