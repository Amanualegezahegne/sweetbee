// 🟨 Toggle mobile nav menu
function toggleMenu() {
    const nav = document.getElementById("navbar");
    nav.classList.toggle("show");
}

// 🎬 Intersection Observer Module for scroll-triggered animations
// This module handles scroll-triggered animations for various sections
// Requirements: 27.1, 27.2, 27.3, 27.4, 18.3, 22.6
const ScrollObserver = (function() {
    // Configuration
    const CONFIG = {
        threshold: 0.2, // Trigger when 20% of section is visible
        rootMargin: '0px',
        latencyTarget: 100 // Target latency in milliseconds
    };

    // Track which sections have already been animated
    const animatedSections = new Set();

    // Check if Intersection Observer is supported
    const isSupported = 'IntersectionObserver' in window;

    /**
     * Callback for when a section enters the viewport
     * @param {IntersectionObserverEntry[]} entries - Array of observed elements
     * @param {IntersectionObserver} observer - The observer instance
     */
    function handleIntersection(entries, observer) {
        entries.forEach(entry => {
            // Check if element is intersecting and hasn't been animated yet
            if (entry.isIntersecting && !animatedSections.has(entry.target)) {
                const sectionId = entry.target.id || entry.target.className;
                
                // Mark section as animated to ensure it only triggers once
                animatedSections.add(entry.target);
                
                // Trigger animation with minimal latency
                requestAnimationFrame(() => {
                    triggerSectionAnimation(entry.target);
                });
                
                // Stop observing this element after animation is triggered
                observer.unobserve(entry.target);
            }
        });
    }

    /**
     * Handle video player visibility for auto-pause functionality
     * @param {IntersectionObserverEntry[]} entries - Array of observed elements
     */
    function handleVideoIntersection(entries) {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            if (!video) return;

            // Auto-pause when visibility drops below 10%
            if (entry.intersectionRatio < 0.1 && !video.paused) {
                video.pause();
            }
        });
    }

    /**
     * Trigger animation for a specific section
     * @param {HTMLElement} section - The section element to animate
     */
    function triggerSectionAnimation(section) {
        // Add animated class to trigger CSS animations
        section.classList.add('animate-in');
        
        // Dispatch custom event for additional JavaScript animations
        const event = new CustomEvent('sectionAnimated', {
            detail: { section: section }
        });
        section.dispatchEvent(event);
    }

    /**
     * Initialize the Scroll Observer
     */
    function init() {
        // Fallback for browsers without Intersection Observer support
        if (!isSupported) {
            console.warn('Intersection Observer not supported. Displaying all animations immediately.');
            // Show all sections immediately
            const sections = document.querySelectorAll(
                '.video-story-section, .features-section, .products-enhanced, .testimonials-section, .cta-section'
            );
            sections.forEach(section => {
                section.classList.add('animate-in');
            });
            return;
        }

        // Create observer for section animations
        const sectionObserver = new IntersectionObserver(handleIntersection, {
            threshold: CONFIG.threshold,
            rootMargin: CONFIG.rootMargin
        });

        // Create observer for video auto-pause (different threshold)
        const videoObserver = new IntersectionObserver(handleVideoIntersection, {
            threshold: [0.1, 0.2], // Watch for both 10% and 20% visibility
            rootMargin: CONFIG.rootMargin
        });

        // Observe Video_Section
        const videoSection = document.querySelector('.video-story-section');
        if (videoSection) {
            sectionObserver.observe(videoSection);
            videoObserver.observe(videoSection); // Also observe for auto-pause
        }

        // Observe Features_Section
        const featuresSection = document.querySelector('.features-section');
        if (featuresSection) {
            sectionObserver.observe(featuresSection);
        }

        // Observe Product_Showcase
        const productShowcase = document.querySelector('.products-enhanced');
        if (productShowcase) {
            sectionObserver.observe(productShowcase);
        }

        // Observe Testimonials_Section
        const testimonialsSection = document.querySelector('.testimonials-section');
        if (testimonialsSection) {
            sectionObserver.observe(testimonialsSection);
        }

        // Observe CTA_Section
        const ctaSection = document.querySelector('.cta-section');
        if (ctaSection) {
            sectionObserver.observe(ctaSection);
        }
    }

    /**
     * Reset a section to allow re-animation (useful for testing)
     * @param {HTMLElement} section - The section to reset
     */
    function resetSection(section) {
        animatedSections.delete(section);
        section.classList.remove('animate-in');
    }

    /**
     * Get the status of animated sections (useful for debugging)
     * @returns {Set} Set of animated sections
     */
    function getAnimatedSections() {
        return new Set(animatedSections);
    }

    // Public API
    return {
        init: init,
        resetSection: resetSection,
        getAnimatedSections: getAnimatedSections,
        isSupported: isSupported
    };
})();

