import os
import smtplib
import csv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, jsonify, send_from_directory

# Create a folder to store the images
UPLOAD_FOLDER = 'upload'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

VIS_FOLDER = 'vis'
if not os.path.exists(VIS_FOLDER):
    os.makedirs(VIS_FOLDER)

CSV_PATH = "counts.csv"

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['VIS_FOLDER'] = VIS_FOLDER

# Load environment variables from .env manually
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    print(f"Loading environment from {env_path}")
    with open(env_path, 'r') as f:
        for line in f:
            if '=' in line and not line.strip().startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value.strip()

# CORS Headers
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'image' not in request.files:
        return 'No image part in the request', 400
    file = request.files['image']
    if file.filename == '':
        return 'No image selected for uploading', 400
    if file:
        filename = f"manual_{file.filename}"
        file.path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file.path)
        print(f"Saved image: {filename}")
        return jsonify({'message': f'Successfully saved {filename}', 'filename': filename}), 200

@app.route('/vis/<path:filename>')
def serve_vis(filename):
    return send_from_directory(app.config['VIS_FOLDER'], filename)

@app.route('/status/<filename>', methods=['GET'])
def check_status(filename):
    heatmap_path = os.path.join(app.config['VIS_FOLDER'], f"heatmap_{filename}")
    
    if os.path.exists(heatmap_path):
        # Image is processed. Find count in CSV.
        count = 0
        try:
            with open(CSV_PATH, 'r') as f:
                # Read last 50 lines for efficiency
                lines = f.readlines()[-50:]
                for line in reversed(lines):
                    parts = line.split(',')
                    if len(parts) >= 3 and parts[0] == filename:
                        count = int(parts[2])
                        break
        except Exception as e:
            print(f"Error reading CSV: {e}")
            
        return jsonify({
            'status': 'completed',
            'people_count': count,
            'heatmap_url': f"http://localhost:5001/vis/heatmap_{filename}",
            'vis_url': f"http://localhost:5001/vis/{filename}"
        }), 200
        
    return jsonify({'status': 'processing'}), 200

@app.route('/send-email', methods=['POST'])
def send_email():
    data = request.json
    to_email = data.get('to')
    subject = data.get('subject')
    body = data.get('body')
    
    sender_email = os.environ.get('SMTP_EMAIL')
    sender_password = os.environ.get('SMTP_PASSWORD')
    
    if not sender_email or not sender_password:
        print("[WARNING] Email credentials missing. Set SMTP_EMAIL and SMTP_PASSWORD env vars.")
        # Simulate success for UI testing even if creds missing
        return jsonify({"status": "simulated", "message": "Email logged (creds missing)"}), 200

    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        
        # Connect to Gmail SMTP (or generic)
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, to_email, text)
        server.quit()
        
        print(f"Email sent to {to_email}")
        return jsonify({"status": "success", "message": "Email sent successfully"}), 200
    except Exception as e:
        print(f"Failed to send email: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/send-webhook', methods=['POST'])
def send_webhook():
    import requests
    data = request.json
    webhook_url = data.get('url')
    message = data.get('message')

    if not webhook_url or not message:
        return jsonify({"error": "Missing url or message"}), 400

    try:
        # Standard Slack/Discord payload structure
        payload = {"text": message, "content": message} # 'text' for Slack, 'content' for Discord
        resp = requests.post(webhook_url, json=payload, timeout=5)
        
        if resp.status_code < 300:
             return jsonify({"status": "success"}), 200
        else:
             return jsonify({"error": f"Webhook failed: {resp.text}"}), 500
    except Exception as e:
        print(f"Webhook error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run the server so it is accessible on your local network
    app.run(host='0.0.0.0', port=5001)