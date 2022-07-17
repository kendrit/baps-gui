<script>
    import ProductTile from './ProductTile.svelte'
    import Tile from './tile.js'
    import Fa from 'svelte-fa/src/fa.svelte';
	import {faRefresh} from '@fortawesome/free-solid-svg-icons/index.es';
    let filters = {};
    let flairs = ["Meta", "Mod Post", "CPU", "Prebuilt", "GPU", "Misc", "Mouse", "Laptop", "RAM", "Fan", "Controller", "SSD-SATA", "Case", "Expired", "Printer", "Monitor", "Keyboard", "Headphones", "PSU", "Cooler"];
    let tiles = [];
    let url = 'https://www.reddit.com/r/buildapcsales.json';
    let promise = getTiles();
    for (let i = 0; i < flairs.length; i++) {
        filters[flairs[i].toLowerCase()] = true;
    }
    filters = filters;
    function refresh() {
        promise = getTiles();
    }
    function disableAll() {
        for (let i = 0; i < flairs.length; i++) {
            filters[flairs[i].toLowerCase()] = false;
        }
        filters = filters;
        refresh();
    }
    function enableAll() {
        for (let i = 0; i < flairs.length; i++) {
            filters[flairs[i].toLowerCase()] = true;
        }
        filters = filters;
        refresh();
    }
    function filterPost(data) {
        for (let i = 0; i < flairs.length; i++) {
            return filters[data.link_flair_css_class.toLowerCase()];
        }
        return true;
    }
    async function getTiles() {
        console.log(filters);
        while (tiles.length > 0) {
                tiles.pop();
        }
        await fetch(url)
        .then(response => response.json())
        .then(body => {
            for (let index = 0; index < body.data.children.length; index++) {
                let data = body.data.children[index].data;
                let _title = data.title;
                let _url = data.url;
                let _purl = data.permalink;
                if (filterPost(data)) {
                    let newTile = new Tile(data, _title, _url, _purl);
                    tiles.push(newTile);
                } else {
                    console.log(data.link_flair_css_class + " not allowed!");
                }
            }
        })
        return tiles;
    }
    function isChecked(type) {
		return filters[type.toLowerCase()];
	}
    function changeFilter(filter) {
		if (filters[filter.toLowerCase()]) {
            filters[filter.toLowerCase()] = false;
        } else {
            filters[filter.toLowerCase()] = true;
        }
        filters = filters;
        refresh();
		return;
	}
</script>

<div>
    <button on:click={refresh}><Fa icon={faRefresh}/></button>
    <button on:click={enableAll}>Enable All</button>
    <button on:click={disableAll}>Disable All</button>
</div>
<div class="filter-container">
    {#each flairs as filter}
        <label>
            <input type="checkbox" checked={filters[filter.toLowerCase()]} on:click={() => changeFilter(filter)}/>
            {filter}
        </label>
    {/each}
</div>
<br>
<div class="grid-container">
    {#await promise}
    <h1>Loading...</h1>
    {:then tilees}
        {#each tilees as tilee}
        <ProductTile tile={tilee} image='images/{tilee.data.link_flair_css_class.toLowerCase()}.jpg'/>
        {/each}
    {/await}
</div>

<style>
    .filter-container {
        display: flex;
        justify-content: space-evenly;
    }

    button {
		background-color: transparent;
		border-width: 0;
	}

	button:hover {
		background-color: #ff3e00;
	}

    .grid-container {
        display: grid;
        column-gap: 50px;
        row-gap: 50px;
        grid-template-columns: auto auto auto auto;
    }
    .filter-container {
        display: flex;
        justify-content: space-evenly;
    }
</style>