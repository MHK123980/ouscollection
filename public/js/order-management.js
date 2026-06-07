const orderStatus = document.querySelectorAll(".order-status")

for (let i = 0; i < orderStatus.length; i++) {
    if (orderStatus[i].innerHTML == "Pending") {
        orderStatus[i].classList.add("bg-warning")
    } else if (orderStatus[i].innerHTML == "Packed") {
        orderStatus[i].classList.add("bg-info")
    } else if (orderStatus[i].innerHTML == "Shipped") {
        orderStatus[i].classList.add("bg-primary")
    } else if (orderStatus[i].innerHTML == "Out for delivery") {
        orderStatus[i].classList.add("bg-dark")
    } else if (orderStatus[i].innerHTML == "Delivered") {
        orderStatus[i].classList.add("bg-success")
    } else {
        orderStatus[i].classList.add("bg-danger")
    }
}

async function packOrder(orderId) {
    document.getElementById("waiter").innerHTML = `<div class="waiting"></div>`
    try {
        const response = await axios({
            method: "put",
            url: `/admin/packOrder/${orderId}`
        })
        document.getElementById("waiter").innerHTML = ""
        if (response.status == 201) {
            let myOrderStatus = document.getElementById("status-" + orderId)
            myOrderStatus.className = "badge order-status bg-info";
            myOrderStatus.innerHTML = "Packed"
            toastr.options = { "positionClass": "toast-bottom-left" }
            toastr.success('<i class="fa-solid fa-boxes-packing"></i> orderId:' + orderId + ' ' + 'status updated to Packed.')
        } else {
            toastr.error('Error updating order status')
        }
    } catch (err) {
        window.location.reload()
        console.error(err)
    }
}

async function shipOrder(orderId) {
    document.getElementById("waiter").innerHTML = `<div class="waiting"></div>`
    try {
        const response = await axios({
            method: "put",
            url: `/admin/shipOrder/${orderId}`
        })
        document.getElementById("waiter").innerHTML = ""
        if (response.status == 201) {
            let myOrderStatus = document.getElementById("status-" + orderId)
            myOrderStatus.className = "badge order-status bg-primary";
            myOrderStatus.innerHTML = "Shipped"
            toastr.options = { "positionClass": "toast-bottom-left" }
            toastr.success('orderId:' + orderId + ' ' + 'status updated to Shipped.')
        } else {
            toastr.error('Error updating order status')
        }
    } catch (err) {
        window.location.reload()
        console.error(err)
    }
}

async function outForDelivery(orderId) {
    document.getElementById("waiter").innerHTML = `<div class="waiting"></div>`
    try {
        const response = await axios({
            method: "put",
            url: `/admin/outForDelivery/${orderId}`
        })
        document.getElementById("waiter").innerHTML = ""
        if (response.status == 201) {
            let myOrderStatus = document.getElementById("status-" + orderId)
            myOrderStatus.className = "badge order-status bg-dark";
            myOrderStatus.innerHTML = "Out for delivery"
            toastr.options = { "positionClass": "toast-bottom-left" }
            toastr.success('<i class="fa-solid fa-truck-fast"></i> orderId:' + orderId + ' ' + 'is out for delivery.')
        } else {
            toastr.error('Error updating order status')
        }
    } catch (err) {
        window.location.reload()
        console.error(err)
    }
}

async function deliverPackage(orderId) {
    document.getElementById("waiter").innerHTML = `<div class="waiting"></div>`
    try {
        const response = await axios({
            method: "put",
            url: `/admin/deliverPackage/${orderId}`
        })
        document.getElementById("waiter").innerHTML = ""
        if (response.status == 201) {
            let myOrderStatus = document.getElementById("status-" + orderId)
            myOrderStatus.className = "badge order-status bg-success";
            myOrderStatus.innerHTML = "Delivered"
            
            // Disable the select dropdown
            const selectEl = document.querySelector(`#action-${orderId} select`);
            if (selectEl) selectEl.disabled = true;

            // Show delete button
            const deleteBtn = document.getElementById("delete-btn-" + orderId);
            if (deleteBtn) deleteBtn.style.display = 'block';

            toastr.options = { "positionClass": "toast-bottom-left" }
            toastr.success('Order id' + orderId + 'status updated to delivered.')
        } else {
            toastr.error('Error updating status')
        }
    } catch (err) {
        window.location.reload()
        console.error(err)
    }
}

