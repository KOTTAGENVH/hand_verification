import os
import logging
from flask import Flask, request, jsonify
import cv2
import mediapipe as mp
import numpy as np
import random
from flask_cors import CORS
import urllib.request

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000'])

# Initialize MediaPipe hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=True, max_num_hands=1, min_detection_confidence=0.5)

# Verify the hand in the image
@app.route('/verify_hand', methods=['POST'])
def verify_hand():
    # Get the Firebase URL from the request
    image_url = request.json.get('image_url')
    if not image_url:
        return jsonify({'status': 'error', 'message': 'No image URL provided'}), 400
    
    try:
        # Download the image from the Firebase URL
        resp = urllib.request.urlopen(image_url)
        image_data = np.asarray(bytearray(resp.read()), dtype="uint8")
        image = cv2.imdecode(image_data, cv2.IMREAD_COLOR)
        
        # Resize the image to a fixed size (e.g., 640x480)
        fixed_width, fixed_height = 640, 480
        image = cv2.resize(image, (fixed_width, fixed_height))
        
        # Convert the image from BGR to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process the image with MediaPipe Hands
        results = hands.process(image_rgb)
        
        # Check if any hand landmarks were detected
        if results.multi_hand_landmarks:
            # Generate a random number
            random_number = random.randint(100, 999)
            
            # Construct the filename with the random number
            image_name = f'verified_hand{random_number}.png'
            directory_path = '/Users/nowenkottage/Downloads/newDataset'
            
            # Create the directory if it does not exist
            if not os.path.exists(directory_path):
                os.makedirs(directory_path)
            
            # Full save path
            save_path = os.path.join(directory_path, image_name)
            
            # Save the image
            cv2.imwrite(save_path, image)
            
            return jsonify({'status': 'ok', 'message': 'Hand detected and image saved', 'image_path': image_name})
        else:
            return jsonify({'status': 'error', 'message': 'No hand detected in the image'}), 400

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


if __name__ == '__main__':
    port = random.randint(1024, 49151)  # Choose a random port between 1024 and 49151
    logging.info(f"Starting server on port {port}")
    app.run(port=port)
