/**
 * The world the site lives in: an atmosphere behind everything, and the entrance into
 * sahaj.os on a first visit. Both are server-rendered HTML + CSS with tiny inline scripts,
 * so they work from the very first frame without waiting for React to hydrate.
 */

/**
 * Decides before first paint whether to play the entrance: home page, first visit this
 * session, full motion, not pinned to plain view, WebGL2 available. Any click, key, wheel or
 * touch skips it; it ends on its own after ~2 s.
 */
const ENTRANCE = `(function(){try{
var d=document.documentElement;
var ok=location.pathname==="/"&&!matchMedia("(prefers-reduced-motion: reduce)").matches
&&localStorage.getItem("sahaj:view")!=="plain"&&localStorage.getItem("sahaj:motion")!=="paused"
&&!sessionStorage.getItem("sahaj:entered")&&("WebGL2RenderingContext" in window);
if(!ok)return;
sessionStorage.setItem("sahaj:entered","1");
d.dataset.enter="on";
var done=false;
function end(){if(done)return;done=true;delete d.dataset.enter;delete d.dataset.enterSkip;}
function skip(){if(done)return;d.dataset.enterSkip="on";setTimeout(end,380);}
["pointerdown","keydown","wheel","touchstart"].forEach(function(t){addEventListener(t,skip,{once:true,passive:true});});
setTimeout(end,2150);
}catch(e){}})();`;

/** Soft light that follows the cursor; one rAF-throttled style write per move. */
const CURSOR_LIGHT = `(function(){
if(!matchMedia("(pointer: fine)").matches)return;
var d=document.documentElement,x=0,y=0,raf=0;
addEventListener("pointermove",function(e){x=e.clientX;y=e.clientY;if(!raf)raf=requestAnimationFrame(function(){raf=0;d.style.setProperty("--mx",x+"px");d.style.setProperty("--my",y+"px");});},{passive:true});
})();`;

export function Entrance() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ENTRANCE }} />
      <div className="enter-veil" aria-hidden="true">
        <div className="enter-ring" />
        <div className="enter-core">
          <div className="enter-seed" />
          <p className="enter-word">
            <span className="enter-hint">entering</span>
            <span>
              sahaj<em>.os</em>
            </span>
          </p>
        </div>
      </div>
    </>
  );
}

export function Atmosphere() {
  return (
    <>
      <div className="atmos" aria-hidden="true">
        <i className="aura a1" />
        <i className="aura a2" />
        <i className="aura a3" />
        <i className="cursor-light" />
        <i className="grain" />
      </div>
      <script dangerouslySetInnerHTML={{ __html: CURSOR_LIGHT }} />
    </>
  );
}
