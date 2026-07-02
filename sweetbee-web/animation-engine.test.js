/**
 * Animation Engine Unit Tests
 * Tests core functionality without requiring a browser environment
 */

// Mock browser APIs for Node.js environment
global.window = {
    matchMedia: (query) => ({
        matches: false, // Default: no reduced motion preference
        media: query
    }),
    requestAnimationFrame: (callback) => {
        return setTimeout(callback, 16.67); // ~60fps
    }
};

// Load the AnimationEngine module
const fs = require('fs');
const path = require('path');
const sweetbeeJs = fs.readFileSync(path.join(__dirname, 'sweetbee.js'), 'utf8');

// Extract AnimationEngine module from sweetbee.js
const animationEngineCode = sweetbeeJs.match(/const AnimationEngine = \(function\(\) \{[\s\S]*?\}\)\(\);/)[0];

// Execute the code to create AnimationEngine
eval(animationEngineCode);

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✓ ${message}`);
        testsPassed++;
    } else {
        console.error(`✗ ${message}`);
        testsFailed++;
    }
}

function assertEqual(actual, expected, message) {
    if (actual === expected) {
        console.log(`✓ ${message}`);
        testsPassed++;
    } else {
        console.error(`✗ ${message}: Expected ${expected}, got ${actual}`);
        testsFailed++;
    }
}

console.log('\n=== Animation Engine Tests ===\n');

// Test 1: Module existence and structure
console.log('Test Suite 1: Module Structure');
assert(typeof AnimationEngine === 'object', 'AnimationEngine module exists');
assert(typeof AnimationEngine.fadeIn === 'function', 'fadeIn function exists');
assert(typeof AnimationEngine.slideUp === 'function', 'slideUp function exists');
assert(typeof AnimationEngine.scaleUp === 'function', 'scaleUp function exists');
assert(typeof AnimationEngine.stagger === 'function', 'stagger function exists');
assert(typeof AnimationEngine.getConfig === 'function', 'getConfig function exists');
assert(typeof AnimationEngine.updateConfig === 'function', 'updateConfig function exists');

// Test 2: Configuration
console.log('\nTest Suite 2: Configuration');
const config = AnimationEngine.getConfig();
assert(config !== null, 'getConfig returns configuration object');
assert(typeof config.defaultDuration === 'number', 'defaultDuration is a number');
assert(typeof config.staggerDelay === 'number', 'staggerDelay is a number');
assertEqual(config.targetFPS, 60, 'targetFPS is 60');
assert(config.frameTime > 0, 'frameTime is positive');
assertEqual(config.prefersReducedMotion, false, 'prefersReducedMotion is false by default');

// Test 3: Reduced motion detection
console.log('\nTest Suite 3: Reduced Motion Support');
assertEqual(AnimationEngine.prefersReducedMotion, false, 'prefersReducedMotion property exists and is false');

// Test with reduced motion enabled
global.window.matchMedia = (query) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query
});

// Re-evaluate the module with reduced motion
eval(animationEngineCode);
const reducedMotionConfig = AnimationEngine.getConfig();
assertEqual(reducedMotionConfig.defaultDuration, 0.01, 'Duration reduced to 0.01ms when reduced motion is preferred');
assertEqual(reducedMotionConfig.staggerDelay, 0, 'Stagger delay is 0 when reduced motion is preferred');

// Reset to normal motion
global.window.matchMedia = (query) => ({
    matches: false,
    media: query
});
eval(animationEngineCode);

// Test 4: Animation function signatures
console.log('\nTest Suite 4: Function Parameters');

// Mock element for testing
const mockElement = {
    nodeType: 1,
    style: {}
};

// Test fadeIn returns a Promise
const fadeInResult = AnimationEngine.fadeIn(mockElement, 100);
assert(fadeInResult instanceof Promise, 'fadeIn returns a Promise');

// Test slideUp returns a Promise
const slideUpResult = AnimationEngine.slideUp(mockElement, 100);
assert(slideUpResult instanceof Promise, 'slideUp returns a Promise');

// Test scaleUp returns a Promise
const scaleUpResult = AnimationEngine.scaleUp(mockElement, 100);
assert(scaleUpResult instanceof Promise, 'scaleUp returns a Promise');

// Test stagger returns a Promise
const mockElements = [mockElement, mockElement];
const staggerResult = AnimationEngine.stagger(mockElements, AnimationEngine.fadeIn, 50, 100);
assert(staggerResult instanceof Promise, 'stagger returns a Promise');

// Test 5: GPU-accelerated properties
console.log('\nTest Suite 5: GPU Acceleration');
const gpuElement = {
    nodeType: 1,
    style: {}
};

AnimationEngine.fadeIn(gpuElement, 100);
assert('opacity' in gpuElement.style, 'fadeIn sets opacity property');
assert('transition' in gpuElement.style, 'fadeIn sets transition property');

const slideElement = {
    nodeType: 1,
    style: {}
};

AnimationEngine.slideUp(slideElement, 100, 30);
assert('transform' in slideElement.style, 'slideUp sets transform property');
assert('opacity' in slideElement.style, 'slideUp sets opacity property');
assert('transition' in slideElement.style, 'slideUp sets transition property');

const scaleElement = {
    nodeType: 1,
    style: {}
};

AnimationEngine.scaleUp(scaleElement, 100, 0.8, 1);
assert('transform' in scaleElement.style, 'scaleUp sets transform property');
assert('opacity' in scaleElement.style, 'scaleUp sets opacity property');

// Test 6: Configuration updates
console.log('\nTest Suite 6: Configuration Updates');
const originalDuration = AnimationEngine.getConfig().defaultDuration;
AnimationEngine.updateConfig({ defaultDuration: 500 });
assertEqual(AnimationEngine.getConfig().defaultDuration, 500, 'Configuration can be updated');
AnimationEngine.updateConfig({ defaultDuration: originalDuration }); // Reset

// Test 7: requestAnimationFrame usage
console.log('\nTest Suite 7: 60fps Target');
assertEqual(AnimationEngine.getConfig().targetFPS, 60, '60fps target is set');
const expectedFrameTime = 1000 / 60;
assert(Math.abs(AnimationEngine.getConfig().frameTime - expectedFrameTime) < 0.01, 'Frame time calculated correctly (~16.67ms)');

// Summary
console.log('\n=== Test Results ===');
console.log(`✓ Passed: ${testsPassed}`);
console.log(`✗ Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
} else {
    console.log(`\n❌ ${testsFailed} test(s) failed`);
    process.exit(1);
}
