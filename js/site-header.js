document.addEventListener("DOMContentLoaded", function () {

    const header =
        document.getElementById("site-header");

    if (!header) {
        return;
    }


    header.className =
        "sk-universal-header";


    header.innerHTML = `

        <div class="sk-topbar">

            <div class="sk-topbar-inner">

                <span>
                    OFFICIAL WEBSITE &bull; SANGGUNIANG KABATAAN SAPILANG
                </span>

                <span>
                    Barangay Sapilang &bull; Bacnotan, La Union
                </span>

            </div>

        </div>


        <nav class="sk-navbar">

            <div class="sk-nav-inner">


                <a
                    class="sk-brand"
                    href="home.html"
                >

                    <img
                        src="images/ChatGPT Image Aug 24, 2026, 06_57_13 PM.png"
                        alt="SK Sapilang Logo"
                    >

                    <div class="sk-brand-text">

                        <strong>SK SAPILANG</strong>

                        <small>Official Digital Youth Governance Portal</small>

                    </div>

                </a>


                <button
                    class="sk-menu-toggle"
                    id="skMenuToggle"
                    type="button"
                    aria-label="Open navigation"
                    aria-expanded="false"
                >&#9776;</button>


                <ul
                    class="sk-nav-links"
                    id="skNavLinks"
                >

                    <li>
                        <a href="home.html">
                            Home
                        </a>
                    </li>

                    <li>
                        <a href="news-events.html">
                            Updates &amp; Programs
                        </a>
                    </li>

                    <li>
                        <a href="resolutions.html">
                            Publications
                        </a>
                    </li>

                    <li>
                        <a href="about.html">
                            About
                        </a>
                    </li>

                    <li>
                        <a href="awards.html">
                            Awards
                        </a>
                    </li>

                    <li>
                        <a href="transparency.html">
                            Transparency
                        </a>
                    </li>

                    <li>
                        <a href="feedback.html">
                            Feedback
                        </a>
                    </li>

                    <li>
                        <a href="contact.html">
                            Contact
                        </a>
                    </li>

                    <li>
                        <a href="kk-portal.html">
                            KK Portal
                        </a>
                    </li>

                </ul>

            </div>

        </nav>

    `;

    const pageFooter = document.querySelector("footer");

    if (pageFooter && !pageFooter.querySelector(".sk-developer-credit")) {
        const developerCredit = document.createElement("div");
        developerCredit.className = "sk-developer-credit";
        developerCredit.textContent = "Website developed by SK Chairperson Dandy Nillo";
        pageFooter.appendChild(developerCredit);
    }


    /* =====================================================
       ACTIVE PAGE
    ===================================================== */

    let currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    if (
        currentPage === "" ||
        currentPage === "index.html"
    ) {
        currentPage = "home.html";
    }


    const currentHash =
        window.location.hash.toLowerCase();

    const combinedPages = ["events.html", "programs.html", "gallery.html", "announcements.html"];
    const activePage = combinedPages.includes(currentPage) ? "news-events.html" : currentPage;


    document
        .querySelectorAll(".sk-nav-links a")
        .forEach(function (link) {

            const fullHref =
                link.getAttribute("href") || "";

            const hrefPage =
                fullHref
                    .split("#")[0]
                    .split("?")[0]
                    .toLowerCase();


            link.classList.remove("active");

            link.removeAttribute(
                "aria-current"
            );


            


            if (
                hrefPage === activePage &&
                !fullHref.includes("#")
            ) {

                link.classList.add(
                    "active"
                );

                link.setAttribute(
                    "aria-current",
                    "page"
                );

            }

        });


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    const menuButton =
        document.getElementById(
            "skMenuToggle"
        );

    const navLinks =
        document.getElementById(
            "skNavLinks"
        );


    if (
        menuButton &&
        navLinks
    ) {

        menuButton.addEventListener(
            "click",
            function () {

                navLinks.classList.toggle(
                    "open"
                );


                const isOpen =
                    navLinks.classList.contains(
                        "open"
                    );


                menuButton.textContent = isOpen ? "\u2715" : "\u2630";


                menuButton.setAttribute(
                    "aria-expanded",
                    isOpen
                        ? "true"
                        : "false"
                );

            }
        );


        navLinks
            .querySelectorAll("a")
            .forEach(function (link) {

                link.addEventListener(
                    "click",
                    function () {

                        navLinks.classList.remove(
                            "open"
                        );

                        menuButton.textContent = "\u2630";

                        menuButton.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }
                );

            });

    }

    /* Load saved website content from the optional CMS backend. */
    if (!document.querySelector('script[data-sk-cms="config"]')) {
        const configScript = document.createElement("script");
        configScript.src = "cms-config.js?v=20260903-COLLECTIONS";
        configScript.dataset.skCms = "config";
        configScript.onload = function () {
            const renderScript = document.createElement("script");
            renderScript.src = "js/cms-render.js?v=20260903-COLLECTIONS";
            renderScript.dataset.skCms = "render";
            document.body.appendChild(renderScript);
        };
        document.body.appendChild(configScript);
    }

});
