(function () {
  "use strict";

  const file = location.pathname.split("/").pop() || "home.html";
  const page = file + location.search + location.hash;

  if (window.top === window.self) {
    const target = "index.html?page=" + encodeURIComponent(page);
    location.replace(target);
    return;
  }

  try {
    window.parent.postMessage({ type: "sk-page-change", page: page }, location.origin);
  } catch (error) {}
})();
