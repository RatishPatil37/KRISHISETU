// ── SUPABASE CONFIG ──────────────────────────────────────────
const SUPABASE_URL = 'https://ofvvofbpxwkrnowhzmoh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdnZvZmJweHdrcm5vd2h6bW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjc1NzEsImV4cCI6MjA4ODY0MzU3MX0.sscHTe1AqEdqP1e80kx1yX5wzSZNQufueYrjda2gzZU';

const MAIN_PAGE_URL = window.location.origin + '/app';

let _sb = null;
function getSB() {
    if (!_sb) _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return _sb;
}

// ── GOOGLE AUTH TRIGGER ─────────────────────────────────────
async function loginWithGoogle() {
    console.log("Initiating Supabase Auth...");
    
    // Gentle liquid connecting text state
    const btns = document.querySelectorAll('.google-btn, .google-login-large');
    btns.forEach(btn => {
        const span = btn.querySelector('span');
        if(span) {
            const originalText = span.innerHTML;
            span.innerHTML = `<span style="opacity: 0.8; font-weight: 400;">Connecting...</span>`;
            btn.style.pointerEvents = 'none';
            setTimeout(() => {
                span.innerHTML = originalText;
                btn.style.pointerEvents = 'auto';
            }, 5000);
        }
    });

    const sb = getSB();
    const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/app/auth/callback',
        },
    });
    
    if (error) {
        console.error('OAuth error:', error.message);
        alert('Google sign-in failed: ' + error.message);
    }
}

// ── INIT ───────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    // ── Auth Modal Logic ──
    const authModal = document.getElementById('auth-modal');
    const openAuthBtns = [document.getElementById('login-btn'), document.querySelector('.google-login-large')];
    const closeModalBtn = document.getElementById('close-modal');
    
    openAuthBtns.forEach(btn => {
        if (btn) btn.addEventListener('click', () => authModal.classList.remove('hidden'));
    });
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => authModal.classList.add('hidden'));
    
    // Tab Switching
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            authTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            const targetPanel = e.target.getAttribute('data-tab');
            document.getElementById('phone-auth').classList.toggle('hidden', targetPanel !== 'phone');
            document.getElementById('google-auth').classList.toggle('hidden', targetPanel !== 'google');
        });
    });

    // ── Phone OTP Auth ──
    const sendOtpBtn = document.getElementById('send-otp-btn');
    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    const backToPhoneBtn = document.getElementById('back-to-phone');
    let currentPhone = '';

    if (sendOtpBtn) {
        sendOtpBtn.addEventListener('click', async () => {
            const phoneInput = document.getElementById('phone-input').value.trim();
            const errorMsg = document.getElementById('phone-error');
            errorMsg.innerText = '';
            
            if (!/^\d{10}$/.test(phoneInput)) {
                errorMsg.innerText = 'Please enter a valid 10-digit number.';
                return;
            }

            currentPhone = '+91' + phoneInput;
            sendOtpBtn.innerText = 'Sending...';
            sendOtpBtn.disabled = true;

            const { error } = await supabase.auth.signInWithOtp({ phone: currentPhone });

            sendOtpBtn.innerText = 'Send OTP';
            sendOtpBtn.disabled = false;

            if (error) {
                errorMsg.innerText = error.message;
            } else {
                document.getElementById('send-otp-step').classList.add('hidden');
                document.getElementById('verify-otp-step').classList.remove('hidden');
                document.getElementById('display-phone').innerText = currentPhone;
            }
        });
    }

    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', async () => {
            const otpInput = document.getElementById('otp-input').value.trim();
            const errorMsg = document.getElementById('verify-error');
            errorMsg.innerText = '';

            if (otpInput.length !== 6) {
                errorMsg.innerText = 'Please enter the 6-digit code.';
                return;
            }

            verifyOtpBtn.innerText = 'Verifying...';
            verifyOtpBtn.disabled = true;

            const { data, error } = await supabase.auth.verifyOtp({
                phone: currentPhone,
                token: otpInput,
                type: 'sms'
            });

            if (error) {
                verifyOtpBtn.innerText = 'Verify & Login';
                verifyOtpBtn.disabled = false;
                errorMsg.innerText = error.message;
            } else {
                // Success! Redirect to the main app callback to set session there.
                // We pass the access token in the hash so the frontend can capture it.
                if (data.session) {
                    window.location.href = `${window.location.origin}/app/auth/callback#access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}&type=recovery`;
                } else {
                    // Fallback to direct app redirect
                    window.location.href = 'http://localhost:5000/app';
                }
            }
        });
    }

    if (backToPhoneBtn) {
        backToPhoneBtn.addEventListener('click', () => {
            document.getElementById('verify-otp-step').classList.add('hidden');
            document.getElementById('send-otp-step').classList.remove('hidden');
            document.getElementById('otp-input').value = '';
            document.getElementById('verify-error').innerText = '';
        });
    }

    // Google Auth Binding
    const googleModalBtn = document.getElementById('google-login-modal-btn');
    if (googleModalBtn) googleModalBtn.addEventListener('click', loginWithGoogle);

    // ── Explore Routing ──
    const exploreBtn = document.getElementById('hero-explore-btn');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
            window.location.href = 'http://localhost:5000/app';
        });
    }

    // Initialize Preloader & Advanced Animations
    initLenis();
    
    // Preloader fade out
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            preloader.style.visibility = 'hidden';
        }
        // Start GSAP animations after preloader fades
        setTimeout(initGSAP, 300);
    }, 1500); // 1.5s loading duration

    // Initialize Premium Interactions
    initCustomCursor();
    initMagneticElements();
});

