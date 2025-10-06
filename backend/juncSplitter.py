import os
import json
import numpy as np
from PIL import Image, ImageDraw
import math
from pathlib import Path
import argparse
from typing import Dict, List, Tuple

class JunctionSplitter:
    def __init__(self, coordinates_data: dict):
        """Initialize with coordinate data from JSON"""
        self.center = coordinates_data['center']
        self.road_angles = coordinates_data['roadAngles']
        self.original_size = coordinates_data['imageSize']
        self.version = coordinates_data.get('version', '1.0')
        
    def scale_coordinates(self, new_width: int, new_height: int) -> Tuple[Dict, Dict]:
        """Scale coordinates to match new image dimensions"""
        scale_x = new_width / self.original_size['width']
        scale_y = new_height / self.original_size['height']
        
        scaled_center = {
            'x': self.center['x'] * scale_x,
            'y': self.center['y'] * scale_y
        }
        
        # Road angles don't need scaling, they're in radians
        scaled_angles = self.road_angles.copy()
        
        return scaled_center, scaled_angles
    
    def create_sector_mask(self, width: int, height: int, center: Dict, 
                          angle: float, sector_width: float = math.pi/2) -> Image:
        """Create a mask for a specific sector (road direction)"""
        mask = Image.new('L', (width, height), 0)
        draw = ImageDraw.Draw(mask)
        
        # Create sector using polygon points
        radius = max(width, height)
        start_angle = angle - sector_width / 2
        end_angle = angle + sector_width / 2
        
        # Create points for the sector
        points = [(center['x'], center['y'])]
        
        # Add arc points
        num_points = 50
        for i in range(num_points + 1):
            current_angle = start_angle + (end_angle - start_angle) * i / num_points
            x = center['x'] + radius * math.cos(current_angle)
            y = center['y'] + radius * math.sin(current_angle)
            points.append((x, y))
        
        draw.polygon(points, fill=255)
        return mask
    
    def split_image(self, image_path: str, output_dir: str) -> Dict[str, str]:
        """Split a single image into 4 road directions"""
        # Load image
        image = Image.open(image_path)
        width, height = image.size
        
        # Scale coordinates for this image
        scaled_center, scaled_angles = self.scale_coordinates(width, height)
        
        # Get base filename without extension
        base_name = Path(image_path).stem
        
        # Create output paths for each direction
        output_paths = {}
        
        for direction, angle in scaled_angles.items():
            # Create sector mask
            mask = self.create_sector_mask(width, height, scaled_center, angle)
            
            # Apply mask to image
            result = Image.new('RGBA', (width, height), (0, 0, 0, 0))
            result.paste(image, (0, 0))
            result.putalpha(mask)
            
            # Convert back to RGB with white background
            final_image = Image.new('RGB', (width, height), 'white')
            final_image.paste(result, (0, 0), result)
            
            # Create output path
            direction_dir = os.path.join(output_dir, direction)
            os.makedirs(direction_dir, exist_ok=True)
            output_path = os.path.join(direction_dir, f"{base_name}_{direction}.jpg")
            
            # Save image
            final_image.save(output_path, 'JPEG', quality=95)
            output_paths[direction] = output_path
            
        return output_paths
    
    def process_batch(self, input_dir: str, output_dir: str, 
                     extensions: List[str] = None) -> Dict:
        """Process all images in a directory"""
        if extensions is None:
            extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']
        
        # Create main output directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Find all image files
        image_files = []
        for ext in extensions:
            image_files.extend(Path(input_dir).glob(f"*{ext}"))
            image_files.extend(Path(input_dir).glob(f"*{ext.upper()}"))
        
        results = {
            'processed': 0,
            'failed': [],
            'output_paths': {},
            'summary': {}
        }
        
        print(f"Found {len(image_files)} images to process...")
        
        for i, image_path in enumerate(image_files):
            try:
                print(f"Processing {i+1}/{len(image_files)}: {image_path.name}")
                
                output_paths = self.split_image(str(image_path), output_dir)
                results['output_paths'][str(image_path)] = output_paths
                results['processed'] += 1
                
            except Exception as e:
                print(f"Failed to process {image_path.name}: {str(e)}")
                results['failed'].append({'file': str(image_path), 'error': str(e)})
        
        # Create summary
        results['summary'] = {
            'total_found': len(image_files),
            'successfully_processed': results['processed'],
            'failed': len(results['failed']),
            'output_directories': list(self.road_angles.keys())
        }
        
        return results