// 🎨 Animation Engine Module for GPU-accelerated page animations
// This module manages all page animations with performance optimization
// Requirements: 18.1, 18.2, 18.4, 18.5, 20.1, 20.2, 20.3, 20.4
const AnimationEngine = (function() {
    // Check for prefers-reduced-motion setting
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Animation configuration
    const CONFIG = {
        defaultDuration: prefersReducedMotion ? 0.01 : 300, // milliseconds
        staggerDelay: prefersReducedMotion ? 0 : 100, // milliseconds
        targetFPS: 60,
        frameTime: 1000 / 60 // ~16.67ms per frame
    };

    /**
     * Check if an element is ready for animation
     * @param {HTMLElement} element - The element to check
     * @returns {boolean} Whether the element can be animated
     */
    function canAnimate(element) {
        return element && element.nodeType === 1 && !prefersReducedMotion;
    }

    /**
     * Fade in animation using opacity (GPU-accelerated)
     * @param {HTMLElement} element - The element to animate
     * @param {number} duration - Animation duration in milliseconds
     * @returns {Promise} Resolves when animation completes
     */
    function fadeIn(element, duration = CONFIG.defaultDuration) {
        return new Promise((resolve) => {
            if (!canAnimate(element)) {
                element.style.opacity = '1';
                resolve();
                return;
            }

            // Set initial state
            element.style.opacity = '0';
            element.style.transition = `opacity ${duration}ms ease-out`;

            // Trigger animation using requestAnimationFrame for 60fps target
            requestAnimationFrame(() => {
                element.style.opacity = '1';
            });

            // Resolve promise when animation completes
            setTimeout(() => {
                resolve();
            }, duration);
        });
    }

    /**
     * Slide up animation using transform (GPU-accelerated)
     * @param {HTMLElement} element - The element to animate
     * @param {number} duration - Animation duration in milliseconds
     * @param {number} distance - Distance to slide in pixels
     * @returns {Promise} Resolves when animation completes
     */
    function slideUp(element, duration = CONFIG.defaultDuration, distance = 30) {
        return new Promise((resolve) => {
            if (!canAnimate(element)) {
                element.style.transform = 'translateY(0)';
                element.style.opacity = '1';
                resolve();
                return;
            }

            // Set initial state
            element.style.opacity = '0';
            element.style.transform = `translateY(${distance}px)`;
            element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;

            // Trigger animation using requestAnimationFrame for 60fps target
            requestAnimationFrame(() => {
                element.style.transform = 'translateY(0)';
                element.style.opacity = '1';
            });

            // Resolve promise when animation completes
            setTimeout(() => {
                resolve();
            }, duration);
        });
    }

    /**
     * Scale up animation using transform (GPU-accelerated)
     * @param {HTMLElement} element - The element to animate
     * @param {number} duration - Animation duration in milliseconds
     * @param {number} fromScale - Initial scale value
     * @param {number} toScale - Final scale value
     * @returns {Promise} Resolves when animation completes
     */
    function scaleUp(element, duration = CONFIG.defaultDuration, fromScale = 0.8, toScale = 1) {
        return new Promise((resolve) => {
            if (!canAnimate(element)) {
                element.style.transform = `scale(${toScale})`;
                element.style.opacity = '1';
                resolve();
                return;
            }

            // Set initial state
            element.style.opacity = '0';
            element.style.transform = `scale(${fromScale})`;
            element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;

            // Trigger animation using requestAnimationFrame for 60fps target
            requestAnimationFrame(() => {
                element.style.transform = `scale(${toScale})`;
                element.style.opacity = '1';
            });

            // Resolve promise when animation completes
            setTimeout(() => {
                resolve();
            }, duration);
        });
    }

    /**
     * Stagger animation function - animates multiple elements with configurable delay
     * @param {NodeList|Array} elements - Elements to animate
     * @param {Function} animationFn - Animation function to apply (fadeIn, slideUp, scaleUp)
     * @param {number} staggerDelay - Delay between each element animation in milliseconds
     * @param {number} duration - Duration for each animation in milliseconds
     * @returns {Promise} Resolves when all animations complete
     */
    function stagger(elements, animationFn = slideUp, staggerDelay = CONFIG.staggerDelay, duration = CONFIG.defaultDuration) {
        // Convert NodeList to Array if needed
        const elementsArray = Array.from(elements);

        // If reduced motion is preferred, animate all at once
        if (prefersReducedMotion) {
            const promises = elementsArray.map(el => animationFn(el, duration));
            return Promise.all(promises);
        }

        // Animate elements with stagger delay using requestAnimationFrame
        const promises = elementsArray.map((element, index) => {
            return new Promise((resolve) => {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        animationFn(element, duration).then(resolve);
                    }, index * staggerDelay);
                });
            });
        });

        return Promise.all(promises);
    }

    /**
     * Get animation configuration (useful for debugging)
     * @returns {Object} Current animation configuration
     */
    function getConfig() {
        return {
            ...CONFIG,
            prefersReducedMotion: prefersReducedMotion
        };
    }

    /**
     * Update animation configuration
     * @param {Object} newConfig - New configuration values
     */
    function updateConfig(newConfig) {
        Object.assign(CONFIG, newConfig);
    }

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

// 🟨 Contact Form Validation
function validateForm() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const message = document.getElementById("message").value.trim();

    // Name check
    if (name === "") {
        alert("Please enter your name.");
        return false;
    }

    // Email check
    const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
    if (!email.match(emailPattern)) {
        alert("Please enter a valid email address.");
        return false;
    }

    // Phone check (+251 9 digits)
    const phonePattern = /^\+251\s?\d{9}$/;
    if (!phone.match(phonePattern)) {
        alert("Please enter a valid Ethiopian phone number like +251 911223344.");
        return false;
    }

    // Message length check
    if (message.length < 10) {
        alert("Your message is too short. Please write at least 10 characters.");
        return false;
    }

    return true;
}

