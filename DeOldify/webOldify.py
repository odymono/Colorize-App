from flask import Flask, request, jsonify
import os
from deoldify import device
from deoldify.device_id import DeviceId
from deoldify.visualize import *

device.set(device=DeviceId.GPU0)


colorizer = get_video_colorizer()

app = Flask(__name__)


# Create an instance of the VideoColorizer class
# video_colorizer = VideoColorizer(ModelImageVisualizer)

# Route for video upload and colorization
@app.route('/colorize', methods=['POST'])
def colorize():
    # Check if video ID is provided in request data
    video_id = request.json['id']
    print(video_id)
    if not video_id:
        return jsonify({'error': 'Video ID not provided'})

    render_factor=40
    file_name_ext = video_id + '.mp4'
    print(file_name_ext)
    result_path = colorizer.colorize_from_file_name(file_name_ext, render_factor=render_factor)


    # Return a 202 response indicating success
    return jsonify({'status': 'good'}), 202


if __name__ == '__main__':
    app.run(debug=False, port=4444)
