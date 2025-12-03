function updateClock() {
const clock = document.getElementByid('clock');
const now = new Date();
clock.textContent =
now.getHours().toString().padStart(2,'0') + ':' +
now.getMinutes().toString().padStart(2,'0');
}
setInterval(updateClock, 1000);
updateClock();

const buttons = document.querySelectorAll("[data-package]");
buttons.forEach(btn => {
    btn.addEventListener("click", () => {
        const pkg = btn.getAttribute("data-package");
        Android.openApp(pkg);
    });
});