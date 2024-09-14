const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

// Helper functions
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

const getUserPermissions = async (username) => {
    const hierarchy = await loadHierarchy();
    // Dummy permissions logic
    return [];
};

const findHierarchyPath = (hierarchy, startUser, endUser) => {
    // Implement path finding logic if needed
    return [];
};

// Function handler
exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed'
        };
    }

    const { username } = event.queryStringParameters;

    try {
        const hierarchy = await loadHierarchy();
        const permissions = await getUserPermissions(username);

        if (permissions.length > 0) {
            const allowedUsers = new Set([...permissions, username]);
            const dataCsvFilePath = path.join(__dirname, '..', 'public', 'data.csv');
            const allData = await readCsvFile(dataCsvFilePath);
            const result = [];

            for (const record of allData) {
                if (allowedUsers.has(record.submitted_by)) {
                    const additionalUsers = findHierarchyPath(hierarchy, username, record.submitted_by);
                    result.push({ ...record, additional_users: additionalUsers });
                }
            }

            return {
                statusCode: 200,
                body: JSON.stringify(result)
            };
        } else {
            return {
                statusCode: 403,
                body: 'User not authorized to view data'
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: 'Internal Server Error'
        };
    }
};
