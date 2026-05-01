const panelConfig = {
  title: "Sun-Panel",
  searchEngines: [
    {
      id: "bing",
      name: "Bing",
      url: "https://www.bing.com/search?q={query}",
    },
    {
      id: "google",
      name: "Google",
      url: "https://www.google.com/search?q={query}",
    },
    {
      id: "github",
      name: "GitHub",
      url: "https://github.com/search?q={query}",
    },
    {
      id: "bilibili",
      name: "B站",
      url: "https://search.bilibili.com/all?keyword={query}",
    },
  ],
  groups: [
    {
      title: "APP",
      links: [
        {
          title: "路由器",
          subtitle: "iStoreOS",
          url: "http://192.168.100.1",
          icon: "router",
          fallback: "R",
          accent: "#ff8d6a",
        },
        {
          title: "个人网站主页",
          subtitle: "个人网站",
          url: "https://example.com",
          icon: "home",
          fallback: "H",
          accent: "#8be8ff",
        },
        {
          title: "bilibili",
          subtitle: "视频",
          url: "https://www.bilibili.com",
          icon: "clapperboard",
          fallback: "B",
          accent: "#fb7299",
        },
        {
          title: "YouTube",
          subtitle: "视频",
          url: "https://www.youtube.com",
          icon: "play",
          fallback: "Y",
          accent: "#ff5a5f",
        },
        {
          title: "壁纸",
          subtitle: "动态壁纸",
          url: "https://wallhaven.cc",
          icon: "image",
          fallback: "W",
          accent: "#67e8a5",
        },
        {
          title: "Loop",
          subtitle: "效率入口",
          url: "https://loop.cloud.microsoft",
          icon: "refresh-cw",
          fallback: "L",
          accent: "#8f6cff",
        },
      ],
    },
    {
      title: "需要完成的项目",
      links: [
        {
          title: "自建全球互联",
          subtitle: "Network",
          url: "https://github.com",
          icon: "globe-2",
          fallback: "G",
          accent: "#7dd3fc",
        },
        {
          title: "Echo's",
          subtitle: "Project",
          url: "https://github.com",
          icon: "sparkles",
          fallback: "E",
          accent: "#ffd166",
        },
        {
          title: "GitHub",
          subtitle: "Code",
          url: "https://github.com",
          icon: "github",
          fallback: "GH",
          accent: "#cfd9e8",
        },
      ],
    },
  ],
};

const defaultAdmin = {
  account: "root",
  password: "password",
};

const storageKeys = {
  searchEngine: "sun-panel-search-engine",
  panelState: "sun-panel-state",
  legacyCustomLinks: "sun-panel-custom-links",
  adminPassword: "sun-panel-admin-password",
  adminAuth: "sun-panel-admin-auth",
};

let activeSearchEngine =
  localStorage.getItem(storageKeys.searchEngine) || panelConfig.searchEngines[0].id;

const $ = (selector) => document.querySelector(selector);

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
    document.documentElement.classList.add("lucide-ready");
  }
}

function readStoredValue(key, fallback) {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
}

function getAdminPassword() {
  return localStorage.getItem(storageKeys.adminPassword) || defaultAdmin.password;
}

function isAuthenticated() {
  return sessionStorage.getItem(storageKeys.adminAuth) === "true";
}

function makeId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getFallback(text) {
  return text.trim().slice(0, 2).toUpperCase() || "N";
}

