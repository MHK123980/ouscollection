$(document).ready(async () => {
    try {
        const response = await axios.get("/user/cartItemCount")
        const itemCount = response.data.itemCount ? response.data.itemCount : 0
        $(".cart-item-count").html(itemCount)

    } catch (err) {
        console.error(err)
    }
})

async function deleteItem(productId) {
    try {
        document.getElementById("waiter").innerHTML =`<div class="waiting"></div>`
        const cartCount =document.getElementById(`currentQuantity-${productId}`)?.value
        const response = await axios({
            method: "delete",
            url: `/user/cart/${productId}`,
            data: {
                cartCount: parseInt(cartCount)
            }
        })
        document.getElementById("waiter").innerHTML =""
        let itemCount = Number($(".cart-item-count").html())
        itemCount -= Number(cartCount)
        if (itemCount != 0) {
            document.getElementById(`cartItem-${productId}`).remove()
            $(".cart-item-count").html(itemCount)
            
                // Update cart totals in real-time instead of reloading
                if (window.location.pathname === '/cart' || window.location.pathname === '/checkout') {
                    // Use setTimeout to ensure DOM is updated before recalculating
                    setTimeout(updateCartTotals, 100);
                }
            toastr.options = { "positionClass": "toast-bottom-right" }
            toastr.warning('item removed from cart.')

        } else {
            // Only reload if on cart/checkout page, otherwise show message
            if (window.location.pathname === '/cart' || window.location.pathname === '/checkout') {
                window.location.reload()
            } else {
                toastr.options = { "positionClass": "toast-bottom-right" }
                toastr.warning('item removed from cart.')
            }
        }

    } catch (error) {
        console.error(error)
    }
}

async function addToCart(productId, productName, productPrice, quantity, offerPrice) {
    
    let currentQuantity = parseInt(document.getElementById(`currentQuantity-${productId}`)?.value || 0)
    let newQuantity = currentQuantity + parseInt(quantity)
    
    // Check stock limit
    const maxStock = parseInt(document.getElementById(`currentQuantity-${productId}`)?.getAttribute('data-max-stock') || 999999)
    if (newQuantity > maxStock) {
        toastr.options = { "positionClass": "toast-bottom-right" }
        toastr.warning(`Cannot exceed available stock of ${maxStock} items`)
        return
    }
    
    // Prevent going below 1
    if (newQuantity < 1) {
        newQuantity = 1
    }
    
    if (quantity == -1 && currentQuantity == 1) {
        deleteItem(productId);
    }
    else {
        try {
            document.getElementById("waiter").innerHTML =`<div class="waiting"></div>`
            const response = await axios({
                method: "put",
                url: `/user/addToCart/${productId}`,
                data: {
                    name: productName,
                    price: Number.parseFloat(productPrice),
                    quantity: Number.parseInt(quantity),
                    offerPrice: Number.parseFloat(offerPrice),
                }
            })
            document.getElementById("waiter").innerHTML =""
            if (response.status == 200) {
                toastr.options = { "positionClass": "toast-bottom-right" }
                await Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'This product is out of stock',
                    confirmButtonColor: '#273952',
                    width: "25em",
                    timer: 2000
                })
                // Only reload on cart page if out of stock
                if (window.location.pathname === '/cart' || window.location.pathname === '/checkout') {
                    window.location.reload()
                }
            } else {
                if (quantity == -1) {
                    toastr.options = { "positionClass": "toast-bottom-right" }
                    toastr.warning('item removed from cart.')
                } else {
                    toastr.options = { "positionClass": "toast-bottom-right" }
                    toastr.success('item added to cart.')
                }
                let itemCount = Number($(".cart-item-count").html())
                itemCount += Number.parseInt(quantity)
                $(".cart-item-count").html(itemCount)

                // Update displayed quantity for this item if present on page
                const qtyInput = document.getElementById(`currentQuantity-${productId}`)
                if (qtyInput) qtyInput.value = newQuantity

                // If item total element exists, update it using returned itemTotal
                if (response.data && response.data.itemTotal) {
                    const itemTotalEl = document.getElementById(`item-${productId}`)
                    if (itemTotalEl) {
                        // Preserve delivery info HTML if present
                        const deliveryNode = itemTotalEl.querySelector('.text-muted')
                        const deliveryHtml = deliveryNode ? deliveryNode.outerHTML : ''
                        itemTotalEl.innerHTML = ` Rs ${Number(response.data.itemTotal).toFixed(2)}` + (deliveryHtml ? `<div class="text-muted small">${deliveryHtml}</div>` : '')
                    }
                }

                // Update cart totals in real-time instead of reloading
                if (window.location.pathname === '/cart' || window.location.pathname === '/checkout') {
                    updateCartTotals();
                }
            }
        }
        catch (err) {
            await Swal.fire({
                icon: 'warning',
                title: 'Oops...',
                text: 'Please login to add items to cart',
                confirmButtonColor: '#273952',
                width: "25em",
                timer: 3000
            })
            window.location ="/login"
            console.error(err)
        }
    }
}

