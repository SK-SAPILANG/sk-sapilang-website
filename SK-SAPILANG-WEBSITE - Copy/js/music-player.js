(function () {
  "use strict";

  if (document.getElementById("skGlobalMusicPlayer")) {
    return;
  }

  const MUSIC_FILE = "images/KABATAAN.mp3";
  const START_VOLUME = 0.01;
  const MAX_VOLUME = 0.20;
  const FADE_SPEED = 350;

  let fadeTimer = null;

  const audio = document.createElement("audio");

  audio.id = "skOfficialMusic";
  audio.src = MUSIC_FILE;
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = START_VOLUME;

  document.body.appendChild(audio);


  const style = document.createElement("style");

  style.id = "skMusicPlayerStyle";

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

      border: 1px solid rgba(57, 221, 255, 0.30);
      border-radius: 999px;

      background: rgba(2, 12, 22, 0.92);
      color: #ffffff;

      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);

      box-shadow: 0 14px 40px rgba(0, 0, 0, 0.40);

      cursor: pointer;

      transition:
        transform 0.2s ease,
        border-color 0.2s ease,
        background 0.2s ease;
    }

    #skMusicButton:hover {
      transform: translateY(-2px);
      border-color: rgba(57, 221, 255, 0.80);
      background: rgba(4, 20, 33, 0.97);
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

      color: #ffffff;

      font-size: 14px;
      font-weight: 900;

      box-shadow:
        0 0 24px rgba(0, 184, 255, 0.25);
    }

    #skMusicInfo {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.15;
    }

    #skMusicTitle {
      color: #ffffff;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 0.08em;
      white-space: nowrap;
    }

    #skMusicStatus {
      margin-top: 4px;

      color: #8ca8b9;

      font-size: 8px;
      font-weight: 800;

      letter-spacing: 0.10em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    #skMusicButton.playing #skMusicIcon {
      animation: skMusicPulse 1.5s ease-in-out infinite;
    }

    @keyframes skMusicPulse {
      0% {
        box-shadow:
          0 0 0 0 rgba(57, 221, 255, 0.40);
      }

      70% {
        box-shadow:
          0 0 0 11px rgba(57, 221, 255, 0);
      }

      100% {
        box-shadow:
          0 0 0 0 rgba(57, 221, 255, 0);
      }
    }

    @media (max-width: 600px) {
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

      #skMusicIcon {
        width: 42px;
        height: 42px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #skMusicButton.playing #skMusicIcon {
        animation: none;
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
      aria-label="Play SK Sapilang music"
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


  function saveSetting(name, value) {
    try {
      sessionStorage.setItem(name, value);
    } catch (error) {
      // Continue without storage.
    }
  }


  function getSetting(name) {
    try {
      return sessionStorage.getItem(name);
    } catch (error) {
      return null;
    }
  }


  function showPlaying() {
    button.classList.add("playing");

    icon.textContent = "Ⅱ";

    status.textContent = "NOW PLAYING";

    button.setAttribute(
      "aria-label",
      "Pause SK Sapilang music"
    );
  }


  function showPaused(message) {
    button.classList.remove("playing");

    icon.textContent = "▶";

    status.textContent =
      message || "MUSIC PAUSED";

    button.setAttribute(
      "aria-label",
      "Play SK Sapilang music"
    );
  }


  function fadeInMusic() {
    clearInterval(fadeTimer);

    audio.volume = START_VOLUME;

    fadeTimer = setInterval(function () {

      if (audio.paused) {
        clearInterval(fadeTimer);
        return;
      }

      const nextVolume =
        Math.min(
          MAX_VOLUME,
          audio.volume + 0.01
        );

      audio.volume = nextVolume;

      if (nextVolume >= MAX_VOLUME) {
        clearInterval(fadeTimer);
      }

    }, FADE_SPEED);
  }


  async function playMusic() {
    try {
      audio.volume = START_VOLUME;

      await audio.play();

      showPlaying();

      fadeInMusic();

      saveSetting(
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

    saveSetting(
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
    saveSetting(
      "skMusicTime",
      String(audio.currentTime || 0)
    );
  }


  window.addEventListener(
    "pagehide",
    savePosition
  );


  setInterval(
    savePosition,
    2000
  );


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
        Number.isFinite(savedTime) &&
        savedTime > 0 &&
        savedTime < audio.duration
      ) {
        audio.currentTime = savedTime;
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

      console.error(
        "Could not load:",
        MUSIC_FILE
      );

    }
  );


  async function startPlayer() {

    const manuallyPaused =
      getSetting(
        "skMusicPlaying"
      ) === "false";


    if (manuallyPaused) {
      showPaused(
        "MUSIC PAUSED"
      );

      return;
    }


    const started =
      await playMusic();


    if (!started) {

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


          document.removeEventListener(
            "keydown",
            startAfterInteraction
          );

        };


      document.addEventListener(
        "pointerdown",
        startAfterInteraction
      );


      document.addEventListener(
        "keydown",
        startAfterInteraction
      );

    }

  }


  startPlayer();

})();