// ── CUSTOM CURSOR ───────────────────────────────────────────
function initCustomCursor() {
    const cursor = document.querySelector('.custom-cursor');
    if (!cursor) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    gsap.ticker.add(() => {
        // Smooth cursor follow
        cursorX += (mouseX - cursorX) * 0.15;
        cursorY += (mouseY - cursorY) * 0.15;
        gsap.set(cursor, { x: cursorX, y: cursorY });
    });

    // Hover effects
    const magneticElements = document.querySelectorAll('.magnetic, .nav-btn, .liquid-btn');
    magneticElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
    });
}

// ── MAGNETIC ELEMENTS ───────────────────────────────────────
function initMagneticElements() {
    const magnetics = document.querySelectorAll('.magnetic');
    
    magnetics.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            gsap.to(btn, {
                x: x * 0.2, // Magnetic strength
                y: y * 0.2,
                duration: 0.6,
                ease: 'power3.out'
            });
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.8,
                ease: 'elastic.out(1, 0.3)'
            });
        });
    });
}

// ── LENIS SMOOTH SCROLL ─────────────────────────────────────
let lenis;
function initLenis() {
    lenis = new Lenis({
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth buttery easing
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
    
    // Smooth scroll for anchors
    document.getElementById('about-btn')?.addEventListener('click', () => lenis.scrollTo('#narrative'));
    document.getElementById('hero-explore-btn')?.addEventListener('click', () => lenis.scrollTo('#narrative'));
}

// ── GSAP & SPLIT-TYPE ANIMATIONS ────────────────────────────
function initGSAP() {
    gsap.registerPlugin(ScrollTrigger);

    // Connect Lenis to ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000) });
    gsap.ticker.lagSmoothing(0);

    // 1. Split Text Setup (Robust visibility)
    const splitTexts = document.querySelectorAll('.split-text');
    splitTexts.forEach(text => {
        const split = new SplitType(text, { types: 'words, chars' });
        
        ScrollTrigger.create({
            trigger: text,
            start: "top 90%",
            onEnter: () => {
                gsap.from(split.chars, {
                    opacity: 0,
                    y: 40,
                    duration: 0.8,
                    stagger: 0.02,
                    ease: "power3.out",
                    clearProps: "all"
                });
            }
        });
    });

    // 2. Continuous Swaying Elements (Sped up)
    const swayingElements = document.querySelectorAll('.swaying');
    swayingElements.forEach(el => {
        gsap.to(el, {
            y: "-=15",
            rotation: 1.5,
            duration: 1.5, // Sped up from 4 to 1.5
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1
        });
    });

    const bgShapes = document.querySelectorAll('.fluid-shape');
    bgShapes.forEach((shape, i) => {
        gsap.to(shape, {
            y: `+=${30 + i * 10}`,
            x: `+=${20 + i * 5}`,
            rotation: i % 2 === 0 ? 10 : -10,
            scale: 1.05,
            duration: 6 + i * 2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1
        });
    });

    // 3. Parallax Depth (Scroll-linked)
    const parallaxCards = document.querySelectorAll('.parallax-card');
    parallaxCards.forEach(card => {
        const speed = parseFloat(card.getAttribute('data-speed')) || 1;
        gsap.to(card, {
            y: (i, target) => -100 * (speed - 1),
            ease: "none",
            scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    });

    // Internal Image Parallax (Million Dollar Animation)
    const internalParallaxes = document.querySelectorAll('.internal-parallax img');
    internalParallaxes.forEach(img => {
        gsap.fromTo(img, 
            { y: '-10%' },
            {
                y: '10%',
                ease: "none",
                scrollTrigger: {
                    trigger: img.closest('.image-card'),
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true
                }
            }
        );
    });

    // 4. Fade Ups & Pop Ins
    const fadeUps = gsap.utils.toArray('.fade-up');
    fadeUps.forEach(element => {
        gsap.from(element, {
            scrollTrigger: {
                trigger: element,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            y: 40,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        });
    });

    const popIns = gsap.utils.toArray('.pop-in');
    popIns.forEach(element => {
        gsap.from(element, {
            scrollTrigger: {
                trigger: element,
                start: "top 80%",
                toggleActions: "play none none reverse"
            },
            scale: 0.9,
            opacity: 0,
            duration: 1,
            ease: "back.out(1.2)"
        });
    });

    // Initial Navbar animation with clearProps to fix Edge/Chrome vanishing bug
    gsap.from(".navbar", { 
        y: -100, 
        opacity: 0, 
        duration: 1.5, 
        ease: "power4.out", 
        delay: 0.2,
        clearProps: "all"
    });
    
    // Initial Hero Chat Bubbles pop
    gsap.from(".chat-row", {
        y: 20, opacity: 0, duration: 0.8, stagger: 0.3, ease: "back.out(1.2)", delay: 1.0
    });
}
