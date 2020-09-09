module.exports = {
    products: [],
    parser: null,
    chunkSize: null,
    productSelector: null,
    nextPageSelector: null,
    filterTagsSelector: null,

    init(config) {
        Object.assign(this, config)
        this.parser = new DOMParser()
    },

    async getPages() {
        const nextPagePrefix = this.getNextPagePrefix(document)
        let pageNumber = 2
        let lastPageReached = false
        while (!lastPageReached) {
            let count = 0
            const promises = []
            while (count < this.chunkSize) {
                promises.push(
                    this.getPage(nextPagePrefix, pageNumber)
                        .then((pageData) => {
                            const doc = this.parser.parseFromString(pageData, 'text/html')
                            this.parsePage(doc)
                            if (!this.getNextPageQueryString(doc)) {
                                lastPageReached = true
                            }
                        })
                )
                pageNumber++
                count++
            }
            await Promise.all(promises)
        }
    },
    async getPage(prefix, number) {
        return fetch(`${prefix}${number}`)
            .then((resp) => resp.text())
    },

    parsePage(doc) {
        this.products.push(...doc.querySelectorAll(this.productSelector));
    },

    getNextPagePrefix(doc) {
        const queryString = this.getNextPageQueryString(doc)
        return queryString.replace(/=\d+$/, '=')
    },

    getNextPageQueryString(doc) {
        const nextPageNode = doc.querySelector(this.nextPageSelector)
        return nextPageNode ? nextPageNode.search : null
    },

    addProductsToPage() {
        const listItemParent = document.querySelector(this.productSelector).parentNode
        this.products.forEach(node => {
            node.style.display = 'none'
            listItemParent.appendChild(node)
        })
    },
    addDataAttributeClasses() {
        const items = document.querySelectorAll(this.productSelector)
        items.forEach(item => {
            const filterEl = item.querySelector(this.filterTagsSelector)
            if (!filterEl) {
                return
            }
            const attributes = filterEl.attributes
            const classes = []
            for (let i = 0; i < attributes.length; i++) {
                const attr = attributes[i]
                item.setAttribute(attr.name, attr.value)
            }
        })
    },
}