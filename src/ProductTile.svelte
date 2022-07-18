<script>
    import Tile from "./tile";
    export let tile = new Tile();
    export let data = tile.data;
    export let title = tile.title;
    export let url = tile.url;
    export let post_url = tile.post_url;
    export let image;
    let now = new Date().getTime() / 1000;
    let daysAgo = Math.round((now - data.created) / 86400);
    $: bgImage = `background-image: url("${image}");`;
    // console.log(tile);
</script>

<div class="product-tile-container" style="{bgImage} background-size: contain;">
    <p>{daysAgo} days ago by {data.author}</p>
    <h2>{title}</h2>
    <a target="_blank" href={url}>PRODUCT LINK</a>
    <br/>
    <a target="_blank" href="https://www.reddit.com{post_url}">VISIT ORIGINAL POST</a>
    <h4>{data ? data.domain : ""}</h4>
    <img src={data ? "https://" + data.domain + "/favicon.ico" : ""} alt={data ? data.domain + " logo" : "undefined logo"}/>
</div>

<style>
    .product-tile-container {
        width: auto;
        height: auto;
        background-color: #FFF;
        background-image: url(${data.thumbnail});
        border-radius: 16px;
        border-width: 4px;
        border-style: solid;
        border-color: #ff3e00;
        color: #ff3e00;
        padding: 2rem;
    }

    .product-tile-container:hover {
        background-color: whitesmoke;
    }
</style>