js/music-player.js
mkdir -p js audio

cat > js/music-player.js <<'EOF'
/* =========================================================
   SK SAPILANG UNIVERSAL MUSIC PLAYER
   Automatically appears on every connected HTML page
========================================================= */

(function () {

  if (document.getElementById("skGlobalMusicPlayer")) return;

  const MUSIC_FILE = "images/KABATAAN.mp3";

  const START_VOLUME = 0.01;
  const NORMAL_VOLUME = 0.20;
  const FADE_TIME = 8000;

  let fadeTimer = null;

  /* =====================================================
     STYLE
  ===================================================== */

  const style = document.createElement("style");

  style.textContent = `

    #skGlobalMusicPlayer{
      position:fixed;
      right:20px;
      bottom:20px;
      z-index:999999;
      font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    }

    .sk-music-shell{
      display:flex;
      align-items:center;
      gap:9px;

      padding:6px 12px 6px 6px;

      min-height:52px;

      border-radius:999px;

      border:1px solid rgba(76,216,255,.23);

      background:rgba(2,11,20,.88);

      backdrop-filter:blur(18px);
      -webkit-backdrop-filter:blur(18px);

      box-shadow:0 15px 45px rgba(0,0,0,.4);

      transition:
        border-color .25s ease,
        transform .25s ease,
        background .25s ease;
    }

    .sk-music-shell:hover{
      border-color:rgba(57,221,255,.55);
      background:rgba(4,18,31,.96);
    }

    .sk-music-btn{
      width:42px;
      height:42px;

      min-width:42px;

      display:grid;
      place-items:center;

      padding:0;

      border:0;
      border-radius:50%;

      background:
        linear-gradient(
          135deg,
          #39ddff,
          #1775ff
        );

      color:white;

      cursor:pointer;

      box-shadow:
        0 0 24px rgba(0,177,255,.25);

      transition:
        transform .2s ease,
        box-shadow .2s ease;
    }

    .sk-music-btn:hover{
      transform:scale(1.06);

      box-shadow:
        0 0 32px rgba(0,190,255,.4);
    }

    .sk-music-btn:active{
      transform:scale(.94);
    }

    .sk-music-bars{
      width:18px;
      height:18px;

      display:flex;
      align-items:center;
      justify-content:center;

      gap:2px;
    }

    .sk-music-bars span{
      display:block;

      width:2px;

      border-radius:10px;

      background:#fff;

      animation:
        skSoundBar .65s ease-in-out
        infinite alternate;
    }

    .sk-music-bars span:nth-child(1){
      height:6px;
    }

    .sk-music-bars span:nth-child(2){
      height:14px;
      animation-delay:.15s;
    }

    .sk-music-bars span:nth-child(3){
      height:9px;
      animation-delay:.3s;
    }

    @keyframes skSoundBar{

      from{
        height:4px;
        opacity:.55;
      }

      to{
        height:15px;
        opacity:1;
      }

    }

    .sk-music-shell.paused
    .sk-music-bars span{
      animation:none;
      height:3px;
      opacity:.65;
    }

    .sk-music-text{
      display:flex;
      flex-direction:column;

      justify-content:center;

      line-height:1.2;
    }

    .sk-music-title{
      color:#f4fbff;

      font-size:10px;
      font-weight:800;

      letter-spacing:.05em;

      white-space:nowrap;
    }

    .sk-music-status{
      margin-top:3px;

      color:#83a5b8;

      font-size:8px;
      font-weight:700;

      letter-spacing:.1em;

      text-transform:uppercase;

      white-space:nowrap;
    }

    @media(max-width:600px){

      #skGlobalMusicPlayer{
        right:13px;
        bottom:13px;
      }

      .sk-music-shell{
        padding:5px;
      }

      .sk-music-btn{
        width:42px;
        height:42px;
      }

      .sk-music-text{
        display:none;
      }

    }

    @media(prefers-reduced-motion:reduce){

      .sk-music-bars span{
        animation:none;
      }

    }

  `;

  document.head.appendChild(style);



  /* =====================================================
     PLAYER HTML
  ===================================================== */

  const player = document.createElement("div");

  player.id = "skGlobalMusicPlayer";

  player.innerHTML = `

    <audio
      id="skOfficialMusic"
      preload="auto"
      loop>
    </audio>

    <div
      class="sk-music-shell paused"
      id="skMusicShell">

      <button
        id="skMusicButton"
        class="sk-music-btn"
        type="button"
        aria-label="Play SK Sapilang music">

        <div
          class="sk-music-bars"
          aria-hidden="true">

          <span></span>
          <span></span>
          <span></span>

        </div>

      </button>

      <div class="sk-music-text">

        <span class="sk-music-title">
          SK SAPILANG
        </span>

        <span
          class="sk-music-status"
          id="skMusicStatus">

          MUSIC READY

        </span>

      </div>

    </div>

  `;

  document.body.appendChild(player);



  /* =====================================================
     ELEMENTS
  ===================================================== */

  const audio =
    document.getElementById("skOfficialMusic");

  const button =
    document.getElementById("skMusicButton");

  const shell =
    document.getElementById("skMusicShell");

  const status =
    document.getElementById("skMusicStatus");


  audio.src = MUSIC_FILE;



  /* =====================================================
     STORAGE HELPERS
  ===================================================== */

  function getStored(name){

    try{

      return sessionStorage.getItem(name);

    }catch(error){

      return null;

    }

  }


  function store(name,value){

    try{

      sessionStorage.setItem(name,value);

    }catch(error){

      /* Ignore storage errors */

    }

  }



  /* =====================================================
     RESTORE MUSIC POSITION
  ===================================================== */

  const savedTime =
    Number(
      getStored("skMusicTime") || 0
    );


  audio.addEventListener(
    "loadedmetadata",
    ()=>{

      if(
        Number.isFinite(savedTime) &&
        savedTime > 0 &&
        savedTime < audio.duration
      ){

        audio.currentTime =
          savedTime;

      }

    },
    {once:true}
  );



  /* =====================================================
     UI
  ===================================================== */

  function playingUI(){

    shell.classList.remove("paused");

    status.textContent =
      "NOW PLAYING";

    button.setAttribute(
      "aria-label",
      "Pause SK Sapilang music"
    );

  }


  function pausedUI(message = "MUSIC PAUSED"){

    shell.classList.add("paused");

    status.textContent =
      message;

    button.setAttribute(
      "aria-label",
      "Play SK Sapilang music"
    );

  }



  /* =====================================================
     FADE IN
     Starts extremely low and slowly increases
  ===================================================== */

  function fadeIn(){

    clearInterval(fadeTimer);

    audio.volume =
      START_VOLUME;


    const steps = 40;

    const interval =
      FADE_TIME / steps;

    const increase =
      (NORMAL_VOLUME - START_VOLUME) /
      steps;


    fadeTimer =
      setInterval(
        ()=>{

          if(audio.paused){

            clearInterval(fadeTimer);

            return;

          }


          const nextVolume =
            Math.min(
              NORMAL_VOLUME,
              audio.volume + increase
            );


          audio.volume =
            nextVolume;


          if(
            nextVolume >=
            NORMAL_VOLUME
          ){

            clearInterval(fadeTimer);

          }

        },
        interval
      );

  }



  /* =====================================================
     PLAY
  ===================================================== */

  async function playMusic(){

    try{

      audio.volume =
        START_VOLUME;


      await audio.play();


      store(
        "skMusicPlaying",
        "true"
      );


      playingUI();

      fadeIn();


      return true;

    }

    catch(error){

      pausedUI("TAP TO PLAY");

      return false;

    }

  }



  /* =====================================================
     PAUSE
  ===================================================== */

  function pauseMusic(){

    audio.pause();

    clearInterval(fadeTimer);


    store(
      "skMusicPlaying",
      "false"
    );


    pausedUI();

  }



  /* =====================================================
     BUTTON
  ===================================================== */

  button.addEventListener(
    "click",
    ()=>{

      if(audio.paused){

        playMusic();

      }else{

        pauseMusic();

      }

    }
  );



  /* =====================================================
     SAVE POSITION
  ===================================================== */

  let lastSavedSecond = -1;


  audio.addEventListener(
    "timeupdate",
    ()=>{

      const second =
        Math.floor(
          audio.currentTime
        );


      if(
        second !== lastSavedSecond &&
        second % 2 === 0
      ){

        lastSavedSecond =
          second;


        store(
          "skMusicTime",
          String(audio.currentTime)
        );

      }

    }
  );


  window.addEventListener(
    "pagehide",
    ()=>{

      store(
        "skMusicTime",
        String(audio.currentTime || 0)
      );

    }
  );



  /* =====================================================
     AUTOPLAY
  ===================================================== */

  async function autoStart(){

    const savedState =
      getStored(
        "skMusicPlaying"
      );


    /*
       If visitor deliberately paused it,
       do not restart on another page.
    */

    if(savedState === "false"){

      pausedUI();

      return;

    }


    const started =
      await playMusic();


    /*
       Browsers may block audible autoplay.

       If that happens, the first normal
       interaction with the website will
       try starting the music again.
    */

    if(!started){

      const startAfterInteraction =
        async ()=>{

          const stillAllowed =
            getStored(
              "skMusicPlaying"
            );


          if(
            stillAllowed !== "false" &&
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



  /* =====================================================
     START
  ===================================================== */

  autoStart();

})();
EOF


for file in *.html; do

  if [ -f "$file" ]; then

    if ! grep -q 'js/music-player.js' "$file"; then

      sed -i 's#</body>#<script src="js/music-player.js"></script>\n</body>#' "$file"

      echo "Music added to: $file"

    else

      echo "Already connected: $file"

    fi

  fi

done

echo ""
echo "======================================"
echo "SK SAPILANG MUSIC PLAYER INSTALLED"
echo "======================================"
echo ""
echo "Make sure your MP3 is located at:"
echo "audio/sk-sapilang-official-music.mp3"
echo ""