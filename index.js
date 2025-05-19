const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const UTMIFY_TOKEN = 'pS3p99lHfuMP9UmuZBM1Vh84yLRPMYehIDRj';

app.post('/webhook-samcart', async (req, res) => {
  try {
    const data = req.body;
    const utm = data.custom_fields || {};
    const product = data.products && data.products[0];

    const payload = {
      orderId: data.order_id || data.id,
      platform: "SamCart",
      paymentMethod: "credit_card",
      status: "paid",
      createdAt: new Date(data.created_at).toISOString().replace('T', ' ').slice(0, 19),
      approvedDate: new Date(data.completed_at || data.created_at).toISOString().replace('T', ' ').slice(0, 19),
      refundedAt: null,
      customer: {
        name: data.customer?.full_name || '',
        email: data.customer?.email || '',
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

    const response = await axios.post(
      'https://api.utmify.com.br/api-credentials/orders',
      payload,
      {
        headers: {
          'x-api-token': UTMIFY_TOKEN
        }
      }
    );

    console.log('✔️ Venda enviada para UTMify:', payload.orderId);
    res.status(200).send({ success: true });

  } catch (error) {
    console.error('❌ Erro ao enviar para UTMify:', error.response?.data || error.message);
    res.status(500).send({ error: 'Erro ao enviar venda para UTMify' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook ativo em http://localhost:${PORT}/webhook-samcart`);
});
