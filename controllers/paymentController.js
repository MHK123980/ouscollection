// Payment functionality removed - using COD only
// const Razorpay = require("razorpay");
// const instance = new Razorpay({
//     key_id: process.env.key_id,
//     key_secret: process.env.key_secret,
// });

module.exports = {
    generateOrder: (req, res) => {
        // Since Razorpay is disabled and we're using COD only, return a mock order ID
        // This prevents the 500 error when the frontend tries to generate order IDs
        const mockOrderId = "order_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        res.send({ orderId: mockOrderId });
    },

    verifyPayment: (req, res) => {
        const orderId = req.params.orderId
        let body = orderId + "|" + req.body.response.razorpay_payment_id;

        const crypto = require("crypto");
        const expectedSignature = crypto.createHmac('sha256', process.env.key_secret)
            .update(body.toString())
            .digest('hex');
        // console.log("sig received ", req.body.response.razorpay_signature);
        // console.log("sig generated ", expectedSignature);
        let response = { "signatureIsValid": false }
        if (expectedSignature === req.body.response.razorpay_signature) {
            response = { "signatureIsValid": true }
        }
        res.send(response);

    },

    refund: async (req, res) => {
        try {
            const paymentId = req.params.id
            await instance.payments.refund(paymentId, {
                "amount": req.body.amount,
                "speed": "optimum",
            })
            res.status(201).json({ message: "refund success" })
        } catch (err) {
            res.status(500).json({ err })
        }
    },
}