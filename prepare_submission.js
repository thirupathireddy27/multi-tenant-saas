const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
console.log('🚀 Preparing project for submission...');

// 1. Revert docker-compose.yml to Mandated Ports (5432, 5000, 3000)
const dockerComposePath = path.join(rootDir, 'docker-compose.yml');
if (fs.existsSync(dockerComposePath)) {
    let content = fs.readFileSync(dockerComposePath, 'utf8');
    content = content.replace(/"5002:5000"/g, '"5000:5000"');
    content = content.replace(/"3002:3000"/g, '"3000:3000"');
    content = content.replace(/http:\/\/localhost:5002\/api/g, 'http://localhost:5000/api');
    content = content.replace(/http:\/\/localhost:3002/g, 'http://localhost:3000');
    content = content.replace(/"5435:5432"/g, '"5432:5432"'); // Just in case
    fs.writeFileSync(dockerComposePath, content);
    console.log('✅ docker-compose.yml reverted to ports 3000/5000/5432');
}

// 2. Update submission.json
const subJsonPath = path.join(rootDir, 'submission.json');
if (fs.existsSync(subJsonPath)) {
    let content = fs.readFileSync(subJsonPath, 'utf8');
    content = content.replace(/"frontend": "http:\/\/localhost:3002"/g, '"frontend": "http://localhost:3000"');
    content = content.replace(/"backend": "http:\/\/localhost:5002"/g, '"backend": "http://localhost:5000"');
    fs.writeFileSync(subJsonPath, content);
    console.log('✅ submission.json URLs updated to 3000/5000');
}

// 3. Update server.js CORS
const serverParamsPath = path.join(rootDir, 'backend/src/server.js');
if (fs.existsSync(serverParamsPath)) {
    let content = fs.readFileSync(serverParamsPath, 'utf8');
    // Ensure 3000 is allowed
    // We'll just replace 3002 with 3000 in the array
    content = content.replace(/'http:\/\/localhost:3002'/g, "'http://localhost:3000'");
    fs.writeFileSync(serverParamsPath, content);
    console.log('✅ backend/src/server.js CORS updated for port 3000');
}

// 4. Update frontend/src/services/api.js (if it has default URL)
const apiJsPath = path.join(rootDir, 'frontend/src/services/api.js');
if (fs.existsSync(apiJsPath)) {
    let content = fs.readFileSync(apiJsPath, 'utf8');
    content = content.replace(/http:\/\/localhost:5002\/api/g, 'http://localhost:5000/api');
    fs.writeFileSync(apiJsPath, content);
    console.log('✅ frontend/src/services/api.js default URL updated');
}

// 5. Update README.md
const readmePath = path.join(rootDir, 'README.md');
if (fs.existsSync(readmePath)) {
    let content = fs.readFileSync(readmePath, 'utf8');
    content = content.replace(/http:\/\/localhost:3002/g, 'http://localhost:3000');
    content = content.replace(/http:\/\/localhost:5002/g, 'http://localhost:5000');
    fs.writeFileSync(readmePath, content);
    console.log('✅ README.md updated');
}

// 6. Update API_DOCS.md
const apiDocsPath = path.join(rootDir, 'API_DOCS.md');
if (fs.existsSync(apiDocsPath)) {
    let content = fs.readFileSync(apiDocsPath, 'utf8');
    content = content.replace(/http:\/\/localhost:5002\/api/g, 'http://localhost:5000/api');
    fs.writeFileSync(apiDocsPath, content);
    console.log('✅ API_DOCS.md updated');
}

console.log('\n✨ Project is ready for submission! Use "git add ." and "git commit" now.');
