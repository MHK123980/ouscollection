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
            let myOrderAction = document.getElementById("action-" + orderId)
            myOrderStatus.classList.replace("bg-warning", "bg-info")
            myOrderStatus.innerHTML = "Packed"
            myOrderAction.innerHTML = `
                <div class="btn-group-vertical" role="group">
                    <button onclick="viewOrderDetails('${orderId}')" class="btn btn-sm btn-outline-primary mb-1"><i class="fa-solid fa-eye"></i> View Details</button>
                    <button class="btn btn-sm btn-outline-danger mb-1" onclick="deleteOrder('${orderId}')"><i class="fa-solid fa-trash"></i> Delete Order</button>
                    <button class="btn btn-sm btn-outline-dark" onclick="shipOrder('${orderId}')"><i class="fa-solid fa-truck-fast"></i> Ship Order</button>
                </div>`
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
            let myOrderAction = document.getElementById("action-" + orderId)
            myOrderStatus.classList.replace("bg-info", "bg-primary")
            myOrderStatus.innerHTML = "Shipped"
            myOrderAction.innerHTML = `
                <div class="btn-group-vertical" role="group">
                    <button onclick="viewOrderDetails('${orderId}')" class="btn btn-sm btn-outline-primary mb-1"><i class="fa-solid fa-eye"></i> View Details</button>
                    <button class="btn btn-sm btn-outline-danger mb-1" onclick="deleteOrder('${orderId}')"><i class="fa-solid fa-trash"></i> Delete Order</button>
                    <button class="btn btn-sm btn-outline-dark" onclick="outForDelivery('${orderId}')"><i class="fa-solid fa-house-chimney"></i> Out For Delivery</button>
                </div>`
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
            let myOrderAction = document.getElementById("action-" + orderId)
            myOrderStatus.classList.replace("bg-primary", "bg-dark")
            myOrderStatus.innerHTML = "Out for delivery"
            myOrderAction.innerHTML = `
                <div class="btn-group-vertical" role="group">
                     <button onclick="viewOrderDetails('${orderId}')" class="btn btn-sm btn-outline-primary mb-1"><i class="fa-solid fa-eye"></i> View Details</button>
                    <button class="btn btn-sm btn-outline-danger mb-1" onclick="deleteOrder('${orderId}')"><i class="fa-solid fa-trash"></i> Delete Order</button>
                    <button class="btn btn-sm btn-outline-dark" onclick="deliverPackage('${orderId}')"><i class="fa-solid fa-thumbs-up"></i> Deliver Package</button>
                </div>`
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
            let myOrderAction = document.getElementById("action-" + orderId)
            myOrderStatus.classList.replace("bg-dark", "bg-success")
            myOrderStatus.innerHTML = "Delivered"
            myOrderAction.innerHTML = `
                <div class="btn-group-vertical" role="group">
                     <button onclick="viewOrderDetails('${orderId}')" class="btn btn-sm btn-outline-primary mb-1"><i class="fa-solid fa-eye"></i> View Details</button>
                    <button class="btn btn-sm btn-outline-danger mb-1" onclick="deleteOrder('${orderId}')"><i class="fa-solid fa-trash"></i> Delete Order</button>
                    <button class="btn btn-outline-dark" disabled ><i class="fa-solid fa-thumbs-up"></i></button>
                </div>`
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
async function cancelOrder(orderId) {
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
                let myOrderAction = document.getElementById("action-" + orderId)
                myOrderStatus.classList.replace("bg-warning", "bg-danger")
                myOrderStatus.innerHTML = "Cancelled"
                myOrderAction.innerHTML = `
                    <div class="btn-group-vertical" role="group">
                         <button onclick="viewOrderDetails('${orderId}')" class="btn btn-sm btn-outline-primary mb-1"><i class="fa-solid fa-eye"></i> View Details</button>
                        <button class="btn btn-sm btn-outline-danger mb-1" onclick="deleteOrder('${orderId}')"><i class="fa-solid fa-trash"></i> Delete Order</button>
                        <button class="btn btn-outline-dark" disabled ><i class="fa-solid fa-ban"></i></button>
                    </div>`
                toastr.options = { "positionClass": "toast-bottom-left" }
                toastr.success('Order cancelled successfully.')
            } else {
                toastr.error('Error updating order status')
            }
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

