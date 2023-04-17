const express = require("express");
const paypal = require("@paypal/checkout-server-sdk");
const _ = require("lodash");

const Order = require('./Database/order.js');

const PAYPAL_CLIENT_ID = "ARoOZKTX_JmmwcBt-J4SimYHjnBxP_ISeqEihL6XhDlJcYtHEuizQ_ugNPlWMVMWdmJQFti6Mh_u6OI1";
const PAYPAL_CLIENT_SECRET = "EOXj4zpVttgVSNs4dnIYM0T2JZ1Scb8_i7MfPqm42PIfOXYugw2eidHwlwr-jNg9kCrbVPCsB9G2F8C2";
const environment = new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);
const paypalClient = new paypal.core.PayPalHttpClient(environment);

const PORT = process.env.PORT || 3000;

const app = express();

// Serve static files
app.get("/", (_, res) => res.sendFile(__dirname + "/index.html"));
app.get("/success", (_, res) => res.sendFile(__dirname + "/success.html"));
app.get("/error", (_, res) => res.sendFile(__dirname + "/error.html"));
app.get("/cancel", (_, res) => res.sendFile(__dirname + "/cancelled.html"));

app.post("/pay", async (_, res) => {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "CAD",
          value: "500.00",
          breakdown: {
            item_total: {
              currency_code: "CAD",
              value: "500.00",
            },
          },
        },
        description: "Mobile Data Management Course Book",
        items: [
          {
            name: "Mobile Data Management",
            unit_amount: {
              currency_code: "CAD",
              value: "50.00",
            },
            quantity: "10",
          },
        ],
      },
    ],
    application_context: {
      return_url: "http://localhost:3000/approved",
      cancel_url: "http://localhost:3000/cancel",
    },
  });

  try {
    const order = await paypalClient.execute(request);
    const approvalUrl = order.result.links.find(link => link.rel === 'approve').href;
    res.redirect(approvalUrl);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.redirect("/error");
  }
});

app.get("/approved", async (req, res) => {
  try {
    const { token } = req.query;

    const request = new paypal.orders.OrdersCaptureRequest(token);
    request.requestBody({});
    const { result } = await paypalClient.execute(request);

    const dbOrder = new Order({
      orderId: result.id,
      status: result.status,
      payer: {
        name: result.payer.name.given_name + " " + result.payer.name.surname,
        phone: _.get(result, "result.payer.phone.phone_number.national_number"),
        email: _.get(result, "result.payer.email_address"),
        payerId: _.get(result, "result.payer.payer_id"),
      },
      links: result.links,
      purchaseUnits: result.purchase_units.map((unit) => ({
        referenceId: unit.reference_id,
        payments: unit.payments.captures.map((payment) => ({
          paymentId: payment.id,
          createTime: payment.create_time,
          finalCapture: payment.final_capture,
          amount: {
            currencyCode: payment.amount.currency_code,
            value: payment.amount.value,
          },
        })),
        shipping: {
          fullName: unit.shipping.name.full_name,
          address: {
            addressLineOne: unit.shipping.address.address_line_1,
            adminAreaOne: unit.shipping.address.admin_area_1,
            adminAreaTwo: unit.shipping.address.admin_area_2,
            postalCode: unit.shipping.address.postal_code,
            countryCode: unit.shipping.address.country_code,
          },
        }
      })),
    });

    await dbOrder.save();

    console.log(dbOrder);

    res.redirect('/success')
  } catch (error) {
    console.error("Failed to capture payment:", error);
    res.redirect("/error")
  }
});

app.listen(PORT, () => console.log(`Server Started on ${PORT}`));
