const express = require('express');
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
require('dotenv').config();
const db = require("./connection/db");
const mongoose = require('mongoose');
const mongoClient = require('mongodb').MongoClient;
require("./models/order");
const request = require("request");
require("./models/user_model");

var CronJob = require('cron').CronJob;

//router Controllers
const admin = require('./router/admin_router/admin_router');
const user = require('./router/user_router');
const internalRoute = require('./router/internal_route');
const EMAIL = require('./helpers/email');
var emailer = new EMAIL();
var ORDER = mongoose.model("order");
var USER = mongoose.model("user");


app.use(bodyParser.urlencoded({
  extended: true,
  limit: '50mb'
}));

app.use(bodyParser.json({
  limit: '50mb',
  extended: true
}));


const port = process.env.PORT;
app.listen(port, () => {
  console.log(`server is running on PORT` + " " + port);
});
app.use(cors());
app.use(function (err, req, res, next) {

  //logger.error(err);
  res.header("Access-Control-Allow-Origin", "*");
  res.status(err.status || 500);
  res.send('Invalid API Request ');
});
app.use('/api/admin', admin);
app.use('/api/user', user);
app.use('/api/internal', internalRoute);

// app.get('/', async (req, res) => {
//   let data = await emailer.orderConfirm("hars", "har", "asd")
//   res.send(data)
// })

// app.get("/hello", async (req, res) => {
//   const path = require("path");
//   var file_name = path.join(__dirname, `index.html`);
//   // var fs = require("fs");
//   //fs.writeFile(file_name, html_form, function (err) {
//   res.sendFile(file_name);

// })
var job = new CronJob('0 */60 * * * *', async () => {
  const findOrders = await ORDER.find({ orderStatus: 'dispatch' })
  // console.log(findOrders)
  if (findOrders.length > 0) {
    for (let i = 0; i < findOrders.length; i++) {
      var url =
        "https://async.pickrr.com/track/tracking/?" +
        "tracking_id=" +
        findOrders[i].tracking_id +
        "&auth_token=" +
        "c91dd1ad7a776d6698b17619788be8a1209735"
      console.log(url)
      var options = {
        method: "GET",
        url: url,
      };
      request(options, async (error, response, body) => {
        if (error) {
          console.log(error);
        } else {
          let jsonData = JSON.parse(body)
          if (jsonData.track_arr) {
            for (let j = 0; j < jsonData.track_arr.length; j++) {
              if (jsonData.track_arr[j].status_name == 'OC') {
                await ORDER.findByIdAndUpdate(findOrders[i]._id, { $set: { orderStatus: "cancel" } })
                console.log("cancel")
              } else if (jsonData.track_arr[j].status_name == 'DL') {
                await ORDER.findByIdAndUpdate(findOrders[i]._id, { $set: { orderStatus: "delivered", deliveryDate: new Date() } })
                const findCust = await USER.findById(findOrders[i].customerId)
                var url =
                  "http://bhashsms.com/api/sendmsg.php?user=GTTFoundation&" +
                  "pass=" +
                  "GTTFoundation@123" +
                  "&sender=" +
                  "Vchimn" +
                  "&phone=" +
                  findCust.phoneNo +
                  "&text=" +
                  `Your order has been delivered by the NGO` +
                  "SMS&priority=ndnd&stype=normal"
                console.log(url)
                var options = {
                  method: "GET",
                  url: url,
                };
                request(options, async (error, response, body) => {
                  if (error) {
                    console.log(error);
                  } else {
                    let jsonData = JSON.parse(body)
                    console.log(jsonData);
                    console.log("success")
                  }
                });
              }
            }
          } else {
            console.log("error")
          }
        }
      });
    }
  } else {
    console.log("all updated")
  }
});
job.start();



