# Animation Engine Module

## Overview

The Animation Engine is a lightweight JavaScript module that provides GPU-accelerated animations for the SweetBee landing page. It's designed to deliver smooth 60fps animations while respecting user accessibility preferences.

## Features

✅ **GPU-Accelerated**: Uses only `transform` and `opacity` properties for optimal performance  
✅ **60fps Target**: Implements `requestAnimationFrame` for smooth animations  
✅ **Accessibility**: Automatic support for `prefers-reduced-motion`  
✅ **Promise-Based**: All animations return Promises for easy chaining  
✅ **Configurable**: Customize durations, delays, and stagger timing  
✅ **Lightweight**: No external dependencies

## Requirements Coverage

This module implements the following requirements:

- **18.1**: Maintains 60fps average frame rate
- **18.2**: Average frame time ≤ 16.67ms
- **18.4**: Uses GPU-accelerated properties (transform & opacity)
- **18.5**: Avoids animating layout properties
- **20.1**: Disables parallax when reduced motion preferred
- **20.2**: Disables auto-advance when reduced motion preferred
- **20.3**: Reduces animation durations to 0.01ms
- **20.4**: Limits animation iterations to 1

## API Reference

### `fadeIn(element, duration)`

Fades in an element using opacity animation.

```javascript
const box = document.getElementById('myBox');
AnimationEngine.fadeIn(box, 500).then(() => {
    console.log('Animation complete!');
});
```

**Parameters:**
- `element` (HTMLElement): The element to animate
- `duration` (number, optional): Animation duration in milliseconds (default: 300ms)

**Returns:** Promise that resolves when animation completes

---

### `slideUp(element, duration, distance)`

Slides an element up using translateY transform.

```javascript
AnimationEngine.slideUp(element, 500, 30);
```

**Parameters:**
- `element` (HTMLElement): The element to animate
- `duration` (number, optional): Animation duration in milliseconds (default: 300ms)
- `distance` (number, optional): Distance to slide in pixels (default: 30px)

**Returns:** Promise that resolves when animation completes

---

### `scaleUp(element, duration, fromScale, toScale)`

Scales an element from one size to another.

```javascript
AnimationEngine.scaleUp(element, 500, 0.8, 1);
```

**Parameters:**
- `element` (HTMLElement): The element to animate
- `duration` (number, optional): Animation duration in milliseconds (default: 300ms)
- `fromScale` (number, optional): Initial scale value (default: 0.8)
- `toScale` (number, optional): Final scale value (default: 1)

**Returns:** Promise that resolves when animation completes

---

### `stagger(elements, animationFn, staggerDelay, duration)`

Animates multiple elements with a configurable delay between each.

```javascript
const cards = document.querySelectorAll('.feature-card');
AnimationEngine.stagger(
    cards,
    AnimationEngine.slideUp,  // Animation function to use
    100,                      // 100ms delay between each element
    300                       // 300ms duration per animation
).then(() => {
    console.log('All animations complete!');
});
```

**Parameters:**
- `elements` (NodeList|Array): Elements to animate
- `animationFn` (Function, optional): Animation function to apply (default: slideUp)
- `staggerDelay` (number, optional): Delay between each element in milliseconds (default: 100ms)
- `duration` (number, optional): Duration for each animation in milliseconds (default: 300ms)

**Returns:** Promise that resolves when all animations complete

---

### `getConfig()`

Returns the current animation configuration.

```javascript
const config = AnimationEngine.getConfig();
console.log(config.targetFPS); // 60
```

**Returns:** Object with configuration values:
- `defaultDuration`: Default animation duration
- `staggerDelay`: Default stagger delay
- `targetFPS`: Target frames per second (60)
- `frameTime`: Frame time in milliseconds (~16.67ms)
- `prefersReducedMotion`: Boolean indicating user preference

---

### `updateConfig(newConfig)`

Updates the animation configuration.

```javascript
AnimationEngine.updateConfig({
    defaultDuration: 500,
    staggerDelay: 150
});
```

**Parameters:**
- `newConfig` (Object): Configuration values to update

---

### `prefersReducedMotion`

Boolean property indicating whether the user has enabled reduced motion.

```javascript
if (AnimationEngine.prefersReducedMotion) {
    console.log('User prefers reduced motion');
}
```

## Usage Examples

### Example 1: Simple Fade In

```javascript
const heroSection = document.querySelector('.hero-section');
AnimationEngine.fadeIn(heroSection, 1200);
```

### Example 2: Staggered Feature Cards

```javascript
const featureCards = document.querySelectorAll('.feature-card');
AnimationEngine.stagger(featureCards, AnimationEngine.slideUp, 100, 300);
```

