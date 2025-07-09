
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE vms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vmName VARCHAR(100),
    esxiHost VARCHAR(100),
    datastore VARCHAR(100),
    network VARCHAR(100),
    cpuCount INT,
    memoryGB INT,
    diskGB INT,
    isoPath VARCHAR(255),
    guestOS VARCHAR(100),
    vcenter VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
