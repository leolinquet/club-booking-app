// client/src/a2hs.js
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); // stop default mini-info bar
  deferredPrompt = e;

  const btn = document.getElementById("install-btn");
  if (btn) {
    btn.style.display = "inline-flex";
    btn.onclick = async () => {
      btn.style.display = "none";
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    };
  }
});
