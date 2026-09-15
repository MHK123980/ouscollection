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
                if (window.location.pathname === '/user/cart' || window.location.pathname === '/user/checkout') {
                    // Use setTimeout to ensure DOM is updated before recalculating
                    setTimeout(updateCartTotals, 100);
                }
            toastr.options = { "positionClass": "toast-bottom-right" }
            toastr.warning('item removed from cart.')

        } else {
            // Cart is now empty - reload to show empty cart view
            if (window.location.pathname === '/user/cart' || window.location.pathname === '/user/checkout') {
                window.location.reload()
            } else {
                $(".cart-item-count").html(0)
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
            // Disable the button briefly to prevent double-clicks
            const btns = document.querySelectorAll(`[onclick*="${productId}"]`)
            btns.forEach(b => b.style.pointerEvents = 'none')

            // Fire the API call (fast now - no extra DB queries)
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
            
            // Re-enable buttons
            btns.forEach(b => b.style.pointerEvents = '')

            if (response.status == 200) {
                // Out of stock
                toastr.options = { "positionClass": "toast-bottom-right" }
                Swal.fire({
                    icon: 'error',
                    title: 'Out of Stock',
                    text: 'This product is out of stock',
                    confirmButtonColor: '#273952',
                    width: "25em",
                    timer: 2000
                })
                if (window.location.pathname === '/user/cart' || window.location.pathname === '/user/checkout') {
                    window.location.reload()
                }
            } else if (response.status == 201) {
                // SUCCESS - confirmed by server, now update UI
                if (quantity == -1) {
                    toastr.options = { "positionClass": "toast-bottom-right" }
                    toastr.warning('Item removed from cart.')
                } else {
                    toastr.options = { "positionClass": "toast-bottom-right" }
                    toastr.success('Item added to cart!')
                }
                
                // Update cart count badge
                let itemCount = Number($(".cart-item-count").html()) || 0
                $(".cart-item-count").html(itemCount + Number.parseInt(quantity))

                // Update displayed quantity for this item if present on page
                const qtyInput = document.getElementById(`currentQuantity-${productId}`)
                if (qtyInput) qtyInput.value = newQuantity

                // If item total element exists, update it using returned itemTotal
                // We will rely on updateCartTotals() to re-render the delivery HTML properly
                // so we don't need to try and preserve it here. updateCartTotals will overwrite it anyway.
                if (response.data && response.data.itemTotal) {
                    const itemTotalEl = document.getElementById(`item-${productId}`)
                    if (itemTotalEl) {
                        // let updateCartTotals handle the deliveryHtml rendering
                        itemTotalEl.innerHTML = `Rs ${Number(response.data.itemTotal).toFixed(2)}`
                    }
                }

                // Update cart totals in real-time instead of reloading
                if (window.location.pathname === '/user/cart' || window.location.pathname === '/user/checkout') {
                    updateCartTotals();
                }
            }
        }
        catch (err) {
            // Re-enable buttons
            document.querySelectorAll(`[onclick*="${productId}"]`).forEach(b => b.style.pointerEvents = '')
            
            Swal.fire({
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
    let subTotal = 0;

    // Calculate totals for each cart item
    const cartItems = document.querySelectorAll('[id^="cartItem-"]');
    console.log('Found cart items:', cartItems.length);

    cartItems.forEach(item => {
        const productId = item.id.replace('cartItem-', '');
        const quantityInput = document.getElementById(`currentQuantity-${productId}`);
        if (!quantityInput) return;

        const quantity = parseInt(quantityInput.value) || 0;

        // Read price and offer price from data attributes on the tr
        const dataPrice = parseFloat(item.getAttribute('data-price')) || 0;
        const dataOfferStr = item.getAttribute('data-offer-price');
        const dataOfferPrice = (dataOfferStr && !isNaN(parseFloat(dataOfferStr)) && parseFloat(dataOfferStr) > 0) ? parseFloat(dataOfferStr) : null;

        const effectivePrice = dataOfferPrice !== null ? dataOfferPrice : dataPrice;
        const itemTotal = effectivePrice * quantity;
        subTotal += itemTotal;

        // Get delivery charge data
        const deliveryCharges = parseFloat(quantityInput.getAttribute('data-delivery-charges')) || 0;
        const increaseDelivery = quantityInput.getAttribute('data-increase-delivery') === 'true';
        const isFreeDelivery = quantityInput.getAttribute('data-is-free-delivery') === 'true';
        const deliveryTiersStr = quantityInput.getAttribute('data-delivery-tiers') || '[]';
        let deliveryTiers = [];
        try { deliveryTiers = JSON.parse(deliveryTiersStr); } catch (e) { }

        // Calculate item delivery charge
        let itemDelivery = 0;
        let deliveryHtml = '';
        if (isFreeDelivery) {
            itemDelivery = 0;
            deliveryHtml = '<div class="text-success small" style="font-weight:bold;">FREE Delivery <i class="fa-solid fa-truck-fast"></i></div>';
        } else if (deliveryTiers && deliveryTiers.length > 0) {
            itemDelivery = deliveryCharges;
            for (let tier of deliveryTiers) {
                if (quantity >= tier.quantity) itemDelivery = Number(tier.charge);
                else break;
            }
            if (itemDelivery > 0) {
                deliveryHtml = `<div class="text-muted small">Delivery: Rs ${itemDelivery.toFixed(2)}</div>`;
            }
        } else {
            itemDelivery = increaseDelivery ? (deliveryCharges * quantity) : deliveryCharges;
            if (itemDelivery > 0) {
                deliveryHtml = `<div class="text-muted small">Delivery: Rs ${itemDelivery.toFixed(2)}${increaseDelivery ? ` (per piece: Rs ${deliveryCharges.toFixed(2)})` : ''}</div>`;
            }
        }

        totalDeliveryCharges += itemDelivery;

        // Update item total display
        const itemTotalElement = document.getElementById(`item-${productId}`);
        if (itemTotalElement) {
            itemTotalElement.innerHTML = `Rs ${itemTotal.toFixed(2)}` + deliveryHtml;
        }
    });

    console.log(`Final calculations - subtotal: ${subTotal}, delivery: ${totalDeliveryCharges}`);

    // Update checkout box totals
    const totalList = document.getElementById('total-list');
    if (totalList) {
        const listItems = totalList.querySelectorAll('li');
        let couponDiscount = 0;

        // Find Coupon / Cart discount if present
        const discountLi = Array.from(listItems).find(li => li.textContent.includes('Cart Discount') || li.textContent.includes('Coupon Discount'));
        if (discountLi) {
            const span = discountLi.querySelector('span');
            if (span) {
                const match = span.textContent.match(/Rs\s+([\d.]+)/);
                if (match) couponDiscount = parseFloat(match[1]) || 0;
            }
        }

        listItems.forEach(li => {
            const text = li.textContent.trim();

            if (text.startsWith('Subtotal')) {
                const span = li.querySelector('span');
                if (span) {
                    span.innerHTML = `Rs ${subTotal.toFixed(2)}`;
                }
            }
            else if (text.includes('Delivery Charges')) {
                const span = li.querySelector('span');
                if (span) {
                    span.textContent = `Rs ${totalDeliveryCharges.toFixed(2)}`;
                }
            }
            else if (text.startsWith('Total') && !text.includes('Subtotal')) {
                const span = li.querySelector('span');
                if (span) {
                    const finalTotal = Math.max(0, subTotal - couponDiscount + totalDeliveryCharges);
                    span.textContent = `Rs ${finalTotal.toFixed(2)}`;
                }
            }
        });
    } else {
        console.log('total-list element not found');
    }
}
