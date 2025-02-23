import os
from pathlib import Path
from typing import List, Dict, Any
from time import perf_counter

import cv2
import numpy as np
import torch
from inference import OptimizedYOLOInference, YOLOInference
from PIL import Image

from dotenv import load_dotenv
load_dotenv()


class YOLOVisualizer:
    def __init__(self, model_path: str):
        """Initialize visualizer with inference model"""
        self.inferencer = YOLOInference(model_path)
        
        # Hot pink color (RGB) matching the reference image
        self.color = (255, 20, 147)  # RGB format
        self.mask_alpha = 0.3  # Slightly transparent for mask

    def draw_annotations(self, img: np.ndarray, mask: np.ndarray, box: np.ndarray, class_id: int) -> np.ndarray:
        """Draw mask, box and label in the reference style"""
        # Convert mask to boolean
        binary_mask = mask > 0.5
        
        # Create and apply the semi-transparent mask
        colored_mask = np.zeros_like(img)
        colored_mask[binary_mask] = self.color
        
        # Blend mask with image
        img = cv2.addWeighted(
            img, 1.0,
            colored_mask, self.mask_alpha,
            0
        )
        
        # Draw bounding box in hot pink
        x1, y1, x2, y2 = map(int, box)
        cv2.rectangle(img, (x1, y1), (x2, y2), self.color, 2)
        
        # Add class label
        text = str(int(class_id))
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.6
        thickness = 1
        
        # Get text size for background
        (text_width, text_height), baseline = cv2.getTextSize(
            text, font, font_scale, thickness)
        
        # Draw text with high visibility
        text_x = x1
        text_y = y1 - 10 if y1 - 10 > text_height else y1 + text_height
        
        # # Draw white text with a subtle shadow effect
        # cv2.putText(img, text, (text_x, text_y), font, font_scale, 
        #            (255, 255, 255), thickness)  # thicker white base
        
        return img

    def plot_boxes_and_masks(self, image: np.ndarray, annotations: dict) -> np.ndarray:
        """Plot segmentation masks with boxes and labels"""
        img = image.copy()
        
        if not annotations or 'masks' not in annotations:
            return img

        masks = annotations['masks']
        classes = annotations['classes']
        boxes = annotations['boxes']
        
        for mask, cls_id, box in zip(masks, classes, boxes):
            img = self.draw_annotations(img, mask, box, cls_id)

        return img

    def process_image(self, image_path: str, output_path: str) -> bool:
        """Process a single image with segmentation visualization"""
        try:
            image = cv2.imread(image_path)
            if image is None:
                return False

            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            annotations = self.inferencer.get_annotations(image_rgb)

            if annotations:
                visualized = self.plot_boxes_and_masks(image_rgb, annotations)
                visualized_bgr = cv2.cvtColor(visualized, cv2.COLOR_RGB2BGR)
                cv2.imwrite(output_path, visualized_bgr)
                return True
            else:
                return False

        except Exception as e:
            print(f"Error processing image {image_path}: {e}")
            import traceback
            print(traceback.format_exc())
            return False

    def process_batch(self, images: List[np.ndarray], batch_size: int = 4) -> List[Dict[str, Any]]:
        """Process a batch of images with segmentation support"""
        if not images:
            return []

        results = []
        start_time = perf_counter()

        try:
            # For MPS device, process in smaller batches
            if self.inferencer.device == 'mps':
                batch_size = min(batch_size, 2)

            # Prepare batch
            preprocessed = []
            for img in images:
                if isinstance(img, Image.Image):
                    img = np.array(img)
                prep_img, params = self.inferencer.preprocess_image(img)
                preprocessed.append((prep_img, params))

            # Run inference on batch
            batch_results = self.inferencer.process_batch(
                [p[0] for p in preprocessed],
                batch_size
            )

            # Process results
            for result, (_, params) in zip(batch_results, preprocessed):
                if result:
                    result['preprocessing_params'] = params
                results.append(result)

        except Exception as e:
            print(f"Error in batch processing: {e}")
            results.extend([{} for _ in range(len(images))])

        end_time = perf_counter()
        print(f"Batch processed in {(end_time - start_time) * 1000:.2f}ms")
        
        return results

def process_single_image(model_path: str, image_file: Path, output_dir: Path) -> Path:
    """Process a single image file"""
    visualizer = YOLOVisualizer(model_path)
    visualizer.inferencer = OptimizedYOLOInference(model_path)
    
    output_path = output_dir / f"{image_file.stem}_pred{image_file.suffix}"
    success = visualizer.process_image(str(image_file), str(output_path))
    
    return output_path if success else None


def main():
    MODEL_PATH = os.getenv('YOLO_WEIGHTS_PATH', "models/best.pt")
    IMAGE_DIR = Path("data/images")
    OUTPUT_DIR = Path("data/predictions")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Find all PNG images
    images = list(IMAGE_DIR.glob("**/*.png"))
    if not images:
        print(f"\nNo PNG images found in {IMAGE_DIR}")
        return

    print(f"\nFound {len(images)} images:")
    for img in images:
        print(f"  - {img.relative_to(IMAGE_DIR)}")

    # Process each image
    for image_file in images:
        try:
            output_path = process_single_image(MODEL_PATH, image_file, OUTPUT_DIR)
            if output_path:
                print(f"Processed {image_file.name} -> {output_path}")
            else:
                print(f"Failed to process {image_file.name}")
        except Exception as e:
            print(f"Error processing {image_file.name}: {e}")

        # Memory management
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        elif hasattr(torch.mps, 'empty_cache'):
            torch.mps.empty_cache()


if __name__ == "__main__":
    main()