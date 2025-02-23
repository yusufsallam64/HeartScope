from concurrent.futures import ThreadPoolExecutor
import os
from time import perf_counter
from functools import partial
from pathlib import Path
from typing import Any, Dict, List, Tuple

import cv2
import numpy as np
import pdf2image
import torch
from ultralytics import YOLO


def get_device() -> str:
    if torch.cuda.is_available():
        return 'cuda'
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        return 'mps'
    return 'cpu'


class YOLOInference:
    def __init__(self, model_path: str):
        """Initialize with path to trained YOLO model weights"""
        print(f"Loading model from: {model_path}")
        self.device = get_device()
        print(f"Using device: {self.device}")

        self.model = YOLO(model_path)
        self.model.to(self.device)

        # Detection parameters
        self.conf_threshold = 0.1
        self.iou_threshold = 0.45

        # Enable TensorRT optimization if available
        if self.device == 'cuda':
            torch.backends.cudnn.benchmark = True
            torch.backends.cuda.matmul.allow_tf32 = True
            torch.backends.cudnn.allow_tf32 = True

    def enhance_image(self, image: np.ndarray) -> np.ndarray:
        """Apply document-specific image enhancement"""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image

        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )

        denoised = cv2.fastNlMeansDenoising(thresh)
        enhanced = cv2.cvtColor(denoised, cv2.COLOR_GRAY2RGB)

        return enhanced

    def preprocess_image(self, image, target_size=1024) -> Tuple[np.ndarray, Tuple[float, int, int]]:
        """Preprocess image while maintaining aspect ratio"""
        if not isinstance(image, np.ndarray):
            image = np.array(image)

        image = self.enhance_image(image)

        height, width = image.shape[:2]
        scale = min(target_size/width, target_size/height)
        new_width = int(width * scale)
        new_height = int(height * scale)

        image = cv2.resize(
            image,
            (new_width, new_height),
            interpolation=cv2.INTER_LANCZOS4
        )

        square_size = target_size
        square_image = np.full(
            (square_size, square_size, 3), 255, dtype=np.uint8)
        x_offset = (square_size - new_width) // 2
        y_offset = (square_size - new_height) // 2
        square_image[y_offset:y_offset+new_height,
                     x_offset:x_offset+new_width] = image

        return square_image, (scale, x_offset, y_offset)

    def get_annotations(self, image) -> Dict[str, Any]:
        """Run inference and return annotations including segmentation masks"""
        processed_img, preprocessing_params = self.preprocess_image(image)
        
        results = self.model.predict(
            source=processed_img,
            conf=self.conf_threshold,
            iou=self.iou_threshold,
            agnostic_nms=True,
            max_det=50,
            save=False,
            imgsz=(1024, 1024),
            retina_masks=True  # Enable high-quality masks
        )

        if results[0].boxes is not None and len(results[0].boxes) > 0:
            annotations = {
                'boxes': results[0].boxes.xyxy.cpu().numpy(),
                'classes': results[0].boxes.cls.cpu().numpy(),
                'confidence': results[0].boxes.conf.cpu().numpy(),
                'preprocessing_params': preprocessing_params
            }
            
            # Add segmentation masks if available
            if hasattr(results[0], 'masks') and results[0].masks is not None:
                annotations['masks'] = results[0].masks.data.cpu().numpy()
                
            return annotations
        return {}

    def process_pdf(self, pdf_path: Path) -> List[Dict[str, Any]]:
        """Process PDF and return annotations for each page"""
        pdf_path = Path(pdf_path)
        print(f"Processing PDF: {pdf_path}")

        try:
            images = pdf2image.convert_from_path(str(pdf_path), dpi=300)
            print(f"Successfully converted PDF to {len(images)} images")

            annotations = []
            for i, image in enumerate(images, 1):
                print(f"Processing page {i}/{len(images)}")
                page_annotations = self.get_annotations(image)
                if page_annotations:
                    page_annotations['original_size'] = image.size
                annotations.append(page_annotations)

            return annotations

        except Exception as e:
            print(f"Error processing PDF: {e}")
            raise


