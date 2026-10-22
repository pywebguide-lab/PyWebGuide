(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const menuButton = document.querySelector(".burger");
  const nav = document.getElementById("site-nav");

  function closeMenu() {
    if (!nav || !menuButton) return;
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Открыть меню");
  }

  if (menuButton && nav) {
    menuButton.addEventListener("click", function () {
      const isOpen = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
    });

    nav.querySelectorAll(".nav-link").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    // Клик вне открытого меню закрывает его
    document.addEventListener("click", function (event) {
      if (nav.classList.contains("open") && !nav.contains(event.target) && !menuButton.contains(event.target)) {
        closeMenu();
      }
    });
  }

  const routes = {
    "/": {
      title: "PyWeb Guide — Python в веб-разработке"
    },
    "/about": {
      title: "О Python — PyWeb Guide"
    },
    "/frameworks": {
      title: "Django и Flask — PyWeb Guide"
    },
    "/contacts": {
      title: "Контакты — PyWeb Guide"
    }
  };

  const pages = document.querySelectorAll(".page");
  const navLinks = document.querySelectorAll(".nav-link");
  const mainEl = document.getElementById("content");
  let pendingScroll = null;

  function normalizeHash(hash) {
    if (!hash || hash === "#") return "/";

    try {
      hash = decodeURIComponent(hash);
    } catch (error) {
      hash = "/";
    }

    hash = hash.replace(/^#/, "");

    if (!hash.startsWith("/")) {
      hash = "/" + hash;
    }

    if (hash.length > 1 && hash.endsWith("/")) {
      hash = hash.slice(0, -1);
    }

    return hash || "/";
  }

  function render(moveFocus) {
    let path = normalizeHash(window.location.hash);

    if (!routes[path]) {
      path = "/";
    }

    pages.forEach(function (page) {
      page.hidden = page.dataset.route !== path;
    });

    navLinks.forEach(function (link) {
      const isActive = normalizeHash(link.getAttribute("href") || "") === path;

      link.classList.toggle("active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    document.title = routes[path].title;
    closeMenu();

    // При переходе между разделами фокус переносится в main,
    // чтобы клавиатура и экранный диктор начинали с нового раздела
    if (moveFocus && mainEl) {
      mainEl.focus({ preventScroll: true });
    }

    const scrollTarget = pendingScroll ? document.getElementById(pendingScroll) : null;
    pendingScroll = null;

    if (scrollTarget) {
      scrollTarget.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }

  window.addEventListener("hashchange", function () {
    render(true);
  });
  render(false);

  /* Доступность и вспомогательные функции */
  const skipLink = document.querySelector(".skip-link");

  // «Перейти к содержанию»: фокус на main, маршрут не ломается
  if (skipLink && mainEl) {
    skipLink.addEventListener("click", function (event) {
      event.preventDefault();
      mainEl.focus();
    });
  }

  // Escape закрывает мобильное меню и возвращает фокус на бургер
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && nav && nav.classList.contains("open")) {
      closeMenu();
      if (menuButton) menuButton.focus();
    }
  });

  // Ссылки с переходом к блоку внутри раздела (например, к мини-тесту)
  document.querySelectorAll("a[data-scroll]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      const id = link.dataset.scroll;

      if (normalizeHash(window.location.hash) === normalizeHash(link.getAttribute("href"))) {
        event.preventDefault();
        const target = document.getElementById(id);
        if (target) target.scrollIntoView();
      } else {
        pendingScroll = id;
      }
    });
  });

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();

      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (error) {
        ok = false;
      }

      document.body.removeChild(area);
      ok ? resolve() : reject(new Error("copy failed"));
    });
  }

  /* Reveal on scroll */
  const revealElements = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach(function (element) {
      element.classList.add("visible");
    });
  } else {
    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.14
    });

    revealElements.forEach(function (element) {
      revealObserver.observe(element);
    });
  }

  /* Typing effect */
  const typedElement = document.getElementById("typed-text");

  if (typedElement && !prefersReducedMotion) {
    const words = ["Django", "Flask", "backend", "базы данных", "практики"];
    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function typeLoop() {
      const currentWord = words[wordIndex];

      if (!deleting) {
        charIndex++;
        typedElement.textContent = currentWord.slice(0, charIndex);

        if (charIndex === currentWord.length) {
          deleting = true;
          setTimeout(typeLoop, 1300);
          return;
        }
      } else {
        charIndex--;
        typedElement.textContent = currentWord.slice(0, charIndex);

        if (charIndex === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
        }
      }

      setTimeout(typeLoop, deleting ? 45 : 85);
    }

    setTimeout(typeLoop, 500);
  }

  /* Progress + toTop */
  const progress = document.getElementById("progress");
  const toTop = document.querySelector(".to-top");

  function updateScrollUI() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (progress) {
      progress.style.width = scrolled + "%";
    }

    if (toTop) {
      toTop.classList.toggle("visible", scrollTop > 350);
    }
  }

  window.addEventListener("scroll", updateScrollUI, {
    passive: true
  });

  updateScrollUI();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth"
      });
    });
  }

  /* Copy code */
  document.addEventListener("click", async function (event) {
    const button = event.target.closest(".copy-btn");

    if (!button) return;

    const block = button.closest(".code-block, .window");
    const code = block ? block.querySelector("code") : null;

    if (!code) return;

    const oldText = button.textContent;

    try {
      await copyText(code.innerText);
      button.textContent = "Скопировано";
      button.classList.add("copied");

      setTimeout(function () {
        button.textContent = oldText;
        button.classList.remove("copied");
      }, 1800);
    } catch (error) {
      button.textContent = "Ошибка";

      setTimeout(function () {
        button.textContent = oldText;
      }, 1800);
    }
  });

  /* Quiz */
  const quizForm = document.getElementById("quiz-form");

  if (quizForm) {
    const quizResult = document.getElementById("quiz-result");
    const QUIZ_COUNT = 5;

    function showQuizResult(text, modifier) {
      quizResult.textContent = text;
      quizResult.className = "quiz-result" + (modifier ? " " + modifier : "");
    }

    quizForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const data = new FormData(quizForm);
      let django = 0;
      let flask = 0;

      for (let i = 1; i <= QUIZ_COUNT; i++) {
        const answer = data.get("q" + i);

        if (answer === "django") django++;
        if (answer === "flask") flask++;
      }

      const answered = django + flask;

      if (answered < QUIZ_COUNT) {
        showQuizResult("Ответь на все вопросы: отвечено " + answered + " из " + QUIZ_COUNT + ".", "is-error");
        return;
      }

      // Вопросов нечётное число, поэтому ничьей быть не может
      const score = " (Django: " + django + ", Flask: " + flask + ")";

      if (django > flask) {
        showQuizResult("Тебе лучше подойдёт Django: готовая структура, ORM и админ-панель." + score, "is-django");
      } else {
        showQuizResult("Тебе лучше подойдёт Flask: минимализм, гибкость и понятный старт." + score, "");
      }
    });

    quizForm.addEventListener("reset", function () {
      showQuizResult("", "");
    });
  }

  /* Contact form: проверка и локальное сохранение */
  const form = document.getElementById("contact-form");

  if (form) {
    const STORE_KEY = "pyweb_messages";
    const status = document.getElementById("form-status");
    const savedList = document.getElementById("saved-list");
    const clearButton = document.getElementById("clear-saved");
    const formCard = form.closest(".form-card");
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function setStatus(message, type) {
      status.textContent = message;
      status.className = "form-status " + type;
    }

    function shakeForm() {
      if (!formCard || prefersReducedMotion) return;

      formCard.classList.remove("shake");
      void formCard.offsetWidth;
      formCard.classList.add("shake");

      formCard.addEventListener("animationend", function () {
        formCard.classList.remove("shake");
      }, {
        once: true
      });
    }

    function isMessage(item) {
      return item !== null &&
        typeof item === "object" &&
        typeof item.name === "string" &&
        typeof item.email === "string" &&
        typeof item.message === "string";
    }

    // Чтение с проверкой структуры. Повреждённая запись не удаляется молча
    // и не перезаписывается: возвращается ошибка, пользователь решает сам.
    function readMessages() {
      let raw;

      try {
        raw = localStorage.getItem(STORE_KEY);
      } catch (error) {
        return { ok: false, reason: "unavailable", items: [] };
      }

      if (!raw) return { ok: true, items: [] };

      let data = null;

      try {
        data = JSON.parse(raw);
      } catch (error) {
        data = null;
      }

      if (!Array.isArray(data) || !data.every(isMessage)) {
        return { ok: false, reason: "corrupted", items: [] };
      }

      return { ok: true, items: data };
    }

    function addInfo(text) {
      const li = document.createElement("li");
      li.textContent = text;
      savedList.appendChild(li);
    }

    // Текст пользователя выводится только через textContent
    function renderSaved() {
      if (!savedList) return;

      savedList.textContent = "";

      const result = readMessages();

      if (clearButton) {
        clearButton.hidden = !(result.items.length || result.reason === "corrupted");
      }

      if (!result.ok) {
        addInfo(result.reason === "corrupted"
          ? "Сохранённые данные повреждены. Их можно очистить кнопкой ниже."
          : "localStorage недоступен в этом браузере.");
        return;
      }

      if (!result.items.length) {
        addInfo("Пока нет сохранённых сообщений.");
        return;
      }

      result.items.slice(-5).reverse().forEach(function (item) {
        const li = document.createElement("li");
        const name = document.createElement("strong");
        const meta = document.createElement("small");
        const text = document.createElement("p");
        const date = new Date(item.date);

        name.textContent = item.name;
        meta.textContent = " · " + item.email + (isNaN(date) ? "" : " · " + date.toLocaleString("ru-RU"));
        text.textContent = item.message;

        li.appendChild(name);
        li.appendChild(meta);
        li.appendChild(text);
        savedList.appendChild(li);
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const fields = form.elements;
      const name = fields.namedItem("name").value.trim();
      const email = fields.namedItem("email").value.trim();
      const message = fields.namedItem("message").value.trim();

      if (!name || !email || !message) {
        setStatus("Заполните все поля: имя, email и сообщение.", "error");
        shakeForm();
        return;
      }

      if (!emailPattern.test(email)) {
        setStatus("Проверьте корректность email, например name@example.com.", "error");
        shakeForm();
        return;
      }

      const result = readMessages();

      if (!result.ok) {
        setStatus(result.reason === "corrupted"
          ? "Не удалось сохранить: сохранённые ранее данные повреждены."
          : "Не удалось сохранить: localStorage недоступен (например, в приватном режиме).", "error");
        shakeForm();
        return;
      }

      const saved = result.items.concat({
        name: name,
        email: email,
        message: message,
        date: new Date().toISOString()
      }).slice(-50);

      try {
        localStorage.setItem("pyweb_messages", JSON.stringify(saved));
      } catch (error) {
        status.textContent = "Не удалось сохранить сообщение.";
        status.className = "form-status error";
        return;
      }

      setStatus("Сообщение сохранено локально в этом браузере. Оно никуда не отправлено.", "success");
      form.reset();
      renderSaved();
    });

    if (clearButton) {
      clearButton.addEventListener("click", function () {
        try {
          localStorage.removeItem(STORE_KEY);
          setStatus("Сохранённые сообщения удалены.", "success");
        } catch (error) {
          setStatus("Не удалось очистить: localStorage недоступен.", "error");
        }

        renderSaved();
      });
    }

    renderSaved();
  }
})();
