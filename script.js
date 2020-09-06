const pageBuster = {
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

const filterHelper = {
    init(config) {
        Object.assign(this, config)
        this.addFilterGroupTag()
        this.addEventListenerToSelector(this.filterButtonSelector, 'click', this.onFilterClick)
        this.addEventListenerToSelector(this.filterToggleSwitchSelector, 'click', this.onFilterClick)
        
    },

    addEventListenerToSelector(selector, event, func) {
        document.querySelectorAll(selector)
            .forEach(node => node.addEventListener(event, func.bind(this)))
    },

    onFilterClick() {
        console.log('Getting filter state')
        requestAnimationFrame(this.getFilterState.bind(this))
    },

    getFilterState() {
        this.setLoading(true)
        const filters = {}
        const filterLists = [...document.querySelectorAll(this.filterListSelector)]
        for (const list of filterLists) {
            const filterName = list.getAttribute(this.filterNameAttribute)
            const selectedItems = [...list.querySelectorAll(this.getSelectedItemSelector())]
            const itemText = selectedItems.map(i => i.parentNode.textContent)
            filters[filterName] = itemText
        }

        // Filter toggle switches
        const checkedFilterToggleSwitches = [...document.querySelectorAll(this.filterToggleSwitchSelector + ':checked')]
        const uncheckedFilterToggleSwitches = [...document.querySelectorAll(this.filterToggleSwitchSelector + ':not(:checked)')]
        for (const toggle of checkedFilterToggleSwitches) {
            const filterName = toggle.getAttribute(this.filterNameAttribute)
            if (!filterName) {
                continue
            }
            filters[filterName] = true
        }

        for (const toggle of uncheckedFilterToggleSwitches) {
            const filterName = toggle.getAttribute(this.filterNameAttribute)
            if (!filterName) {
                continue
            }
            filters[filterName] = false
        }

        console.log('Filter state', filters)
        this.displayFilterTags(filters)
        this.applyFilterState(filters)
    },

    getSelectedItemSelector() {
        return this.filterItemSelector + ' input:checked'
    },

    displayFilterTags(filters) {
        const filterTags = []
        for (const [filterGroup, filterList] of Object.entries(filters)) {
            if (!Array.isArray(filterList)) {
                continue
            }
            for (const filter of filterList) {
                filterTags.push(this.getFilterTagEl(filterGroup, filter))
            }
        }

        const tagWrapper = document.querySelector(this.activeFilterWrapper)
        tagWrapper.innerHTML = ''
        for (const tag of filterTags) {
            tagWrapper.appendChild(tag)
        }
    },

    getFilterTagHTML(filter) {
        return `<div class="active-filter-cloud"><a href="#" class="active-filter-link w-inline-block"><div>${filter}</div></a></div>`
    },

    getFilterTagEl(filterName, filterValue) {
        const div = document.createElement('div')
        div.classList.add('active-filter-cloud')
        div.innerHTML = `<a href="#" class="active-filter-link w-inline-block"><div>${filterValue}</div></a></div>`
        div.addEventListener('click', () => this.onDeselectFilter(filterName, filterValue))
        return div
    },

    onDeselectFilter(filterName, filterValue) {
        const items = Array.from(document.querySelectorAll(`${this.filterListSelector}[${this.filterNameAttribute}="${filterName}"] ${this.getSelectedItemSelector()}`))
        const matching = items.find(i => i.parentNode.textContent === filterValue)
        if (matching) {
            matching.parentNode.click()
            this.getFilterState()
        }
    },

    addFilterGroupTag() {
        const filters = [...document.querySelectorAll(`[${this.filterNameAttribute}]`)]
        filters.forEach(f => f.innerHTML += `<div style="display: none;" data-filter-group="${f.getAttribute(this.filterNameAttribute)}"></div>`)
    },

    applyFilterState(state) {
        if (!window.mixer) {
            return
        }
        for (const [ filterName, filterValues ] of Object.entries(state)) {
            if (filterValues === true) {
                window.mixer.setFilterGroupSelectors(filterName, [this.getFilterAsSelector(filterName, 'true'), this.getFilterAsSelector(filterName, 'yes')])
            } else if (filterValues === false) {
                window.mixer.setFilterGroupSelectors(filterName, null)
            } else {
                window.mixer.setFilterGroupSelectors(filterName, filterValues.map(f => this.getFilterAsSelector(filterName, f)))
            }
          
        }
        window.mixer.parseFilterGroups(false)
    },

    getFilterAsSelector(filterName, filterValue) {
        return `[${this.filterAttributePrefix}-${filterName}="${filterValue}"]`
    },

    // Price buckets
    initPriceBuckets() {
        const buckets = [...document.querySelectorAll(this.priceBucketSelector)].map(b => b.innerText)
        const rangeRegex = /(\d+)-(\d+)/
        const bucketMap = {}
        buckets.forEach((bucket, index) => {
            const rangeMatches = bucket.match(rangeRegex)
            if (rangeMatches) {
                bucketMap[bucket] = [ parseInt(rangeMatches[1]), parseInt(rangeMatches[2]) ]
            } else if (index === 0) {
                bucketMap[bucket] = [ 0, this.getNumberFromString(bucket) ]
            } else if (index === buckets.length - 1) {
                bucketMap[bucket] = [ this.getNumberFromString(bucket), Number.POSITIVE_INFINITY ]
            }
        })
        this.priceBuckets = bucketMap
        this.setPriceBuckets()
    },

    getNumberFromString(string = '') {
        return parseInt(string.replace(/[^\d]/g, ''))
    },

    setPriceBuckets() {
        const products = [...document.querySelectorAll(`[${this.priceAttribute}]`)]
        products.forEach(product => {
            const price = product.getAttribute(this.priceAttribute)
            product.setAttribute(this.priceAttribute, this.getBucketForPrice(price))
        })
    },

    getBucketForPrice(price) {
        const priceFloat = parseFloat(price)
        for (const [key, value] of Object.entries(this.priceBuckets)) {
            if (priceFloat >= value[0] && priceFloat < value[1]) {
                return key
            }
        }
        return price
    },

    setLoading(isLoading) {
        const loadingEl = document.querySelector(this.loaderSelector)
        if (!loadingEl) {
            return
        }
        loadingEl.style.display = isLoading ? 'block' : '' 
    },
}

window.addEventListener('load', function() {
    pageBuster.init({
        chunkSize: 10,
        productSelector: '.category-product-list > .tiles-section > div[role="listitem"]',
        filterTagsSelector: '.filter-tags > div',
        nextPageSelector: 'a.w-pagination-next'
    })

    filterHelper.init({
        filterListSelector: '.dd-filter-contents',
        filterItemSelector: '.dd-filter-item',
        filterButtonSelector: '.button-2.reset.w-button',
        activeFilterWrapper: '.active-filter-tags',
        filterNameAttribute: 'data-iso-filter-name',
        filterAttributePrefix: 'data-iso',
        filterToggleSwitchSelector: '.filter-switches input',
        priceBucketSelector: '[data-iso-filter-name="price"] .dd-filter-item:not(.price-range-item)',
        priceAttribute: 'data-iso-price',
        loaderSelector: '.filters-loading',
    })

    pageBuster.getPages()
        .then(() => {
            pageBuster.addProductsToPage()
            pageBuster.addDataAttributeClasses()
            filterHelper.initPriceBuckets()
            window.mixer = mixitup(document.querySelector('.category-product-list'), {
                selectors: {
                    target: '.category-product-list > .tiles-section > div[role="listitem"]',
                },
                multifilter: {
                    enable: true,
                    parseOn: 'submit',
                },
                callbacks: {
                    onMixStart() {
                        console.log('Filtering starting')
                        filterHelper.setLoading(true)
                    },
                    onMixEnd() {
                        console.log('Filtering ended')
                        window.requestAnimationFrame(() => filterHelper.setLoading(false))
                    },
                }
            })
            filterHelper.getFilterState()
        })
})


