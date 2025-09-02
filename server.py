import os
from flask import Flask, request

# Create a folder to store the images
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'image' not in request.files:
        return 'No image part in the request', 400
    file = request.files['image']
    if file.filename == '':
        return 'No image selected for uploading', 400
    if file:
        filename = file.filename
        file.path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file.path)
        print(f"Saved image: {filename}")
        return f'Successfully saved {filename}', 200

if __name__ == '__main__':
    # Run the server so it is accessible on your local network
    app.run(host='0.0.0.0', port=5001)
