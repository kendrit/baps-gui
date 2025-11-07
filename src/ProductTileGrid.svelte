<script>
    import ProductTile from './ProductTile.svelte'
    import Tile from './tile.js'
    import Fa from 'svelte-fa/src/fa.svelte';
	import {faRefresh} from '@fortawesome/free-solid-svg-icons/index.es';
    let filters = {};
    let limits = [
		{ id: 1, text: 10 },
		{ id: 2, text: 25 },
		{ id: 3, text: 50 },
        { id: 4, text: 100},
        { id: 5, text: 250},
        { id: 6, text: 500}
	];
    let limit = 10;
    let flairs = ["Meta", "CPU", "Prebuilt", "GPU", "Misc", "Mouse", "Laptop", "RAM", "Fan", "Controller", "SSD-SATA", "SSD-M2", "Case", "Printer", "Monitor", "Keyboard", "Headphones", "PSU", "Cooler"];
    let tiles = [];
    let selectedQueryType = 'top';
    let promise = getTiles();
    for (let i = 0; i < flairs.length; i++) {
        filters[flairs[i].toLowerCase()] = true;
    }
    filters = filters;
    function refresh() {
        promise = getTiles();
    }
    function generateUrl() {
        let filterList = Object.keys(filters);
        console.log(filterList);
        let url = 'https://api.reddit.com/r/buildapcsales/' + selectedQueryType + '.json?limit=' + limit + '&t=month';
        if (filters.length < 1) {
            return url;
        }
        url += '&f=';
        for (let i = 0; i < filters.length; i++) {
            if (i + 1 === filters.length) {
                url += 'flair_name%3A%22'+ filters[i] +'%22'
            } else {
                url += 'flair_name%3A%22'+ filters[i] +'%22%20OR'
            }
        }
        console.log(url);
        return url;
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
        if (data.link_flair_css_class == null) {
            return false;
        }
        for (let i = 0; i < flairs.length; i++) {
            return filters[data.link_flair_css_class.toLowerCase()];
        }
        return true;
    }
    async function getTiles() {
        console.log(selectedQueryType);
        let url = generateUrl();
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
        tiles.sort((a, b) => (a.data.created < b.data.created) ? 1 : -1);
        return tiles;
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
<select bind:value={limit} on:change="{() => answer = ''}">
    {#each limits as question}
        <option value={question.text}>
            {question.text}
        </option>
    {/each}
</select>
<button on:click={refresh}><b><Fa icon={faRefresh}/></b></button>
<button on:click={enableAll}><b>Enable All</b></button>
<button on:click={disableAll}><b>Disable All</b></button>
<div>
    <label class="radio-btn">
        <input type=radio bind:group={selectedQueryType} name="selectedQueryType" value={'hot'}>
        HOT
    </label>
    <label class="radio-btn">
        <input type=radio bind:group={selectedQueryType} name="selectedQueryType" value={'top'}>
        TOP
    </label>
    <label class="radio-btn">
        <input type=radio bind:group={selectedQueryType} name="selectedQueryType" value={'new'}>
        NEW
    </label>
</div>
<div class="filter-container">
    {#each flairs as filter}
    <label class="container">{filter}
        <input type="checkbox" checked={filters[filter.toLowerCase()]} on:click={() => changeFilter(filter)}>
        <span class="checkmark"></span>
      </label>
    {/each}
</div>
<br>
{#await promise}
    <h1>Loading...</h1>
{:then tilees}
<h2 class="header">{tilees.length} AVAILABLE PRODUCTS:</h2>
<div class="grid-container">
    {#each tilees as tilee}
        <ProductTile tile={tilee} image=''/>
        {/each}
</div>
{/await}

<style>

    .filter-container {
        display: flex;
        justify-content: space-evenly;
    }

    button {
		background-color: transparent;
		border-width: 0;
        color: #ff3e00;
	}

    h2 {
		color: #ff3e00;
		font-size: 2em;
		font-weight: 100;
	}

	button:hover {
		background-color: #ff3e00;
	}

    .grid-container {
        display: grid;
        column-gap: 50px;
        row-gap: 50px;
        grid-template-columns: auto auto auto;
    }
    .filter-container {
        display: flex;
        justify-content: space-evenly;
        width: 60%;
        flex-wrap: wrap;
        float: right;
    }

    .container {
        display: block;
        position: relative;
        padding-left: 35px;
        margin-bottom: 12px;
        cursor: pointer;
        font-size: 22px;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }

    /* Hide the browser's default checkbox */
    .container input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;
    }

    /* Create a custom checkbox */
    .checkmark {
        position: absolute;
        top: 0;
        left: 0;
        height: 25px;
        width: 25px;
        background-color: #000;
    }

    /* On mouse-over, add a grey background color */
    .container:hover input ~ .checkmark {
        background-color: #000;
    }

    /* When the checkbox is checked, add a blue background */
    .container input:checked ~ .checkmark {
        background-color: #000;
    }

    /* Create the checkmark/indicator (hidden when not checked) */
    .checkmark:after {
        content: "";
        position: absolute;
        display: none;
    }

    /* Show the checkmark when checked */
    .container input:checked ~ .checkmark:after {
        display: block;
    }

    /* Style the checkmark/indicator */
    .container .checkmark:after {
        left: 9px;
        top: 5px;
        width: 5px;
        height: 10px;
        border: solid #ff3e00;
        border-width: 0 3px 3px 0;
        -webkit-transform: rotate(45deg);
        -ms-transform: rotate(45deg);
        transform: rotate(45deg);
    }
</style>
