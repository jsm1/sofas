import 'regenerator-runtime/runtime.js'
import mixitup from '../lib/mixitup'
import mixitupPagination from '../lib/mixitup-pagination'
import mixitupMultifilter from '../lib/mixitup-multifilter'

mixitup.use(mixitupPagination)
mixitup.use(mixitupMultifilter)

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
        filterToggleTrueAttribute: 'data-iso-filter-true-value',
        filterToggleFalseAttribute: 'data-iso-filter-false-value',
        filterAttributePrefix: 'data-iso',
        filterToggleSwitchSelector: '.filter-switches input',
        priceBucketSelector: '[data-iso-filter-name="price"] .dd-filter-item:not(.price-range-item)',
        priceAttribute: 'data-iso-price',
        loaderSelector: '.filters-loading',
        paginationWrapperSelector: '.pagination-wrapper',
    })

    pageBuster.getPages()
        .then(() => {
            pageBuster.addProductsToPage()
            pageBuster.addDataAttributeClasses()
            filterHelper.initPriceBuckets()
            // document.querySelector('.pagination-wrapper').classList.add('mixitup-page-list')
            filterHelper.initPaginationButtons()
            window.mixer = mixitup(document.querySelector('.category-product-list'), {
                selectors: {
                    target: '.category-product-list > .tiles-section > div[role="listitem"]',
                },
                multifilter: {
                    enable: true,
                    parseOn: 'submit',
                },
                pagination: {
                    limit: 25,
                },
                callbacks: {
                    onMixStart() {
                        console.log('Filtering starting')
                        filterHelper.setLoading(true)
                    },
                    onMixEnd() {
                        console.log('Filtering ended')
                        window.requestAnimationFrame(() => filterHelper.setLoading(false))
                        filterHelper.setPageNavigationVisibility()
                    },
                    onPaginateEnd() {
                        filterHelper.setPageNavigationVisibility()
                        window.scrollTo(0, 0)
                    },
                }
            })
            filterHelper.getFilterState()
            filterHelper.togglePrevPageVisibility()
        })
})


