<script>
    import ProductTile from './ProductTile.svelte'
    export let count = "20";
    let tiles = [];
    let fruits = [];
    let url = 'https://www.reddit.com/r/buildapcsales.json';
    let loaded = false;
    let promise = [getTiles()];
    async function getTiles() {
        fetch(url)
        .then(response => response.json())
        .then(body => {
            for (let index = 0; index < body.data.children.length; index++) {
                let newTile = {
                    "title": body.data.children[index].data.title,
                    "link":  body.data.children[index].data.url
                };
                tiles.push(newTile);
            }
        })
        console.log(tiles);
        return tiles;
    }
</script>

<div class="grid-container">
    <ProductTile />
    {#await promise then value}
        {console.log({value}.value[0])}
        {#each {value}.value as tile}
            {console.log(tile)}
            <ProductTile title={tile.title} url={tile.url}/>
        {/each}
    {/await}
</div>

<style>
    /* .grid-container {
        display: flex;
        column-gap: 50px;
    } */
</style>