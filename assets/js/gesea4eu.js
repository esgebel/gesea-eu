/* GESEA4EU gallery: open a photo large, browse with the arrows or the keyboard. */
(function(){var lb=document.getElementById("g4lb");if(!lb)return;var bs=[].slice.call(document.querySelectorAll(".g4-grid button")),i=0,im=lb.querySelector("img");
function show(k){i=(k+bs.length)%bs.length;var s=bs[i].querySelector("img");im.src=s.getAttribute("src")||"";im.alt=s.alt;lb.classList.add("on");}
bs.forEach(function(b,k){b.addEventListener("click",function(){show(k);});});
lb.querySelector(".x").onclick=function(){lb.classList.remove("on");};lb.querySelector(".p").onclick=function(){show(i-1);};lb.querySelector(".n").onclick=function(){show(i+1);};
lb.addEventListener("click",function(e){if(e.target===lb)lb.classList.remove("on");});document.addEventListener("keydown",function(e){if(!lb.classList.contains("on"))return;if(e.key==="Escape")lb.classList.remove("on");if(e.key==="ArrowLeft")show(i-1);if(e.key==="ArrowRight")show(i+1);});})();
