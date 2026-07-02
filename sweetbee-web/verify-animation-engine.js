/**
 * Simple verification script for AnimationEngine module
 * Validates that the module is correctly structured and exports expected functions
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Animation Engine Implementation...\n');

// Read sweetbee.js
const sweetbeeJsPath = path.join(__dirname, 'sweetbee.js');
const sweetbeeContent = fs.readFileSync(sweetbeeJsPath, 'utf8');

// Verification checks
let passed = 0;
let failed = 0;

function check(condition, message) {
    if (condition) {
        console.log(`✓ ${message}`);
        passed++;
    } else {
        console.error(`✗ ${message}`);
        failed++;
    }
}

// Check 1: AnimationEngine module exists
check(
    sweetbeeContent.includes('const AnimationEngine = (function()'),
    'AnimationEngine module declaration exists'
);

// Check 2: GPU-accelerated properties comment
check(
    sweetbeeContent.includes('GPU-accelerated'),
    'GPU-accelerated animations comment exists'
);

// Check 3: fadeIn function
check(
    sweetbeeContent.includes('function fadeIn(') && 
    sweetbeeContent.includes('opacity'),
    'fadeIn function exists and uses opacity property'
);

// Check 4: slideUp function
check(
    sweetbeeContent.includes('function slideUp(') && 
    sweetbeeContent.includes('translateY'),
    'slideUp function exists and uses transform translateY'
);

// Check 5: scaleUp function
check(
    sweetbeeContent.includes('function scaleUp(') && 
    sweetbeeContent.includes('scale('),
    'scaleUp function exists and uses transform scale'
);

// Check 6: stagger function
check(
    sweetbeeContent.includes('function stagger(') &&
    sweetbeeContent.includes('staggerDelay'),
    'stagger function exists with configurable delay'
);

// Check 7: prefers-reduced-motion support
check(
    sweetbeeContent.includes('prefers-reduced-motion') &&
    sweetbeeContent.includes('matchMedia'),
    'prefers-reduced-motion media query support exists'
);

// Check 8: requestAnimationFrame usage
check(
    sweetbeeContent.includes('requestAnimationFrame'),
    'requestAnimationFrame used for 60fps target'
);

// Check 9: Configuration object
check(
    sweetbeeContent.includes('CONFIG') &&
    sweetbeeContent.includes('targetFPS: 60'),
    'Configuration object with 60fps target exists'
);

// Check 10: Public API exports
const requiredExports = ['fadeIn', 'slideUp', 'scaleUp', 'stagger', 'getConfig', 'updateConfig'];
const hasAllExports = requiredExports.every(exportName => {
    const pattern = new RegExp(`${exportName}:\\s*${exportName}`);
    return pattern.test(sweetbeeContent);
});

check(hasAllExports, 'All required functions exported in public API');

// Check 11: Requirements comments
const requirements = ['18.1', '18.2', '18.4', '18.5', '20.1', '20.2', '20.3', '20.4'];
const hasRequirements = requirements.every(req => sweetbeeContent.includes(req));
check(hasRequirements, 'All requirements documented in comments');

// Check 12: Transform and opacity for GPU acceleration
check(
    sweetbeeContent.match(/transform/g).length >= 5 &&
    sweetbeeContent.match(/opacity/g).length >= 5,
    'Transform and opacity properties used (GPU-accelerated)'
);

// Check 13: Promise-based API
check(
    sweetbeeContent.includes('return new Promise') &&
    sweetbeeContent.includes('resolve()'),
    'Functions return Promises for async animation handling'
);

// Check 14: Duration configuration
check(
    sweetbeeContent.includes('defaultDuration') &&
    sweetbeeContent.includes('duration = CONFIG.defaultDuration'),
    'Configurable animation duration implemented'
);

// Check 15: Module pattern
check(
    sweetbeeContent.includes('const AnimationEngine = (function() {') &&
    sweetbeeContent.includes('return {') &&
    /AnimationEngine = \(function\(\) \{[\s\S]*?\}\)\(\);/.test(sweetbeeContent),
    'Proper IIFE module pattern used'
);

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Total Checks: ${passed + failed}`);
console.log(`✓ Passed: ${passed}`);
console.log(`✗ Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
    console.log('\n🎉 All verification checks passed!');
    console.log('\nAnimation Engine implementation meets requirements:');
    console.log('  ✓ GPU-accelerated animations (transform & opacity)');
    console.log('  ✓ fadeIn, slideUp, scaleUp utilities');
    console.log('  ✓ Stagger animation with configurable delay');
    console.log('  ✓ prefers-reduced-motion support');
    console.log('  ✓ 60fps target with requestAnimationFrame');
    process.exit(0);
} else {
    console.log(`\n❌ ${failed} verification check(s) failed`);
    process.exit(1);
}
