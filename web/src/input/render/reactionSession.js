export const gestureCycle = {
    currentTarget: null,
    previousTarget: null,
    pressActive: false,
    swipeActive: false,
    mouseOver: false,   // renamed from selectedTarget

    setCurrent(target) {
        if (this.currentTarget) {
            this.previousTarget = this.currentTarget
        }
        if (!target) {
            this.currentTarget = null
            return
        }
        this.currentTarget = target
    },
    setMouseOver(over) { this.mouseOver = !!over },
    resetAll() {
        this.currentTarget = null
        this.previousTarget = null
        this.pressActive = false
        this.swipeActive = false
        this.mouseOver = false
    }
}