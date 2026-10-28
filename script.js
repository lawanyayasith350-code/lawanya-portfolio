// ========================================
// Mobile navigation
// ========================================

const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
const mobile = window.matchMedia('(max-width: 720px)');

function closeMenu() {
  navLinks.classList.remove('active');
  menuBtn.setAttribute('aria-expanded', 'false');
}

menuBtn.addEventListener('click', () => {
  const open = navLinks.classList.toggle('active');
  menuBtn.setAttribute('aria-expanded', String(open));
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeMenu);
});

document.addEventListener('keydown', event => {
  if (
    event.key === 'Escape' &&
    navLinks.classList.contains('active')
  ) {
    closeMenu();
    menuBtn.focus();
  }
});

document.addEventListener('click', event => {
  if (!event.target.closest('.nav')) {
    closeMenu();
  }
});

mobile.addEventListener('change', closeMenu);


// ========================================
// Hero photo fallback
// ========================================

const portrait = document.querySelector('.hero-photo img');

function photoUnavailable() {
  portrait.hidden = true;
  portrait.parentElement.classList.add('photo-missing');
}

portrait.addEventListener('error', photoUnavailable);

if (portrait.complete && !portrait.naturalWidth) {
  photoUnavailable();
}


// ========================================
// Learning cards and score count-up
// ========================================

(() => {
  const cards = [
    ...document.querySelectorAll('#learning .learning-item')
  ];

  const motion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  if (
    !cards.length ||
    motion.matches ||
    !('IntersectionObserver' in window)
  ) {
    return;
  }

  function countScore(node) {
    const target = Number(node.dataset.score);

    if (!Number.isFinite(target)) {
      return;
    }

    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / 950, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      node.textContent = String(
        motion.matches
          ? target
          : Math.round(target * eased)
      );

      if (progress < 1 && !motion.matches) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(
    entries => {
      let delay = 0;

      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          return;
        }

        observer.unobserve(entry.target);

        if (motion.matches) {
          return;
        }

        if (typeof entry.target.animate === 'function') {
          const animation = entry.target.animate(
            [
              {
                opacity: 0,
                transform: 'translateY(22px)'
              },
              {
                opacity: 1,
                transform: 'translateY(0)'
              }
            ],
            {
              duration: 650,
              delay,
              easing: 'cubic-bezier(.2,.7,.2,1)',
              fill: 'backwards'
            }
          );

          const stopOnReducedMotion = () => {
            if (motion.matches) {
              animation.cancel();
            }
          };

          motion.addEventListener(
            'change',
            stopOnReducedMotion
          );

          animation.finished
            .catch(() => {})
            .finally(() => {
              motion.removeEventListener(
                'change',
                stopOnReducedMotion
              );
            });

          delay += 90;
        }

        const score = entry.target.querySelector(
          '[data-score]'
        );

        if (score) {
          countScore(score);
        }
      });
    },
    {
      threshold: 0.15
    }
  );

  cards.forEach(card => {
    observer.observe(card);
  });
})();


// ========================================
// Active menu, scroll progress,
// and section entrance animations
// ========================================

(() => {
  const motion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  const header = document.querySelector('.header');

  const sections = [
    ...document.querySelectorAll('main > section[id]')
  ];

  const navItems = [
    ...document.querySelectorAll(
      '.nav-links a[href^="#"]'
    )
  ];

  const animations = new Set();
  let framePending = false;

  // Highlight the navigation item for the current section.
  function updateNavigation() {
    framePending = false;

    const headerHeight = header
      ? header.getBoundingClientRect().height
      : 82;

    const guide = Math.min(
      window.innerHeight * 0.35,
      headerHeight + 160
    );

    let current = '';

    sections.forEach(section => {
      if (section.getBoundingClientRect().top <= guide) {
        current = section.id;
      }
    });

    const maxScroll =
      document.documentElement.scrollHeight -
      window.innerHeight;

    // Select Contact when the bottom of the page is reached.
    if (
      maxScroll > 0 &&
      window.scrollY >= maxScroll - 2 &&
      sections.length
    ) {
      current = sections[sections.length - 1].id;
    }

    navItems.forEach(link => {
      const selected =
        link.getAttribute('href') === '#' + current;

      link.classList.toggle('is-current', selected);

      if (selected) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    // Update the progress line underneath the header.
    if (header) {
      const progress = maxScroll > 0
        ? Math.min(
            1,
            Math.max(0, window.scrollY / maxScroll)
          )
        : 0;

      header.style.setProperty(
        '--scroll-progress',
        String(progress)
      );
    }
  }

  function scheduleNavigation() {
    if (framePending) {
      return;
    }

    framePending = true;
    requestAnimationFrame(updateNavigation);
  }

  window.addEventListener(
    'scroll',
    scheduleNavigation,
    { passive: true }
  );

  window.addEventListener('resize', scheduleNavigation);
  window.addEventListener('load', scheduleNavigation);

  updateNavigation();

  // Navigation continues working with reduced motion enabled.
  if (
    motion.matches ||
    !('IntersectionObserver' in window)
  ) {
    return;
  }

  const targets = [
    ...document.querySelectorAll(
      '.section-title, ' +
      '#about .about-card > p, ' +
      '#skills .skill-card, ' +
      '#projects .project-card, ' +
      '#contact .contact-card'
    )
  ];

  const observer = new IntersectionObserver(
    entries => {
      let stagger = 0;

      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          return;
        }

        // Animate each element once.
        observer.unobserve(entry.target);

        if (
          motion.matches ||
          typeof entry.target.animate !== 'function'
        ) {
          return;
        }

        const isTitle = entry.target.classList.contains(
          'section-title'
        );

        const animation = entry.target.animate(
          [
            {
              opacity: 0,
              transform: isTitle
                ? 'translateX(-38px)'
                : 'translateY(58px) scale(.96)'
            },
            {
              opacity: 1,
              transform: 'translate(0,0) scale(1)'
            }
          ],
          {
            duration: isTitle ? 800 : 950,
            delay: stagger,
            easing: 'cubic-bezier(.16,1,.3,1)',
            fill: 'backwards'
          }
        );

        animations.add(animation);

        animation.finished
          .catch(() => {})
          .finally(() => {
            animations.delete(animation);
          });

        stagger = Math.min(stagger + 130, 390);
      });
    },
    {
      threshold: 0,
      rootMargin: '0px 0px -45px 0px'
    }
  );

  targets.forEach(target => {
    observer.observe(target);
  });

  motion.addEventListener('change', () => {
    if (!motion.matches) {
      return;
    }

    observer.disconnect();

    animations.forEach(animation => {
      animation.cancel();
    });

    animations.clear();
  });
})();