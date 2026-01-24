export const gestureCycle = {
    currentTarget: null,
    previousTarget: null,
    pressActive: false,
    swipeActive: false,
    mouseOver: false,   // renamed from selectedTarget
    swipeAxis: 'both',

    setCurrent(target) {
        if (this.currentTarget) {
            this.previousTarget = this.currentTarget
        }
        if (!target) {
            this.currentTarget = null
            this.swipeAxis = 'both'
            return
        }
        this.currentTarget = target
        this.swipeAxis = target.axis || 'both'
    },
    setPrevious(target) { this.previousTarget = target },
    setMouseOver(over) { this.mouseOver = !!over },
    resetPress() { this.pressActive = false; this.previousTarget = null },
    resetSwipe() { this.swipeActive = false },
    resetGesture() {
        this.resetPress()
        this.resetSwipe()
    },
    resetAll() {
        this.currentTarget = null
        this.previousTarget = null
        this.pressActive = false
        this.swipeActive = false
        this.mouseOver = false
        this.swipeAxis = 'both'
    },
    hasCurrent() {
        return !!this.currentTarget
    }
}