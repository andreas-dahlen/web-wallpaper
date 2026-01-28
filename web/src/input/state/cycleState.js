export const cycleState = {
    currentTarget: null,
    previousTarget: null,

    phaseType: 'idle',
    //'press' | 'swipe-start' | 'swipe' | 'idle'

    //MIGHT INTEGRATE THE FOLLOWING + MORE?
    // mouseOver: false,   // renamed from selectedTarget
    axis: 'both',
    lockAxis: false,
    pressCancel: false,

    getFacts() {
        return {
            currentTarget: this.currentTarget,
            previousTarget: this.previousTarget,
            phaseType: this.phaseType,

            // mouseOver: this.mouseOver,

            axis: this.axis,
            lockAxis: this.lockAxis,
            pressCancel: this.pressCancel
        }
    },

    setCycle(result) {
        this.phaseType = result.type

        if (result.target) {
            this.previousTarget = this.currentTarget
            this.currentTarget = result.target
        }

        if (result.axis !== undefined) this.axis = result.axis
        if (result.lockAxis !== undefined) this.lockAxis = result.lockAxis
        if (result.pressCancel !== undefined) this.pressCancel = result.pressCancel
    },

    resetState() {
        this.currentTarget = null
        this.previousTarget = null
        this.phaseType = 'idle'

        // this.mouseOver = false
        this.axis = 'both'
        this.lockAxis = false
        this.pressCancel = false
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
    //intent, result








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
        //this.axis = solution.axis
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