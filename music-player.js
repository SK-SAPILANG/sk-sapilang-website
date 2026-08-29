/* =========================================================
   SK SAPILANG
   UNIVERSAL WEBSITE MUSIC PLAYER
========================================================= */

(function () {

  "use strict";


  /* =========================================================
     SETTINGS
  ========================================================= */

  const MUSIC_FILE = "images/KABATAAN.mp3";

  // Starts almost silent
  const START_VOLUME = 0.01;

  // Normal maximum volume = 20%
  const MAX_VOLUME = 0.20;

  // How fast the volume increases
  const FADE_SPEED = 350;



  /* =========================================================
     STOP DUPLICATE PLAYER
  ========================================================= */

  if (
    document.getElementById(
      "skGlobalMusicPlayer"
    )
  ) {

    return;

  }



  /* =========================================================
     CREATE AUDIO
  ========================================================= */

  const audio =
    document.createElement(
      "audio"
    );


  audio.id =
    "skOfficialMusic";


  audio.src =
    MUSIC_FILE;


  audio.loop =
    true;


  audio.preload =
    "auto";


  audio.volume =
    START_VOLUME;


  document.body.appendChild(
    audio
  );



  /* =========================================================
     CREATE PLAYER CSS
  ========================================================= */

  const style =
    document.createElement(
      "style"
    );


  style.textContent = `

    /* ===============================================
       MAIN PLAYER
    =============================================== */

    #skGlobalMusicPlayer {

      position: fixed;

      right: 20px;

      bottom: 20px;

      z-index: 999999;

      font-family:
        Arial,
        Helvetica,
        sans-serif;

    }



    /* ===============================================
       BUTTON
    =============================================== */

    #skMusicButton {

      display: flex;

      align-items: center;

      gap: 10px;


      min-height: 54px;


      padding:
        6px
        16px
        6px
        6px;


      border:

        1px solid
        rgba(
          57,
          221,
          255,
          0.30
        );


      border-radius:
        999px;


      background:

        rgba(
          2,
          12,
          22,
          0.92
        );


      color:
        #ffffff;


      backdrop-filter:
        blur(18px);


      -webkit-backdrop-filter:
        blur(18px);


      box-shadow:

        0 15px 45px
        rgba(
          0,
          0,
          0,
          0.40
        );


      cursor:
        pointer;


      transition:

        transform
        0.20s ease,

        border-color
        0.20s ease,

        background
        0.20s ease;

    }



    #skMusicButton:hover {

      transform:
        translateY(-2px);


      border-color:
        rgba(
          57,
          221,
          255,
          0.80
        );


      background:

        rgba(
          4,
          20,
          33,
          0.97
        );

    }



    /* ===============================================
       ROUND MUSIC ICON
    =============================================== */

    #skMusicIcon {

      width:
        42px;

      height:
        42px;


      min-width:
        42px;


      display:
        grid;


      place-items:
        center;


      border-radius:
        50%;


      background:

        linear-gradient(
          135deg,
          #39ddff,
          #1775ff
        );


      color:
        #ffffff;


      font-size:
        14px;


      font-weight:
        900;


      box-shadow:

        0 0 24px
        rgba(
          0,
          184,
          255,
          0.25
        );

    }



    /* ===============================================
       TEXT
    =============================================== */

    #skMusicInfo {

      display:
        flex;


      flex-direction:
        column;


      align-items:
        flex-start;


      justify-content:
        center;


      line-height:
        1.15;

    }



    #skMusicTitle {

      color:
        #ffffff;


      font-size:
        10px;


      font-weight:
        900;


      letter-spacing:
        0.08em;


      white-space:
        nowrap;

    }



    #skMusicStatus {

      margin-top:
        4px;


      color:
        #8ca8b9;


      font-size:
        8px;


      font-weight:
        800;


      letter-spacing:
        0.10em;


      text-transform:
        uppercase;


      white-space:
        nowrap;

    }



    /* ===============================================
       PLAYING ANIMATION
    =============================================== */

    #skMusicButton.playing
    #skMusicIcon {

      animation:

        skMusicPulse
        1.5s
        ease-in-out
        infinite;

    }



    @keyframes skMusicPulse {

      0% {

        box-shadow:

          0 0 0 0

          rgba(
            57,
            221,
            255,
            0.40
          );

      }


      70% {

        box-shadow:

          0 0 0 11px

          rgba(
            57,
            221,
            255,
            0
          );

      }


      100% {

        box-shadow:

          0 0 0 0

          rgba(
            57,
            221,
            255,
            0
          );

      }

    }



    /* ===============================================
       MOBILE
    =============================================== */

    @media (
      max-width: 600px
    ) {

      #skGlobalMusicPlayer {

        right:
          12px;


        bottom:
          12px;

      }


      #skMusicButton {

        padding:
          6px;

      }


      #skMusicInfo {

        display:
          none;

      }


      #skMusicIcon {

        width:
          42px;


        height:
          42px;

      }

    }



    /* ===============================================
       REDUCED MOTION
    =============================================== */

    @media (
      prefers-reduced-motion: reduce
    ) {

      #skMusicButton.playing
      #skMusicIcon {

        animation:
          none;

      }

    }

  `;


  document.head.appendChild(
    style
  );



  /* =========================================================
     CREATE PLAYER
  ========================================================= */

  const player =
    document.createElement(
      "div"
    );


  player.id =
    "skGlobalMusicPlayer";


  player.innerHTML = `

    <button

      id="skMusicButton"

      type="button"

      aria-label="Play SK Sapilang music"

    >


      <span
        id="skMusicIcon"
      >

        ▶

      </span>



      <span
        id="skMusicInfo"
      >


        <strong
          id="skMusicTitle"
        >

          SK SAPILANG

        </strong>



        <span
          id="skMusicStatus"
        >

          MUSIC READY

        </span>


      </span>


    </button>

  `;


  document.body.appendChild(
    player
  );



  /* =========================================================
     GET PLAYER ELEMENTS
  ========================================================= */

  const button =
    document.getElementById(
      "skMusicButton"
    );


  const icon =
    document.getElementById(
      "skMusicIcon"
    );


  const status =
    document.getElementById(
      "skMusicStatus"
    );



  /* =========================================================
     STORAGE
  ========================================================= */

  function saveSetting(
    name,
    value
  ) {

    try {

      sessionStorage.setItem(
        name,
        value
      );

    }

    catch (error) {

      // Continue without storage.

    }

  }



  function getSetting(
    name
  ) {

    try {

      return sessionStorage.getItem(
        name
      );

    }

    catch (error) {

      return null;

    }

  }



  /* =========================================================
     PLAYING DISPLAY
  ========================================================= */

  function showPlaying() {

    button.classList.add(
      "playing"
    );


    icon.textContent =
      "Ⅱ";


    status.textContent =
      "NOW PLAYING";


    button.setAttribute(
      "aria-label",
      "Pause SK Sapilang music"
    );

  }



  /* =========================================================
     PAUSED DISPLAY
  ========================================================= */

  function showPaused(
    message
  ) {

    button.classList.remove(
      "playing"
    );


    icon.textContent =
      "▶";


    status.textContent =
      message ||
      "MUSIC PAUSED";


    button.setAttribute(
      "aria-label",
      "Play SK Sapilang music"
    );

  }



  /* =========================================================
     FADE MUSIC IN
  ========================================================= */

  function fadeInMusic() {

    clearInterval(
      fadeTimer
    );


    audio.volume =
      START_VOLUME;


    fadeTimer =
      setInterval(

        function () {


          if (
            audio.paused
          ) {

            clearInterval(
              fadeTimer
            );


            return;

          }



          const nextVolume =

            Math.min(

              MAX_VOLUME,

              audio.volume +
              0.01

            );


          audio.volume =
            nextVolume;



          if (
            nextVolume >=
            MAX_VOLUME
          ) {

            clearInterval(
              fadeTimer
            );

          }


        },

        FADE_SPEED

      );

  }



  /* =========================================================
     PLAY MUSIC
  ========================================================= */

  async function playMusic() {

    try {


      audio.volume =
        START_VOLUME;


      await audio.play();


      showPlaying();


      fadeInMusic();


      saveSetting(
        "skMusicPlaying",
        "true"
      );


      return true;


    }

    catch (error) {


      showPaused(
        "TAP TO PLAY"
      );


      console.log(
        "Browser blocked automatic audio playback."
      );


      return false;

    }

  }



  /* =========================================================
     PAUSE MUSIC
  ========================================================= */

  function pauseMusic() {


    audio.pause();


    clearInterval(
      fadeTimer
    );


    showPaused(
      "MUSIC PAUSED"
    );


    saveSetting(
      "skMusicPlaying",
      "false"
    );

  }



  /* =========================================================
     BUTTON CLICK
  ========================================================= */

  button.addEventListener(

    "click",

    function () {


      if (
        audio.paused
      ) {


        playMusic();


      }

      else {


        pauseMusic();


      }


    }

  );



  /* =========================================================
     SAVE SONG POSITION
  ========================================================= */

  function saveMusicPosition() {


    saveSetting(

      "skMusicTime",

      String(
        audio.currentTime ||
        0
      )

    );

  }



  window.addEventListener(

    "pagehide",

    saveMusicPosition

  );



  /* =========================================================
     RESTORE SONG POSITION
  ========================================================= */

  audio.addEventListener(

    "loadedmetadata",

    function () {


      const savedTime =

        Number(

          getSetting(
            "skMusicTime"
          ) || 0

        );



      if (

        Number.isFinite(
          savedTime
        ) &&

        savedTime > 0 &&

        savedTime <
        audio.duration

      ) {


        audio.currentTime =
          savedTime;


      }


    },

    {
      once: true
    }

  );



  /* =========================================================
     MUSIC FILE ERROR
  ========================================================= */

  audio.addEventListener(

    "error",

    function () {


      showPaused(
        "MUSIC NOT FOUND"
      );


      console.error(

        "SK Sapilang music file was not found:",

        MUSIC_FILE

      );


    }

  );



  /* =========================================================
     START PLAYER
  ========================================================= */

  async function startPlayer() {


    const manuallyPaused =

      getSetting(
        "skMusicPlaying"
      ) === "false";



    if (
      manuallyPaused
    ) {


      showPaused(
        "MUSIC PAUSED"
      );


      return;

    }



    const started =

      await playMusic();



    /* =====================================================
       BROWSER AUTOPLAY FALLBACK

       Chrome, Safari and mobile browsers may block
       music until the visitor interacts with the page.

       If blocked, the first click/tap will start it.
    ===================================================== */

    if (
      !started
    ) {


      const startAfterInteraction =

        async function () {


          const allowed =

            getSetting(
              "skMusicPlaying"
            ) !== "false";



          if (

            allowed &&

            audio.paused

          ) {


            await playMusic();


          }



          document.removeEventListener(

            "pointerdown",

            startAfterInteraction

          );


        };



      document.addEventListener(

        "pointerdown",

        startAfterInteraction

      );


    }


  }



  /* =========================================================
     GO
  ========================================================= */

  startPlayer();


})();