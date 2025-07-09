
# VM Automation Backend

## Setup Instructions

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Setup MySQL database:
- Create a MySQL database named `vm_database`
- Run the `schema.sql` file to create the required tables
- Update the `.env` file with your MySQL credentials

3. Create a test user (optional):
```sql
INSERT INTO users (username, password) VALUES ('admin', '$2b$12$yourhashedpassword');
```

4. Run the Flask application:
```bash
python app.py
```

The backend will run on `http://localhost:5000` and the frontend should be able to connect to it.

## API Endpoints

- `POST /login` - User authentication
- `POST /logout` - User logout
- `GET /vms` - List all VMs
- `POST /vms` - Create new VM

## PowerShell Integration

The application automatically executes PowerShell scripts to create VMs on vCenter when a new VM is submitted through the form.
