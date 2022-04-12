<script>
    export let title = "A Product Title"
    export let url = ""
</script>

<div class="product-tile-container">
    <h2>{title}</h2>
    <a href={url}>VISIT</a>
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
    }

    .product-tile-container:hover {
        background-color: whitesmoke;
    }
</style>