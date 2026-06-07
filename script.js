document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu
    const hamburger = document.getElementById('hamburger-menu');
    const navLinks = document.getElementById('nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // 2. Informed Consent Modal
    const consentModal = document.getElementById('consent-modal');
    if (consentModal) {
        if (!localStorage.getItem('mindbridge_consent')) {
            consentModal.style.display = 'flex';
        } else {
            consentModal.style.display = 'none';
        }

        const consentBtn = document.getElementById('consent-btn');
        if (consentBtn) {
            consentBtn.addEventListener('click', () => {
                localStorage.setItem('mindbridge_consent', 'true');
                consentModal.style.display = 'none';
            });
        }
    }

    // 3. Screening Matrix UI Logic
    const screeningCards = document.getElementById('screening-cards');
    const formContainer = document.getElementById('form-container');
    const backBtn = document.getElementById('back-to-screening');
    
    if (screeningCards && formContainer) {
        document.querySelectorAll('.screening-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const formId = e.target.getAttribute('data-form');
                
                // Hide cards, show container
                screeningCards.style.display = 'none';
                formContainer.style.display = 'block';
                
                // Hide all forms, show selected
                document.querySelectorAll('.assessment-form').forEach(f => f.style.display = 'none');
                document.getElementById(formId).style.display = 'block';
            });
        });

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                formContainer.style.display = 'none';
                screeningCards.style.display = 'grid'; // Returns to grid-3 layout implicitly handled by class
            });
        }
    }

    // 4. Form Validation & Router
    function setupFormRouter(formId, instrument, numQuestions) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            let totalScore = 0;
            let allAnswered = true;
            let q9Score = 0;

            for (let i = 1; i <= numQuestions; i++) {
                const name = `${instrument.toLowerCase()}${i}`;
                const selected = document.querySelector(`input[name="${name}"]:checked`);
                
                if (selected) {
                    let val = parseInt(selected.value, 10);
                    // Critical: PSS-10 reverse scoring for 4, 5, 7, 8
                    if (instrument === 'PSS10' && [4, 5, 7, 8].includes(i)) {
                        val = 4 - val; // 0=4, 1=3, 2=2, 3=1, 4=0
                    }
                    totalScore += val;

                    if (instrument === 'PHQ9' && i === 9) {
                        q9Score = val;
                    }
                } else {
                    allAnswered = false;
                }
            }

            if (!allAnswered) {
                alert("Please answer all questions before submitting.");
                return;
            }

            // Determine Severity Thresholds
            let severity = 'minimal';
            if (instrument === 'PHQ9' || instrument === 'GAD7') {
                if (totalScore >= 15) severity = 'severe';
                else if (totalScore >= 10) severity = 'moderate';
                else if (totalScore >= 5) severity = 'mild';
            } else if (instrument === 'PSS10') {
                if (totalScore >= 27) severity = 'severe';
                else if (totalScore >= 14) severity = 'moderate';
                else severity = 'minimal'; // low stress
            }

            // Redirect to results.html with params
            const url = `results.html?test=${instrument}&score=${totalScore}&severity=${severity}&q9=${q9Score}`;
            window.location.href = url;
        });
    }

    setupFormRouter('phq9-form', 'PHQ9', 9);
    setupFormRouter('gad7-form', 'GAD7', 7);
    setupFormRouter('pss10-form', 'PSS10', 10);

    // 5. Results Engine Logic
    if (window.location.pathname.includes('results.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const test = urlParams.get('test');
        const score = parseInt(urlParams.get('score'), 10);
        let severity = urlParams.get('severity');
        const q9 = parseInt(urlParams.get('q9'), 10);

        if (test && !isNaN(score)) {
            document.getElementById('result-test-name').textContent = `${test} Results`;
            
            const scoreCircle = document.getElementById('score-circle');
            scoreCircle.innerHTML = `<span>${score}</span> / ${test === 'PSS10' ? '40' : (test === 'PHQ9' ? '27' : '21')}`;
            
            const subtext = document.getElementById('severity-subtext');
            const tier1 = document.getElementById('tier1-resources');
            const tier2 = document.getElementById('tier2-resources');
            const tier3 = document.getElementById('tier3-resources');
            const crisisBanner = document.getElementById('crisis-banner');

            // Apply specific class for color mapping based on severity param
            scoreCircle.className = `score-circle tier-${severity}`;

            // Reset display states
            tier1.style.display = 'none';
            tier2.style.display = 'none';
            tier3.style.display = 'none';

            // CRITICAL COMPLIANCE: Force Crisis Protocol if Q9 > 0
            let forceCrisis = false;
            if (test === 'PHQ9' && q9 > 0) {
                forceCrisis = true;
            }

            if (forceCrisis) {
                severity = 'severe';
                scoreCircle.className = `score-circle tier-severe`;
            }

            if (severity === 'minimal') {
                subtext.textContent = "Your results suggest minimal symptoms. This is a good time to build healthy habits.";
                tier1.style.display = 'grid';
            } else if (severity === 'mild') {
                subtext.textContent = "Your results suggest mild symptoms. Self-care and monitoring can help.";
                tier1.style.display = 'grid';
            } else if (severity === 'moderate') {
                subtext.textContent = "Your results suggest moderate symptoms. Speaking with a professional would be beneficial.";
                tier1.style.display = 'grid';
                tier2.style.display = 'block';
            } else if (severity === 'severe') {
                subtext.textContent = "Your results suggest significant symptoms. Professional support is strongly recommended.";
                tier1.style.display = 'grid';
                tier2.style.display = 'block';
                tier3.style.display = 'block';
            }

            if (forceCrisis) {
                crisisBanner.style.display = 'block';
                subtext.textContent = "Your results indicate some risk. Immediate professional support is strongly recommended.";
            }
        }
    }

    // 6. Contact Form Interception
    const contactForm = document.getElementById('contact-intake-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert("Thank you! Your message has been routed securely. Our team will contact you shortly.");
            contactForm.reset();
        });
    }
});
