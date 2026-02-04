
document.addEventListener('DOMContentLoaded', function () {
    console.log('Checkout JS loaded');

    const checkoutForm = document.getElementById('checkoutForm');
    const placeOrderBtn = document.getElementById('rzp-button1');

    console.log('Checkout form element:', checkoutForm);
    console.log('Place order button element:', placeOrderBtn);

    if (checkoutForm) {
        console.log('Adding form submit listener');
        checkoutForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            console.log('Form submitted - preventDefault called');

            const paymentType = $('input[name=paymentType]:checked', '#checkoutForm').val()
            console.log('Payment type:', paymentType);

            const formData = new FormData(event.target)
            console.log('Form data created');

            if (paymentType == "cod") {
                console.log('Processing COD order');
                checkout(formData)
            } else if (paymentType == "razorpay") {
                console.log('Processing Razorpay order');
                razorpay(orderId, amount, formData)
            } else {
                console.error('No payment type selected');
            }
        });
    } else {
        console.error('Checkout form not found');
    }

    if (placeOrderBtn) {
        console.log('Place Order button found');
        // Removed redundant click listeners that were causing double submission
        // The button is type="submit", so it will naturally trigger the form's submit event
    } else {
        console.error('Place order button not found');
    }

    // Check if button is disabled on page load
    setTimeout(() => {
        if (placeOrderBtn) {
            console.log('Button disabled after load:', placeOrderBtn.disabled);
            console.log('Button classes:', placeOrderBtn.className);
        }
    }, 1000);
});


async function checkout(formData) {
    try {
        const response = await axios({
            url: '/user/checkout',
            method: "post",
            data: formData,
            data: formData,
            // headers: { 'Content-Type': 'multipart/form-data' }  <-- REMOVED: Let browser set boundary
        });
        if (response.status == 201) {
            await Swal.fire({
                title: 'Order Placed Successfully!',
                text: 'Your order has been placed successfully.',
                icon: 'success',
                confirmButtonColor: '#273952',
                width: "25em",
                // timer: 3000 // Removed timer to let animation complete and user read message
            })

            if (response.data && response.data.isGuest) {
                window.location = "/"
            } else {
                window.location = "/user/myOrders"
            }
        } else {
            await Swal.fire({
                icon: 'error',
                title: 'Order Not Placed',
                text: 'Failed to place order. Please try again.',
                confirmButtonColor: '#273952',
                width: "25em",
                // timer: 3000
            })
            // window.location = "/user/checkout" // Removed auto-refresh on failure
        }
    } catch (err) {
        console.error(err)
        let errorTitle = 'Order Not Placed';
        let errorMessage = 'Something went wrong while placing your order.';

        if (err.response) {
            if (err.response.status === 401) {
                errorTitle = 'Authentication Required';
                errorMessage = 'Please login to place an order.';
            } else if (err.response.data && err.response.data.message) {
                errorMessage = err.response.data.message;
            }
        }

        await Swal.fire({
            icon: 'error',
            title: errorTitle,
            text: errorMessage,
            confirmButtonColor: '#273952',
            width: "25em",
            // timer: 3000
        })

        if (err.response && err.response.status === 401) {
            // Redirect to login or home if 401
            window.location = "/";
        } else {
            // Do not refresh page on standard errors so user can fix them
            // window.location = "/user/checkout"
        }
    }
}


function razorpay(orderId, amount, formData) {
    let options = {
        "key": "rzp_test_qdnGosbHKRU60Y", // Enter the Key ID generated from the Dashboard
        "name": "myStyle",
        "amount": amount,
        "order_id": orderId, // For one time payment
        "retry": false,
        "theme": {
            "color": "#273952"
        },
        // This handler function will handle the success payment
        "handler": async function (response) {
            // alert(response.razorpay_payment_id);
            try {
                const verification = await axios({
                    method: "post",
                    url: `/user/payment/verify/${orderId}`,
                    data: {
                        response: response,
                    }
                })
                if (verification.data.signatureIsValid) {
                    const paymentId = response.razorpay_payment_id

                    //appending order Id and payment id to data to update on database

                    formData.append("orderId", orderId)
                    formData.append("paymentId", paymentId)

                    //calling checkout after payment verification
                    checkout(formData)

                } else {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: 'Payment Failed!',
                        confirmButtonColor: '#273952',
                        width: "25em",
                        timer: 2000,
                    })
                    window.location = "/user/checkout"
                }
            } catch (err) {
                console.log(err)
                window.location = "/user/myOrders"
            }

        },
    };
    const rzp1 = new Razorpay(options);
    rzp1.open();
    rzp1.on('payment.failed', async function (response) {
        await Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Payment Failed!',
            confirmButtonColor: '#273952',
            width: "25em",
            timer: 2000,
        })
        window.location = "/user/checkout"
    });

}

// dom manipulation for saved address
function fillForm(address, index) {
    let myAddress = JSON.parse(address)
    $("#addressInputField :input").prop("disabled", true)
    $("#new-address").prop("disabled", false)
    $("#new-address").prop("checked", false)
    $("#address-index").prop("disabled", false)

    $("#address-index").val(index)
    $("[name='fullName']").val(myAddress.firstName + (myAddress.lastName ? ' ' + myAddress.lastName : ''))
    $("[name='phone']").val(myAddress.phone)
    $("[name='phone2']").val(myAddress.phone2 || '')
    $("[name='house']").val(myAddress.house)
    $("[name='address']").val(myAddress.address)
    $("[name='areaName']").val(myAddress.areaName || myAddress.address)
    $("[name='landmark']").val(myAddress.landmark || '')
    $("[name='city']").val(myAddress.city)
    $("[name='state']").val(myAddress.state)
    $("[name='email']").val(myAddress.email || '')
}

function handleChange(checkbox) {
    if (checkbox.checked == true) {
        $("#addressInputField :input").not("[name=email]").prop("disabled", false)
        $("#addressInputField :input").not("[name=newAddress]").not("[name=phone2]").not("[name=landmark]").val('')
    }
}

async function removeAddress(index) {
    try {
        let result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#6F7E8B',
            cancelButtonColor: '#273952',
            confirmButtonText: 'Yes, Delete it!',
            cancelButtonText: 'No.',
            width: '25em'
        })
        if (result.isConfirmed) {
            const response = await axios.delete(`/user/deleteAddress/${index}`)
            if (response.status == 204) {
                document.getElementById(`address-${index}`).remove()
                toastr.options = {
                    "positionClass": "toast-bottom-right"
                }
                toastr.success('address removed successfully.')
            }
        }
    } catch (error) {
        console.error(err)
    }
}


