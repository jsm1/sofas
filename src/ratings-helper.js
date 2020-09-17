module.exports = {
    init(config) {
        Object.assign(this, config)
        this.parser = new DOMParser()
        this.applyStarRatings()
    },

    applyStarRatings() {
        const ratingBlocks = [...document.querySelectorAll(this.ratingBlockSelector)]
        ratingBlocks.forEach((block) => this.applyStarRatingToBlock(block))
    },

    applyStarRatingToBlock(block) {
        const rating = block.getAttribute(this.ratingAttribute) || 0
        const wholeStars = Math.floor(rating)
        const fractionalStars = wholeStars ? rating % wholeStars : 0
        const roundedFractionalStars = parseFloat(fractionalStars).toFixed(2)
        const starWrapper = block.querySelector(this.starWrapperSelector)
        const starEls = []
        for (let i = 0; i < wholeStars; i++) {
            starEls.push(this.getStarWithFill(1))
        } 
        starEls.push(this.getStarWithFill(roundedFractionalStars))
        starEls.forEach(el => starWrapper.appendChild(el))

        this.setRatingText(block, rating)
    },

    setRatingText(block, rating) {
        block.querySelector(this.ratingNumberSelector).innerText = rating
    },

    getStarWithFill(fill) {
        const linearGradientName = 'linear-gradient-' + fill
        const svg = this.getNodeWithAttributes('svg', { viewBox: '0 0 11.49 11' })
        const defs = this.getNodeWithAttributes('defs', { viewBox: '0 0 11.49 11' })
        const gradient = this.getNodeWithAttributes('linearGradient', { id: linearGradientName, y1: "5.5", x2: "11.49", y2:"5.5", gradientUnits:"userSpaceOnUse" })
        const stop1 = this.getNodeWithAttributes('stop', { offset: fill, 'stop-color': "#f8c246" })
        const stop2 = this.getNodeWithAttributes('stop', { offset: fill, 'stop-color': "#fff" })
        const g1 = this.getNodeWithAttributes('g', { id: 'fivestars' })
        const g2 = this.getNodeWithAttributes('g', { id: 'stars-empty' })
        const path = this.getNodeWithAttributes('path', {id: "s", d: "M2.94,10.92,5.75,9.44l2.81,1.48a.68.68,0,0,0,1-.72L9,7.07l2.28-2.21a.7.7,0,0,0-.38-1.18L7.77,3.23,6.36.38a.69.69,0,0,0-1.23,0L3.73,3.23.59,3.68A.69.69,0,0,0,.21,4.86L2.48,7.07,1.94,10.2A.69.69,0,0,0,2.94,10.92Z", style: `fill: url(#${linearGradientName})`})

        g2.appendChild(path)
        g1.appendChild(g2)

        gradient.appendChild(stop1)
        gradient.appendChild(stop2)
        defs.appendChild(gradient)

        svg.appendChild(defs)
        svg.appendChild(g1)
       
        return svg
    },

    getNodeWithAttributes(svgNode, attributes) {
        const newNode = document.createElementNS('http://www.w3.org/2000/svg', svgNode)
        for (const [key, value] of Object.entries(attributes)) {
            newNode.setAttribute(key, value)
        }
        return newNode
    },
}