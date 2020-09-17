module.exports = {
    init({
        formSelector,
        searchInputSelector
    }) {
        console.log('init search');
        this.formSelector = formSelector
        this.searchInputSelector = searchInputSelector
        this.initListeners()
    },

    initListeners() {
        [...document.querySelectorAll(this.formSelector)]
            .forEach(node => node.addEventListener('submit', this.onSearch.bind(this)))
    },

    onSearch(event) {
        console.log('hey')
        event.preventDefault()
        console.log(event)
        const searchInput = document.querySelector(this.searchInputSelector)
        const value = searchInput.value
        if (!value) {
            return
        }
        const urlEncodedValue = encodeURI(value)
        window.open(`https://www.moebel24.de/s?query=${urlEncodedValue}&mode=webflow`, '_blank')
    },
}