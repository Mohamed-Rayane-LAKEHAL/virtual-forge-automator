
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from database import get_db_connection
from powershell_runner import run_vm_creation_powershell
import bcrypt
import threading
import time
import os

app = Flask(__name__)

# Configure CORS properly for your frontend
CORS(app, 
     origins=['http://localhost:8080', 'http://127.0.0.1:8080'],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Use a more secure secret key
app.secret_key = os.environ.get('SECRET_KEY', 'your_very_secure_secret_key_change_in_production')
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hour

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

def require_auth(f):
    """Decorator to require authentication for endpoints"""
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

def ensure_status_column():
    """Ensure the status column exists in the vms table"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if status column exists
        cursor.execute("SHOW COLUMNS FROM vms LIKE 'status'")
        result = cursor.fetchone()
        
        if not result:
            # Add status column if it doesn't exist
            cursor.execute("ALTER TABLE vms ADD COLUMN status VARCHAR(20) DEFAULT 'pending'")
            conn.commit()
            print("Added status column to vms table")
            
        # Check if result column exists
        cursor.execute("SHOW COLUMNS FROM vms LIKE 'result'")
        result = cursor.fetchone()
        
        if not result:
            # Add result column if it doesn't exist
            cursor.execute("ALTER TABLE vms ADD COLUMN result TEXT")
            conn.commit()
            print("Added result column to vms table")
            
    except Exception as e:
        print(f"Error ensuring columns exist: {e}")
    finally:
        cursor.close()
        conn.close()

def execute_vm_creation_async(vm_id, vm_data):
    """Execute PowerShell script asynchronously and update database"""
    print(f"Starting PowerShell execution for VM ID: {vm_id}")
    ps_result = run_vm_creation_powershell(vm_data)
    print("RESULT FROM APP.PY: ", ps_result)
    
    # Determine status based on PowerShell result
    if ps_result['success']:
        # Check if the VM name appears in the success message
        output = ps_result['output']
        vm_name = vm_data['vmName']
        if f"✅ VM '{vm_name}'" in output:
            status = 'success'
            result_text = f"SUCCESS: {output}"
        else:
            status = 'error'
            result_text = f"ERROR: VM creation may have failed - name not found in success message"
    else:
        status = 'error'
        result_text = f"ERROR: {ps_result['error']}"
    
    # Update database with result
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE vms SET result = %s, status = %s WHERE id = %s
    """, (result_text, status, vm_id))
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"VM {vm_id} updated with status: {status}")

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
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"error": "Username and password required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE username=%s", (data['username'],))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user and verify_password(data['password'], user['password']):
        session['user'] = user['username']
        session.permanent = True
        print(f"User {user['username']} logged in successfully")
        return jsonify({"message": "Login successful", "user": {"username": user['username']}}), 200
    
    print(f"Failed login attempt for username: {data.get('username', 'unknown')}")
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/check-auth', methods=['GET'])
def check_auth():
    """Check if user is authenticated"""
    print(f"Auth check - Session: {dict(session)}")
    if 'user' in session:
        print(f"User {session['user']} is authenticated")
        return jsonify({"authenticated": True, "user": {"username": session['user']}}), 200
    
    print("No authenticated user found")
    return jsonify({"authenticated": False}), 401

@app.route('/logout', methods=['POST'])
def logout():
    username = session.get('user', 'unknown')
    session.clear()
    print(f"User {username} logged out")
    return jsonify({"message": "Logged out"}), 200

@app.route('/vms', methods=['GET'])
@require_auth
def list_vms():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM vms ORDER BY created_at DESC")
    vms = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(vms)

@app.route('/vms', methods=['POST'])
@require_auth
def create_vm():
    vm_data = request.json
    print("VM DATA : ", vm_data)
    
    # Ensure columns exist before inserting
    ensure_status_column()
    
    # First, insert VM with pending status
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO vms (vmName, esxiHost, datastore, network, cpuCount, memoryGB, diskGB, isoPath, guestOS, vcenter, status)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        vm_data['vmName'], vm_data['esxiHost'], vm_data['datastore'], vm_data['network'],
        vm_data['cpuCount'], vm_data['memoryGB'], vm_data['diskGB'],
        vm_data['isoPath'], vm_data['guestOS'], vm_data['vcenter'], 'pending'
    ))
    vm_id = cursor.lastrowid
    conn.commit()
    cursor.close()
    conn.close()
    
    # Start PowerShell execution in background thread
    thread = threading.Thread(target=execute_vm_creation_async, args=(vm_id, vm_data))
    thread.daemon = True
    thread.start()
    
    return jsonify({"message": "VM creation started", "vm_id": vm_id}), 201

if __name__ == '__main__':
    # Ensure database columns exist on startup
    ensure_status_column()
    app.run(debug=True, host='0.0.0.0', port=5000)
