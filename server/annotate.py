from concurrent.futures import ProcessPoolExecutor
import gc
import io
import os
import tempfile
from datetime import datetime
from pathlib import Path
from typing import List

import cv2
import img2pdf
import numpy as np
import pdf2image
import torch
from inference import OptimizedYOLOInference, YOLOInference
from PIL import Image

from dotenv import load_dotenv
load_dotenv()


class YOLOVisualizer:
    def __init__(self, model_path: str):
        """Initialize visualizer with inference model"""
        self.inferencer = YOLOInference(model_path)

    def plot_boxes_only(self, image: np.ndarray, annotations: dict) -> np.ndarray:
        """Custom plotting function to draw boxes with class colors and confidence scores"""
        img = image.copy()

        # Define colors for different classes (BGR format)
        colors = [
            (139, 0, 0),      # question - blue
            (0, 0, 255),      # figure - scarlet red
            (92, 184, 92),    # multiple_choice_option - green
            (232, 229, 139),  # answer_region - light blue
            (187, 233, 235)   # instruction - light yellow
        ]

        boxes = annotations['boxes']
        cls = annotations['classes']
        conf = annotations['confidence']

        for box, cls_id, conf_score in zip(boxes, cls, conf):
            x1, y1, x2, y2 = map(int, box)
            color = colors[int(cls_id) % len(colors)]

            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)

            conf_text = f"{conf_score:.2f}"
            font_scale = 0.4
            font_thickness = 1
            font = cv2.FONT_HERSHEY_SIMPLEX

            (text_width, text_height), _ = cv2.getTextSize(
                conf_text, font, font_scale, font_thickness)
            cv2.rectangle(img, (x1, y1 - text_height - 2),
                          (x1 + text_width, y1), (255, 255, 255), -1)
            cv2.putText(img, conf_text, (x1, y1 - 2), font,
                        font_scale, (0, 0, 0), font_thickness)

        return img

    def compile_to_pdf(self, image_paths: List[Path], output_pdf_path: Path) -> bool:
        """Compile images to PDF with quality preservation"""
        try:
            image_bytes = []
            for img_path in image_paths:
                if isinstance(img_path, Path):
                    img_path = str(img_path)

                with Image.open(img_path) as img:
                    if img.mode != 'RGB':
                        img = img.convert('RGB')

                    img_byte_arr = io.BytesIO()
                    img.save(img_byte_arr, format='JPEG',
                             quality=95, optimize=True)
                    image_bytes.append(img_byte_arr.getvalue())

            try:
                pdf_bytes = img2pdf.convert(image_bytes, with_pdfrw=True)

                if pdf_bytes:
                    with open(output_pdf_path, 'wb') as pdf_file:
                        pdf_file.write(pdf_bytes)
            except Exception as e:
                print(f"Error during PDF conversion: {e}")
                return False

            print(f"Successfully created PDF at {output_pdf_path}")
            return True

        except Exception as e:
            print(f"Error creating PDF: {e}")
            return False

    def process_pdf(self, pdf_path: Path, output_dir: Path) -> Path:
        """Process PDF with annotations and save visualization"""
        pdf_path = Path(pdf_path)

        try:
            # Get original images and annotations
            images = pdf2image.convert_from_path(str(pdf_path), dpi=300)
            annotations = self.inferencer.process_pdf(pdf_path)

            with tempfile.TemporaryDirectory() as temp_dir:
                temp_dir_path = Path(temp_dir)
                processed_image_paths = []

                for i, (image, page_annotations) in enumerate(zip(images, annotations), 1):
                    if page_annotations:
                        orig_width, orig_height = page_annotations['original_size']
                        scale, x_offset, y_offset = page_annotations['preprocessing_params']

                        # Preprocess image for visualization
                        processed_img, _ = self.inferencer.preprocess_image(
                            image)

                        # Plot boxes
                        im_array = self.plot_boxes_only(
                            processed_img, page_annotations)

                        # Convert back to original aspect ratio
                        im = Image.fromarray(im_array[..., ::-1])  # BGR to RGB
                        im = im.crop((x_offset, y_offset,
                                      x_offset + int(orig_width * scale),
                                      y_offset + int(orig_height * scale)))
                        im = im.resize((orig_width, orig_height),
                                       Image.Resampling.LANCZOS)

                        # Save with high quality
                        temp_image_path = temp_dir_path / f"page_{i}.jpg"
                        im.save(temp_image_path, quality=95, optimize=True)
                    else:
                        # If no detections, save original
                        temp_image_path = temp_dir_path / f"page_{i}.jpg"
                        image.save(temp_image_path, quality=95)

                    processed_image_paths.append(temp_image_path)

                # Create unique folder for this PDF
                pdf_output_dir = output_dir / pdf_path.stem
                pdf_output_dir.mkdir(exist_ok=True)

                # Find next available increment number
                existing_pdfs = list(
                    pdf_output_dir.glob(f"{pdf_path.stem}-*.pdf"))
                if not existing_pdfs:
                    increment = 1
                else:
                    numbers = [int(p.stem.split('-')[-1])
                               for p in existing_pdfs]
                    increment = max(numbers) + 1

                # Compile to PDF with incremental naming
                output_pdf_path = pdf_output_dir / \
                    f"{pdf_path.stem}-{increment}.pdf"
                self.compile_to_pdf(processed_image_paths, output_pdf_path)

                return output_pdf_path

        except Exception as e:
            print(f"Error processing PDF: {e}")
            raise


