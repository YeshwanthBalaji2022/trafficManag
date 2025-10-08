from juncSplitter import JunctionSplitter

coordinates = {
    "center": {"x": 224, "y": 199.5625},
    "roadAngles": {
        "north": -2.261114199563297,
        "east": -0.5535587531603815,  
        "west": 2.335636639107386,
        "south": 0.9662663026446082
    },
    "imageSize": {"width": 600, "height": 600}
}

splitter = JunctionSplitter(coordinates)
results = splitter.process_batch('input_folder', 'output_folder')
print(f"Processed {results['processed']} images successfully!")