async function cancelOrder(orderId, selectEl, oldStatus) {
    try {
        let result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#6F7E8B',
            cancelButtonColor: '#212529',
            confirmButtonText: 'Yes, cancel it!',
            cancelButtonText: 'No.',
            width: '25em'
        })
        if (result.isConfirmed) {
            document.getElementById("waiter").innerHTML = `<div class="waiting"></div>`
            const response = await axios({
                method: "put",
                url: `/admin/cancelOrder/${orderId}`
            })
            document.getElementById("waiter").innerHTML = ""
            if (response.status == 201) {
                let myOrderStatus = document.getElementById("status-" + orderId)
                myOrderStatus.className = "badge order-status bg-danger";
                myOrderStatus.innerHTML = "Cancelled"
                
                // Disable the select dropdown
                if (selectEl) selectEl.disabled = true;

                // Show delete button
                const deleteBtn = document.getElementById("delete-btn-" + orderId);
                if (deleteBtn) deleteBtn.style.display = 'block';

                toastr.options = { "positionClass": "toast-bottom-left" }
                toastr.success('Order cancelled successfully.')
            } else {
                toastr.error('Error updating order status')
            }
        } else {
            // Revert select back to previous status if they cancel the swal
            if (selectEl) selectEl.value = oldStatus || selectEl.getAttribute('data-old-value');
        }
    } catch (err) {
        window.location.reload()
        console.error(err)
    }
}

async function deleteOrder(orderId) {
    try {
        let result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this! This will delete the order permanently.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No.',
            width: '25em'
        })
        if (result.isConfirmed) {
            document.getElementById("waiter").innerHTML = `<div class="waiting"></div>`
            const response = await axios({
                method: "delete",
                url: `/admin/orders/${orderId}`
            })
            document.getElementById("waiter").innerHTML = ""
            if (response.status == 200) {
                document.getElementById("order-" + orderId).remove()
                toastr.options = { "positionClass": "toast-bottom-left" }
                toastr.success('Order deleted successfully.')
            } else {
                toastr.error('Error deleting order')
            }
        }
    } catch (err) {
        window.location.reload()
        console.error(err)
    }
}

async function changeOrderStatus(selectEl, orderId, oldStatus) {
    const newStatus = selectEl.value;
    
    // Store old value in case we need to revert (like cancelled)
    if (!selectEl.getAttribute('data-old-value')) {
        selectEl.setAttribute('data-old-value', oldStatus);
    }
    const currentOldValue = selectEl.getAttribute('data-old-value');
    
    // Warn before changing if they select Cancelled
    if (newStatus === "Cancelled") {
        cancelOrder(orderId, selectEl, currentOldValue);
        return;
    }
    
    // Route to appropriate function
    if (newStatus === "Packed") packOrder(orderId);
    else if (newStatus === "Shipped") shipOrder(orderId);
    else if (newStatus === "Out for delivery") outForDelivery(orderId);
    else if (newStatus === "Delivered") deliverPackage(orderId);
    
    // Update old status reference for next change
    selectEl.setAttribute('data-old-value', newStatus);
    // Update the inline onclick attribute to use the new status for next time
    selectEl.setAttribute('onchange', `changeOrderStatus(this, '${orderId}', '${newStatus}')`);
}