def main():
    parser = argparse.ArgumentParser(description='Batch process junction images')
    parser.add_argument('--input', '-i', required=True, 
                       help='Input directory containing images')
    parser.add_argument('--output', '-o', required=True,
                       help='Output directory for processed images')
    parser.add_argument('--coordinates', '-c', required=True,
                       help='JSON file with coordinates data')
    parser.add_argument('--extensions', nargs='+', 
                       default=['.jpg', '.jpeg', '.png', '.bmp', '.tiff'],
                       help='Image file extensions to process')
    
    args = parser.parse_args()
    
    # Load coordinates
    try:
        with open(args.coordinates, 'r') as f:
            coordinates_data = json.load(f)
    except Exception as e:
        print(f"Error loading coordinates file: {e}")
        return
    
    # Initialize splitter
    splitter = JunctionSplitter(coordinates_data)
    
    # Process batch
    print(f"Starting batch processing...")
    print(f"Input directory: {args.input}")
    print(f"Output directory: {args.output}")
    print(f"Extensions: {args.extensions}")
    print("-" * 50)
    
    results = splitter.process_batch(args.input, args.output, args.extensions)
    
    # Print summary
    print("\n" + "="*50)
    print("PROCESSING COMPLETE")
    print("="*50)
    print(f"Total images found: {results['summary']['total_found']}")
    print(f"Successfully processed: {results['summary']['successfully_processed']}")
    print(f"Failed: {results['summary']['failed']}")
    print(f"\nOutput directories created:")
    for direction in results['summary']['output_directories']:
        direction_path = os.path.join(args.output, direction)
        count = len(os.listdir(direction_path)) if os.path.exists(direction_path) else 0
        print(f"  {direction}/: {count} images")
    
    if results['failed']:
        print(f"\nFailed files:")
        for failure in results['failed'][:10]:  # Show first 10 failures
            print(f"  {Path(failure['file']).name}: {failure['error']}")
        if len(results['failed']) > 10:
            print(f"  ... and {len(results['failed']) - 10} more")
    
    # Save detailed results
    results_file = os.path.join(args.output, 'processing_results.json')
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\nDetailed results saved to: {results_file}")

# Example usage as a script
if __name__ == "__main__":
    # You can also use it directly without command line arguments
    
    # Example coordinates (your provided data)
    example_coordinates = {
        "center": {"x": 224, "y": 199.5625},
        "roadAngles": {
            "north": -2.261114199563297,
            "east": -0.5535587531603815,
            "west": 2.335636639107386,
            "south": 0.9662663026446082
        },
        "imageSize": {"width": 600, "height": 600},
        "timestamp": "2025-09-16T05:44:40.652Z",
        "version": "1.0"
    }
    
    # If running without command line args, use direct method
    import sys
    if len(sys.argv) == 1:
        print("Direct usage example:")
        print("You can use this script in two ways:")
        print("\n1. Command line:")
        print("python script.py -i /path/to/images -o /path/to/output -c coordinates.json")
        print("\n2. Direct in code:")
        print("splitter = JunctionSplitter(coordinates_data)")
        print("results = splitter.process_batch('input_folder', 'output_folder')")
        
        # Uncomment below to run directly:
        splitter = JunctionSplitter(example_coordinates)
        results = splitter.process_batch('input_images', 'output_split')
        print("Processing complete!")
    else:
        main()