function cart(id, name, price, offerPrice) {
    let quantity = document.getElementById("itemQuantity").value
    addToCart(id, name, price, quantity, offerPrice)
}

// Function to handle manual quantity input changes
async function updateQuantity(productId, productName, productPrice, offerPrice) {
    const quantityInput = document.getElementById(`currentQuantity-${productId}`);
    const newQuantity = parseInt(quantityInput.value);
    const currentQuantity = parseInt(quantityInput.getAttribute('data-current-quantity') || quantityInput.value);

    // Only update if quantity actually changed
    if (newQuantity !== currentQuantity) {
        const quantityDiff = newQuantity - currentQuantity;

        // Validate quantity
        if (newQuantity < 1) {
            quantityInput.value = 1;
            return;
        }

        const maxStock = parseInt(quantityInput.getAttribute('data-max-stock') || 999999);
        if (newQuantity > maxStock) {
            quantityInput.value = maxStock;
            toastr.options = { "positionClass": "toast-bottom-right" }
            toastr.warning(`Cannot exceed available stock of ${maxStock} items`)
            return;
        }

        // Update the cart
        await addToCart(productId, productName, productPrice, quantityDiff, offerPrice);

        // Update the stored current quantity
        quantityInput.setAttribute('data-current-quantity', newQuantity);
    }
}

