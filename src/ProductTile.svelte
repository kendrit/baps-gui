<script>
    export let title = "A Product Title"
    export let description = "An example product description"
    export let productType = "General"
</script>

<div class="product-tile-container">
    <h2>{title}</h2>
    <p>{description}</p>
    <button>VISIT</button>
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