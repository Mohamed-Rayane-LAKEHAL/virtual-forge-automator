
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from database import get_db_connection
from powershell_runner import run_vm_creation_powershell
import bcrypt

app = Flask(__name__)

# Configure CORS properly for your frontend
CORS(app, 
     origins=['http://localhost:8080', 'http://127.0.0.1:8080'],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

app.secret_key = 'your_secret_key'

def hash_password(password):
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, hashed_password):
    """Verify a password against a hash, handling both bcrypt hashes and plain text"""
    try:
        # Try bcrypt verification first
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError:
        # If bcrypt fails, check if it's plain text (for migration purposes)
        return password == hashed_password

@app.route('/hash-password', methods=['POST'])
def hash_user_password():
    """Utility endpoint to hash a password - for admin use"""
    data = request.json
    if not data or 'password' not in data:
        return jsonify({"error": "Password required"}), 400
    
    hashed = hash_password(data['password'])
    return jsonify({"hashed_password": hashed}), 200

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE username=%s", (data['username'],))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user and verify_password(data['password'], user['password']):
        session['user'] = user['username']
        return jsonify({"message": "Login successful"}), 200
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"}), 200

@app.route('/vms', methods=['GET'])
def list_vms():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM vms ORDER BY created_at DESC")
    vms = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(vms)

@app.route('/vms', methods=['POST'])
def create_vm():
    vm_data = request.json
    print("VM DATA : ", vm_data)
    # Execute PowerShell script and get result
    ps_result = run_vm_creation_powershell(vm_data)
    
    # Prepare result string for database storage
    if ps_result['success']:
        result_text = f"SUCCESS: {ps_result['output']}"
    else:
        result_text = f"ERROR: {ps_result['error']}"
    
    # Insert VM data with result into database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO vms (vmName, esxiHost, datastore, network, cpuCount, memoryGB, diskGB, isoPath, guestOS, vcenter, result)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        vm_data['vmName'], vm_data['esxiHost'], vm_data['datastore'], vm_data['network'],
        vm_data['cpuCount'], vm_data['memoryGB'], vm_data['diskGB'],
        vm_data['isoPath'], vm_data['guestOS'], vm_data['vcenter'], result_text
    ))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "VM created and PowerShell executed", "result": ps_result}), 201

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
