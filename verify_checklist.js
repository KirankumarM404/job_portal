
var fs = require('fs');
var path = require('path');

var appPath = path.join(__dirname, 'app.js');
var htmlPath = path.join(__dirname, 'index.html');
var cssPath = path.join(__dirname, 'index.css');

var appContent = fs.readFileSync(appPath, 'utf8');
var htmlContent = fs.readFileSync(htmlPath, 'utf8');
var cssContent = fs.readFileSync(cssPath, 'utf8');

var checks = [
    { file: 'app.js', check: 'checklistItems', found: appContent.indexOf('var checklistItems = [') !== -1 },
    { file: 'app.js', check: 'renderShipPage', found: appContent.indexOf('function renderShipPage() {') !== -1 },
    { file: 'app.js', check: 'TEST_KEY', found: appContent.indexOf('var TEST_KEY = "jobTrackerTestChecklist"') !== -1 },
    { file: 'index.html', check: '#route-test', found: htmlContent.indexOf('id="route-test"') !== -1 },
    { file: 'index.html', check: '#route-ship', found: htmlContent.indexOf('id="route-ship"') !== -1 },
    { file: 'index.css', check: '.test-panel', found: cssContent.indexOf('.test-panel {') !== -1 },
    { file: 'index.css', check: '.lock-icon', found: cssContent.indexOf('.lock-icon') !== -1 }
];

console.log('=== VERIFICATION RESULTS ===');
var passed = 0;
checks.forEach(function (c) {
    if (c.found) passed++;
    console.log((c.found ? 'PASS' : 'FAIL') + ': ' + c.file + ' contains ' + c.check);
});

if (passed === checks.length) {
    console.log('ALL CHECKS PASSED');
} else {
    console.log('SOME CHECKS FAILED');
    process.exit(1);
}
