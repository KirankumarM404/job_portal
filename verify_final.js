
var fs = require('fs');
var path = require('path');

var files = ['index.html', 'app.js', 'index.css', 'README.md'];
var checks = [
    { file: 'index.html', query: 'id="route-proof"', name: 'Proof Route' },
    { file: 'app.js', query: 'function renderProofPage', name: 'renderProofPage' },
    { file: 'app.js', query: 'function exportSubmission', name: 'exportSubmission' },
    { file: 'index.css', query: '.proof-header-row', name: 'Proof CSS' },
    { file: 'README.md', query: '# Job Notification Tracker', name: 'README Title' }
];

console.log('=== FINAL VERIFICATION ===');
var allPassed = true;

checks.forEach(function (c) {
    var content = fs.readFileSync(path.join(__dirname, c.file), 'utf8');
    if (content.indexOf(c.query) !== -1) {
        console.log('PASS: ' + c.name);
    } else {
        console.log('FAIL: ' + c.name);
        allPassed = false;
    }
});

if (allPassed) {
    console.log('\nALL CHECKS PASSED. SYSTEM READY.');
} else {
    console.log('\nSYSTEM INCOMPLETE.');
    process.exit(1);
}
