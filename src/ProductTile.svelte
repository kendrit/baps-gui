<script>
    import Tile from "./tile";
    export let tile = new Tile();
    export let data = tile.data;
    export let title = tile.title;
    export let url = tile.url;
    export let post_url = tile.post_url;
    let now = new Date().getTime() / 1000;
    let daysAgo = Math.round((now - data.created) / (60 * 60 * 24));
    let hoursAgo = Math.round((now - data.created) / (60 * 60));
    let minutesAgo = Math.round((now - data.created) / (60));
    $: bgImage = `background-image: url("${data.thumbnail}");`;
    // console.log(tile);
</script>

<a target="_blank" class="product-tile-container" href={url}>
    {#if daysAgo != 0}
    <p><b>{daysAgo} day(s) ago</b> by <a href="https://www.reddit.com/u/{data.author}/">{data.author}</a></p>
    {:else if hoursAgo != 0}
    <p><b>{hoursAgo} hour(s) ago</b> by <a href="https://www.reddit.com/u/{data.author}/">{data.author}</a></p>
    {:else if minutesAgo != 0}
    <p><b>{daysAgo} minute(s) ago</b> by <a href="https://www.reddit.com/u/{data.author}/">{data.author}</a></p>
    {/if}
    <h2>{title}</h2>
    <a target="_blank" href="https://www.reddit.com{post_url}">VISIT ORIGINAL POST</a>
    <div class="vendor" style="display=inline;">
        
        <h4>{data ? "www." + data.domain : ""}</h4>
        <img src={data ? "https://" + data.domain + "/favicon.ico" : ""} alt={data ? data.domain + " logo" : "undefined logo"}/>
    </div>
    {#if data.thumbnail != 'nsfw' && data.thumbnail != 'default'}
        <img src={data.thumbnail} alt={data.title + " thumbnail"}/>
    {/if}
    
</a>

<style>
    .product-tile-container {
        transition: 0.3s;
        width: auto;
        height: auto;
        background-color: #000;
        background-image: "";
        border-radius: 16px;
        border-width: 0px;
        border-style: solid;
        border-color: #ff3e00;
        color: #ff3e00;
        padding: 2rem;
        text-decoration: none;
        box-shadow: 10px 10px 20px 0px rgba(0,0,0,0.50);
        -webkit-box-shadow: 10px 10px 20px 0px rgba(0,0,0,0.50);
        -moz-box-shadow: 10px 10px 20px 0px rgba(0,0,0,0.50);
    }

    h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

    p {
		color: #ff3e00;
		font-weight: 100;
	}

    h2 {
		color: #ff3e00;
		font-size: 2em;
		font-weight: 100;
	}

    .product-tile-container:hover {
        transition: 0.3s;
        background-color: #222;
        border-width: 8px;
    }
</style>