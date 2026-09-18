/* Presentation-only proportional certificate scaling. Saved layer coordinates remain untouched. */
(function(){
  'use strict';
  function init(){
    var canvas=document.getElementById('certificateCanvas');
    if(!canvas || canvas.dataset.responsiveCanvas==='1') return;
    canvas.dataset.responsiveCanvas='1';
    var parent=canvas.parentNode;
    var shell=document.createElement('div');
    shell.className='sk-cert-scale-shell';
    shell.style.cssText='width:100%;position:relative;display:flex;justify-content:center;overflow:visible;';
    parent.insertBefore(shell,canvas); shell.appendChild(canvas);
    function fit(){
      var available=Math.max(280, shell.parentElement.clientWidth || window.innerWidth);
      if(window.innerWidth<=1100){
        var base=1068, h=base*(210/297), scale=Math.min(1,available/base);
        canvas.style.width=base+'px'; canvas.style.maxWidth='none'; canvas.style.flex='0 0 '+base+'px';
        canvas.style.transformOrigin='top center'; canvas.style.transform='scale('+scale+')';
        shell.style.height=(h*scale)+'px';
      }else{
        canvas.style.width='100%'; canvas.style.maxWidth='100%'; canvas.style.flex='0 1 auto';
        canvas.style.transform='none'; shell.style.height='auto';
      }
    }
    fit(); window.addEventListener('resize',fit,{passive:true}); window.addEventListener('orientationchange',fit,{passive:true});
    if(window.ResizeObserver) new ResizeObserver(fit).observe(parent);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