class OptimizedYOLOInference(YOLOInference):
    def __init__(self, model_path: str):
        try:
            super().__init__(model_path)
            # Initialize executor after super() call
            self.executor = ThreadPoolExecutor(max_workers=6)
            self.target_size = 1024

            if self.device == 'mps':
                # Move model to float32 for MPS compatibility
                self.model.model = self.model.model.float()
                torch.mps.empty_cache()

            # Limit cache size to prevent memory bloat
            self._preprocess_cache = {}
            self._cache_size_limit = 8

            # Only compile model if not using MPS
            if self.device != 'mps':
                print("Compiling model for optimized inference")
                self.model = torch.compile(
                    self.model,
                    mode='reduce-overhead',
                    fullgraph=True,
                    dynamic=False,
                )
                print("Model compiled successfully")
                
        except Exception as e:
            print(f"Error initializing OptimizedYOLOInference: {e}")
            # Ensure executor is defined even if initialization fails
            self.executor = None
            raise

    def enhance_image(self, image: np.ndarray) -> np.ndarray:
        """Optimized document enhancement"""
        if isinstance(image, np.ndarray):
            if len(image.shape) == 2 or (len(image.shape) == 3 and image.shape[2] == 1):
                image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
            elif image.dtype != np.uint8:
                image = (image * 255).astype(np.uint8)
        else:
            image = np.array(image)
            if len(image.shape) == 2:
                image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)

        return cv2.bilateralFilter(image, 9, 75, 75)

    def preprocess_image(self, image) -> Tuple[np.ndarray, Tuple[float, int, int]]:
        """Memory-optimized image preprocessing"""
        if not isinstance(image, np.ndarray):
            image = np.array(image)

        cache_key = hash(image.tobytes())
        if cache_key in self._preprocess_cache:
            return self._preprocess_cache[cache_key]

        # Clear cache if it exceeds size limit
        if len(self._preprocess_cache) >= self._cache_size_limit:
            self._preprocess_cache.clear()

        # Rest of the preprocessing code remains the same...
        image = self.enhance_image(image)
        height, width = image.shape[:2]
        scale = min(self.target_size/width, self.target_size/height)
        new_width = int(width * scale)
        new_height = int(height * scale)

        image = cv2.resize(image, (new_width, new_height),
                           interpolation=cv2.INTER_LINEAR)

        square_image = np.full(
            (self.target_size, self.target_size, 3), 255, dtype=np.uint8)
        x_offset = (self.target_size - new_width) // 2
        y_offset = (self.target_size - new_height) // 2
        square_image[y_offset:y_offset+new_height,
                     x_offset:x_offset+new_width] = image

        result = (square_image, (scale, x_offset, y_offset))
        self._preprocess_cache[cache_key] = result
        return result

    def process_pdf(self, pdf_path: Path) -> List[Dict[str, Any]]:
        """Process PDF with optimized thread usage and dynamic batch sizing"""
        pdf_path = Path(pdf_path)
        print(f"Processing PDF: {pdf_path}")

        try:
            # Increase thread count for PDF conversion on M1
            # M1 Pro has 8 performance + 2 efficiency cores
            thread_count = min(8, max(4, os.cpu_count() - 2))
            images = pdf2image.convert_from_path(
                str(pdf_path), 
                dpi=300,
                thread_count=thread_count  # Increased from 4
            )
            print(f"Successfully converted PDF to {len(images)} images")

            # Dynamic batch sizing based on number of pages
            total_images = len(images)
            if total_images <= 4:
                batch_size = total_images  # Process all at once for small PDFs
            elif total_images <= 8:
                batch_size = 4  # Half batch for medium PDFs
            elif total_images <= 16:
                batch_size = 6  # Larger batch for bigger PDFs
            else:
                batch_size = 8  # Maximum batch size for very large PDFs

            # Adjust batch size for MPS
            # if self.device == 'mps':
            #     batch_size = min(batch_size, 4)  # MPS works better with smaller batches

            print(f"Using batch size of {batch_size} for {total_images} pages")

            all_annotations = []
            
            for i in range(0, total_images, batch_size):
                batch_start = perf_counter()
                batch = images[i:min(i + batch_size, total_images)]
                current_batch_size = len(batch)
                
                print(f"Processing batch {i//batch_size + 1}/{(total_images + batch_size - 1)//batch_size} "
                    f"({current_batch_size} images)")
                
                batch_results = self.process_batch(batch, batch_size=current_batch_size)
                
                for result, image in zip(batch_results, batch):
                    if result:
                        result['original_size'] = image.size
                    all_annotations.append(result)

                batch_time = (perf_counter() - batch_start) * 1000
                print(f"Batch processed in {batch_time:.2f}ms "
                    f"({batch_time/current_batch_size:.2f}ms per image)")

                # Force garbage collection after each batch
                import gc
                gc.collect()
                if self.device == 'cuda':
                    torch.cuda.empty_cache()
                elif self.device == 'mps':
                    torch.mps.empty_cache()

            # print(all_annotations)
            return all_annotations

        except Exception as e:
            print(f"Error processing PDF: {e}")
            raise

    def process_batch(self, images: List[np.ndarray], batch_size: int = 4) -> List[Dict[str, Any]]:
        """Process images in batches with optimized memory handling"""
        if not images:
            return []

        results = []
        start_time = perf_counter()

        try:
            # For MPS device, process in smaller batches
            if self.device == 'mps':
                batch_size = min(batch_size, 2)

            # Prepare tensors
            batch_tensors = []
            for img in images:
                if not isinstance(img, np.ndarray):
                    img = np.array(img)
                
                # Convert to tensor and normalize
                tensor = torch.from_numpy(img).to(self.device)
                tensor = tensor.float() / 255.0
                tensor = tensor.permute(2, 0, 1).unsqueeze(0)
                batch_tensors.append(tensor)

            # Process in smaller sub-batches for MPS
            if self.device == 'mps':
                sub_batch_results = []
                for i in range(0, len(batch_tensors), batch_size):
                    sub_batch = batch_tensors[i:i + batch_size]
                    sub_batch_tensor = torch.cat(sub_batch, dim=0)
                    
                    with torch.inference_mode():
                        predictions = self.model.predict(
                            source=sub_batch_tensor,
                            conf=self.conf_threshold,
                            iou=self.iou_threshold,
                            agnostic_nms=True,
                            max_det=50,
                            save=False,
                            imgsz=(1024, 1024),
                            verbose=False,
                            retina_masks=True  # Enable high-quality masks
                        )
                    sub_batch_results.extend(predictions)
                predictions = sub_batch_results
            else:
                # For non-MPS devices, process the full batch
                batch_tensor = torch.cat(batch_tensors, dim=0)
                with torch.inference_mode():
                    predictions = self.model.predict(
                        source=batch_tensor,
                        conf=self.conf_threshold,
                        iou=self.iou_threshold,
                        agnostic_nms=True,
                        max_det=50,
                        save=False,
                        imgsz=(1024, 1024),
                        verbose=False,
                        retina_masks=True  # Enable high-quality masks
                    )

            # Process results
            for pred in predictions:
                if pred.boxes is not None and len(pred.boxes) > 0:
                    with torch.inference_mode():
                        result = {
                            'boxes': pred.boxes.xyxy.cpu().numpy(),
                            'classes': pred.boxes.cls.cpu().numpy(),
                            'confidence': pred.boxes.conf.cpu().numpy(),
                        }
                        
                        # Add masks if available
                        if hasattr(pred, 'masks') and pred.masks is not None:
                            result['masks'] = pred.masks.data.cpu().numpy()
                else:
                    result = {}
                results.append(result)

        except Exception as e:
            print(f"Error in batch processing: {e}")
            import traceback
            print(traceback.format_exc())
            results.extend([{} for _ in range(len(images))])

        end_time = perf_counter()
        print(f"Batch processed in {(end_time - start_time) * 1000:.2f}ms")
        
        return results


    def get_annotations(self, image) -> Dict[str, Any]:
        """Single image inference - now just processes a batch of size 1"""
        return self.process_batch([image], batch_size=4)[0]

    def __del__(self):
        """Cleanup resources safely"""
        try:
            if hasattr(self, 'executor') and self.executor is not None:
                self.executor.shutdown()
            if hasattr(self, '_preprocess_cache'):
                self._preprocess_cache.clear()
            if hasattr(self, 'device') and self.device == 'mps':
                torch.mps.empty_cache()
        except Exception as e:
            print(f"Error during cleanup: {e}")
