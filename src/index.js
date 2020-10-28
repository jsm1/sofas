import 'regenerator-runtime/runtime.js'
import mixitup from '../lib/mixitup'
import mixitupPagination from '../lib/mixitup-pagination'
import mixitupMultifilter from '../lib/mixitup-multifilter'

mixitup.use(mixitupPagination)
mixitup.use(mixitupMultifilter)

import pageBuster from './page-buster'
import filterHelper from './filter-helper'
import searchHelper from './search-helper'
import ratingsHelper from './ratings-helper'

window.addEventListener('load', function() {
    pageBuster.init({
        chunkSize: 10,
        productSelector: '.category-product-list > .tiles-section > div[role="listitem"]',
        filterTagsSelector: '.filter-tags > div',
        nextPageSelector: 'a.w-pagination-next',
        tileLinkAttribute: 'data-tile-link',
        linkSelector: 'a.tile',
    })

    filterHelper.init({
        filterListSelector: '.dd-filter-contents',
        filterItemSelector: '.dd-filter-item',
        filterItemValueAttribute: 'data-iso-value',
        filterButtonSelector: '.button-2.reset.w-button',
        activeFilterContainer: '.active-filters',
        activeFilterWrapper: '.active-filter-tags',
        filterNameAttribute: 'data-iso-filter-name',
        filterToggleTrueAttribute: 'data-iso-filter-true-value',
        filterToggleFalseAttribute: 'data-iso-filter-false-value',
        filterAttributePrefix: 'data-iso',
        filterToggleSwitchSelector: '.filter-switches input',
        priceBucketSelector: '[data-iso-filter-name="price"] .dd-filter-item:not(.price-range-item)',
        priceAttribute: 'data-iso-price',
        minPriceInputSelector: '.price-field-wrapper [name="min"]',
        maxPriceInputSelector: '.price-field-wrapper [name="Max"]',
        loaderSelector: '.filters-loading',
        paginationWrapperSelector: '.pagination-wrapper',
    })

    searchHelper.init({
        formSelector: 'form.search',
        searchInputSelector: '#search',
    })

    const pageSizeElement = document.querySelector('[data-page-size]')
    let pageSize = 25
    if (pageSizeElement) {
        const parsed = parseInt(pageSizeElement.getAttribute('data-page-size'))
        pageSize = parsed || pageSize
    }

    pageBuster.getPages()
        .then(() => {
            pageBuster.addProductsToPage()
            pageBuster.addDataAttributeClasses()
            pageBuster.setTileLinks()
            filterHelper.initPriceBuckets()
            // document.querySelector('.pagination-wrapper').classList.add('mixitup-page-list')
            filterHelper.initPaginationButtons()
            window.mixer = mixitup(document.querySelector('.category-product-list'), {
                selectors: {
                    target: '.category-product-list > .tiles-section > div[role="listitem"]',
                    pageList: '.w-pagination-wrapper'
                },
                multifilter: {
                    enable: true,
                    parseOn: 'submit',
                },
                pagination: {
                    limit: pageSize,
                    generatePageList: true,
                },
                animation: {
                    enable: false,
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
                },
                templates: {
                    pager: '<button type="button" class="${classNames} pagination-button" data-page="${pageNumber}">${pageNumber}</button>',
                    pagerPrev: '<button type="button" class="${classNames w-pagination-previous button-2 next-prev prev pagination-button pagination-button__prev}" data-page="prev">Vorherige Seite</button>',
                    pagerNext: '<button type="button" class="${classNames} w-pagination-next button-2 next-prev pagination-button pagination-button__next" data-page="next">Nächste Seite</button>'
                },
            })
            filterHelper.getFilterState()
            //filterHelper.togglePrevPageVisibility()

            ratingsHelper.init({
                ratingBlockSelector: '.category-product-list > .tiles-section > div[role="listitem"]',
                ratingAttribute: 'data-iso-rating',
                starWrapperSelector: '.stars',
                ratingNumberSelector: '.rating-2',
            })
            // Reinitialise Webflow interactions
            Webflow.require('ix2').init()
        })
})


