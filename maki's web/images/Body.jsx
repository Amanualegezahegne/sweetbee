

function Body() {
    return (<>
        <section className="hero">
            <h2>Pure & Natural Honey</h2>
            <div className="buttons">
                <button className="prev-btn"><i class="fas fa-arrow-left"></i></button>
                <button className="next-btn"><i class="fas fa-arrow-right"></i></button>
            </div>
        </section>


        <section class="products">
            <h2>Our Products</h2>
            <div className="product-list">
                <div className="product">
                    <img src="images/pic3.jpg" alt="Wild Honey" />
                    <h3>Wild Honey</h3>
                </div>
                <div className="product">
                    <img src="images/pic5.jpg" alt="Organic Honey" />
                    <h3>Organic Honey</h3>
                </div>
                <div className="product">
                    <img src="images/pic4.jpg" alt="Honeycomb Jar" />
                    <h3>Honeycomb Jar</h3>
                </div>
            </div>
            <p>For more information <a href="products.html">click here</a></p>
        </section>
    </>
    );


}

export default Body