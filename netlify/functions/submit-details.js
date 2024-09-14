const path = require('path');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');

// Setup CSV writer
const dataCsvFilePath = path.join(__dirname, '..', 'public', 'data.csv');
const csvWriter = createObjectCsvWriter({
    path: dataCsvFilePath,
    header: [
        { id: 'name', title: 'Name' },
        { id: 'email', title: 'Email' },
        { id: 'username', title: 'Username' }
    ],
    append: true
});

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

// Get user permissions (simplified)
const getUserPermissions = async (username) => {
    const hierarchy = await loadHierarchy();
    // Dummy permissions logic
    return [];
};

// Function handler
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed'
        };
    }

    const { name, email, username } = JSON.parse(event.body);

    try {
        const permissions = await getUserPermissions(username);
        if (permissions.length > 0) {
            await csvWriter.writeRecords([{ name, email, username }]);
            return {
                statusCode: 200,
                body: 'Data saved'
            };
        } else {
            return {
                statusCode: 403,
                body: 'User not authorized to submit details'
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: 'Internal Server Error'
        };
    }
};
