<script>
    import ProductTile from './ProductTile.svelte'
    import Tile from './tile.js'
    let tiles = [];
    let url = 'https://www.reddit.com/r/buildapcsales.json';
    let promise = getTiles();
    function filterPost(data) {
        if (data.link_flair_css_class === "expired") {
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
                if (filterPost(data)) {
                    let newTile = new Tile(_title, _url, _purl);
                    tiles.push(newTile);
                }
                console.log(body.data.children[index]);
            }
        })
        return tiles;
    }
</script>
<div class="grid-container">
    {#await promise}
    <ProductTile />
    {:then tilees}
        {#each tilees as tilee}
        <ProductTile title={tilee.title} url={tilee.url} post_url={tilee.post_url}/>
        {/each}
    {/await}
</div>

<style>
    .grid-container {
        display: grid;
        column-gap: 50px;
        row-gap: 50px;
        grid-template-columns: auto auto auto;
    }
</style>