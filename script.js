// Scroll Progress Bar Logic
function updateScrollProgress() {
  const progressBar = document.getElementById('scroll-indicator');
  const track = document.getElementById('scroll-bar');
  if (!progressBar || !track) return;

  const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  const docHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const scrollPercent = Math.min(Math.max((scrollTop / docHeight) * 100, 0), 100);
  const barHeight = track.offsetHeight || 165;
  const fillHeight = (scrollPercent / 100) * barHeight;

  document.body.style.setProperty('--scroll-progress', `${fillHeight}px`);
  progressBar.style.height = `${fillHeight}px`;
  progressBar.style.background = 'linear-gradient(180deg, rgba(29, 205, 159, 0.98) 0%, rgba(17, 214, 255, 0.98) 100%)';
  progressBar.style.boxShadow = '0 0 14px rgba(29, 205, 159, 0.9), 0 0 22px rgba(15, 208, 255, 0.7), 0 0 38px rgba(15, 208, 255, 0.4)';
  progressBar.style.filter = 'drop-shadow(0 0 10px rgba(15, 208, 255, 0.8))';
}

window.addEventListener('scroll', () => requestAnimationFrame(updateScrollProgress), { passive: true });
window.addEventListener('load', updateScrollProgress);
document.addEventListener('DOMContentLoaded', updateScrollProgress);
window.addEventListener('resize', updateScrollProgress);
updateScrollProgress();

const letters = document.querySelectorAll('.loading-text span');

gsap.to(letters, {
  opacity: 1,
  duration: 1.2,
  stagger: 0.15,
  onUpdate: function () {
    letters.forEach((el, i) => {
      gsap.to(el, {
        color: '#ffffff',
        duration: 0.2,
        delay: i * 0.15
      });

      gsap.to(el, {
        color: 'rgba(255,255,255,0.1)',
        duration: 0.2,
        delay: i * 0.15 + 0.4
      });
    });
  },
  onComplete: () => {
    gsap.to('#loading', {
      opacity: 0,
      duration: 1,
      delay: 0.5,
      onComplete: () => {
        document.getElementById('loading').style.display = 'none';
      }
    });
  }
});

