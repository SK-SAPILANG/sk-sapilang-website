
const toggle=document.querySelector('.menu-toggle');
const links=document.querySelector('.nav-links');
if(toggle) toggle.addEventListener('click',()=>links.classList.toggle('open'));

document.querySelectorAll('.nav-links a').forEach(a=>{
  if(a.pathname===location.pathname || (a.getAttribute('href')==='index.html' && location.pathname.endsWith('/')))
    a.classList.add('active');
});

const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('show')});
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());

const search=document.querySelector('[data-search]');
if(search){
  search.addEventListener('input',()=>{
    const term=search.value.toLowerCase();
    document.querySelectorAll('[data-search-item]').forEach(item=>{
      item.style.display=item.textContent.toLowerCase().includes(term)?'':'none';
    });
  });
}

const form=document.querySelector('#contactForm');
if(form){
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const msg=document.querySelector('#formMessage');
    msg.textContent='Thank you! Your message has been prepared. Connect this form to your preferred email/form service for live submissions.';
    msg.className='notice';
    form.reset();
  });
}
/* =========================================================
   SK SAPILANG
   PROVINCIAL IMAGE CAROUSEL FIX
   Works with normal pages + ?page=contact.html
========================================================= */

(function () {

    function initProvincialCarousel() {

        /*
         * Supports several possible class names so the
         * carousel continues to work with your current HTML.
         */

        const sliders =
            document.querySelectorAll(
                ".provincial-slider, " +
                ".provincial-carousel, " +
                ".province-slider, " +
                "[data-provincial-slider]"
            );


        sliders.forEach(function (slider) {

            /*
             * Do not initialize the same slider twice.
             */

            if (
                slider.dataset.carouselReady === "true"
            ) {
                return;
            }


            const slides =
                slider.querySelectorAll(
                    ".provincial-slide, " +
                    ".province-slide, " +
                    ".slide"
                );


            if (!slides.length) {
                return;
            }


            slider.dataset.carouselReady =
                "true";


            let currentIndex = 0;


            /*
             * FIND BUTTONS
             */

            const nextButton =
                slider.querySelector(
                    ".next, " +
                    ".carousel-next, " +
                    ".provincial-next, " +
                    "[data-next]"
                );


            const previousButton =
                slider.querySelector(
                    ".prev, " +
                    ".carousel-prev, " +
                    ".provincial-prev, " +
                    "[data-prev]"
                );


            /*
             * SHOW CURRENT SLIDE
             */

            function showSlide(index) {

                if (index >= slides.length) {
                    currentIndex = 0;
                }

                else if (index < 0) {
                    currentIndex =
                        slides.length - 1;
                }

                else {
                    currentIndex = index;
                }


                slides.forEach(
                    function (slide, slideIndex) {

                        const active =
                            slideIndex ===
                            currentIndex;


                        slide.classList.toggle(
                            "active",
                            active
                        );


                        slide.style.display =
                            active
                                ? ""
                                : "none";


                        slide.setAttribute(
                            "aria-hidden",
                            active
                                ? "false"
                                : "true"
                        );

                    }
                );

            }


            /*
             * NEXT
             */

            function nextSlide() {

                showSlide(
                    currentIndex + 1
                );

            }


            /*
             * PREVIOUS
             */

            function previousSlide() {

                showSlide(
                    currentIndex - 1
                );

            }


            if (nextButton) {

                nextButton.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        nextSlide();

                    }
                );

            }


            if (previousButton) {

                previousButton.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        previousSlide();

                    }
                );

            }


            /*
             * SWIPE SUPPORT
             */

            let touchStartX = 0;
            let touchEndX = 0;


            slider.addEventListener(
                "touchstart",
                function (event) {

                    touchStartX =
                        event.changedTouches[0]
                            .screenX;

                },
                {
                    passive: true
                }
            );


            slider.addEventListener(
                "touchend",
                function (event) {

                    touchEndX =
                        event.changedTouches[0]
                            .screenX;


                    const difference =
                        touchStartX -
                        touchEndX;


                    if (
                        Math.abs(difference) <
                        40
                    ) {
                        return;
                    }


                    if (difference > 0) {
                        nextSlide();
                    }

                    else {
                        previousSlide();
                    }

                },
                {
                    passive: true
                }
            );


            /*
             * AUTOMATIC SLIDE
             */

            let autoplay =
                setInterval(
                    nextSlide,
                    5000
                );


            slider.addEventListener(
                "mouseenter",
                function () {

                    clearInterval(
                        autoplay
                    );

                }
            );


            slider.addEventListener(
                "mouseleave",
                function () {

                    clearInterval(
                        autoplay
                    );

                    autoplay =
                        setInterval(
                            nextSlide,
                            5000
                        );

                }
            );


            /*
             * INITIAL IMAGE
             */

            showSlide(0);

        });

    }


    /* =====================================================
       NORMAL PAGE LOAD
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initProvincialCarousel
        );

    }

    else {

        initProvincialCarousel();

    }


    /* =====================================================
       DYNAMIC PAGE LOAD FIX

       Your website uses URLs such as:

       ?page=contact.html

       This observer detects when contact.html content is
       inserted after the main site has already loaded.
    ===================================================== */

    const observer =
        new MutationObserver(
            function () {

                initProvincialCarousel();

            }
        );


    observer.observe(
        document.body,
        {
            childList: true,
            subtree: true
        }
    );


    /* =====================================================
       HASH / HISTORY CHANGE
    ===================================================== */

    window.addEventListener(
        "popstate",
        function () {

            setTimeout(
                initProvincialCarousel,
                100
            );

        }
    );


    window.addEventListener(
        "hashchange",
        function () {

            setTimeout(
                initProvincialCarousel,
                100
            );

        }
    );


    /*
     * Make it available manually if another script
     * needs to initialize the carousel.
     */

    window.initProvincialCarousel =
        initProvincialCarousel;

})();