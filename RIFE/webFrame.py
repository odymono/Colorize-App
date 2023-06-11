from flask import Flask, request, jsonify
import os
from shutil import move

app = Flask(__name__)


# Route for video upload and colorization
@app.route('/framing', methods=['POST'])
def colorize():
    # Check if video ID is provided in request data
    video_id = request.json['id']
    print(video_id)
    if not video_id:
        return jsonify({'error': 'Video ID not provided'})
    os.system(f'python inference_video.py --video=C:\\AngularApp\\Colorize\\BackEnd\\uploads\\{video_id}.mp4 --fps=60')
    move(f'C:\\AngularApp\\Colorize\\BackEnd\\uploads\\{video_id}_frame.mp4', f'C:\\AngularApp\\Colorize\\BackEnd\\uploads\\{video_id}.mp4')
    return jsonify({'status': 'good'}), 202


if __name__ == '__main__':
    app.run(debug=False, port=6666)
