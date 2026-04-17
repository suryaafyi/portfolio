import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register Plugin
gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {

  // 1. General Fade Up for all .knot-tx items
  const txElements = document.querySelectorAll('.knot-tx');
  txElements.forEach(el => {
    // Initial hidden state
    gsap.set(el, { y: 50, opacity: 0 });

    ScrollTrigger.create({
      trigger: el,
      start: "top 85%", // when top of element hits 85% of screen
      once: true,       // only animate once as we scroll down
      onEnter: () => {
        gsap.to(el, {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: "power3.out",
          stagger: 0.2 // if multiple elements are tied
        });
      }
    });
  });

  // 2. Specific Hero Loading Sequence 
  // Let the hero fade natively then stagger the elements inside
  const heroTL = gsap.timeline();
  
  heroTL.fromTo('.hero-headline', 
    { y: 30, opacity: 0 }, 
    { y: 0, opacity: 1, duration: 1.2, ease: "power4.out" }
  )
  .fromTo('.hero-subtext', 
    { y: 20, opacity: 0 }, 
    { y: 0, opacity: 1, duration: 1, ease: "power3.out" }, 
    "-=0.6"
  )
  .fromTo('.hero-meta', 
    { opacity: 0 }, 
    { opacity: 1, duration: 1 }, 
    "-=0.4"
  );

  // 3. Number Counter for 21.1% in Act 6
  const statElement = document.querySelector('.huge-stat');
  if (statElement) {
    ScrollTrigger.create({
      trigger: statElement,
      start: "top 80%",
      once: true,
      onEnter: () => {
        // Simple counter from 0 to 21.1
        let obj = { val: 0 };
        gsap.to(obj, {
          val: 21.1,
          duration: 2.5,
          ease: "power2.out",
          onUpdate: () => {
            statElement.innerHTML = obj.val.toFixed(1) + "%";
          }
        });
      }
    });
  }

  // 4. Custom Inverted Cursor Logic
  const cursor = document.querySelector('.knot-cursor');
  if (cursor) {
    document.addEventListener('mousemove', (e) => {
      // Direct positioning for 0 latency
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });

    // Hover effect on links and buttons
    const interactivates = document.querySelectorAll('a, button, .knot-card, .knot-mockup-wrapper');
    interactivates.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
    });
  }

});