function isLikelyUrl(value) {
  return (
    /^https?:\/\//i.test(value) ||
    /^localhost(:\d+)?(\/.*)?$/i.test(value) ||
    /^(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/i.test(value) ||
    /^[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(value)
  );
}

function shouldOpenWithHttp(value) {
  return (
    /^localhost(:\d+)?(\/.*)?$/i.test(value) ||
    /^(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/i.test(value)
  );
}

function normalizeUrl(value) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${shouldOpenWithHttp(value) ? "http" : "https"}://${value}`;
}

function normalizeCustomUrl(rawValue) {
  const value = rawValue.trim();

  if (!value || !isLikelyUrl(value)) {
    throw new Error("请输入有效链接");
  }

  const url = new URL(normalizeUrl(value));

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("链接仅支持 http 或 https");
  }

  return url.href;
}

function safeHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function normalizeLinks(links, groupIndex = 0) {
  if (!Array.isArray(links)) {
    return [];
  }

  return links
    .map((link, linkIndex) => {
      if (!link || !link.title || !link.url) {
        return null;
      }

      try {
        return {
          id: link.id || `default-link-${groupIndex}-${linkIndex}`,
          title: String(link.title).trim(),
          subtitle: String(link.subtitle || "").trim(),
          url: normalizeCustomUrl(String(link.url)),
          icon: String(link.icon || "bookmark").trim() || "bookmark",
          fallback: String(link.fallback || getFallback(String(link.title))).trim(),
          accent: String(link.accent || "#72d6ff").trim(),
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function createDefaultPanelState() {
  return {
    title: panelConfig.title,
    groups: panelConfig.groups.map((group, groupIndex) => ({
      id: `default-group-${groupIndex}`,
      title: group.title,
      links: normalizeLinks(group.links, groupIndex),
    })),
  };
}

function normalizePanelState(rawState) {
  const state = rawState && typeof rawState === "object" ? rawState : {};
  const rawGroups = Array.isArray(state.groups) ? state.groups : [];

  return {
    title: String(state.title || panelConfig.title).trim() || panelConfig.title,
    groups: rawGroups.map((group, groupIndex) => {
      const safeGroup = group && typeof group === "object" ? group : {};

      return {
        id: safeGroup.id || `group-${groupIndex}-${makeId()}`,
        title: String(safeGroup.title || "未命名分组").trim() || "未命名分组",
        links: normalizeLinks(safeGroup.links, groupIndex),
      };
    }),
  };
}

function getPanelState() {
  const storedState = readStoredValue(storageKeys.panelState, null);

  if (storedState && Array.isArray(storedState.groups)) {
    return normalizePanelState(storedState);
  }

  const state = createDefaultPanelState();
  const legacyLinks = normalizeLinks(readStoredValue(storageKeys.legacyCustomLinks, []), 99);

  if (legacyLinks.length) {
    state.groups.push({
      id: "legacy-custom-group",
      title: "我的添加",
      links: legacyLinks,
    });
  }

  savePanelState(state);
  return state;
}

function savePanelState(state) {
  localStorage.setItem(storageKeys.panelState, JSON.stringify(normalizePanelState(state)));
}

function applyPanelTitle(state = getPanelState()) {
  document.title = state.title;
  $("#site-title").textContent = state.title;

  const input = $("#panel-title-input");
  if (input) {
    input.value = state.title;
  }
}

function updateClock() {
  const now = new Date();
  const clock = $("#clock");
  const date = $("#date");

  clock.textContent = now.toLocaleTimeString("zh-CN", { hour12: false });
  clock.dateTime = now.toISOString();
  date.textContent = `${now.getMonth() + 1}-${now.getDate()} ${new Intl.DateTimeFormat(
    "zh-CN",
    { weekday: "short" },
  ).format(now)}`;
}

function resolveDestination(rawValue) {
  const value = rawValue.trim();

  if (!value) {
    return "";
  }

  if (isLikelyUrl(value)) {
    return normalizeUrl(value);
  }

  const engine =
    panelConfig.searchEngines.find((item) => item.id === activeSearchEngine) ||
    panelConfig.searchEngines[0];
  return engine.url.replace("{query}", encodeURIComponent(value));
}

function renderSearchTabs() {
  const tabs = $("#search-tabs");
  tabs.innerHTML = "";

  panelConfig.searchEngines.forEach((engine) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = engine.name;
    button.setAttribute("aria-pressed", String(engine.id === activeSearchEngine));
    button.addEventListener("click", () => {
      activeSearchEngine = engine.id;
      localStorage.setItem(storageKeys.searchEngine, activeSearchEngine);
      renderSearchTabs();
      $("#search-input").focus();
    });
    tabs.append(button);
  });
}

function renderLinks() {
  const state = getPanelState();
  const zone = $("#link-zone");
  const groupTemplate = $("#group-template");
  const cardTemplate = $("#card-template");

  applyPanelTitle(state);
  zone.innerHTML = "";

  state.groups.forEach((group) => {
    const groupNode = groupTemplate.content.cloneNode(true);
    const section = groupNode.querySelector(".link-group");
    const title = groupNode.querySelector("h2");
    const grid = groupNode.querySelector(".link-grid");

    title.textContent = group.title;

    group.links.forEach((link) => {
      const cardNode = cardTemplate.content.cloneNode(true);
      const card = cardNode.querySelector(".nav-card");
      const icon = cardNode.querySelector(".card-icon i");
      const fallback = cardNode.querySelector(".icon-fallback");

      card.href = link.url;
      card.title = link.title;
      card.style.setProperty("--icon-bg", link.accent || "#72d6ff");
      icon.dataset.lucide = link.icon || "bookmark";
      fallback.textContent = link.fallback || getFallback(link.title);
      cardNode.querySelector("strong").textContent = link.title;
      cardNode.querySelector("small").textContent = link.subtitle || safeHostname(link.url);
      grid.append(cardNode);
    });

    zone.append(section);
  });

  refreshIcons();
}

function showFeedback(message, isError = false) {
  const feedback = $("#admin-feedback");
  feedback.textContent = message;
  feedback.classList.toggle("is-error", isError);
}

function renderGroupOptions(selectedGroupId = "") {
  const state = getPanelState();
  const select = $("#link-group");
  const submitButton = $("#link-form .primary-button");
  const currentValue = selectedGroupId || select.value;

  select.innerHTML = "";

  if (!state.groups.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "请先添加分组";
    select.append(option);
    select.disabled = true;
    submitButton.disabled = true;
    return;
  }

  state.groups.forEach((group) => {
    const option = document.createElement("option");
    option.value = group.id;
    option.textContent = group.title;
    select.append(option);
  });

  select.disabled = false;
  submitButton.disabled = false;
  select.value = state.groups.some((group) => group.id === currentValue)
    ? currentValue
    : state.groups[0].id;
}

function renderGroupList() {
  const state = getPanelState();
  const list = $("#group-list");

  list.innerHTML = "";

  if (!state.groups.length) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = "暂无分组";
    list.append(empty);
    return;
  }

  state.groups.forEach((group) => {
    const row = document.createElement("div");
    const input = document.createElement("input");
    const saveButton = document.createElement("button");
    const deleteButton = document.createElement("button");

    row.className = "group-row";
    input.type = "text";
    input.value = group.title;
    input.maxLength = 32;
    input.setAttribute("aria-label", `修改分组 ${group.title}`);
    saveButton.className = "mini-button";
    saveButton.type = "button";
    saveButton.dataset.saveGroupId = group.id;
    saveButton.textContent = "保存";
    deleteButton.className = "mini-button";
    deleteButton.type = "button";
    deleteButton.dataset.deleteGroupId = group.id;
    deleteButton.textContent = "删除";

    row.append(input, saveButton, deleteButton);
    list.append(row);
  });
}

function getSafeColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : "#72d6ff";
}

function createEditField(labelText, options) {
  const label = document.createElement("label");
  const span = document.createElement("span");
  const input = document.createElement("input");

  span.textContent = labelText;
  input.name = options.name;
  input.type = options.type || "text";
  input.value = options.value || "";

  if (options.maxLength) {
    input.maxLength = options.maxLength;
  }

  if (options.placeholder) {
    input.placeholder = options.placeholder;
  }

  if (options.inputMode) {
    input.inputMode = options.inputMode;
  }

  if (options.required) {
    input.required = true;
  }

  label.append(span, input);
  return label;
}

function renderCustomList(forceOpenGroupId = "") {
  const state = getPanelState();
  const list = $("#custom-list");
  const openGroupIds = new Set(
    Array.from(list.querySelectorAll("[data-manage-group-id][open]")).map(
      (item) => item.dataset.manageGroupId,
    ),
  );

  list.innerHTML = "";

  if (!state.groups.length) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = "暂无分组，请先在分组管理中添加分组";
    list.append(empty);
    return;
  }

  state.groups.forEach((group) => {
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    const title = document.createElement("span");
    const count = document.createElement("small");
    const icon = document.createElement("i");
    const groupList = document.createElement("div");

    details.className = "link-manage-group";
    details.dataset.manageGroupId = group.id;
    details.open = openGroupIds.has(group.id) || forceOpenGroupId === group.id;
    summary.className = "link-group-summary";
    title.textContent = group.title;
    count.textContent = `${group.links.length} 个链接`;
    icon.dataset.lucide = "chevron-down";
    groupList.className = "group-link-list";

    summary.append(title, count, icon);
    details.append(summary, groupList);

    if (!group.links.length) {
      const empty = document.createElement("p");
      empty.className = "admin-empty";
      empty.textContent = "这个分组下暂无链接";
      groupList.append(empty);
      list.append(details);
      return;
    }

    group.links.forEach((link) => {
      const form = document.createElement("form");
      const saveButton = document.createElement("button");
      const deleteButton = document.createElement("button");

      form.className = "link-edit-form";
      form.dataset.groupId = group.id;
      form.dataset.linkId = link.id;
      form.append(
        createEditField("标题", {
          name: "edit-title",
          value: link.title,
          maxLength: 30,
          required: true,
        }),
        createEditField("标签", {
          name: "edit-tag",
          value: link.subtitle,
          maxLength: 40,
        }),
        createEditField("链接", {
          name: "edit-url",
          value: link.url,
          inputMode: "url",
          placeholder: "https://example.com",
          required: true,
        }),
        createEditField("图标", {
          name: "edit-icon",
          value: link.icon,
          maxLength: 24,
        }),
        createEditField("颜色", {
          name: "edit-color",
          type: "color",
          value: getSafeColor(link.accent),
        }),
      );

      saveButton.className = "mini-button";
      saveButton.type = "submit";
      saveButton.textContent = "保存";
      deleteButton.className = "mini-button";
      deleteButton.type = "button";
      deleteButton.dataset.deleteLinkId = link.id;
      deleteButton.dataset.groupId = group.id;
      deleteButton.textContent = "删除";

      form.append(saveButton, deleteButton);
      groupList.append(form);
    });

    list.append(details);
  });

  refreshIcons();
}

function renderAdminState() {
  const state = getPanelState();
  applyPanelTitle(state);
  renderGroupOptions();
  renderGroupList();
  renderCustomList();
}

function updateAdminView(message = "") {
  const loggedIn = isAuthenticated();

  $("#login-form").hidden = loggedIn;
  $("#admin-dashboard").hidden = !loggedIn;
  $("#admin-status").textContent = loggedIn ? `${defaultAdmin.account} 已登录` : "未登录";
  showFeedback(message);

  if (loggedIn) {
    renderAdminState();
  }

  refreshIcons();
}

function bindSearch() {
  $("#search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const destination = resolveDestination($("#search-input").value);

    if (destination) {
      window.open(destination, "_blank", "noopener,noreferrer");
    }
  });
}

function bindAdminPanel() {
  $("#admin-toggle").addEventListener("click", () => {
    const panel = $("#admin-panel");
    panel.hidden = !panel.hidden;
    updateAdminView();

    if (!panel.hidden) {
      const target = isAuthenticated() ? $("#panel-title-input") : $("#admin-account");
      target.focus();
    }
  });

  $("#admin-close").addEventListener("click", () => {
    $("#admin-panel").hidden = true;
  });

  $("#login-form").addEventListener("submit", (event) => {
    event.preventDefault();

    const account = $("#admin-account").value.trim();
    const password = $("#admin-password").value;

    if (account === defaultAdmin.account && password === getAdminPassword()) {
      sessionStorage.setItem(storageKeys.adminAuth, "true");
      event.currentTarget.reset();
      updateAdminView("登录成功");
      $("#panel-title-input").focus();
      return;
    }

    showFeedback("账号或密码错误", true);
  });

  $("#title-form").addEventListener("submit", (event) => {
    event.preventDefault();

    const state = getPanelState();
    const title = $("#panel-title-input").value.trim();

    if (!title) {
      showFeedback("大标题不能为空", true);
      return;
    }

    state.title = title;
    savePanelState(state);
    renderLinks();
    renderAdminState();
    showFeedback("大标题已更新");
  });

  $("#group-form").addEventListener("submit", (event) => {
    event.preventDefault();

    const state = getPanelState();
    const title = $("#group-title").value.trim();

    if (!title) {
      showFeedback("分组名称不能为空", true);
      return;
    }

    state.groups.push({
      id: makeId(),
      title,
      links: [],
    });
    savePanelState(state);
    event.currentTarget.reset();
    renderLinks();
    renderAdminState();
    showFeedback("分组已添加");
  });

  $("#group-list").addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const saveButton = target.closest("[data-save-group-id]");
    const deleteButton = target.closest("[data-delete-group-id]");
    const state = getPanelState();

    if (saveButton) {
      const group = state.groups.find((item) => item.id === saveButton.dataset.saveGroupId);
      const row = saveButton.closest(".group-row");
      const input = row ? row.querySelector("input") : null;
      const title = input ? input.value.trim() : "";

      if (!group || !title) {
        showFeedback("分组名称不能为空", true);
        return;
      }

      group.title = title;
      savePanelState(state);
      renderLinks();
      renderAdminState();
      showFeedback("分组已更新");
      return;
    }

    if (deleteButton) {
      const group = state.groups.find((item) => item.id === deleteButton.dataset.deleteGroupId);

      if (!group || !window.confirm(`删除分组「${group.title}」和其中所有链接？`)) {
        return;
      }

      state.groups = state.groups.filter((item) => item.id !== group.id);
      savePanelState(state);
      renderLinks();
      renderAdminState();
      showFeedback("分组已删除");
    }
  });

  $("#link-form").addEventListener("submit", (event) => {
    event.preventDefault();

    if (!isAuthenticated()) {
      updateAdminView("请先登录");
      return;
    }

    try {
      const state = getPanelState();
      const groupId = $("#link-group").value;
      const group = state.groups.find((item) => item.id === groupId);

      if (!group) {
        showFeedback("请先添加分组", true);
        return;
      }

      const title = $("#link-title").value.trim();
      const subtitle = $("#link-tag").value.trim();
      const url = normalizeCustomUrl($("#link-url").value);
      const icon = $("#link-icon").value.trim() || "bookmark";
      const accent = $("#link-color").value || "#72d6ff";

      group.links.push({
        id: makeId(),
        title,
        subtitle,
        url,
        icon,
        fallback: getFallback(title),
        accent,
      });

      savePanelState(state);
      event.currentTarget.reset();
      $("#link-icon").value = "bookmark";
      $("#link-color").value = "#72d6ff";
      renderLinks();
      renderGroupOptions(groupId);
      renderCustomList(groupId);
      showFeedback("链接已添加");
      $("#link-title").focus();
    } catch (error) {
      showFeedback(error.message || "添加失败", true);
    }
  });

  $("#custom-list").addEventListener("submit", (event) => {
    const form = event.target;

    if (!(form instanceof HTMLFormElement) || !form.classList.contains("link-edit-form")) {
      return;
    }

    event.preventDefault();

    try {
      const state = getPanelState();
      const group = state.groups.find((item) => item.id === form.dataset.groupId);
      const link = group ? group.links.find((item) => item.id === form.dataset.linkId) : null;

      if (!group || !link) {
        showFeedback("没有找到这条链接", true);
        return;
      }

      const title = form.querySelector('[name="edit-title"]').value.trim();
      const subtitle = form.querySelector('[name="edit-tag"]').value.trim();
      const url = normalizeCustomUrl(form.querySelector('[name="edit-url"]').value);
      const icon = form.querySelector('[name="edit-icon"]').value.trim() || "bookmark";
      const accent = form.querySelector('[name="edit-color"]').value || "#72d6ff";

      if (!title) {
        showFeedback("链接标题不能为空", true);
        return;
      }

      link.title = title;
      link.subtitle = subtitle;
      link.url = url;
      link.icon = icon;
      link.accent = accent;
      link.fallback = getFallback(title);

      savePanelState(state);
      renderLinks();
      renderCustomList(group.id);
      showFeedback("链接已更新");
    } catch (error) {
      showFeedback(error.message || "保存失败", true);
    }
  });

  $("#custom-list").addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const button = target.closest("[data-delete-link-id]");

    if (!button) {
      return;
    }

    const state = getPanelState();
    const group = state.groups.find((item) => item.id === button.dataset.groupId);
    const link = group
      ? group.links.find((item) => item.id === button.dataset.deleteLinkId)
      : null;

    if (!group || !link || !window.confirm(`删除链接「${link.title}」？`)) {
      return;
    }

    group.links = group.links.filter((item) => item.id !== link.id);
    savePanelState(state);
    renderLinks();
    renderCustomList(group.id);
    showFeedback("链接已删除");
  });

  $("#admin-logout").addEventListener("click", () => {
    sessionStorage.removeItem(storageKeys.adminAuth);
    updateAdminView("已退出");
  });

  $("#password-form").addEventListener("submit", (event) => {
    event.preventDefault();

    const oldPassword = $("#old-password").value;
    const newPassword = $("#new-password").value;
    const confirmPassword = $("#confirm-password").value;

    if (oldPassword !== getAdminPassword()) {
      showFeedback("旧密码不正确", true);
      return;
    }

    if (newPassword !== confirmPassword) {
      showFeedback("两次输入的新密码不一致", true);
      return;
    }

    localStorage.setItem(storageKeys.adminPassword, newPassword);
    event.currentTarget.reset();
    showFeedback("密码已更新");
  });
}

function boot() {
  renderSearchTabs();
  renderLinks();
  bindSearch();
  bindAdminPanel();
  updateAdminView();
  updateClock();
  setInterval(updateClock, 1000);
  refreshIcons();
}

boot();
