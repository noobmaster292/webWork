const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

// Helper function to read CSV file
const readCsvFile = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
};

// Load hierarchy from CSV
const loadHierarchy = async () => {
    const hierarchyCsvFilePath = path.join(__dirname, '..', 'public', 'hierarchy_mapping.csv');
    const hierarchyData = await readCsvFile(hierarchyCsvFilePath);
    const hierarchy = {};

    hierarchyData.forEach(row => {
        if (row.Boss && row.Employees) {
            const boss = row.Boss;
            const employees = row.Employees.split(',').map(e => e.trim());
            hierarchy[boss] = employees;
        }
    });

    return hierarchy;
};

// Authenticate user
const authenticateUser = async (username, password) => {
    const usersCsvFilePath = path.join(__dirname, '..', 'public', 'users.csv');
    const users = await readCsvFile(usersCsvFilePath);
    return users.find(u => u.username === username && u.password === password) || null;
};

// Function handler
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed'
        };
    }

    const { username, password } = JSON.parse(event.body);

    try {
        const user = await authenticateUser(username, password);
        if (user) {
            const hierarchy = await loadHierarchy();
            // Replace this with actual permissions logic
            const permissions = []; // Get user permissions

            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    username: user.username,
                    role: user.role,
                    hierarchy: permissions
                })
            };
        } else {
            return {
                statusCode: 401,
                body: 'Invalid credentials'
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: 'Internal Server Error'
        };
    }
};
