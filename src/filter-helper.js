module.exports = {
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

    initPaginationButtons() {
        const buttonHTML = `
            <a href="#" class="w-pagination-previous button-2 next-prev prev pagination-button pagination-button__prev">
                <svg class="w-pagination-previous-icon" height="12px" width="12px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" transform="translate(0, 1)"><path fill="none" stroke="currentColor" fill-rule="evenodd" d="M8 10L4 6l4-4"></path>
                </svg>
                <div class="w-inline-block">Vorherige Seite</div>
            </a>
            <a href="#" class="w-pagination-next button-2 next-prev pagination-button pagination-button__next">
                <div class="w-inline-block">Nächste Seite</div>
                <svg class="w-pagination-next-icon" height="12px" width="12px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" transform="translate(0, 1)"><path fill="none" stroke="currentColor" fill-rule="evenodd" d="M4 2l4 4-4 4"></path>
                </svg>
            </a>`
        const paginationWrapperEl = document.querySelector(this.paginationWrapperSelector)
        paginationWrapperEl.innerHTML = buttonHTML
        this.addEventListenerToSelector('.pagination-button__prev', 'click', this.prevPageClick)
        this.addEventListenerToSelector('.pagination-button__next', 'click', this.nextPageClick)
    },

    togglePrevPageVisibility() {
        if (mixer.getState().activePagination.page === 1) {
            document.querySelector('.pagination-button__prev').style.display = 'none'
        } else {
            document.querySelector('.pagination-button__prev').style.display = 'block'
        }
    },

    prevPageClick() {
        window.mixer.prevPage()
    },

    nextPageClick() {
        window.mixer.nextPage()
    },
}