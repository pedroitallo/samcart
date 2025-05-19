const axios = require("axios");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send({ message: "Only POST requests allowed" });
  }

  const data = req.body;
  const utm = data.custom_fields || {};
  const product = data.products && data.products[0];

  const payload = {
    orderId: data.order_id || data.id,
    platform: "SamCart",
    paymentMethod: "credit_card",
    status: "paid",
    createdAt: new Date(data.created_at).toISOString().replace("T", " ").slice(0, 19),
    approvedDate: new Date(data.completed_at || data.created_at).toISOString().replace("T", " ").slice(0, 19),
    refundedAt: null,
    customer: {
      name: data.customer?.full_name || "",
      email: data.customer?.email || "",
      phone: data.customer?.phone || null,
      document: null,
      country: "BR",
      ip: data.customer?.ip_address || null
    },
    products: [
      {
        id: product?.product_id || "samcart-product",
        name: product?.product_name || "Produto SamCart",
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: Math.round(Number(product?.price || data.amount) * 100)
      }
    ],
    trackingParameters: {
      src: utm.src || null,
      sck: utm.sck || null,
      utm_source: utm.utm_source || null,
      utm_campaign: utm.utm_campaign || null,
      utm_medium: utm.utm_medium || null,
      utm_content: utm.utm_content || null,
      utm_term: utm.utm_term || null
    },
    commission: {
      totalPriceInCents: Math.round(Number(product?.price || data.amount) * 100),
      gatewayFeeInCents: 200,
      userCommissionInCents: Math.round(Number(product?.price || data.amount) * 100) - 200
    },
    isTest: false
  };

  try {
    await axios.post(
      "https://api.utmify.com.br/api-credentials/orders",
      payload,
      {
        headers: {
          "x-api-token": "pS3p99lHfuMP9UmuZBM1Vh84yLRPMYehIDRj"
        }
      }
    );

    res.status(200).send({ success: true });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send({ error: "Erro ao enviar venda para UTMify" });
  }
};
