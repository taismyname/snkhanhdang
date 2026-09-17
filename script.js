/* =========================================================
   CONFIG — chỉnh mấy dòng dưới đây cho phù hợp với người nhận
   ========================================================= */
const CONFIG = {
  recipientName: "Khánh Đăng",       // đổi thành tên người bạn muốn tặng, vd: "Linh"
  // Muốn đổi lời dẫn, lời chúc dài, lời chúc cuối -> sửa trực tiếp trong index.html
  // (mình để trong HTML cho dễ chỉnh câu chữ nhiều dòng)
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("recipient-name").textContent = CONFIG.recipientName;

  setRealViewportHeight();
  initSparks();
  initIntroOpen();
  initScrollReveal();
  initGiftBox();
  initPhotoParallax();
});

/* =========================================================
   FIX 100VH TRÊN SAFARI iOS
   (thanh địa chỉ co giãn làm 100vh không ổn định)
   ========================================================= */
function setRealViewportHeight() {
  const setVh = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };
  setVh();
  window.addEventListener("resize", setVh);
  window.addEventListener("orientationchange", setVh);
}

/* =========================================================
   HẠT SÁNG TRÔI NHẸ TRÊN MÀN HÌNH MỞ ĐẦU (canvas, nhẹ, GPU-friendly)
   ========================================================= */
function initSparks() {
  const canvas = document.getElementById("sparks-canvas");
  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Bảng màu rực rỡ cho hạt sáng (khớp với các biến màu trong style.css)
  const SPARK_COLORS = ["27, 164, 210", "232, 73, 125", "255, 177, 0", "34, 195, 182"];

  let width, height, dpr;
  let particles = [];
  let rafId = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth = canvas.offsetWidth;
    height = canvas.clientHeight = canvas.offsetHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createParticles() {
    const count = Math.min(28, Math.floor((width * height) / 26000));
    particles = Array.from({ length: count }, () => spawnParticle(true));
  }

  function spawnParticle(randomY) {
    return {
      x: Math.random() * width,
      y: randomY ? Math.random() * height : height + 10,
      r: Math.random() * 1.4 + 0.4,
      speed: Math.random() * 0.18 + 0.05,
      drift: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.5 + 0.15,
      flicker: Math.random() * 0.02 + 0.005,
      flickerDir: 1,
      color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
    };
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      p.y -= p.speed;
      p.x += p.drift;
      p.alpha += p.flicker * p.flickerDir;
      if (p.alpha > 0.65 || p.alpha < 0.1) p.flickerDir *= -1;

      if (p.y < -10) Object.assign(p, spawnParticle(false));

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
      ctx.fill();
    });
    rafId = requestAnimationFrame(draw);
  }

  resize();
  createParticles();

  if (!prefersReducedMotion) {
    draw();
  } else {
    // Vẽ tĩnh một lần, không animate liên tục
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
      ctx.fill();
    });
  }

  window.addEventListener("resize", () => {
    resize();
    createParticles();
  });

  // Dừng animation khi tab không hiển thị -> đỡ hao pin
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!document.hidden && !prefersReducedMotion && !rafId) {
      draw();
    }
  });
}

/* =========================================================
   MỞ MÀN HÌNH INTRO -> HIỆN GREETING
   ========================================================= */
function initIntroOpen() {
  const introScreen = document.getElementById("intro");
  const openBtn = document.getElementById("open-btn");
  const greetingTitle = document.getElementById("greeting-title");
  const htmlEl = document.documentElement;
  const bodyEl = document.body;

  let hasOpened = false;

  openBtn.addEventListener("click", () => {
    if (hasOpened) return;
    hasOpened = true;

    introScreen.classList.add("is-closing");

    const finishOpen = () => {
      introScreen.classList.add("is-hidden");
      htmlEl.classList.remove("is-locked");
      bodyEl.classList.remove("is-locked");
      greetingTitle.classList.add("is-revealed");
      introScreen.removeEventListener("transitionend", finishOpen);
    };

    introScreen.addEventListener("transitionend", finishOpen);
    // fallback nếu transitionend không bắn (một số trường hợp trên Safari cũ)
    setTimeout(finishOpen, 1000);
  });
}