function initLineWaves(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const {
    speed = 0.3,
    innerLineCount = 32.0,
    outerLineCount = 40.0,
    warpIntensity = 1.0,
    rotation = -23,
    edgeFadeWidth = 0.0,
    colorCycleSpeed = 1.0,
    brightness = 0.2,
    color1 = '#1DCD9F',
    color2 = '#1DCD9F',
    color3 = '#1DCD9F',
    enableMouseInteraction = true,
    mouseInfluence = 2.0
  } = options;

  function hexToVec3(hex) {
    const h = hex.replace('#', '');
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255
    ];
  }

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;';
  container.appendChild(canvas);

  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
  if (!gl) return;

  const vertexShaderSrc = `
    attribute vec2 aPosition;
    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragmentShaderSrc = `
    precision highp float;

    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uSpeed;
    uniform float uInnerLines;
    uniform float uOuterLines;
    uniform float uWarpIntensity;
    uniform float uRotation;
    uniform float uEdgeFadeWidth;
    uniform float uColorCycleSpeed;
    uniform float uBrightness;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform vec2 uMouse;
    uniform float uMouseInfluence;
    uniform bool uEnableMouse;

    #define HALF_PI 1.5707963

    float hashF(float n) {
      return fract(sin(n * 127.1) * 43758.5453123);
    }

    float smoothNoise(float x) {
      float i = floor(x);
      float f = fract(x);
      float u = f * f * (3.0 - 2.0 * f);
      return mix(hashF(i), hashF(i + 1.0), u);
    }

    float displaceA(float coord, float t) {
      float result = sin(coord * 2.123) * 0.2;
      result += sin(coord * 3.234 + t * 4.345) * 0.1;
      result += sin(coord * 0.589 + t * 0.934) * 0.5;
      return result;
    }

    float displaceB(float coord, float t) {
      float result = sin(coord * 1.345) * 0.3;
      result += sin(coord * 2.734 + t * 3.345) * 0.2;
      result += sin(coord * 0.189 + t * 0.934) * 0.3;
      return result;
    }

    vec2 rotate2D(vec2 p, float angle) {
      float c = cos(angle);
      float s = sin(angle);
      return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
    }

    void main() {
      vec2 coords = gl_FragCoord.xy / uResolution;
      coords = coords * 2.0 - 1.0;
      coords.x *= uResolution.x / uResolution.y;
      coords = rotate2D(coords, uRotation);

      float halfT = uTime * uSpeed * 0.5;
      float fullT = uTime * uSpeed;

      float mouseWarp = 0.0;
      if (uEnableMouse) {
        vec2 mPos = rotate2D(uMouse * 2.0 - 1.0, uRotation);
        mPos.x *= uResolution.x / uResolution.y;
        float mDist = length(coords - mPos);
        mouseWarp = uMouseInfluence * exp(-mDist * mDist * 4.0);
      }

      float warpAx = coords.x + displaceA(coords.y, halfT) * uWarpIntensity + mouseWarp;
      float warpAy = coords.y - displaceA(coords.x * cos(fullT) * 1.235, halfT) * uWarpIntensity;
      float warpBx = coords.x + displaceB(coords.y, halfT) * uWarpIntensity + mouseWarp;
      float warpBy = coords.y - displaceB(coords.x * sin(fullT) * 1.235, halfT) * uWarpIntensity;

      vec2 fieldA = vec2(warpAx, warpAy);
      vec2 fieldB = vec2(warpBx, warpBy);
      vec2 blended = mix(fieldA, fieldB, 0.5);

      float fadeTop = smoothstep(uEdgeFadeWidth, uEdgeFadeWidth + 0.4, blended.y);
      float fadeBottom = smoothstep(-uEdgeFadeWidth, -(uEdgeFadeWidth + 0.4), blended.y);
      float vMask = 1.0 - max(fadeTop, fadeBottom);

      float tileCount = mix(uOuterLines, uInnerLines, vMask);
      float scaledY = blended.y * tileCount;
      float nY = smoothNoise(abs(scaledY));

      float ridge = pow(
        step(abs(nY - blended.x) * 2.0, HALF_PI) * cos(2.0 * (nY - blended.x)),
        5.0
      );

      float lines = 0.0;
      for (float i = 1.0; i < 3.0; i += 1.0) {
        lines += pow(max(fract(scaledY), fract(-scaledY)), i * 2.0);
      }

      float pattern = vMask * lines;

      float cycleT = fullT * uColorCycleSpeed;
      float rChannel = (pattern + lines * ridge) * (cos(blended.y + cycleT * 0.234) * 0.5 + 1.0);
      float gChannel = (pattern + vMask * ridge) * (sin(blended.x + cycleT * 1.745) * 0.5 + 1.0);
      float bChannel = (pattern + lines * ridge) * (cos(blended.x + cycleT * 0.534) * 0.5 + 1.0);

      vec3 col = (rChannel * uColor1 + gChannel * uColor2 + bChannel * uColor3) * uBrightness;
      float alpha = clamp(length(col), 0.0, 1.0);

      gl_FragColor = vec4(col, alpha);
    }
  `;

  function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vs = createShader(gl.VERTEX_SHADER, vertexShaderSrc);
  const fs = createShader(gl.FRAGMENT_SHADER, fragmentShaderSrc);
  if (!vs || !fs) return;

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    return;
  }

  gl.useProgram(program);

  const quadVerts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

  const aPosition = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  const uTimeLoc = gl.getUniformLocation(program, 'uTime');
  const uResLoc = gl.getUniformLocation(program, 'uResolution');
  const uSpeedLoc = gl.getUniformLocation(program, 'uSpeed');
  const uInnerLoc = gl.getUniformLocation(program, 'uInnerLines');
  const uOuterLoc = gl.getUniformLocation(program, 'uOuterLines');
  const uWarpLoc = gl.getUniformLocation(program, 'uWarpIntensity');
  const uRotLoc = gl.getUniformLocation(program, 'uRotation');
  const uFadeLoc = gl.getUniformLocation(program, 'uEdgeFadeWidth');
  const uCycleLoc = gl.getUniformLocation(program, 'uColorCycleSpeed');
  const uBrightLoc = gl.getUniformLocation(program, 'uBrightness');
  const uC1Loc = gl.getUniformLocation(program, 'uColor1');
  const uC2Loc = gl.getUniformLocation(program, 'uColor2');
  const uC3Loc = gl.getUniformLocation(program, 'uColor3');
  const uMouseLoc = gl.getUniformLocation(program, 'uMouse');
  const uMouseInfLoc = gl.getUniformLocation(program, 'uMouseInfluence');
  const uEnableMouseLoc = gl.getUniformLocation(program, 'uEnableMouse');

  const rotRad = (rotation * Math.PI) / 180;
  gl.uniform1f(uSpeedLoc, speed);
  gl.uniform1f(uInnerLoc, innerLineCount);
  gl.uniform1f(uOuterLoc, outerLineCount);
  gl.uniform1f(uWarpLoc, warpIntensity);
  gl.uniform1f(uRotLoc, rotRad);
  gl.uniform1f(uFadeLoc, edgeFadeWidth);
  gl.uniform1f(uCycleLoc, colorCycleSpeed);
  gl.uniform1f(uBrightLoc, brightness);
  gl.uniform3fv(uC1Loc, hexToVec3(color1));
  gl.uniform3fv(uC2Loc, hexToVec3(color2));
  gl.uniform3fv(uC3Loc, hexToVec3(color3));
  gl.uniform1f(uMouseInfLoc, mouseInfluence);
  gl.uniform1i(uEnableMouseLoc, enableMouseInteraction ? 1 : 0);

  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let currentMouse = [0.5, 0.5];
  let targetMouse = [0.5, 0.5];

  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    targetMouse = [
      (e.clientX - rect.left) / rect.width,
      1.0 - (e.clientY - rect.top) / rect.height
    ];
  }

  function handleMouseLeave() {
    targetMouse = [0.5, 0.5];
  }

  if (enableMouseInteraction) {
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
  }

  function resize() {
    const w = container.clientWidth || container.offsetWidth || window.innerWidth;
    const h = container.clientHeight || container.offsetHeight || window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uResLoc, w, h);
  }

  window.addEventListener('resize', resize);

  let animationFrameId;

  function render(time) {
    animationFrameId = requestAnimationFrame(render);
    gl.uniform1f(uTimeLoc, time * 0.001);

    if (enableMouseInteraction) {
      currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
      currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
      gl.uniform2f(uMouseLoc, currentMouse[0], currentMouse[1]);
    }

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  requestAnimationFrame(() => {
    resize();
    animationFrameId = requestAnimationFrame(render);
  });

  return {
    destroy: () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      if (enableMouseInteraction) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    }
  };
}

function renderMostUsedLanguages() {
  const container = document.getElementById('githubLanguages');
  if (!container) return;

  const skills = [
    { name: 'HTML', percent: 87, icon: 'devicon-html5-plain colored', accent: '#ff7a30' },
    { name: 'CSS', percent: 65, icon: 'devicon-css3-plain colored', accent: '#26d0ff' },
    { name: 'JavaScript', percent: 18, icon: 'devicon-javascript-plain colored', accent: '#f7d74c' },
    { name: 'Bootstrap', percent: 56, icon: 'devicon-bootstrap-plain colored', accent: '#8b5cf6' },
    { name: 'WordPress', percent: 67, icon: 'devicon-wordpress-plain colored', accent: '#2ec5ff' }
  ];

  container.innerHTML = skills.map((skill) => `
    <div class="language-card skill-progress-card p-5 rounded-2xl">
      <div class="skill-card-top">
        <div class="skill-card-brand" style="background:transparent; box-shadow:none; color:${skill.accent};">
          <i class="${skill.icon}" aria-hidden="true"></i>
        </div>
        <div class="skill-card-text">
          <span>${skill.name}</span>
        </div>
      </div>
      <div class="skill-progress-track">
        <span class="skill-progress-bar" style="width:${skill.percent}%; background:${skill.accent};"></span>
      </div>
    </div>
  `).join('');
}

function initThemeToggle() {
  const button = document.querySelector('.hero-theme');
  if (!button) return;

  const icon = button.querySelector('i');
  const apply = (light) => {
    document.body.classList.toggle('light-mode', light);
    if (icon) icon.className = light ? 'fas fa-sun' : 'fas fa-moon';
    button.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
    button.title = light ? 'Switch to dark mode' : 'Switch to light mode';
    localStorage.setItem('shariq-theme', light ? 'light' : 'dark');
  };

  const saved = localStorage.getItem('shariq-theme');
  apply(saved === 'light');
  button.addEventListener('click', () => apply(!document.body.classList.contains('light-mode')));
}

function initMobileMenu() {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    const icon = toggle.querySelector('i');
    if (icon) icon.className = open ? 'fas fa-times' : 'fas fa-bars';
  };

  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });
}

function initNavigationState() {
  const links = document.querySelectorAll('.hero-primary-nav a, .mobile-menu a');
  if (!links.length) return;

  links.forEach((link) => {
    link.addEventListener('pointerdown', () => {
      const target = link.getAttribute('href');
      links.forEach((item) => item.classList.toggle('active', item.getAttribute('href') === target));
    });
  });
}

function initContentAnimations() {
  if (!window.gsap || !window.ScrollTrigger) return;

  window.gsap.registerPlugin(window.ScrollTrigger);

  if (window.gsap.utils && window.gsap.utils.toArray) {
    window.gsap.utils.toArray('.journey-card').forEach((card, index) => {
      window.gsap.from(card, {
        opacity: 0,
        y: 80,
        duration: 0.5,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        delay: index * 0.1
      });
    });
  }

  const projectCards = document.querySelectorAll('.project-card');
  if (projectCards.length) {
    window.gsap.from(projectCards, {
      scrollTrigger: {
        trigger: '#projects',
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      },
      opacity: 0,
      y: 60,
      duration: 1,
      ease: 'power3.out'
    });
  }
}

function initPremiumPortfolioMotion() {
  const animatedTargets = document.querySelectorAll(
    '.hero-centered-content, .about-premium-copy, .about-photo-column, .journey-card, .tech-group, .tech-item, .language-card, .project-card, .blog-card, .contact-info, .contact-item, .contact-form-panel, .contact-heading, .contact-layout'
  );

  if (!animatedTargets.length) return;

  animatedTargets.forEach((element, index) => {
    element.classList.add('motion-reveal');
    element.style.transitionDelay = `${Math.min(index * 70, 380)}ms`;
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, {
    threshold: 0.18,
    rootMargin: '0px 0px -10px 0px'
  });

  animatedTargets.forEach((element) => revealObserver.observe(element));

}

function initHeroNameAnimation() {
  const title = document.querySelector('.hero-centered-title');
  if (!title || title.dataset.lettersReady === 'true') return;

  const text = title.textContent.trim();
  title.textContent = '';
  title.dataset.lettersReady = 'true';

  [...text].forEach((character, index) => {
    const letter = document.createElement('span');
    letter.className = character === ' ' ? 'hero-name-space' : 'hero-name-letter';
    letter.textContent = character === ' ' ? '\u00a0' : character;
    letter.style.setProperty('--letter-index', index);
    title.appendChild(letter);
  });
}

function initParticles() {
  if (typeof window.particlesJS !== 'function') return;
  window.particlesJS('particles-projects', {
    particles: {
      number: { value: 50 },
      color: { value: 'ffffff' },
      shape: { type: 'circle' },
      opacity: { value: 0.5, random: true },
      size: { value: 4, random: true },
      line_linked: {
        enable: true,
        distance: 150,
        color: 'ffffff',
        opacity: 0.4,
        width: 1
      },
      move: {
        enable: true,
        speed: 3,
        direction: 'none',
        out_mode: 'out'
      }
    },
    interactivity: {
      detect_on: 'canvas',
      events: {
        onhover: { enable: true, mode: 'grab' },
        onclick: { enable: true, mode: 'push' }
      },
      modes: {
        grab: { distance: 140, line_linked: { opacity: 1 } },
        push: { particles_nb: 4 }
      }
    },
    retina_detect: true
  });
}

function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) return;

  const submitBtn = document.getElementById('submitBtn');
  const submitText = document.getElementById('submitText');
  const submitLoading = document.getElementById('submitLoading');
  const formMessage = document.getElementById('formMessage');
  const messageText = document.getElementById('messageText');

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!submitBtn || !submitText || !submitLoading || !formMessage || !messageText) return;

    submitBtn.disabled = true;
    submitText.classList.add('hidden');
    submitLoading.classList.remove('hidden');

    const formData = new FormData(contactForm);
    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message')
    };

    try {
      const response = await fetch('https://formsubmit.co/ajax/shariq.mailbox1@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          _replyto: data.email,
          subject: `Portfolio Contact: ${data.subject}`,
          message: data.message,
          _subject: 'New message from Shariq Dilmurad Zai Portfolio',
          _template: 'table'
        })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Email service rejected the request.');
      }

      messageText.textContent = 'Message sent successfully. Thank you for reaching out!';
      formMessage.className = 'mt-4 p-4 rounded-lg bg-green-100 text-green-700 border border-green-200';
      formMessage.classList.remove('hidden');
      contactForm.reset();
    } catch (error) {
      const emailSubject = encodeURIComponent(`Portfolio Contact: ${data.subject}`);
      const emailBody = encodeURIComponent(
        `Name: ${data.firstName} ${data.lastName}\n` +
        `Email: ${data.email}\n` +
        `Subject: ${data.subject}\n\n` +
        `Message:\n${data.message}`
      );
      const mailtoLink = `mailto:shariq.mailbox1@gmail.com?subject=${emailSubject}&body=${emailBody}`;

      messageText.innerHTML = `Online sending is unavailable right now. <a href="${mailtoLink}" class="underline font-semibold">Click here to send it by email</a>.`;
      formMessage.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-700 border border-red-200';
      formMessage.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitText.classList.remove('hidden');
      submitLoading.classList.add('hidden');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderMostUsedLanguages();
  initThemeToggle();
  initMobileMenu();
  initNavigationState();
  initContactForm();

  if (document.getElementById('line-waves-container')) {
    initLineWaves('line-waves-container', {
      speed: 0.04,
      innerLineCount: 10,
      outerLineCount: 14,
      warpIntensity: 0.35,
      rotation: -45,
      brightness: 0.12,
      color1: '#1DCD9F',
      color2: '#1DCD9F',
      color3: '#1DCD9F',
      enableMouseInteraction: false,
      mouseInfluence: 0
    });
  }

  initParticles();
  initContentAnimations();
  initPremiumPortfolioMotion();
  initHeroNameAnimation();
});
