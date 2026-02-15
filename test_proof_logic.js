
// Mock Environment
var localStorage = {
    store: {},
    getItem: function (k) { return this.store[k] || null; },
    setItem: function (k, v) { this.store[k] = v; }
};

var document = {
    getElementById: function (id) {
        if (!this[id]) this[id] = { style: {}, classList: { add: function () { }, remove: function () { } } };
        return this[id];
    }
};

// Mock Data
var PROOF_KEY = "jobTrackerProof";
var checklistItems = new Array(10).fill({ id: 'test' });
var checklistState = {}; // All false initially

// Logic to Test (Copied from app.js)
function getProofState() {
    try {
        var json = localStorage.getItem(PROOF_KEY);
        return json ? JSON.parse(json) : { lovable: "", github: "", deploy: "" };
    } catch (e) {
        return { lovable: "", github: "", deploy: "" };
    }
}

function updateProofStatus() {
    var state = getProofState();
    // derived checks
    var allTestsPassed = checklistItems.every(function (item) {
        return !!checklistState[item.id];
    });

    var hasLovable = state.lovable && state.lovable.startsWith("http");
    var hasGithub = state.github && state.github.startsWith("http");
    var hasDeploy = state.deploy && state.deploy.startsWith("http");
    var allLinksPresent = hasLovable && hasGithub && hasDeploy;

    var isShipped = allTestsPassed && allLinksPresent;
    return { isShipped: isShipped, links: allLinksPresent, tests: allTestsPassed };
}

// TESTS
console.log("=== PROOF LOGIC VERIFICATION ===");

// 1. Initial State
console.log("Test 1: Initial State (No links, No tests)");
checklistState = {};
localStorage.store = {};
var res = updateProofStatus();
if (!res.isShipped) console.log("PASS: Not shipped");
else console.log("FAIL: Shipped incorrectly");

// 2. Links Only
console.log("Test 2: Links Only (No tests)");
localStorage.setItem(PROOF_KEY, JSON.stringify({
    lovable: "https://lovable.dev",
    github: "https://github.com",
    deploy: "https://vercel.com"
}));
res = updateProofStatus();
if (!res.isShipped && res.links && !res.tests) console.log("PASS: Links valid, but not shipped (detected missing tests)");
else console.log("FAIL: " + JSON.stringify(res));

// 3. Tests Only
console.log("Test 3: Tests Only (No links)");
localStorage.setItem(PROOF_KEY, JSON.stringify({}));
checklistItems.forEach(i => checklistState[i.id] = true);
res = updateProofStatus();
if (!res.isShipped && !res.links && res.tests) console.log("PASS: Tests passed, but not shipped (detected missing links)");
else console.log("FAIL: " + JSON.stringify(res));

// 4. Invalid Link
console.log("Test 4: Invalid Link (not-a-url)");
localStorage.setItem(PROOF_KEY, JSON.stringify({
    lovable: "not-a-url",
    github: "https://github.com",
    deploy: "https://vercel.com"
}));
res = updateProofStatus();
if (!res.links) console.log("PASS: Invalid link rejected");
else console.log("FAIL: Invalid link accepted");

// 5. Success
console.log("Test 5: All Conditions Met");
localStorage.setItem(PROOF_KEY, JSON.stringify({
    lovable: "https://lovable.dev",
    github: "https://github.com",
    deploy: "https://vercel.com"
}));
// Tests already true from Test 3
res = updateProofStatus();
if (res.isShipped) console.log("PASS: Shipped successfully");
else console.log("FAIL: Failed to ship");