async function viewOrderDetails(orderId) {
    try {
        const response = await axios({
            method: "get",
            url: `/admin/orders/${orderId}`
        })
        if (response.status == 200) {
            const order = response.data.myOrder;
            const fullName = `${order.deliveryAddress.firstName} ${order.deliveryAddress.lastName || ''}`.trim();
            const content = `
                <div class="row">
                    <div class="col-md-6">
                        <h6>Customer Full Name: ${fullName}</h6>
                        <h6>Customer Mobile No: ${order.deliveryAddress.phone || ''}</h6>
                        <h6>Customer Another Mobile No: </h6>
                        <h6>Customer House No: ${order.deliveryAddress.house || ''}</h6>
                        <h6>Customer Street Name/no: ${order.deliveryAddress.address || ''}</h6>
                        <h6>Customer Area Name: </h6>
                        <h6>Customer City: ${order.deliveryAddress.city || ''}</h6>
                        <h6>Customer Province: ${order.deliveryAddress.state || ''}</h6>
                        <h6>Customer PinCode: ${order.deliveryAddress.pincode || ''}</h6>
                        <h6>Customer Email: ${order.userId ? order.userId.email : (order.deliveryAddress.email || 'Guest')}</h6>
                    </div>
                    <div class="col-md-6">
                        <h6>Product Details:</h6>
                        <ul>
                            ${order.products.map(product => `<li>${product.name} x${product.quantity} - Rs ${product.offerPrice || product.price}</li>`).join('')}
                        </ul>
                        <h6>Payment Detail: ${order.paymentType === 'cod' ? 'COD' : 'Online Payment'}</h6>
                        <h6>Summary:</h6>
                        <p>Product Price: Rs ${order.subTotal.toFixed(2)}</p>
                        <p>Delivery Charges: Rs ${order.totalDeliveryCharges.toFixed(2)}</p>
                        <p><strong>Total Amount: Rs ${order.total.toFixed(2)}</strong></p>
                    </div>
                </div>
            `;
            document.getElementById("orderDetailsContent").innerHTML = content;
            new bootstrap.Modal(document.getElementById('orderDetailsModal')).show();
        } else {
            toastr.error('Error loading order details')
        }
    } catch (err) {
        console.error(err)
        toastr.error('Error loading order details')
    }
}

function printSlip(orderId) {
    axios.get(`/admin/orders/${orderId}`)
        .then(response => {
            const order = response.data.myOrder;
            const fullName = `${order.deliveryAddress.firstName} ${order.deliveryAddress.lastName || ''}`.trim();
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Order Slip - ${order.orderIdStr || order._id}</title>
                    <style>
                        body { font-family: 'Segoe UI', sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
                        .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 10px; margin-bottom: 15px; }
                        .header h2 { margin: 0; font-size: 20px; }
                        .header p { margin: 3px 0; color: #666; font-size: 12px; }
                        .info-row { display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0; }
                        .divider { border-top: 1px dashed #ccc; margin: 10px 0; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 10px 0; }
                        th, td { padding: 5px 4px; text-align: left; border-bottom: 1px solid #eee; }
                        th { font-weight: bold; }
                        .total-row { font-weight: bold; font-size: 14px; border-top: 2px solid #333; }
                        .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #999; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>OUS Collection</h2>
                        <p>Order Slip</p>
                        <p>${new Date(order.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</p>
                    </div>
                    <div class="info-row"><span>Order #:</span><span><strong>${order.orderIdStr || order._id}</strong></span></div>
                    <div class="info-row"><span>Customer:</span><span>${fullName}</span></div>
                    <div class="info-row"><span>Phone:</span><span>${order.deliveryAddress.phone || '-'}</span></div>
                    <div class="info-row"><span>Address:</span><span>${order.deliveryAddress.address || ''}, ${order.deliveryAddress.city || ''}</span></div>
                    <div class="info-row"><span>Province:</span><span>${order.deliveryAddress.province || order.deliveryAddress.state || '-'}</span></div>
                    <div class="divider"></div>
                    <table>
                        <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
                        <tbody>
                            ${order.products.map(p => `<tr><td>${p.name}</td><td>${p.quantity}</td><td>PKR ${(p.offerPrice || p.price).toFixed(2)}</td></tr>`).join('')}
                        </tbody>
                    </table>
                    <div class="divider"></div>
                    <div class="info-row"><span>Subtotal:</span><span>PKR ${order.subTotal.toFixed(2)}</span></div>
                    <div class="info-row"><span>Delivery:</span><span>PKR ${(order.totalDeliveryCharges || 0).toFixed(2)}</span></div>
                    <div class="info-row total-row"><span>Total:</span><span>PKR ${order.total.toFixed(2)}</span></div>
                    <div class="info-row"><span>Payment:</span><span>${order.paymentType === 'cod' ? 'COD' : 'Online Payment ✅'}</span></div>
                    <div class="info-row"><span>Status:</span><span>${order.status}</span></div>
                    <div class="footer">
                        Thank you for shopping with OUS Collection!<br>
                        OusCollection All Rights Reserved By MHK
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 500);
        })
        .catch(err => {
            console.error(err);
            toastr.error('Error loading order for print');
        });
}
