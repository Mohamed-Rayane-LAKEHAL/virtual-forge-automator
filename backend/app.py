from flask import Flask, request, jsonify, session, make_response
from flask_cors import CORS
from database import get_db_connection
from powershell_runner import run_vm_creation_powershell
import bcrypt
import threading
import time
import os

app = Flask(__name__)

# Configure CORS to allow both local and Lovable preview domains
CORS(app, 
     origins=["http://localhost:8080", "http://127.0.0.1:8080", "http://192.168.1.41:8080", 
              "http://192.168.1.35:8080",  # Add the frontend IP from logs
              "https://fa092e75-dda3-4019-bc20-96f9f4bf4126.lovableproject.com",
              "https://*.lovableproject.com"],  # Allow Lovable preview domains
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Use a more secure secret key
app.secret_key = os.environ.get('SECRET_KEY', 'your_very_secure_secret_key_change_in_production')

# Session configuration for cross-origin requests
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # Allow cross-site requests
app.config['SESSION_COOKIE_DOMAIN'] = None  # Allow any domain
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hour

# Add OPTIONS handler for preflight requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        origin = request.headers.get('Origin')
        if origin:
            response.headers.add("Access-Control-Allow-Origin", origin)
        response.headers.add('Access-Control-Allow-Headers', "Content-Type, Authorization, Accept, Origin, X-Requested-With")
        response.headers.add('Access-Control-Allow-Methods', "GET, POST, PUT, DELETE, OPTIONS")
        response.headers.add('Access-Control-Allow-Credentials', "true")
        return response

@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin:
        # Allow all Lovable preview domains and local development
        allowed_origins = [
            "http://localhost:8080", 
            "http://127.0.0.1:8080", 
            "http://192.168.1.41:8080",
            "http://192.168.1.35:8080",  # Add the frontend IP from logs
            "https://fa092e75-dda3-4019-bc20-96f9f4bf4126.lovableproject.com"
        ]
        if origin in allowed_origins or origin.endswith('.lovableproject.com'):
            response.headers.add('Access-Control-Allow-Origin', origin)
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

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
        print(f"Auth check for {request.endpoint}: Session = {dict(session)}")
        if 'user' not in session:
            print("Authentication failed - no user in session")
            return jsonify({"error": "Authentication required"}), 401
        print(f"Authentication successful for user: {session['user']}")
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
    print(f"Login attempt from origin: {request.headers.get('Origin')}")
    print(f"Login data received: {data}")
    
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
        print(f"User {user['username']} logged in successfully. Session: {dict(session)}")
        
        # Create response with explicit headers for cross-origin cookies
        response = make_response(jsonify({"message": "Login successful", "user": {"username": user['username']}}))
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        origin = request.headers.get('Origin')
        if origin and (origin in ["http://localhost:8080", "http://127.0.0.1:8080", "http://192.168.1.41:8080", "http://192.168.1.35:8080", "https://fa092e75-dda3-4019-bc20-96f9f4bf4126.lovableproject.com"] or origin.endswith('.lovableproject.com')):
            response.headers.add('Access-Control-Allow-Origin', origin)
        return response, 200
    
    print(f"Failed login attempt for username: {data.get('username', 'unknown')}")
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/check-auth', methods=['GET'])
def check_auth():
    """Check if user is authenticated"""
    print(f"Auth check from origin: {request.headers.get('Origin')}")
    print(f"Auth check - Session: {dict(session)}")
    print(f"Request headers: {dict(request.headers)}")
    
    response_data = {"authenticated": False}
    status_code = 200
    
    if 'user' in session:
        print(f"User {session['user']} is authenticated")
        response_data = {"authenticated": True, "user": {"username": session['user']}}
        status_code = 200
    else:
        print("No authenticated user found")
    
    response = make_response(jsonify(response_data))
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    origin = request.headers.get('Origin')
    if origin and (origin in ["http://localhost:8080", "http://127.0.0.1:8080", "http://192.168.1.41:8080", "http://192.168.1.35:8080", "https://fa092e75-dda3-4019-bc20-96f9f4bf4126.lovableproject.com"] or origin.endswith('.lovableproject.com')):
        response.headers.add('Access-Control-Allow-Origin', origin)
    return response, status_code

@app.route('/logout', methods=['POST'])
def logout():
    username = session.get('user', 'unknown')
    session.clear()
    print(f"User {username} logged out")
    response = make_response(jsonify({"message": "Logged out"}))
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    origin = request.headers.get('Origin')
    if origin and (origin in ["http://localhost:8080", "http://127.0.0.1:8080", "http://192.168.1.41:8080", "http://192.168.1.35:8080", "https://fa092e75-dda3-4019-bc20-96f9f4bf4126.lovableproject.com"] or origin.endswith('.lovableproject.com')):
        response.headers.add('Access-Control-Allow-Origin', origin)
    return response, 200

@app.route('/vms', methods=['GET'])
@require_auth
def list_vms():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM vms ORDER BY created_at DESC")
    vms = cursor.fetchall()
    cursor.close()
    conn.close()
    
    response = jsonify(vms)
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

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
    
    response = jsonify({"message": "VM creation started", "vm_id": vm_id})
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response, 201

@app.route('/vms/batch', methods=['POST'])
@require_auth
def create_batch_vms():
    batch_data = request.json
    print("BATCH VM DATA: ", batch_data)
    
    # Ensure columns exist before inserting
    ensure_status_column()
    
    vm_names = batch_data.get('vmNames', [])
    if not vm_names:
        return jsonify({"error": "No VM names provided"}), 400
    
    # Extract template data
    template_data = {k: v for k, v in batch_data.items() if k != 'vmNames'}
    
    vm_ids = []
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Insert all VMs with pending status
        for vm_name in vm_names:
            cursor.execute("""
                INSERT INTO vms (vmName, esxiHost, datastore, network, cpuCount, memoryGB, diskGB, isoPath, guestOS, vcenter, status)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                vm_name, template_data['esxiHost'], template_data['datastore'], template_data['network'],
                template_data['cpuCount'], template_data['memoryGB'], template_data['diskGB'],
                template_data['isoPath'], template_data['guestOS'], template_data['vcenter'], 'pending'
            ))
            vm_ids.append(cursor.lastrowid)
        
        conn.commit()
        
        # Start PowerShell execution for each VM in background threads
        for i, vm_id in enumerate(vm_ids):
            vm_data = {**template_data, 'vmName': vm_names[i]}
            thread = threading.Thread(target=execute_vm_creation_async, args=(vm_id, vm_data))
            thread.daemon = True
            thread.start()
            # Add small delay between starts to avoid overwhelming the system
            time.sleep(1)
        
        response = jsonify({"message": f"Batch VM creation started for {len(vm_names)} VMs", "vm_ids": vm_ids})
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 201
        
    except Exception as e:
        conn.rollback()
        print(f"Error creating batch VMs: {e}")
        return jsonify({"error": f"Failed to create batch VMs: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    # Ensure database columns exist on startup
    ensure_status_column()
    # Bind to all network interfaces (0.0.0.0) to be accessible from other machines
    print("Starting Flask server on http://192.168.1.41:5000")
    print("Configured to accept requests from Lovable preview domains")
    print("Added support for frontend IP: 192.168.1.35:8080")
    app.run(debug=True, host='0.0.0.0', port=5000)
