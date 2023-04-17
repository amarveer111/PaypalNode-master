const mongoose = require("mongoose");
require("./database.js");

const orderSchema = new mongoose.Schema({
  orderId: String,
  status: String,
  links: [{
    href: String,
    method: String,
    rel: String,
  }],
  payer: {
    name: String,
    payerId: String,
    phone: String,
    email: String,
  },
  purchaseUnits: [{
    referenceId: String,
    payments: [{
      paymentId: String,
      createTime: String,
      finalCapture: Boolean,
      amount: {
        currencyCode: String,
        value: String,
      },
    }],
    shipping: {
      fullName: String,
      address: {
        addressLineOne: String,
        adminAreaOne: String,
        adminAreaTwo: String,
        countryCode: String,
        postalCode: String,
      }
    },
  }],
});

module.exports = mongoose.model('Order', orderSchema);
