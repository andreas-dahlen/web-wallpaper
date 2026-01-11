/* ==================================================
   REACTION CSS MAP
   ==================================================

   This is a reference for InputElement reactions.
   Use it to check data-* flags, state names, and
   example CSS effects for press, release, swipe, etc.
*/

/* --------------------
   PRESS
   --------------------
   Triggered: data-pressed="true"
   Example:
     - Button moves down (translateY)
     - Slight scale down
     - Darker background
*/
.test-button[data-pressed="true"],
.test-button :deep(.input-element[data-pressed="true"]) {
    transform: translateY(2px) scale(0.97);
    background: #0f172a;
}

/* --------------------
   RELEASE
   --------------------
   Triggered: removal of data-pressed
   Example:
     - Reset scale/position
     - Restore background
*/
.test-button :deep(.input-element):not([data-pressed="true"]) {
    transform: translateY(0) scale(1);
    background: #111827;
}

/* --------------------
   SWIPE START
   --------------------
   Triggered: data-swiping="true" + data-react-swipe-start
   Example:
     - Highlight or glow
     - Subtle opacity change
*/
.test-button :deep(.input-element[data-swiping="true"][data-react-swipe-start="true"]) {
    box-shadow: 0 0 20px rgba(255,255,255,0.1);
    opacity: 0.9;
}

/* --------------------
   SWIPE
   --------------------
   Triggered: data-swiping="true"
   Example:
     - Change opacity/brightness
     - Optional transform based on delta (JS-driven)
*/
.test-button :deep(.input-element[data-swiping="true"]) {
    opacity: 0.85;
    filter: brightness(0.95);
}

/* --------------------
   SWIPE END
   --------------------
   Triggered: data-react-swipe-end
   Example:
     - Commit animation / pulse
*/
.test-button :deep(.input-element[data-react-swipe-end="true"]) {
    animation: swipeEndPulse 0.2s ease forwards;
}

/* --------------------
   CANCEL
   --------------------
   Triggered: data-react-cancel
   Example:
     - Shake animation
     - Reset opacity/transform
*/
.test-button :deep(.input-element[data-react-cancel="true"]) {
    animation: cancelShake 0.15s ease;
}

/* --------------------
   OPTIONAL ANIMATIONS
   -------------------- */
@keyframes swipeEndPulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.9; }
    100% { transform: scale(1); opacity: 1; }
}

@keyframes cancelShake {
    0% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    50% { transform: translateX(4px); }
    75% { transform: translateX(-4px); }
    100% { transform: translateX(0); }
}

/* ==================================================
   END REACTION MAP
   ================================================== */
