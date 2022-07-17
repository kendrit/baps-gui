<script>
    import Tile from "./tile";
    export let tile = new Tile();
    export let data = tile.data;
    export let title = tile.title;
    export let url = tile.url;
    export let post_url = tile.post_url;
    // console.log(tile);
</script>

<div class="product-tile-container">
    <h2>{title}</h2>
    <a target="_blank" href={url}>PRODUCT LINK</a>
    <br/>
    <a target="_blank" href="https://www.reddit.com{post_url}">VISIT ORIGINAL POST</a>
    <h4>{data ? data.domain : ""}</h4>
    <img src={data ? "https://" + data.domain + "/favicon.ico" : ""} alt={data ? data.domain + " logo" : "undefined logo"}/>
</div>

<style>
    .product-tile-container {
        width: 300px;
        height: 300px;
        background-color: white;
        border-radius: 16px;
        border-width: 2px;
        border-style: solid;
        border-color: #ff3e00;
        color: #222;
        padding: 2rem;
    }

    .product-tile-container:hover {
        background-color: whitesmoke;
    }
</style>