<script>
    import ProductTile from './ProductTile.svelte'
    import Tile from './tile.js'
    let tiles = [];
    let filters = [];
    let omittedFilters = ["Expired"];
    let flairs = ["Meta", "Mod Post", "CPU", "Prebuilt", "GPU", "SSD - M.2", "Case", "Expired", "Printer", "Monitor", "Keyboard", "Headphones", "PSU"]
    for (let i = 0; i < flairs.length; i++) {
        filters.push([flairs[i], !(omittedFilters.includes(flairs[i]))]);
    }
    let url = 'https://www.reddit.com/r/buildapcsales.json';
    let promise = getTiles();
    function filterPost(data, filters) {
        if (filters.includes(data.link_flair_css_class)) {
            return false;
        } else {
            return true;
        }
    }
    async function getTiles() {
        await fetch(url)
        .then(response => response.json())
        .then(body => {
            for (let index = 0; index < body.data.children.length; index++) {
                let data = body.data.children[index].data;
                let _title = data.title;
                let _url = data.url;
                let _purl = data.permalink;
                if (filterPost(data, filters)) {
                    let newTile = new Tile(data, _title, _url, _purl);
                    tiles.push(newTile);
                }
                // console.log(body.data.children[index]);
            }
        })
        return tiles;
    }
</script>
<div class="filter-container">
    {#each filters as filter}
        {#if filter[1]}
        <label>
            <input type="checkbox" checked>
            {filter[0]}
        </label>
        {:else}
        <label>
            <input type="checkbox">
            {filter[0]}
        </label>
        {/if}
    {/each}
</div>

<div class="grid-container">
    {#await promise}
    <ProductTile />
    {:then tilees}
        {#each tilees as tilee}
        <ProductTile tile={tilee}/>
        {/each}
    {/await}
</div>

<style>
    .grid-container {
        display: inline-grid;
        column-gap: 50px;
        row-gap: 50px;
        grid-template-columns: auto auto auto;
    }
    .filter-container {
        display: flex;
        justify-content: space-evenly;
    }
</style>