/* =========================================================
   SCROLL REVEAL CHO ĐOẠN THƯ (IntersectionObserver)
   ========================================================= */
function initScrollReveal() {
  const targets = document.querySelectorAll(".reveal-up");

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.35, rootMargin: "0px 0px -8% 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

/* =========================================================
   HỘP QUÀ + CONFETTI + LỜI CHÚC CUỐI
   ========================================================= */
function initGiftBox() {
  const giftBox = document.getElementById("gift-box");
  const tapHint = document.getElementById("gift-tap-hint");
  const finalMessage = document.getElementById("final-message");

  let opened = false;

  giftBox.addEventListener("click", () => {
    if (opened) return;
    opened = true;

    giftBox.classList.add("is-opened");
    tapHint.classList.add("is-hidden");

    fireConfetti();

    setTimeout(() => {
      finalMessage.classList.add("is-visible");
    }, 350);
  });
}

/* Confetti nhẹ, tự chạy 1 lần rồi dừng hẳn — không dùng thư viện ngoài */
function fireConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = (canvas.width = window.innerWidth * dpr);
  const height = (canvas.height = window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (prefersReducedMotion) {
    return; // tôn trọng người dùng nhạy cảm với chuyển động
  }

  const colors = ["#1BA4D2", "#E8497D", "#FFB100", "#22C3B6"];
  const originX = window.innerWidth / 2;
  const originY = window.innerHeight * 0.42;

  const particleCount = window.innerWidth < 420 ? 70 : 100;

  const particles = Array.from({ length: particleCount }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 3;
    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed * (Math.random() * 0.6 + 0.5),
      vy: Math.sin(angle) * speed - 4,
      size: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
      shape: Math.random() > 0.5 ? "circle" : "rect",
      life: 1,
    };
  });

  const gravity = 0.16;
  const drag = 0.985;
  const duration = 1800;
  const start = performance.now();

  function frame(now) {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach((p) => {
      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.life = 1 - t;

      ctx.save();
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx.restore();
    });

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  requestAnimationFrame(frame);
}

/* =========================================================
   PARALLAX NHẸ CHO ẢNH NỀN (khu vực ảnh kỷ niệm)
   - Chỉ chạy khi section đang hiển thị trên màn hình (đỡ tốn pin)
   - Tôn trọng prefers-reduced-motion (không di chuyển nếu người dùng bật)
   ========================================================= */
function initPhotoParallax() {
  const section = document.getElementById("photo");
  const bgImg = document.getElementById("photo-bg-img");
  if (!section || !bgImg) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return; // giữ ảnh nền đứng yên, không thêm chuyển động

  const RANGE = 26; // biên độ di chuyển tối đa (px) — rất nhẹ, không gây chóng mặt
  let ticking = false;
  let listening = false;

  function updateParallax() {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // progress: -1 (section ở dưới màn hình) -> 0 (giữa màn hình) -> 1 (section ở trên màn hình)
    const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
    const offset = Math.max(-1, Math.min(1, progress)) * RANGE;
    bgImg.style.transform = `translate3d(-50%, calc(-50% + ${offset.toFixed(1)}px), 0) scale(1.12)`;
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  function startListening() {
    if (listening) return;
    listening = true;
    window.addEventListener("scroll", onScroll, { passive: true });
    updateParallax();
  }

  function stopListening() {
    if (!listening) return;
    listening = false;
    window.removeEventListener("scroll", onScroll);
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startListening();
          } else {
            stopListening();
          }
        });
      },
      { rootMargin: "20% 0px 20% 0px" }
    );
    observer.observe(section);
  } else {
    // fallback cho trình duyệt rất cũ: chạy parallax thường trực
    startListening();
  }
}