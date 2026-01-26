export const cycleState = {
    currentTarget: null,
    previousTarget: null,

    phaseType: 'idle',
    //'press' | 'swipe-start' | 'swipe' | 'idle'

    //MIGHT INTEGRATE THE FOLLOWING + MORE?
    mouseOver: false,   // renamed from selectedTarget
    swipeAxis: 'both', //might integrate

    getFacts() {
        return {
            currentTarget: this.currentTarget,
            previousTarget: this.previousTarget,
            phaseType: this.phaseType,
            mouseOver: this.mouseOver,
            swipeAxis: this.swipeAxis
        }
    },

    resetState() {
        this.currentTarget = null
        this.previousTarget = null
        this.phaseType = 'idle'
        this.mouseOver = false
        this.swipeAxis = 'both'
    },

    checkPressElegibility(type) {
        return this.phaseType === 'idle' && (!type || type === 'press')
    },
    checkSwipeStartElegibility(type) {
        return this.phaseType === 'press' && (!type || type === 'swipe-start')
    },
    checkSwipeElegibility(type) {
        return this.phaseType === 'swipe-start' && (!type || type === 'swipe')
    },
    checkSwipeEndElegibility(type) {
        return this.phaseType === 'swipe' && (!type || type === 'swipe-end')
    },
    checkPressReleaseElegibility(type) {
        return this.phaseType === 'press' && (!type || type === 'press-release')
    },

    activePress(solution) {
        if (this.currentTarget) {
            this.previousTarget = this.currentTarget
        }
        if (!solution.element) {
            this.resetState()
            return
        }
        this.currentTarget = solution.element
        this.phaseType = solution.type
    },

    activeSwipeStart(solution) {
        if (!this.currentTarget) {
            return
        }
        this.phaseType = solution.type
        //this.swipeAxis = solution.axis
    },

    activeSwipe(solution) {
        this.phaseType = solution.type
    },

    activeSwipeEnd() {
        this.resetState()
    },

    activePressRelease() {
        this.resetState()
    }
}