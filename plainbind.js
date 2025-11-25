/*!
 * PlainBind.js - tiny HTML-first data binder
 * Spec: plain HTML + data-* + JSON, single-pass initial render
 */
(function (global) {
  if (typeof document === "undefined") return;

  const VERSION = "0.1.0";
  const formatterMap = new Map();
  const readyQueue = [];
  let initialized = false;
  let lastContext = null;

  function registerFormatter(name, fn) {
    if (typeof name !== "string" || !name) {
      throw new Error("Formatter name must be a non-empty string");
    }
    if (typeof fn !== "function") {
      throw new Error("Formatter must be a function");
    }
    formatterMap.set(name, fn);
  }

  function onReady(cb) {
    if (typeof cb !== "function") return;
    if (initialized && lastContext) {
      try {
        cb(lastContext);
      } catch (err) {
        console.error("[PlainBind] ready callback error", err);
      }
      return;
    }
    readyQueue.push(cb);
  }

  function emitReady(context) {
    lastContext = context;
    initialized = true;
    while (readyQueue.length) {
      const cb = readyQueue.shift();
      try {
        cb(context);
      } catch (err) {
        console.error("[PlainBind] ready callback error", err);
      }
    }
    try {
      const event = new CustomEvent("plainbind:ready", { detail: context });
      document.dispatchEvent(event);
    } catch (err) {
      // CustomEvent may be unavailable in very old browsers; ignore silently.
    }
  }

  function isEmptyValue(val) {
    return val === null || val === undefined || val === "";
  }

  function truthy(val) {
    if (Array.isArray(val)) return val.length > 0;
    return !!val;
  }

  function normalizePath(path) {
    return String(path || "")
      .trim()
      .replace(/\[(\d+)\]/g, ".$1")
      .split(".")
      .filter(Boolean);
  }

  function lookupInScope(name, scope) {
    let cursor = scope;
    while (cursor) {
      if (Object.prototype.hasOwnProperty.call(cursor.vars, name)) {
        return cursor.vars[name];
      }
      cursor = cursor.parent;
    }
    return undefined;
  }

  function resolvePath(path, scope) {
    if (!path) return "";
    const tokens = normalizePath(path);
    if (!tokens.length) return "";
    let value = lookupInScope(tokens[0], scope);
    if (value === undefined && scope.root && Object.prototype.hasOwnProperty.call(scope.root, tokens[0])) {
      value = scope.root[tokens[0]];
    }
    for (let i = 1; i < tokens.length; i += 1) {
      if (value == null) return "";
      const key = tokens[i];
      value = value[key];
    }
    return value == null ? "" : value;
  }

  function applyFormat(value, formatterName, scope) {
    if (!formatterName) return value;
    const fn = formatterMap.get(formatterName);
    if (!fn) return value;
    try {
      return fn(value, scope.vars);
    } catch (err) {
      console.error("[PlainBind] formatter error", err);
      return value;
    }
  }

  function bindText(el, expr, scope) {
    const formatterName = el.getAttribute("data-format");
    const placeholder = el.getAttribute("data-placeholder");
    let value = resolvePath(expr, scope);
    value = applyFormat(value, formatterName, scope);
    if (isEmptyValue(value) && placeholder !== null) {
      value = placeholder;
    }
    el.textContent = value == null ? "" : String(value);
  }

  function bindHTML(el, expr, scope) {
    const formatterName = el.getAttribute("data-format");
    const placeholder = el.getAttribute("data-placeholder");
    let value = resolvePath(expr, scope);
    value = applyFormat(value, formatterName, scope);
    if (isEmptyValue(value) && placeholder !== null) {
      value = placeholder;
    }
    el.innerHTML = value == null ? "" : String(value);
  }

  function bindAttributes(el, scope) {
    const attrs = Array.from(el.attributes).filter((attr) =>
      attr.name.startsWith("data-bind-attr-")
    );
    if (!attrs.length) return;
    const formatterName = el.getAttribute("data-format");
    const placeholder = el.getAttribute("data-placeholder");
    attrs.forEach((attr) => {
      const targetName = attr.name.replace("data-bind-attr-", "");
      let value = resolvePath(attr.value, scope);
      value = applyFormat(value, formatterName, scope);
      if (isEmptyValue(value) && placeholder !== null) {
        value = placeholder;
      }
      if (isEmptyValue(value)) {
        el.removeAttribute(targetName);
      } else {
        el.setAttribute(targetName, String(value));
      }
    });
  }

  function applyClassWhen(el, expr, scope) {
    if (!expr) return;
    const pairs = expr.split(",").map((p) => p.trim()).filter(Boolean);
    pairs.forEach((pair) => {
      const [rawExpr, className] = pair.split(":").map((s) => s.trim());
      if (!rawExpr || !className) return;
      const val = resolvePath(rawExpr, scope);
      if (truthy(val)) {
        el.classList.add(className);
      } else {
        el.classList.remove(className);
      }
    });
  }

  function applyLink(el, expr, scope) {
    if (!expr) return;
    const value = resolvePath(expr, scope);
    if (isEmptyValue(value)) {
      el.removeAttribute("href");
    } else {
      el.setAttribute("href", String(value));
    }
  }

  function handleRepeat(el, expr, scope) {
    const match = expr && expr.match(/^\s*([\w$]+)\s+in\s+(.+)\s*$/);
    if (!match) return false;
    const [, varName, listExpr] = match;
    const collection = resolvePath(listExpr, scope);
    const items = Array.isArray(collection) ? collection : [];

    const parent = el.parentNode;
    if (!parent) return true;

    const fragment = document.createDocumentFragment();
    items.forEach((item, index) => {
      const clone = el.cloneNode(true);
      clone.removeAttribute("data-repeat");
      const childScope = {
        vars: Object.assign({}, scope.vars, { [varName]: item, $index: index }),
        parent: scope,
        root: scope.root,
      };
      processElement(clone, childScope);
      fragment.appendChild(clone);
    });
    parent.replaceChild(fragment, el);
    return true;
  }

  function handleEmpty(el, expr, scope) {
    if (!expr) return false;
    const value = resolvePath(expr, scope);
    const shouldShow = Array.isArray(value) ? value.length === 0 : !truthy(value);
    if (!shouldShow) {
      if (el.parentNode) el.parentNode.removeChild(el);
      return true;
    }
    return false;
  }

  function processElement(el, scope) {
    if (el.nodeType !== 1) return;

    const repeatExpr = el.getAttribute("data-repeat");
    if (repeatExpr) {
      handleRepeat(el, repeatExpr, scope);
      return;
    }

    const emptyExpr = el.getAttribute("data-empty");
    if (emptyExpr) {
      const removed = handleEmpty(el, emptyExpr, scope);
      if (removed) return;
    }

    const showExpr = el.getAttribute("data-show");
    if (showExpr) {
      const value = resolvePath(showExpr, scope);
      el.hidden = !truthy(value);
    }
    const hideExpr = el.getAttribute("data-hide");
    if (hideExpr) {
      const value = resolvePath(hideExpr, scope);
      el.hidden = truthy(value);
    }

    const classExpr = el.getAttribute("data-class-when");
    if (classExpr) {
      applyClassWhen(el, classExpr, scope);
    }

    const linkExpr = el.getAttribute("data-link");
    if (linkExpr) {
      applyLink(el, linkExpr, scope);
    }

    const htmlExpr = el.getAttribute("data-bind-html");
    if (htmlExpr) {
      bindHTML(el, htmlExpr, scope);
      return;
    }

    const textExpr = el.getAttribute("data-bind");
    if (textExpr) {
      bindText(el, textExpr, scope);
      return;
    }

    bindAttributes(el, scope);

    const children = Array.from(el.childNodes);
    children.forEach((child) => processElement(child, scope));
  }

  async function loadData() {
    const inline = document.getElementById("plainbind-data");
    if (inline && inline.getAttribute("type") === "application/json") {
      try {
        return JSON.parse(inline.textContent || "{}");
      } catch (err) {
        console.error("[PlainBind] Failed to parse inline JSON", err);
        return {};
      }
    }

    const path = window.location.pathname;
    const base = path.endsWith("/") ? `${path}index.html` : path;
    const url = new URL(`${base}.json`, window.location.href).toString();
    try {
      const res = await fetch(url, { credentials: "same-origin" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      // Swallow errors and fall back to empty data to keep rendering going.
      return {};
    }
  }

  async function init() {
    if (initialized) return lastContext;
    const data = await loadData();
    const scope = { vars: data || {}, parent: null, root: data || {} };
    const root = document.body || document.documentElement;
    const children = Array.from(root.childNodes);
    children.forEach((child) => processElement(child, scope));
    const context = { data, root, version: VERSION };
    emitReady(context);
    return context;
  }

  function autoInit() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
      init();
    }
  }

  const PlainBind = {
    init,
    ready: onReady,
    registerFormatter,
    version: VERSION,
  };

  global.PlainBind = PlainBind;
  if (typeof module === "object" && typeof module.exports !== "undefined") {
    module.exports = PlainBind;
  }

  autoInit();
})(typeof window !== "undefined" ? window : globalThis);