### Example 3: Chaining Animations

```javascript
const element = document.getElementById('myElement');

AnimationEngine.fadeIn(element, 500)
    .then(() => AnimationEngine.scaleUp(element, 300, 1, 1.1))
    .then(() => AnimationEngine.scaleUp(element, 300, 1.1, 1))
    .then(() => console.log('Animation sequence complete!'));
```

### Example 4: Custom Animation Function with Stagger

```javascript
// Create a custom animation function
function customFadeSlide(element, duration) {
    element.style.opacity = '0';
    element.style.transform = 'translateX(-20px)';
    element.style.transition = `all ${duration}ms ease-out`;
    
    requestAnimationFrame(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateX(0)';
    });
    
    return new Promise(resolve => setTimeout(resolve, duration));
}

// Use with stagger
const items = document.querySelectorAll('.list-item');
AnimationEngine.stagger(items, customFadeSlide, 80, 400);
```

## Integration with Landing Page

The Animation Engine is used throughout the landing page for:

1. **Hero Section**: Fade-in animation on page load
2. **Features Section**: Staggered slide-up animation for feature cards
3. **Product Showcase**: Fade-in and slide-up for product cards
4. **Testimonials**: Smooth transitions in carousel
5. **CTA Section**: Slide-in animations from left and right

## Performance Notes

### Why Transform and Opacity?

The Animation Engine exclusively uses `transform` and `opacity` properties because:

1. **GPU Acceleration**: These properties are composited on the GPU, not requiring the main thread
2. **No Layout Recalculation**: Doesn't trigger layout or paint operations
3. **Smooth Performance**: Achieves 60fps even on lower-end devices

### Properties to Avoid

Do NOT animate these properties (they cause layout thrashing):
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `border-width`

### Reduced Motion Support

When a user enables `prefers-reduced-motion` in their system settings:
- All animations complete in 0.01ms (essentially instant)
- Stagger delays are set to 0
- Elements still appear, just without motion

Test reduced motion in Chrome DevTools:
1. Open DevTools → ⋮ → More tools → Rendering
2. Find "Emulate CSS media feature prefers-reduced-motion"
3. Select "prefers-reduced-motion: reduce"

## Testing

### Verification Script

Run the verification script to ensure the module is correctly implemented:

```bash
node verify-animation-engine.js
```

Expected output:
```
✓ AnimationEngine module declaration exists
✓ GPU-accelerated animations comment exists
✓ fadeIn function exists and uses opacity property
✓ slideUp function exists and uses transform translateY
✓ scaleUp function exists and uses transform scale
✓ stagger function exists with configurable delay
✓ prefers-reduced-motion media query support exists
✓ requestAnimationFrame used for 60fps target
...
🎉 All verification checks passed!
```

### Browser Testing

Open `animation-usage-example.html` in a browser to see interactive demos of all animation functions.

### Integration Testing

Open `animation-test.html` for a comprehensive test suite with:
- Individual animation tests
- Stagger animation tests
- Configuration checks
- GPU acceleration verification

## Browser Support

The Animation Engine works in all modern browsers that support:
- `requestAnimationFrame` (all modern browsers)
- CSS `transform` and `opacity` (all modern browsers)
- `matchMedia` for reduced motion detection (all modern browsers)

## File Location

The Animation Engine is located in:
```
sweetbee-web/sweetbee.js
```

It's implemented as an IIFE (Immediately Invoked Function Expression) module pattern, exposing a global `AnimationEngine` object.

## Module Structure

```javascript
const AnimationEngine = (function() {
    // Private variables and functions
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const CONFIG = { /* ... */ };
    
    function canAnimate(element) { /* ... */ }
    function fadeIn(element, duration) { /* ... */ }
    function slideUp(element, duration, distance) { /* ... */ }
    function scaleUp(element, duration, fromScale, toScale) { /* ... */ }
    function stagger(elements, animationFn, staggerDelay, duration) { /* ... */ }
    
    // Public API
    return {
        fadeIn: fadeIn,
        slideUp: slideUp,
        scaleUp: scaleUp,
        stagger: stagger,
        getConfig: getConfig,
        updateConfig: updateConfig,
        prefersReducedMotion: prefersReducedMotion
    };
})();
```

## Contributing

When modifying the Animation Engine:

1. **Always use GPU-accelerated properties** (transform, opacity)
2. **Maintain 60fps target** with requestAnimationFrame
3. **Respect reduced motion** preferences
4. **Return Promises** from animation functions
5. **Document requirements** in comments
6. **Run verification** script before committing

## License

Part of the SweetBee Honey website project.
