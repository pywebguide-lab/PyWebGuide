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

  // Каждый раздел — отдельная HTML-страница, активный пункт меню задан в разметке
  const mainEl = document.getElementById("content");

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

  /* Вкладки Flask / Django в окне кода на главной */
  const tabs = Array.prototype.slice.call(document.querySelectorAll(".window-tab"));

  function selectTab(tab, moveFocus) {
    tabs.forEach(function (item) {
      const selected = item === tab;
      const panel = document.getElementById(item.getAttribute("aria-controls"));

      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
      panel.classList.toggle("is-active", selected);
      panel.inert = !selected;
    });

    if (moveFocus) tab.focus();
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      selectTab(tab, false);
    });

    // Стрелки переключают вкладки, как принято для role="tablist"
    tab.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      selectTab(tabs[(index + step + tabs.length) % tabs.length], true);
    });
  });

  /* Copy code */
  document.addEventListener("click", async function (event) {
    const button = event.target.closest(".copy-btn");

    if (!button) return;

    const block = button.closest(".code-block, .window");
    // В окне с вкладками копируется код открытой вкладки
    const code = block ? block.querySelector(".is-active code") || block.querySelector("code") : null;

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
    const quizNext = document.getElementById("quiz-next");
    const quizNextProject = document.getElementById("quiz-next-project");
    const quizNextDocs = document.getElementById("quiz-next-docs");
    const QUIZ_COUNT = 5;

    // Персональный следующий шаг после теста: практика и документация выбранного фреймворка
    const nextSteps = {
      django: {
        project: "project.html#django",
        projectText: "Сделать первый проект на Django",
        docs: "https://docs.djangoproject.com/en/6.1/intro/tutorial01/",
        docsText: "Руководство Django 6.1"
      },
      flask: {
        project: "project.html#flask",
        projectText: "Сделать первый проект на Flask",
        docs: "https://flask.palletsprojects.com/en/stable/quickstart/",
        docsText: "Flask 3.1: Quickstart"
      }
    };

    function showQuizResult(text, modifier) {
      quizResult.textContent = text;
      quizResult.className = "quiz-result" + (modifier ? " " + modifier : "");
    }

    function showNextStep(framework) {
      if (!quizNext) return;

      const step = framework ? nextSteps[framework] : null;
      quizNext.hidden = !step;
      if (!step) return;

      quizNextProject.href = step.project;
      quizNextProject.textContent = step.projectText;
      quizNextDocs.href = step.docs;
      quizNextDocs.textContent = step.docsText;
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
        showNextStep(null);
        return;
      }

      // Вопросов нечётное число, поэтому ничьей быть не может
      const score = " (Django: " + django + ", Flask: " + flask + ")";

      if (django > flask) {
        showQuizResult("Тебе лучше подойдёт Django: готовая структура, ORM и админ-панель." + score, "is-django");
        showNextStep("django");
      } else {
        showQuizResult("Тебе лучше подойдёт Flask: минимализм, гибкость и понятный старт." + score, "");
        showNextStep("flask");
      }
    });

    quizForm.addEventListener("reset", function () {
      showQuizResult("", "");
      showNextStep(null);
    });
  }

  /* Прогресс обучения: отмеченные шаги сохраняются в localStorage */
  const PROGRESS_KEY = "pyweb_progress";

  function readProgress() {
    try {
      const data = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
      return data !== null && typeof data === "object" && !Array.isArray(data) ? data : {};
    } catch (error) {
      return {};
    }
  }

  function writeProgress(data) {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      return false;
    }
  }

  document.querySelectorAll("[data-progress]").forEach(function (box) {
    const key = box.dataset.progress;
    const list = document.querySelector('[data-progress-list="' + key + '"]');

    if (!list) return;

    const boxes = list.querySelectorAll("input[data-step]");
    const count = box.querySelector("[data-progress-count]");
    const fill = box.querySelector("[data-progress-fill]");
    const reset = box.querySelector("[data-progress-reset]");

    function update() {
      const done = Array.prototype.filter.call(boxes, function (input) {
        return input.checked;
      });

      count.textContent = done.length;
      fill.style.width = (boxes.length ? done.length / boxes.length * 100 : 0) + "%";
      if (reset) reset.hidden = done.length === 0;

      boxes.forEach(function (input) {
        input.closest(".timeline-item, .project-step").classList.toggle("is-done", input.checked);
      });
    }

    function save() {
      const data = readProgress();
      data[key] = Array.prototype.filter.call(boxes, function (input) {
        return input.checked;
      }).map(function (input) {
        return input.dataset.step;
      });
      writeProgress(data);
    }

    const saved = readProgress()[key];

    boxes.forEach(function (input) {
      input.checked = Array.isArray(saved) && saved.indexOf(input.dataset.step) !== -1;
      input.addEventListener("change", function () {
        save();
        update();
      });
    });

    if (reset) {
      reset.addEventListener("click", function () {
        boxes.forEach(function (input) {
          input.checked = false;
        });
        save();
        update();
      });
    }

    update();
  });

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

  /* Тема: тёмная или светлая, выбор сохраняется в localStorage */
  const themeToggle = document.querySelector(".theme-toggle");
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (themeToggle) themeToggle.setAttribute("aria-pressed", String(theme === "light"));
    if (themeMeta) themeMeta.setAttribute("content", theme === "light" ? "#f5f7fb" : "#0b0f16");
  }

  applyTheme(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);

      try {
        localStorage.setItem("pyweb_theme", next);
      } catch (error) {
        // Без localStorage тема просто не запомнится
      }
    });
  }

  /* Подсветка синтаксиса Python без сторонних библиотек */
  const PY_TOKENS = new RegExp([
    "(#.*$)",                                                  // 1 комментарий
    "([rbfuRBFU]{0,2}(?:\"\"\"[\\s\\S]*?\"\"\"|'''[\\s\\S]*?'''|\"(?:\\\\.|[^\"\\\\\\n])*\"|'(?:\\\\.|[^'\\\\\\n])*'))", // 2 строка
    "(@[A-Za-z_][\\w.]*)",                                     // 3 декоратор
    "\\b(def|class)(\\s+)([A-Za-z_]\\w*)",                     // 4-6 объявление функции или класса
    "\\b(True|False|None|\\d+(?:\\.\\d+)?)\\b",                // 7 константа или число
    "\\b(from|import|return|if|elif|else|for|in|while|with|as|try|except|finally|raise|not|and|or|is|lambda|pass|yield|async|await|global)\\b" // 8 ключевое слово
  ].join("|"), "gm");

  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function span(cls, text) {
    return '<span class="' + cls + '">' + escapeHtml(text) + "</span>";
  }

  function highlightPython(source) {
    let html = "";
    let last = 0;

    source.replace(PY_TOKENS, function (match, comment, string, decorator, decl, space, name, constant, keyword, offset) {
      html += escapeHtml(source.slice(last, offset));

      if (comment) html += span("tok-c", comment);
      else if (string) html += span("tok-s", string);
      else if (decorator) html += span("tok-d", decorator);
      else if (decl) html += span("tok-k", decl) + space + span("tok-f", name);
      else if (constant) html += span("tok-n", constant);
      else html += span("tok-k", keyword);

      last = offset + match.length;
      return match;
    });

    return html + escapeHtml(source.slice(last));
  }

  document.querySelectorAll("pre > code").forEach(function (code) {
    const block = code.closest(".code-block");
    const label = block ? block.querySelector(".code-head span") : null;
    const name = label ? label.textContent.trim() : "";

    // Команды терминала, HTML-шаблоны и SQL не подсвечиваем как Python
    if (/Терминал|\.html$|SQL/.test(name)) return;

    code.innerHTML = highlightPython(code.textContent);
  });

  /* Проверь себя: вопросы с правильными ответами и объяснениями */
  document.querySelectorAll(".knowledge-check").forEach(function (checkForm) {
    const groups = checkForm.querySelectorAll("fieldset[data-answer]");
    const score = checkForm.querySelector(".check-score");

    function clear() {
      checkForm.querySelectorAll(".quiz-option").forEach(function (option) {
        option.classList.remove("is-right", "is-wrong");
      });
      checkForm.querySelectorAll(".check-explain").forEach(function (explain) {
        explain.hidden = true;
      });
      score.textContent = "";
      score.className = "check-score";
    }

    checkForm.addEventListener("submit", function (event) {
      event.preventDefault();
      clear();

      let right = 0;
      let answered = 0;

      groups.forEach(function (group) {
        const chosen = group.querySelector("input:checked");
        const correct = group.querySelector('input[value="' + group.dataset.answer + '"]');

        if (!chosen) return;

        answered++;
        correct.closest(".quiz-option").classList.add("is-right");

        if (chosen === correct) {
          right++;
        } else {
          chosen.closest(".quiz-option").classList.add("is-wrong");
        }

        group.querySelector(".check-explain").hidden = false;
      });

      if (answered < groups.length) {
        score.textContent = "Ответь на все вопросы: отвечено " + answered + " из " + groups.length + ".";
        score.className = "check-score quiz-result is-error";
        return;
      }

      score.textContent = "Верно " + right + " из " + groups.length + (right === groups.length
        ? ". Отлично, можно идти дальше!"
        : ". Посмотри объяснения под вопросами.");
    });

    checkForm.addEventListener("reset", clear);
  });

  /* Продолжить обучение: незавершённые варианты первого проекта */
  const continueBox = document.getElementById("continue");

  if (continueBox) {
    const progress = readProgress();
    let unfinished = 0;

    continueBox.querySelectorAll("[data-track]").forEach(function (link) {
      const steps = progress[link.dataset.track];
      const done = Array.isArray(steps) ? steps.length : 0;
      const total = Number(link.dataset.total);
      const inProgress = done > 0 && done < total;

      link.hidden = !inProgress;
      if (!inProgress) return;

      unfinished++;
      link.querySelector("[data-track-count]").textContent = done + " из " + total;
    });

    continueBox.hidden = unfinished === 0;
  }
})();