// 🟩 Handle contact form submission and load products if applicable
// NOTE: Full initialization is handled by the DOMContentLoaded handler appended below.

// ============================================================
// PRODUCTS PAGE — loadProducts, filter, sort
// ============================================================

/** All products fetched from API (source of truth for filtering/sorting) */
let _allProducts = [];

/**
 * Truncate text to maxLen characters, appending ellipsis if needed.
 * @param {string} text
 * @param {number} maxLen
 * @returns {string}
 */
function _truncate(text, maxLen) {
    if (typeof text !== 'string') return '';
    return text.length > maxLen ? text.slice(0, maxLen - 1) + '\u2026' : text;
}

/**
 * Format a number as ETB currency string "ETB X,XXX".
 * @param {number|string} price
 * @returns {string}
 */
function _formatPrice(price) {
    const num = parseFloat(price);
    if (isNaN(num)) return 'Price N/A';
    return 'ETB ' + num.toLocaleString('en-US');
}

/**
 * Render skeleton placeholder cards while fetching.
 * @param {HTMLElement} container
 * @param {number} count
 */
function _renderSkeletons(container, count) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        container.insertAdjacentHTML('beforeend', `
            <div class="prod-card prod-card--skeleton" role="listitem" aria-hidden="true">
                <div class="prod-card__img-wrap skeleton"></div>
                <div class="prod-card__body">
                    <div class="skeleton prod-skel-title"></div>
                    <div class="skeleton prod-skel-desc"></div>
                    <div class="skeleton prod-skel-desc prod-skel-desc--short"></div>
                    <div class="prod-card__footer">
                        <div class="skeleton prod-skel-price"></div>
                        <div class="skeleton prod-skel-btn"></div>
                    </div>
                </div>
            </div>
        `);
    }
}

/**
 * Build a single product card HTML string.
 * @param {Object} p  product object
 * @param {number} index  position (used for stagger delay)
 * @returns {string} HTML string
 */
