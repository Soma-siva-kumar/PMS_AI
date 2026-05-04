import cv2
from flask import Flask, Response
import sys

app = Flask(__name__)

# This script can be run as: python python_streamer.py <camera_index_or_url>
# Example: python python_streamer.py 0
# Example: python python_streamer.py http://192.168.1.5:8080/video

def generate_frames(source):
    # If source is numeric, convert to int for local webcam
    if source.isdigit():
        source = int(source)
    
    camera = cv2.VideoCapture(source)
    
    while True:
        success, frame = camera.read()
        if not success:
            break
        else:
            # You could add AI processing here (e.g. YOLO, Pose detection)
            # frame = process_frame(frame)
            
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    # Use the first command line argument as the source, default to 0 (webcam)
    source = sys.argv[1] if len(sys.argv) > 1 else '0'
    return Response(generate_frames(source),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    print(" * AI Stream Engine Starting...")
    print(" * Access via: http://localhost:5001/video_feed")
    app.run(host='0.0.0.0', port=5001, debug=False)
