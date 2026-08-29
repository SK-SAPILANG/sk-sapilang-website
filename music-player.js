mkdir -p js

cat > js/music-player.js <<'EOF'
(function () {

  if (document.getElementById("skGlobalMusicPlayer")) return;

  const MUSIC_FILE = "images/KABATAAN.mp3";

  const audio = document.createElement("audio");
  audio.id = "skOfficialMusic";
  audio.src = MUSIC_FILE;
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0.01;

  document.body.appendChild(audio);

  const style = document.createElement("style");

  style.textContent = `
    #skGlobalMusicPlayer{
      position:fixed;
      right:18px;
      bottom:18px;
      z-index:999999;
      font-family:Arial,sans-serif;
    }

    #skMusicButton{
      display:flex;
      align-items:center;
      gap:9px;

      min-height:48px;
      padding:10px 16px;

      border-radius:999px;

      border:1px solid rgba(76,216,255,.35);

      background:rgba(2,12,22,.92);
      color:#fff;

      backdrop-filter:blur(14px);
      -webkit-backdrop-filter:blur(14px);

      box-shadow:0 12px 35px rgba(0,0,0,.4);

      font-weight:700;
      cursor:pointer;
    }

    #skMusicButton:hover{
      border-color:#39ddff;
    }

    #skMusicIcon{
      width:30px;
      height:30px;

      display:grid;
      place-items:center;

      border-radius:50%;

      background:linear-gradient(
        135deg,
        #39ddff,
        #1775ff
      );

      color:white;
    }

    #skMusicStatus{
      font-size:11px;
      letter-spacing:.04em;
    }

    @media(max-width:600px){

      #skGlobalMusicPlayer{
        right:12px;
        bottom:12px;
      }

      #skMusicStatus{
        display:none;
      }

      #skMusicButton{
        padding:7px;
      }

      #skMusicIcon{
        width:38px;
        height:38px;
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
      aria-label="Play SK Sapilang music">

      <span id="skMusicIcon">
        ▶
      </span>

      <span id="skMusicStatus">
        PLAY MUSIC
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

  let fadeTimer = null;

  function saveState(){

    try{

      sessionStorage.setItem(
        "skMusicTime",
        String(audio.currentTime || 0)
      );

      sessionStorage.setItem(
        "skMusicPlaying",
        audio.paused ? "false" : "true"
      );

    }catch(error){}

  }

  function restoreTime(){

    try{

      const saved =
        Number(
          sessionStorage.getItem(
            "skMusicTime"
          ) || 0
        );

      if(
        Number.isFinite(saved) &&
        saved > 0 &&
        saved < audio.duration
      ){

        audio.currentTime = saved;

      }

    }catch(error){}

  }

  audio.addEventListener(
    "loadedmetadata",
    restoreTime,
    {once:true}
  );

  function fadeIn(){

    clearInterval(fadeTimer);

    audio.volume = 0.01;

    fadeTimer = setInterval(() => {

      if(audio.paused){

        clearInterval(fadeTimer);

        return;
      }

      if(audio.volume >= 0.20){

        audio.volume = 0.20;

        clearInterval(fadeTimer);

        return;
      }

      audio.volume =
        Math.min(
          0.20,
          audio.volume + 0.01
        );

    }, 350);

  }

  async function playMusic(){

    try{

      audio.volume = 0.01;

      await audio.play();

      icon.textContent = "❚❚";

      status.textContent =
        "MUSIC PLAYING";

      button.setAttribute(
        "aria-label",
        "Pause SK Sapilang music"
      );

      fadeIn();

      try{

        sessionStorage.setItem(
          "skMusicPlaying",
          "true"
        );

      }catch(error){}

      return true;

    }catch(error){

      icon.textContent = "▶";

      status.textContent =
        "TAP TO PLAY";

      return false;

    }

  }

  function pauseMusic(){

    audio.pause();

    clearInterval(fadeTimer);

    icon.textContent = "▶";

    status.textContent =
      "MUSIC PAUSED";

    button.setAttribute(
      "aria-label",
      "Play SK Sapilang music"
    );

    try{

      sessionStorage.setItem(
        "skMusicPlaying",
        "false"
      );

    }catch(error){}

  }

  button.addEventListener(
    "click",
    () => {

      if(audio.paused){

        playMusic();

      }else{

        pauseMusic();

      }

    }
  );

  window.addEventListener(
    "pagehide",
    saveState
  );

  setInterval(
    saveState,
    2000
  );

  async function startMusic(){

    let previouslyPaused = false;

    try{

      previouslyPaused =
        sessionStorage.getItem(
          "skMusicPlaying"
        ) === "false";

    }catch(error){}

    if(previouslyPaused){

      icon.textContent = "▶";
      status.textContent =
        "MUSIC PAUSED";

      return;
    }

    const started =
      await playMusic();

    if(!started){

      const startAfterInteraction =
        async () => {

          let allowed = true;

          try{

            allowed =
              sessionStorage.getItem(
                "skMusicPlaying"
              ) !== "false";

          }catch(error){}

          if(
            allowed &&
            audio.paused
          ){

            await playMusic();

          }

        };

      document.addEventListener(
        "pointerdown",
        startAfterInteraction,
        {once:true}
      );

    }

  }

  startMusic();

})();
EOF

for file in *.html; do
  if [ -f "$file" ]; then
    if ! grep -q 'js/music-player.js' "$file"; then
      sed -i 's#</body>#<script src="js/music-player.js"></script>\n</body>#' "$file"
      echo "Music added to $file"
    else
      echo "$file already connected"
    fi
  fi
done

echo ""
echo "DONE."
echo "Make sure this exact file exists:"
echo "images/KABATAAN.mp3"
echo ""