function _buildProductCard(p, index) {
    const name    = escapeHTML(_truncate(p.name || 'Unnamed Product', 50));
    const desc    = escapeHTML(_truncate(p.description || '', 120));
    const price   = _formatPrice(p.price);
    const imgSrc  = escapeHTML(p.imageUrl || '');
    const imgAlt  = escapeHTML(p.name || 'Product image');
    const delay   = (index * 0.1).toFixed(1);

    return `
        <div class="prod-card" role="listitem" style="animation-delay:${delay}s">
            <div class="prod-card__img-wrap">
                <img
                    src="${imgSrc}"
                    alt="${imgAlt}"
                    class="prod-card__img"
                    loading="lazy"
                    onerror="this.onerror=null;this.parentElement.classList.add('prod-card__img-wrap--error');this.style.display='none';"
                />
            </div>
            <div class="prod-card__body">
                <h3 class="prod-card__name" title="${name}">${name}</h3>
                <p class="prod-card__desc">${desc || '<em>No description available.</em>'}</p>
                <div class="prod-card__footer">
                    <span class="prod-card__price">${price}</span>
                    <a href="contact.html" class="btn prod-card__btn">
                        <i class="fas fa-shopping-basket" aria-hidden="true"></i> Order Now
                    </a>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render the results-count label.
 * @param {number} shown
 * @param {number} total
 */
function _updateResultsCount(shown, total) {
    const el = document.getElementById('resultsCount');
    if (!el) return;
    if (shown === total) {
        el.textContent = total === 0 ? '' : `Showing all ${total} product${total !== 1 ? 's' : ''}`;
    } else {
        el.textContent = `Showing ${shown} of ${total} product${total !== 1 ? 's' : ''}`;
    }
}

/**
 * Render a filtered + sorted subset of _allProducts into the grid.
 * @param {Object[]} products
 */
function _renderProducts(products) {
    const container = document.getElementById('productList');
    if (!container) return;

    if (!products.length) {
        container.innerHTML = `
            <div class="prod-empty" role="status">
                <i class="fas fa-box-open prod-empty__icon" aria-hidden="true"></i>
                <p class="prod-empty__title">No products found</p>
                <p class="prod-empty__sub">Try adjusting your search or filter.</p>
            </div>
        `;
        _updateResultsCount(0, _allProducts.length);
        return;
    }

    container.innerHTML = products.map((p, i) => _buildProductCard(p, i)).join('');
    _updateResultsCount(products.length, _allProducts.length);
}

/**
 * Apply current search query and sort selection to _allProducts and re-render.
 */
function _applyFilters() {
    const query = (document.getElementById('productSearch') || {}).value || '';
    const sort  = (document.getElementById('productSort') || {}).value || 'default';
    const q     = query.trim().toLowerCase();

    let filtered = _allProducts.filter(function(p) {
        if (!q) return true;
        return (
            (p.name        || '').toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q)
        );
    });

    if (sort === 'price-asc') {
        filtered = filtered.slice().sort(function(a, b) { return parseFloat(a.price) - parseFloat(b.price); });
    } else if (sort === 'price-desc') {
        filtered = filtered.slice().sort(function(a, b) { return parseFloat(b.price) - parseFloat(a.price); });
    }
    // 'newest' and 'default' keep insertion order (server order = newest first by convention)

    _renderProducts(filtered);
}

/**
 * Wire up search input and sort dropdown for live filtering.
 */
function _initFilterBar() {
    const searchEl = document.getElementById('productSearch');
    const sortEl   = document.getElementById('productSort');
    const pills    = document.querySelectorAll('.filter-pill');

    if (searchEl) {
        searchEl.addEventListener('input', _applyFilters);
    }
    if (sortEl) {
        sortEl.addEventListener('change', _applyFilters);
    }
    pills.forEach(function(pill) {
        pill.addEventListener('click', function() {
            pills.forEach(function(p) { p.classList.remove('active'); p.setAttribute('aria-pressed', 'false'); });
            pill.classList.add('active');
            pill.setAttribute('aria-pressed', 'true');
            _applyFilters();
        });
    });
}

/**
 * Make the filter bar sticky once the hero scrolls out of view.
 */
function _initStickyBar() {
    const bar = document.getElementById('filterBar');
    if (!bar) return;
    // The CSS handles position:sticky; this just adds a shadow class on scroll.
    window.addEventListener('scroll', function() {
        bar.classList.toggle('products-filter-bar--stuck', window.scrollY > 40);
    }, { passive: true });
}

// 🐝 Load products on the Products page
async function loadProducts() {
    const container = document.getElementById("productList");
    if (!container) return;

    _renderSkeletons(container, 6);

    try {
        const res = await fetch("http://localhost:3001/admin/products");
        if (!res.ok) throw new Error('HTTP ' + res.status);

        const products = await res.json();
        _allProducts = Array.isArray(products) ? products : [];

        if (!_allProducts.length) {
            container.innerHTML = `
                <div class="prod-empty" role="status">
                    <i class="fas fa-box-open prod-empty__icon" aria-hidden="true"></i>
                    <p class="prod-empty__title">No products available yet</p>
                    <p class="prod-empty__sub">Check back soon — new products are on the way!</p>
                </div>
            `;
            _updateResultsCount(0, 0);
            return;
        }

        _applyFilters();
        _initFilterBar();
        _initStickyBar();

    } catch (err) {
        console.error("Failed to load products:", err);
        container.innerHTML = `
            <div class="prod-error" role="alert">
                <i class="fas fa-exclamation-triangle prod-error__icon" aria-hidden="true"></i>
                <p class="prod-error__title">Couldn't load products</p>
                <p class="prod-error__sub">Please check your connection and try again.</p>
                <button class="btn prod-error__retry" onclick="loadProducts()">
                    <i class="fas fa-redo" aria-hidden="true"></i> Retry
                </button>
            </div>
        `;
    }
}


// ============================================================
// BROWSER COMPATIBILITY (Task 20.1)
// ============================================================
// requestAnimationFrame fallback
window.requestAnimationFrame = window.requestAnimationFrame || function(cb) { setTimeout(cb, 16); };

// ============================================================
// SECURITY: HTML Escape Utility (Task 18.1, Req 25.5)
// Prevents XSS when rendering dynamic text
// ============================================================
function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// ============================================================
// HERO SECTION ANIMATIONS (Task 4.3)
// Requirements: 2.1, 2.2, 2.4, 20.1
// ============================================================
const HeroAnimations = (function() {
    const prefersReduced = AnimationEngine.prefersReducedMotion;

    /**
     * Initialize hero fade-in with 1.2s duration (Req 2.1)
     */
    function initFadeIn() {
        const heroContent = document.querySelector('.hero-content');
        if (!heroContent) return;

        if (prefersReduced) {
            // Immediately show without animation
            heroContent.style.opacity = '1';
            heroContent.classList.add('hero-animated');
            return;
        }

        // Trigger fade-in after a brief delay to ensure DOM paint
        requestAnimationFrame(() => {
            heroContent.classList.add('hero-animated');
        });
    }

    /**
     * Parallax scroll effect on hero background (Req 2.4)
     * Moves background at 40% of scroll speed for parallax
     */
    function initParallax() {
        if (prefersReduced) return; // Req 20.1 - disabled for reduced motion

        const hero = document.querySelector('.hero-enhanced');
        if (!hero) return;

        let ticking = false;

        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(function() {
                    const scrollY = window.pageYOffset;
                    const heroHeight = hero.offsetHeight;
                    // Only apply parallax while hero is in view
                    if (scrollY <= heroHeight) {
                        hero.style.backgroundPositionY = (scrollY * 0.4) + 'px';
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /**
     * Bounce animation for scroll indicator (Req 2.2)
     * CSS already handles the animation; JS ensures it's active
     */
    function initScrollIndicator() {
        const indicator = document.querySelector('.hero-scroll-indicator');
        if (!indicator) return;

        // Smooth scroll to next section on click
        indicator.addEventListener('click', function() {
            const videoSection = document.querySelector('.video-story-section');
            if (videoSection) {
                videoSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    /**
     * Hero background image error fallback (Req 24.3)
     */
    function initBgFallback() {
        const hero = document.querySelector('.hero-enhanced');
        if (!hero) return;

        const testImg = new Image();
        testImg.onerror = function() {
            hero.classList.add('hero-bg-fallback');
            hero.style.backgroundImage = 'none';
        };
        testImg.src = "images/bee 2.jpg";
    }

    function init() {
        initFadeIn();
        initParallax();
        initScrollIndicator();
        initBgFallback();
    }

    return { init: init };
})();

// ============================================================
// VIDEO PLAYER MODULE (Tasks 5.1–5.4)
// Requirements: 3, 4, 5, 23, 29
// ============================================================
const VideoPlayer = (function() {
    let videoEl = null;
    let playBtn = null;
    let errorOverlay = null;
    let retryBtn = null;
    let videoLoaded = false;
    let userPaused = false; // Track if user deliberately paused (Req 5.4)

    /**
     * Show/hide the custom play button overlay (Req 4.1, 4.2, 4.5)
     */
    function updatePlayBtnVisibility() {
        if (!playBtn || !videoEl) return;
        if (videoEl.paused) {
            playBtn.classList.remove('hidden');
        } else {
            playBtn.classList.add('hidden');
        }
    }

    /**
     * Show error overlay (Req 23.1)
     */
    function showError(msg) {
        if (!errorOverlay) return;
        const msgEl = errorOverlay.querySelector('.video-error-msg');
        if (msgEl) msgEl.textContent = msg || 'Unable to load video';
        errorOverlay.style.display = 'flex';
        if (playBtn) playBtn.classList.add('hidden');
    }

    /**
     * Hide error overlay
     */
    function hideError() {
        if (errorOverlay) errorOverlay.style.display = 'none';
    }

    /**
     * Attempt to load WebM fallback when MP4 fails (Req 23.4)
     */
    function tryWebmFallback() {
        if (!videoEl) return;
        const webmSource = videoEl.querySelector('source[type="video/webm"]');
        const mp4Source = videoEl.querySelector('source[type="video/mp4"]');
        if (webmSource && mp4Source) {
            // Move webm to be the primary source
            mp4Source.remove();
            videoEl.load();
        } else {
            showError('Video format not supported');
        }
    }

    /**
     * Lazy load video via IntersectionObserver at 20% threshold (Req 5.1, 5.2)
     */
    function initLazyLoad() {
        if (!videoEl) return;

        if (!('IntersectionObserver' in window)) {
            // Fallback: load immediately
            loadVideo();
            return;
        }

        const lazyObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.2 && !videoLoaded) {
                    loadVideo();
                    lazyObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        const wrapper = videoEl.closest('.video-wrapper') || videoEl;
        lazyObserver.observe(wrapper);
    }

    /**
     * Actually start loading the video (set src attributes) (Req 5.2)
     */
    function loadVideo() {
        if (videoLoaded || !videoEl) return;
        videoLoaded = true;
        // preload="metadata" already set in HTML; triggering load here
        videoEl.load();
    }

    /**
     * Handle play button click (Req 4.2)
     */
    function onPlayBtnClick() {
        if (!videoEl) return;
        userPaused = false;
        videoEl.play().catch(function() {
            showError('Unable to load video');
        });
    }

    /**
     * Toggle play/pause on video click (Req 4.4)
     */
    function onVideoClick() {
        if (!videoEl) return;
        if (videoEl.paused) {
            userPaused = false;
            videoEl.play().catch(function() {
                showError('Unable to load video');
            });
        } else {
            userPaused = true;
            videoEl.pause();
        }
    }

    /**
     * Auto-pause when < 10% visible (Req 5.3)
     * Prevent auto-resume when re-enters viewport (Req 5.4)
     */
    function initAutoPause() {
        if (!videoEl || !('IntersectionObserver' in window)) return;

        const autoPauseObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.intersectionRatio < 0.1 && !videoEl.paused) {
                    videoEl.pause();
                    // Mark as auto-paused (not user-initiated)
                    userPaused = false;
                    videoEl.dataset.autoPaused = 'true';
                }
                // Do NOT auto-resume (Req 5.4)
            });
        }, { threshold: [0, 0.1] });

        const wrapper = videoEl.closest('.video-story-section') || videoEl;
        autoPauseObserver.observe(wrapper);
    }

    /**
     * Initialize error handling (Req 23)
     */
    function initErrorHandling() {
        if (!videoEl) return;

        let mp4Failed = false;

        videoEl.addEventListener('error', function(e) {
            if (!mp4Failed) {
                mp4Failed = true;
                tryWebmFallback();
            } else {
                showError('Video format not supported');
            }
        });

        // Listen for source errors
        const sources = videoEl.querySelectorAll('source');
        sources.forEach(function(source) {
            source.addEventListener('error', function() {
                if (!mp4Failed && source.type === 'video/mp4') {
                    mp4Failed = true;
                    tryWebmFallback();
                } else if (mp4Failed) {
                    showError('Video format not supported');
                }
            });
        });
    }

    /**
     * Initialize retry button (Req 23.2, 23.3)
     */
    function initRetry() {
        if (!retryBtn || !videoEl) return;
        retryBtn.addEventListener('click', function() {
            hideError();
            videoEl.load();
            videoEl.play().catch(function() {
                showError('Unable to load video');
            });
        });
    }

    /**
     * Initialize the video player module
     */
    function init() {
        videoEl = document.getElementById('honey-video');
        if (!videoEl) return;

        playBtn = document.querySelector('.video-play-btn');
        errorOverlay = document.querySelector('.video-error-overlay');
        retryBtn = document.querySelector('.video-retry-btn');

        // Wire up events
        if (playBtn) playBtn.addEventListener('click', onPlayBtnClick);
        videoEl.addEventListener('click', onVideoClick);
        videoEl.addEventListener('play', updatePlayBtnVisibility);
        videoEl.addEventListener('pause', updatePlayBtnVisibility);
        videoEl.addEventListener('ended', updatePlayBtnVisibility);

        initLazyLoad();
        initAutoPause();
        initErrorHandling();
        initRetry();
    }

    return { init: init };
})();

// ============================================================
// FEATURES SECTION ANIMATIONS (Tasks 7.1–7.3)
// Requirements: 6.7, 6.8, 7.1
// ============================================================
const FeaturesAnimations = (function() {
    function onAnimate(section) {
        const cards = section.querySelectorAll('.feature-card');
        if (!cards.length) return;

        // Use AnimationEngine.stagger with 0.1s (100ms) delay (Req 6.8)
        AnimationEngine.stagger(cards, AnimationEngine.slideUp, 100, 600);
    }

    function init() {
        const featuresSection = document.querySelector('.features-section');
        if (!featuresSection) return;

        featuresSection.addEventListener('sectionAnimated', function(e) {
            onAnimate(e.target);
        });
    }

    return { init: init };
})();

// ============================================================
// PRODUCT SHOWCASE MODULE (Tasks 8.1–8.4)
// Requirements: 8, 9, 26.1, 26.2, 26.5, 24.1
// ============================================================
const ProductShowcase = (function() {
    const MAX_NAME_LEN = 50;
    const MAX_DESC_LEN = 150;

    /**
     * Truncate text with ellipsis (Req 26.1, 26.2)
     */
    function truncate(text, maxLen) {
        if (typeof text !== 'string') return '';
        return text.length > maxLen ? text.slice(0, maxLen - 1) + '\u2026' : text;
    }

    /**
     * Validate and truncate product card content (Req 26.1, 26.2, 26.5)
     */
    function validateCard(card) {
        const nameEl = card.querySelector('.product-name');
        const descEl = card.querySelector('.product-description');
        const priceEl = card.querySelector('.product-price');

        if (nameEl) {
            const raw = nameEl.textContent || '';
            nameEl.textContent = truncate(raw, MAX_NAME_LEN);
        }

        if (descEl) {
            const raw = descEl.textContent || '';
            descEl.textContent = truncate(raw, MAX_DESC_LEN);
        }

        if (priceEl) {
            const raw = priceEl.textContent || '';
            if (!raw.trim() || raw.trim() === '' || raw.trim() === '0') {
                priceEl.textContent = 'Price not available';
            }
        }
    }

    /**
     * Image error handling with retry + exponential backoff (Req 24.1, 24.4)
     */
    function initImageErrorHandling() {
        const images = document.querySelectorAll('.product-image');
        images.forEach(function(img) {
            let retries = 0;
            const originalSrc = img.src;

            img.addEventListener('error', function() {
                if (retries < 3) {
                    retries++;
                    const delay = Math.pow(2, retries) * 500; // 1s, 2s, 4s
                    setTimeout(function() {
                        img.src = originalSrc + '?retry=' + retries;
                    }, delay);
                } else {
                    // Show branded placeholder after 3 failed retries
                    img.style.display = 'none';
                    const wrapper = img.closest('.product-image-wrapper');
                    if (wrapper) {
                        wrapper.style.background = 'var(--bg-card)';
                        wrapper.style.display = 'flex';
                        wrapper.style.alignItems = 'center';
                        wrapper.style.justifyContent = 'center';
                        const placeholder = document.createElement('span');
                        placeholder.textContent = '🍯';
                        placeholder.style.fontSize = '3rem';
                        wrapper.appendChild(placeholder);
                    }
                }
            });
        });
    }

    function init() {
        // Validate all existing cards
        const cards = document.querySelectorAll('.product-card-enhanced');
        cards.forEach(validateCard);

        // Image error handling
        initImageErrorHandling();

        // Listen for animate-in event
        const section = document.querySelector('.products-enhanced');
        if (section) {
            section.addEventListener('sectionAnimated', function(e) {
                const productCards = e.target.querySelectorAll('.product-card-enhanced');
                AnimationEngine.stagger(productCards, AnimationEngine.slideUp, 120, 600);
            });
        }
    }

    return { init: init };
})();

// ============================================================
// TESTIMONIALS CAROUSEL MODULE (Tasks 10.1–10.5)
// Requirements: 10, 11, 12, 16.2, 16.3, 26.3, 26.4, 26.6, 30
// ============================================================
const Carousel = (function() {
    const MAX_TEXT_LEN = 250;
    let currentIndex = 0;   // Req 30.1
    let totalCards = 0;
    let autoTimer = null;
    let trackEl = null;
    let cards = [];
    let indicators = [];
    let prefersReduced = AnimationEngine.prefersReducedMotion;

    // Touch state
    let touchStartX = 0;
    let touchEndX = 0;

    /**
     * Truncate testimonial text (Req 26.3)
     */
    function truncate(text, maxLen) {
        if (typeof text !== 'string') return '';
        return text.length > maxLen ? text.slice(0, maxLen - 1) + '\u2026' : text;
    }

    /**
     * Validate testimonial cards content (Req 26.3, 26.4, 26.6)
     */
    function validateCards() {
        cards.forEach(function(card) {
            // Truncate text
            const textEl = card.querySelector('.testimonial-text');
            if (textEl) {
                textEl.textContent = truncate(textEl.textContent || '', MAX_TEXT_LEN);
            }

            // Validate rating (Req 26.4)
            const ratingEl = card.querySelector('.testimonial-rating');
            if (ratingEl) {
                const stars = ratingEl.querySelectorAll('i');
                const count = stars.length;
                if (count < 1 || count > 5) {
                    // Default to 5 stars
                    ratingEl.innerHTML = '';
                    for (let i = 0; i < 5; i++) {
                        const star = document.createElement('i');
                        star.className = 'fas fa-star';
                        star.setAttribute('aria-hidden', 'true');
                        ratingEl.appendChild(star);
                    }
                }
            }

            // Avatar fallback handled via onerror in HTML (Req 26.6)
        });
    }

    /**
     * Update carousel position (Req 30.4)
     */
    function goTo(index) {
        currentIndex = ((index % totalCards) + totalCards) % totalCards; // safe modulo
        trackEl.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
        updateIndicators();
    }

    /**
     * Go to next slide (Req 30.2)
     */
    function next() {
        goTo((currentIndex + 1) % totalCards);
    }

    /**
     * Go to previous slide (Req 30.3)
     */
    function prev() {
        goTo((currentIndex - 1 + totalCards) % totalCards);
    }

    /**
     * Update active dot indicator (Req 11.6)
     */
    function updateIndicators() {
        indicators.forEach(function(dot, i) {
            dot.classList.toggle('active', i === currentIndex);
            dot.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
        });
    }

    /**
     * Start auto-advance timer (Req 11.7, 30.6)
     */
    function startAutoAdvance() {
        if (prefersReduced) return; // Req 20.2
        stopAutoAdvance();
        autoTimer = setInterval(function() {
            next();
        }, 5000);
    }

    /**
     * Stop auto-advance timer
     */
    function stopAutoAdvance() {
        if (autoTimer) {
            clearInterval(autoTimer);
            autoTimer = null;
        }
    }

    /**
     * Reset auto-advance timer on user interaction (Req 30.7)
     */
    function resetTimer() {
        stopAutoAdvance();
        startAutoAdvance();
    }

    /**
     * Initialize keyboard navigation (Req 12.1, 12.2)
     */
    function initKeyboard() {
        const carousel = document.querySelector('.testimonials-carousel');
        if (!carousel) return;

        carousel.setAttribute('tabindex', '0');
        carousel.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowRight') {
                next();
                resetTimer();
            } else if (e.key === 'ArrowLeft') {
                prev();
                resetTimer();
            }
        });
    }

    /**
     * Initialize touch swipe (Req 16.2, 16.3)
     */
    function initTouch() {
        const carousel = document.querySelector('.testimonials-carousel');
        if (!carousel) return;

        carousel.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].clientX;
        }, { passive: true });

        carousel.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].clientX;
            const deltaX = touchStartX - touchEndX;
            if (Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    next();
                } else {
                    prev();
                }
                resetTimer();
            }
        }, { passive: true });
    }

    /**
     * Initialize hover pause (Req 11.8, 11.9)
     */
    function initHoverPause() {
        const carousel = document.querySelector('.testimonials-carousel');
        if (!carousel) return;

        carousel.addEventListener('mouseenter', stopAutoAdvance);
        carousel.addEventListener('mouseleave', startAutoAdvance);
    }

    /**
     * Initialize the carousel
     */
    function init() {
        trackEl = document.querySelector('.testimonial-track');
        if (!trackEl) return;

        cards = Array.from(trackEl.querySelectorAll('.testimonial-card'));
        totalCards = cards.length;
        if (totalCards === 0) return;

        indicators = Array.from(document.querySelectorAll('.carousel-indicators .indicator'));

        // Validate content
        validateCards();

        // Set initial state
        updateIndicators();

        // Prev/Next buttons
        const prevBtn = document.querySelector('.carousel-btn.prev');
        const nextBtn = document.querySelector('.carousel-btn.next');

        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                prev();
                resetTimer();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                next();
                resetTimer();
            });
        }

        // Dot indicators (Req 11.5)
        indicators.forEach(function(dot, i) {
            dot.addEventListener('click', function() {
                goTo(i);
                resetTimer();
            });
            dot.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goTo(i);
                    resetTimer();
                }
            });
        });

        initKeyboard();
        initTouch();
        initHoverPause();
        startAutoAdvance();
    }

    return { init: init };
})();

// ============================================================
// CTA SECTION ANIMATIONS (Tasks 11.1–11.3)
// Requirements: 13, 14
// ============================================================
const CTAAnimations = (function() {
    function onAnimate(section) {
        // CSS transitions handle the slide-in via .animate-in class
        // (cta-content slides from left, cta-visual from right)
        // AnimationEngine can also be triggered here for flexibility
        const content = section.querySelector('.cta-content');
        const visual = section.querySelector('.cta-visual');

        if (AnimationEngine.prefersReducedMotion) {
            if (content) { content.style.opacity = '1'; content.style.transform = 'none'; }
            if (visual)  { visual.style.opacity = '1'; visual.style.transform = 'none'; }
        }
    }

    function init() {
        const ctaSection = document.querySelector('.cta-section');
        if (!ctaSection) return;

        ctaSection.addEventListener('sectionAnimated', function(e) {
            onAnimate(e.target);
        });
    }

    return { init: init };
})();

// ============================================================
// IMAGE ERROR HANDLING - GLOBAL (Tasks 14.1–14.2)
// Requirements: 17.4, 17.5, 24.1, 24.2, 24.4
// ============================================================
const ImageErrorHandler = (function() {
    const retryCounts = new WeakMap();

    function handleError(img) {
        const count = retryCounts.get(img) || 0;

        if (count < 3) {
            retryCounts.set(img, count + 1);
            const delay = Math.pow(2, count + 1) * 500; // 1s, 2s, 4s
            const originalSrc = img.dataset.originalSrc || img.src.split('?')[0];
            img.dataset.originalSrc = originalSrc;

            setTimeout(function() {
                img.src = originalSrc + '?retry=' + (count + 1);
            }, delay);
        } else {
            // Final fallback: show branded placeholder (Req 17.4)
            img.alt = img.alt || 'Image unavailable';
            img.style.background = 'var(--bg-card)';
            img.onerror = null; // prevent infinite loop

            // For testimonial avatars: data-uri placeholder (Req 24.2)
            if (img.classList.contains('author-avatar')) {
                const letter = (img.alt || 'U').charAt(0).toUpperCase();
                img.src = 'data:image/svg+xml,' + encodeURIComponent(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">' +
                    '<circle cx="30" cy="30" r="30" fill="#ffc107"/>' +
                    '<text x="30" y="38" text-anchor="middle" font-size="28" fill="#3a2c00">' + letter + '</text>' +
                    '</svg>'
                );
            }
        }
    }

    function init() {
        // Attach to all lazy-loaded images
        document.querySelectorAll('img[loading="lazy"]').forEach(function(img) {
            img.addEventListener('error', function() {
                handleError(img);
            });
        });
    }

    return { init: init };
})();

// ============================================================
// UPDATE DOMContentLoaded TO INITIALIZE ALL NEW MODULES
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
    // Initialize Scroll Observer for landing page animations
    ScrollObserver.init();

    // Hero animations (Task 4.3)
    HeroAnimations.init();

    // Video player (Tasks 5.1-5.4)
    VideoPlayer.init();

    // Features animations (Tasks 7.1-7.3)
    FeaturesAnimations.init();

    // Product showcase (Tasks 8.1-8.4)
    ProductShowcase.init();

    // Testimonials carousel (Tasks 10.1-10.5)
    Carousel.init();

    // CTA animations (Tasks 11.1-11.3)
    CTAAnimations.init();

    // Global image error handling (Tasks 14.1-14.2)
    ImageErrorHandler.init();

    // Contact form — with toast notifications and loading spinner
    const form = document.getElementById("contactForm");
    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();

            if (!validateForm()) return;

            const submitBtn = form.querySelector("button[type=submit]");
            const labelEl = submitBtn.querySelector(".contact-submit-label");
            const iconEl = submitBtn.querySelector("i");

            // Show spinner
            submitBtn.disabled = true;
            if (iconEl) { iconEl.className = "fas fa-spinner"; }
            if (labelEl) { labelEl.textContent = "Sending…"; }

            const formData = {
                name: escapeHTML(document.getElementById("name").value),
                email: escapeHTML(document.getElementById("email").value),
                phone: escapeHTML(document.getElementById("phone").value),
                message: escapeHTML(document.getElementById("message").value),
            };

            try {
                const response = await fetch("http://localhost:3001/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });

                const result = await response.json();
                showToast("✅ " + (result.message || "Message sent! We'll be in touch soon."), "success");
                form.reset();
            } catch (error) {
                showToast("❌ Failed to send. Please try again.", "error");
                console.error(error);
            } finally {
                submitBtn.disabled = false;
                if (iconEl) { iconEl.className = "fas fa-paper-plane"; }
                if (labelEl) { labelEl.textContent = "Send Message"; }
            }
        });
    }

    // FAQ accordion
    document.querySelectorAll(".faq-trigger").forEach(function (trigger) {
        trigger.addEventListener("click", function () {
            var item = trigger.closest(".faq-item");
            var answer = document.getElementById(trigger.getAttribute("aria-controls"));
            var isOpen = item.classList.contains("faq-item--open");

            // Close all others
            document.querySelectorAll(".faq-item--open").forEach(function (openItem) {
                openItem.classList.remove("faq-item--open");
                openItem.querySelector(".faq-trigger").setAttribute("aria-expanded", "false");
                var a = openItem.querySelector(".faq-answer");
                if (a) a.hidden = true;
            });

            // Toggle this one
            if (!isOpen) {
                item.classList.add("faq-item--open");
                trigger.setAttribute("aria-expanded", "true");
                if (answer) answer.hidden = false;
            }
        });
    });

    // Products page
    if (document.getElementById("productList")) {
        loadProducts();
    }
});

// ============================================================
// TOAST NOTIFICATION UTILITY
// ============================================================
function showToast(message, type) {
    var container = document.getElementById("toast-container");
    if (!container) return;

    var toast = document.createElement("div");
    toast.className = "toast toast--" + (type || "success");
    toast.setAttribute("role", "status");
    toast.textContent = message;

    // Click to dismiss
    toast.addEventListener("click", function () { dismissToast(toast); });

    container.appendChild(toast);

    // Auto-dismiss after 4 seconds
    setTimeout(function () { dismissToast(toast); }, 4000);
}

function dismissToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add("toast--leaving");
    toast.addEventListener("animationend", function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, { once: true });
}