def process_single_pdf(model_path: str, pdf_file: Path, output_dir: Path) -> Path:
    """Process a single PDF file"""
    visualizer = YOLOVisualizer(model_path)
    visualizer.inferencer = OptimizedYOLOInference(model_path)
    return visualizer.process_pdf(pdf_file, output_dir)


def main():
    MODEL_PATH = os.getenv('YOLO_WEIGHTS_PATH',
                           "yolo/runs/detect/best/best.pt")
    PDF_DIR = "pdfs"
    OUTPUT_DIR = Path(
        f"predictions/yolo/{datetime.now().strftime('%m-%d-%H:%M')}")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    pdf_dir = Path(PDF_DIR)
    if not pdf_dir.exists():
        pdf_dir.mkdir(parents=True, exist_ok=True)

    pdfs = list(pdf_dir.glob("**/*.pdf"))
    if not pdfs:
        print(f"\nNo PDFs found in {pdf_dir} or its subdirectories")
        return

    print(f"\nFound {len(pdfs)} PDF files:")
    for pdf in pdfs:
        print(f"  - {pdf.relative_to(pdf_dir)}")

    # More aggressive but still safe
    num_workers = min(6, max(4, os.cpu_count() - 2))
    print(f"\nProcessing PDFs using {num_workers} parallel workers")

    batch_size = 6
    for i in range(0, len(pdfs), batch_size):
        batch_pdfs = pdfs[i:i + batch_size]
        print(
            f"\nProcessing batch {i//batch_size + 1} of {(len(pdfs) + batch_size - 1)//batch_size}")

        with ProcessPoolExecutor(max_workers=num_workers) as executor:
            futures = []
            for pdf_file in batch_pdfs:
                future = executor.submit(
                    process_single_pdf,
                    MODEL_PATH,  # Changed order - model path first
                    pdf_file,    # PDF file second
                    OUTPUT_DIR   # Output dir third
                )
                futures.append((pdf_file, future))

            # Process results as they complete
            for pdf_file, future in futures:
                try:
                    output_path = future.result()
                    print(
                        f"Completed processing {pdf_file.name} -> {output_path}")
                except Exception as e:
                    print(f"Error processing {pdf_file.name}: {e}")

        # Memory management between batches
        gc.collect()
        if hasattr(torch.mps, 'empty_cache'):
            torch.mps.empty_cache()


if __name__ == "__main__":
    main()
