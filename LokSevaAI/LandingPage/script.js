
//  SUPABASE CONFIG
const SUPABASE_URL = 'https://awldamekqajcfbqfwwge.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_87c-6w_xL70ZVmCWdO0yDQ_muFlIsha';

// After Google OAuth Supabase drops the user straight onto the
// data collection app (port 5173) with the auth hash in the URL.
const MAIN_PAGE_URL = 'http://localhost:5173';

// ── Supabase singleton ─────────────────────────────────────
let _sb = null;
function getSB() {
    if (!_sb) _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return _sb;
}


//  GOOGLE AUTH TRIGGER

async function loginWithGoogle() {
    // --- DEVELOPMENT MOCK BYPASS ---
    // Bypassing Supabase because it's currently paused/down. 
    // This directly routes the user to the next step of the onboarding flow.
    console.log("Mock Auth Bypass: Redirecting to Data Collection...");
    window.location.href = MAIN_PAGE_URL + '#mock_bypass=true';

    /* --- PRODUCTION SUPABASE AUTH ---
    const sb = getSB();
    const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // Supabase redirects here with the access_token hash
            // → Main React app picks it up automatically
            redirectTo: MAIN_PAGE_URL,
        },
    });
    if (error) {
        console.error('OAuth error:', error.message);
        alert('Google sign-in failed: ' + error.message);
    }
    */
}

//  SESSION CHECK ON LP LOAD
window.addEventListener('DOMContentLoaded', async () => {
    // Attach Google login to navbar button
    const navBtn = document.getElementById('login-btn');
    if (navBtn) navBtn.addEventListener('click', loginWithGoogle);

    // Attach Google login to page-4 CTA button
    const ctaBtn = document.querySelector('.google-login-large');
    if (ctaBtn) ctaBtn.addEventListener('click', loginWithGoogle);
});


//  GSAP SCROLL ANIMATIONS

gsap.registerPlugin(ScrollTrigger);

// 1. Parliament image zoom + fade (Page 1)
gsap.to("#parliament-img", {
    scrollTrigger: {
        trigger: "#page1",
        start: "top top",
        end: "bottom top",
        scrub: 1,
    },
    scale: 3,
    opacity: 0.02,
    filter: "grayscale(100%) blur(5px)",
});

// 2. Project name fade + letter-spacing expand (Page 1)
gsap.to(".project-name", {
    scrollTrigger: {
        trigger: "#page1",
        start: "top top",
        end: "60% top",
        scrub: 1,
    },
    y: -50,
    opacity: 0,
    letterSpacing: "4rem",
});

// 3. Ashok Chakra rotation on scroll (Page 2)
gsap.to(".rotating-chakra", {
    scrollTrigger: {
        trigger: "#page2",
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
    },
    rotation: 360 * 3,
    ease: "none",
});

// 4. Mac container slide-in (Page 2)
gsap.from(".mac-container", {
    scrollTrigger: {
        trigger: "#page2",
        start: "top 80%",
        end: "center center",
        scrub: 1.5,
    },
    opacity: 0,
    x: 100,
    ease: "power2.out",
});

// 5. Chat messages pan in from sides (Page 2)
gsap.utils.toArray(".chat-message").forEach((msg) => {
    gsap.to(msg, {
        scrollTrigger: {
            trigger: msg,
            start: "top 85%",
            toggleActions: "play none none reverse",
        },
        opacity: 1,
        x: 0,
        duration: 1,
        ease: "power3.out",
    });
});

// 6. Tech goal list items (Page 2)
gsap.utils.toArray(".tech-goals-list li").forEach((li) => {
    gsap.to(li, {
        scrollTrigger: {
            trigger: li,
            start: "top 95%",
            toggleActions: "play none none reverse",
        },
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        delay: 0.3,
    });
});

// ── Navigation smooth scroll (About button) ────────────────
document.getElementById('about-btn').addEventListener('click', () => {
    gsap.to(window, { scrollTo: "#page3", duration: 1.5, ease: "power4.inOut" });
});

document.documentElement.style.scrollBehavior = "auto";
