(function () {
  "use strict";

  if (document.getElementById("skGlobalMusicPlayer")) {
    return;
  }

  const MUSIC_FILE = "images/KABATAAN.mp3";

  const START_VOLUME = 0.01;
  const MAX_VOLUME = 0.20;
  const FADE_SPEED = 250;

  let fadeTimer = null;

  const audio = document.createElement("audio");

  audio.id = "skOfficialMusic";
  audio.src = MUSIC_FILE;
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = START_VOLUME;

  document.body.appendChild(audio);


  const style = document.createElement("style");

  style.textContent = `
    #skGlobalMusicPlayer {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 999999;
      font-family: Arial, Helvetica, sans-serif;
    }

    #skMusicButton {
      display: flex;
      align-items: center;
      gap: 10px;

      min-height: 52px;
      padding: 6px 15px 6px 6px;

      border: 1px solid rgba(57,221,255,.30);
      border-radius: 999px;

      background: rgba(2,12,22,.92);
      color: #fff;

      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);

      box-shadow: 0 14px 40px rgba(0,0,0,.40);

      cursor: pointer;
    }

    #skMusicIcon {
      width: 40px;
      height: 40px;
      min-width: 40px;

      display: grid;
      place-items: center;

      border-radius: 50%;

      background:
        linear-gradient(
          135deg,
          #39ddff,
          #1775ff
        );

      font-weight: 900;
    }

    #skMusicInfo {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.15;
    }

    #skMusicTitle {
      font-size: 10px;
      font-weight: 900;
      letter-spacing: .08em;
    }

    #skMusicStatus {
      margin-top: 4px;

      color: #8ca8b9;

      font-size: 8px;
      font-weight: 800;

      letter-spacing: .10em;
      text-transform: uppercase;
    }

    @media (max-width:600px) {
      #skGlobalMusicPlayer {
        right: 12px;
        bottom: 12px;
      }

      #skMusicButton {
        padding: 6px;
      }

      #skMusicInfo {
        display: none;
      }
    }
  `;

  document.head.appendChild(style);


  const player = document.createElement("div");

  player.id = "skGlobalMusicPlayer";

  player.innerHTML = `
    <button
      id="skMusicButton"
      type="button"
      aria-label="Play music"
    >
      <span id="skMusicIcon">▶</span>

      <span id="skMusicInfo">
        <strong id="skMusicTitle">
          SK SAPILANG
        </strong>

        <span id="skMusicStatus">
          MUSIC READY
        </span>
      </span>
    </button>
  `;

  document.body.appendChild(player);


  const button =
    document.getElementById("skMusicButton");

  const icon =
    document.getElementById("skMusicIcon");

  const status =
    document.getElementById("skMusicStatus");


  function save(name, value) {
    try {
      localStorage.setItem(name, value);
    } catch (error) {}
  }


  function load(name) {
    try {
      return localStorage.getItem(name);
    } catch (error) {
      return null;
    }
  }


  function showPlaying() {
    icon.textContent = "Ⅱ";
    status.textContent = "NOW PLAYING";

    button.setAttribute(
      "aria-label",
      "Pause music"
    );
  }


  function showPaused(message) {
    icon.textContent = "▶";

    status.textContent =
      message || "MUSIC PAUSED";

    button.setAttribute(
      "aria-label",
      "Play music"
    );
  }


  function fadeIn() {
    clearInterval(fadeTimer);

    audio.volume = START_VOLUME;

    fadeTimer = setInterval(function () {

      if (audio.paused) {
        clearInterval(fadeTimer);
        return;
      }

      audio.volume = Math.min(
        MAX_VOLUME,
        audio.volume + 0.01
      );

      if (audio.volume >= MAX_VOLUME) {
        clearInterval(fadeTimer);
      }

    }, FADE_SPEED);
  }


  async function playMusic() {
    try {
      await audio.play();

      showPlaying();

      fadeIn();

      save(
        "skMusicPlaying",
        "true"
      );

      return true;

    } catch (error) {

      showPaused(
        "TAP TO PLAY"
      );

      return false;
    }
  }


  function pauseMusic() {
    audio.pause();

    clearInterval(fadeTimer);

    showPaused(
      "MUSIC PAUSED"
    );

    save(
      "skMusicPlaying",
      "false"
    );
  }


  button.addEventListener(
    "click",
    function () {

      if (audio.paused) {
        playMusic();
      } else {
        pauseMusic();
      }

    }
  );


  function savePosition() {
    save(
      "skMusicTime",
      String(audio.currentTime || 0)
    );
  }


  setInterval(
    savePosition,
    500
  );


  window.addEventListener(
    "pagehide",
    savePosition
  );


  document.addEventListener(
    "click",
    function (event) {

      const link =
        event.target.closest("a");

      if (!link) {
        return;
      }

      const href =
        link.getAttribute("href");

      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      savePosition();
    }
  );


  audio.addEventListener(
    "loadedmetadata",
    async function () {

      const savedTime =
        Number(
          load("skMusicTime") || 0
        );

      if (
        Number.isFinite(savedTime) &&
        savedTime >= 0 &&
        savedTime < audio.duration
      ) {
        audio.currentTime = savedTime;
      }


      if (
        load("skMusicPlaying") !== "false"
      ) {

        const started =
          await playMusic();


        if (!started) {

          const firstInteraction =
            async function () {

              if (
                load("skMusicPlaying") !== "false" &&
                audio.paused
              ) {
                await playMusic();
              }

              document.removeEventListener(
                "pointerdown",
                firstInteraction
              );

            };


          document.addEventListener(
            "pointerdown",
            firstInteraction
          );

        }

      } else {

        showPaused(
          "MUSIC PAUSED"
        );

      }

    },
    { once: true }
  );


  audio.addEventListener(
    "error",
    function () {

      showPaused(
        "MUSIC FILE NOT FOUND"
      );

    }
  );

})();