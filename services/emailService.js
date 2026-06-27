const sendOrderConfirmationEmail = async (order, recipientEmail) => {
    try {
        if (!process.env.BREVO_API_KEY) {
            console.log('Brevo API key missing. Email not sent.');
            return;
        }

        const orderIdStr = order.orderIdStr || order._id.toString();
        let productsHtml = '';
        
        for (let item of order.products) {
            const productName = item.productId.name || item.name || 'Product';
            productsHtml += `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px;">${productName}</td>
                <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right;">Rs. ${item.offerPrice || item.price || 0}</td>
            </tr>`;
        }

        const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #28a745; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Order Confirmed!</h1>
                <div style="font-size: 50px; color: white; margin-top: 10px;">&#10004;</div>
            </div>
            <div style="padding: 20px;">
                <p>Hello,</p>
                <p>Thank you for shopping with <strong>OUS Collection</strong>! We have received your order and it is currently being processed.</p>
                <h3 style="border-bottom: 2px solid #28a745; padding-bottom: 5px;">Order Details (ID: ${orderIdStr})</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 10px; text-align: left;">Item</th>
                            <th style="padding: 10px; text-align: center;">Qty</th>
                            <th style="padding: 10px; text-align: right;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productsHtml}
                    </tbody>
                </table>
                <div style="margin-top: 20px; text-align: right;">
                    <p><strong>Subtotal:</strong> Rs. ${order.subTotal}</p>
                    <p><strong>Delivery:</strong> Rs. ${order.totalDeliveryCharges}</p>
                    ${order.coupon && order.coupon.discount ? `<p><strong>Discount:</strong> -Rs. ${order.coupon.discount}</p>` : ''}
                    <h3 style="color: #28a745;"><strong>Total:</strong> Rs. ${order.total}</h3>
                </div>
                <div style="margin-top: 20px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
                    <h4 style="margin-top: 0;">Shipping Address:</h4>
                    <p style="margin: 0;">${order.deliveryAddress.firstName} ${order.deliveryAddress.lastName}</p>
                    <p style="margin: 5px 0;">${order.deliveryAddress.address}, ${order.deliveryAddress.areaName || ''}</p>
                    <p style="margin: 0;">${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.pincode || ''}</p>
                    <p style="margin: 5px 0 0 0;">Phone: ${order.deliveryAddress.phone}</p>
                </div>
                <p style="margin-top: 30px; text-align: center; color: #777;">If you have any questions, please reply to this email.</p>
            </div>
        </div>`;

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: "OUS Collection", email: "ouscollection12@gmail.com" },
                to: [{ email: recipientEmail }],
                subject: `Order Confirmation - OUS Collection (#${orderIdStr})`,
                htmlContent: htmlContent
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            console.error('Brevo API Error:', errData);
        } else {
            console.log(`Order confirmation email sent to ${recipientEmail}`);
        }
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
    }
};

module.exports = { sendOrderConfirmationEmail };