// Function to update cart totals in real-time
function updateCartTotals() {
    console.log('updateCartTotals called');

    let totalDeliveryCharges = 0;
    let totalCartValue = 0;
    let subTotal = 0;

    // Calculate totals for each cart item
    const cartItems = document.querySelectorAll('[id^="cartItem-"]');
    console.log('Found cart items:', cartItems.length);

    cartItems.forEach(item => {
        const productId = item.id.replace('cartItem-', '');
        const quantityInput = document.getElementById(`currentQuantity-${productId}`);
        if (!quantityInput) return;

        const quantity = parseInt(quantityInput.value) || 0;
        console.log(`Processing item ${productId}, quantity: ${quantity}`);

        // Get price and offer price from the item data
        const priceElement = item.querySelector('.shoping__cart__price');
        let price = 0;
        let offerPrice = null;

        if (priceElement) {
            const priceText = priceElement.textContent.trim();
            console.log(`Price text: "${priceText}"`);

            // Extract price from text (handles both regular and offer price cases)
            const priceMatch = priceText.match(/Rs\s+([\d.]+)/);
            if (priceMatch) {
                price = parseFloat(priceMatch[1]);
                console.log(`Extracted price: ${price}`);
            }

            // Check if there's an offer price (crossed out price)
            const delElement = priceElement.querySelector('del');
            if (delElement) {
                const delMatch = delElement.textContent.match(/Rs\s+([\d.]+)/);
                if (delMatch) {
                    price = parseFloat(delMatch[1]); // Original price
                    offerPrice = parseFloat(priceMatch[1]); // Offer price
                    console.log(`Offer price detected - original: ${price}, offer: ${offerPrice}`);
                }
            }
        }

        // Get delivery charge data
        const deliveryCharges = parseFloat(quantityInput.getAttribute('data-delivery-charges')) || 0;
        const increaseDelivery = quantityInput.getAttribute('data-increase-delivery') === 'true';

        console.log(`Delivery charges: ${deliveryCharges}, increase with qty: ${increaseDelivery}`);

        // Calculate item delivery charge
        const itemDelivery = increaseDelivery ? (deliveryCharges * quantity) : deliveryCharges;
        totalDeliveryCharges += itemDelivery;

        // Calculate item total
        const itemPrice = offerPrice || price;
        const itemTotal = itemPrice * quantity;
        totalCartValue += itemTotal;
        subTotal += price * quantity;

        console.log(`Item calculations - price: ${itemPrice}, total: ${itemTotal}, subtotal contribution: ${price * quantity}`);

        // Update item total display
        const itemTotalElement = document.getElementById(`item-${productId}`);
        if (itemTotalElement) {
            // Preserve delivery info HTML if present
            const deliveryNode = itemTotalElement.querySelector('.text-muted');
            const deliveryHtml = deliveryNode ? deliveryNode.outerHTML : '';
            itemTotalElement.innerHTML = `Rs ${itemTotal.toFixed(2)}` + (deliveryHtml ? `<div class="text-muted small">${deliveryHtml}</div>` : '');
        }
    });

    console.log(`Final calculations - subtotal: ${subTotal}, cart value: ${totalCartValue}, delivery: ${totalDeliveryCharges}`);

    // Update checkout box totals
    const totalList = document.getElementById('total-list');
    if (totalList) {
        console.log('Found total-list element');
        const listItems = totalList.querySelectorAll('li');
        console.log('Found list items:', listItems.length);

        listItems.forEach(li => {
            const text = li.textContent.trim();
            console.log('Processing li:', text);

            // Update subtotal (crossed out value)
            if (text.startsWith('Subtotal')) {
                console.log('Found subtotal li');
                const span = li.querySelector('span');
                if (span) {
                    span.innerHTML = `<del>Rs ${subTotal.toFixed(2)}</del>`;
                    console.log('Updated subtotal');
                }
            }

            // Update cart discount
            else if (text.includes('Cart Discount')) {
                console.log('Found discount li');
                const span = li.querySelector('span');
                if (span) {
                    const discount = subTotal - totalCartValue;
                    span.textContent = `Rs ${discount.toFixed(2)}`;
                    console.log('Updated discount');
                }
            }

            // Update delivery charges
            else if (text.includes('Delivery Charges')) {
                console.log('Found delivery li');
                const span = li.querySelector('span');
                if (span) {
                    span.textContent = `Rs ${totalDeliveryCharges.toFixed(2)}`;
                    console.log('Updated delivery charges');
                }
            }

            // Update total
            else if (text.startsWith('Total') && !text.includes('Subtotal')) {
                console.log('Found total li');
                const span = li.querySelector('span');
                if (span) {
                    // Check if there's a coupon discount
                    let couponDiscount = 0;
                    const couponDiscountLi = Array.from(listItems).find(li => li.textContent.includes('Coupon Discount'));
                    if (couponDiscountLi) {
                        const discountMatch = couponDiscountLi.textContent.match(/Rs\s+([\d.]+)/);
                        if (discountMatch) {
                            couponDiscount = parseFloat(discountMatch[1]);
                        }
                    }
                    const finalTotal = totalCartValue + totalDeliveryCharges - couponDiscount;
                    span.textContent = `Rs ${finalTotal.toFixed(2)}`;
                    console.log('Updated final total');
                }
            }
        });
    } else {
        console.log('total-list element not found');
    }
}
