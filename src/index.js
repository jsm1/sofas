require('../lib/mixitup.min.js')
require('../lib/mixitup-pagination.min.js')
require('../lib/mixitup-multifilter.min.js')

import pageBuster from './page-buster'
import filterHelper from './filter-helper'

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


