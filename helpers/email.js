const API_KEY = '69930ec6e63499099cee91ef6d58105d-cac494aa-a1c05cf8';
const DOMAIN = 'sandbox25856c021f9d4b0cb9f3d681a6ed9b77.mailgun.org';

const formData = require('form-data');
const Mailgun = require('mailgun.js');

const mailgun = new Mailgun(formData);
const client = mailgun.client({ username: 'api', key: API_KEY });


module.exports = function () {

    this.welcomeEmail = async (cust_name) => {
        return new Promise((resolve, reject) => {
            const messageData = {
                from: 'harshit.moshimoshi@gmail.com',
                to: 'harshit.moshimoshi@gmail.com',
                subject: 'Welcome',
                text: 'Testing some Mailgun awesomeness!',
                html: `<!DOCTYPE html>
                <html>
                
                <head>
                    <title></title>
                    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                    <style type="text/css">
                        body,
                        table,
                        td,
                        a {
                            -webkit-text-size-adjust: 100%;
                            -ms-text-size-adjust: 100%;
                        }
                
                        table,
                        td {
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                        }
                
                        img {
                            -ms-interpolation-mode: bicubic;
                        }
                
                        img {
                            border: 0;
                            height: auto;
                            line-height: 100%;
                            outline: none;
                            text-decoration: none;
                        }
                
                        table {
                            border-collapse: collapse !important;
                        }
                
                        body {
                            height: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            width: 100% !important;
                        }
                
                        a[x-apple-data-detectors] {
                            color: inherit !important;
                            text-decoration: none !important;
                            font-size: inherit !important;
                            font-family: inherit !important;
                            font-weight: inherit !important;
                            line-height: inherit !important;
                        }
                
                        @media screen and (max-width: 480px) {
                            .mobile-hide {
                                display: none !important;
                            }
                
                            .mobile-center {
                                text-align: center !important;
                            }
                        }
                
                        div[style*="margin: 16px 0;"] {
                            margin: 0 !important;
                        }
                    </style>
                
                <body style="margin: 0 !important; padding: 0 !important; background-color: #eeeeee;" bgcolor="#eeeeee">
                    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: Open Sans, Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
                        For what reason would it be advisable for me to think about business content? That might be little bit risky to have crew member like them.
                    </div>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td align="center" style="background-color: #eeeeee;" bgcolor="#eeeeee">
                                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                                    <tr>
                                        <td align="center" valign="top" style="font-size:0; padding: 35px;" bgcolor="#F44336">
                                            <div style="display:inline-block; max-width:50%; min-width:100px; vertical-align:top; width:100%;">
                                                <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:300px;">
                                                    <tr>
                                                        <td align="left" valign="top" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 36px; font-weight: 800; line-height: 48px;" class="mobile-center">
                                                            <h1 style="font-size: 36px; font-weight: 800; margin: 0; color: #ffffff;">Welcome ${cust_name}</h1>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                            <div style="display:inline-block; max-width:50%; min-width:100px; vertical-align:top; width:100%;" class="mobile-hide">
            
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="padding: 35px 35px 20px 35px; background-color: #ffffff;" bgcolor="#ffffff">
                                            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                                                <tr>
                                                    <td align="center" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding-top: 25px;"> <img src="https://img.icons8.com/carbon-copy/100/000000/checked-checkbox.png" width="125" height="120" style="display: block; border: 0px;" /><br>
                                                        <h2 style="font-size: 30px; font-weight: 800; line-height: 36px; color: #333333; margin: 0;">Thank you for filling out our sign up form. We are glad that you joined us. 
                                                        Have a nice day, </h2>
                                                    </td>
                                                </tr>
                                                <tr>
                                                <td align="center" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding-top: 25px;"><br>
                                                    <h2 style="font-size: 30px; font-weight: 800; line-height: 36px; color: #333333; margin: 0;">WEChimini</h2>
                                                </td>
                                            </tr>
                                        
            
                                               
                                            </table>
                                        </td>
                                    </tr>
                                  
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                
                </html>`
            };

            client.messages.create(DOMAIN, messageData)
                .then((res) => {
                    resolve(res);
                })
                .catch((err) => {
                    resolve(err);
                });
        })
    };
    this.welcomeVender = async (franchise_name, email, password) => {
        return new Promise((resolve, reject) => {
            const messageData = {
                from: 'harshit.moshimoshi@gmail.com',
                to: 'harshit.moshimoshi@gmail.com',
                subject: 'Welcome',
                text: 'Testing some Mailgun awesomeness!',
                html: `<!DOCTYPE html>
                <html>
                
                <head>
                    <title></title>
                    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                    <style type="text/css">
                        body,
                        table,
                        td,
                        a {
                            -webkit-text-size-adjust: 100%;
                            -ms-text-size-adjust: 100%;
                        }
                
                        table,
                        td {
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                        }
                
                        img {
                            -ms-interpolation-mode: bicubic;
                        }
                
                        img {
                            border: 0;
                            height: auto;
                            line-height: 100%;
                            outline: none;
                            text-decoration: none;
                        }
                
                        table {
                            border-collapse: collapse !important;
                        }
                
                        body {
                            height: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            width: 100% !important;
                        }
                
                        a[x-apple-data-detectors] {
                            color: inherit !important;
                            text-decoration: none !important;
                            font-size: inherit !important;
                            font-family: inherit !important;
                            font-weight: inherit !important;
                            line-height: inherit !important;
                        }
                
                        @media screen and (max-width: 480px) {
                            .mobile-hide {
                                display: none !important;
                            }
                
                            .mobile-center {
                                text-align: center !important;
                            }
                        }
                
                        div[style*="margin: 16px 0;"] {
                            margin: 0 !important;
                        }
                    </style>
                
                <body style="margin: 0 !important; padding: 0 !important; background-color: #eeeeee;" bgcolor="#eeeeee">
                    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: Open Sans, Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
                        For what reason would it be advisable for me to think about business content? That might be little bit risky to have crew member like them.
                    </div>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td align="center" style="background-color: #eeeeee;" bgcolor="#eeeeee">
                                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                                    <tr>
                                        <td align="center" valign="top" style="font-size:0; padding: 35px;" bgcolor="#F44336">
                                            <div style="display:inline-block; max-width:50%; min-width:100px; vertical-align:top; width:100%;">
                                                <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:300px;">
                                                    <tr>
                                                        <td align="left" valign="top" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 36px; font-weight: 800; line-height: 48px;" class="mobile-center">
                                                            <h1 style="font-size: 36px; font-weight: 800; margin: 0; color: #ffffff;">Welcome ${franchise_name}</h1>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                            <div style="display:inline-block; max-width:50%; min-width:100px; vertical-align:top; width:100%;" class="mobile-hide">
            
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="padding: 35px 35px 20px 35px; background-color: #ffffff;" bgcolor="#ffffff">
                                            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                                                <tr>
                                                    <td align="center" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding-top: 25px;"> <img src="https://img.icons8.com/carbon-copy/100/000000/checked-checkbox.png" width="125" height="120" style="display: block; border: 0px;" /><br>
                                                        <h2 style="font-size: 30px; font-weight: 800; line-height: 36px; color: #333333; margin: 0;">Please use these credentials for login email:${email},password:${password}
                                                        Have a nice day, </h2>
                                                    </td>
                                                </tr>
                                                <tr>
                                                <td align="center" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding-top: 25px;"><br>
                                                    <h2 style="font-size: 30px; font-weight: 800; line-height: 36px; color: #333333; margin: 0;">WEChimini</h2>
                                                </td>
                                            </tr>
                                        
            
                                               
                                            </table>
                                        </td>
                                    </tr>
                                  
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                
                </html>`
            };

            client.messages.create(DOMAIN, messageData)
                .then((res) => {
                    resolve(res);
                })
                .catch((err) => {
                    resolve(err);
                });
        })
    };
    this.orderConfirm = async (cust_name, order_id, total) => {
        return new Promise((resolve, reject) => {
            const messageData = {
                from: 'harshit.moshimoshi@gmail.com',
                to: 'harshit.moshimoshi@gmail.com',
                subject: 'Welcome',
                text: 'Testing some Mailgun awesomeness!',
                html: `<!DOCTYPE html>
                <html>
                
                <head>
                    <title></title>
                    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                    <style type="text/css">
                        body,
                        table,
                        td,
                        a {
                            -webkit-text-size-adjust: 100%;
                            -ms-text-size-adjust: 100%;
                        }
                
                        table,
                        td {
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                        }
                
                        img {
                            -ms-interpolation-mode: bicubic;
                        }
                
                        img {
                            border: 0;
                            height: auto;
                            line-height: 100%;
                            outline: none;
                            text-decoration: none;
                        }
                
                        table {
                            border-collapse: collapse !important;
                        }
                
                        body {
                            height: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            width: 100% !important;
                        }
                
                        a[x-apple-data-detectors] {
                            color: inherit !important;
                            text-decoration: none !important;
                            font-size: inherit !important;
                            font-family: inherit !important;
                            font-weight: inherit !important;
                            line-height: inherit !important;
                        }
                
                        @media screen and (max-width: 480px) {
                            .mobile-hide {
                                display: none !important;
                            }
                
                            .mobile-center {
                                text-align: center !important;
                            }
                        }
                
                        div[style*="margin: 16px 0;"] {
                            margin: 0 !important;
                        }
                    </style>
                
                <body style="margin: 0 !important; padding: 0 !important; background-color: #eeeeee;" bgcolor="#eeeeee">
                    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: Open Sans, Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
                        For what reason would it be advisable for me to think about business content? That might be little bit risky to have crew member like them.
                    </div>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td align="center" style="background-color: #eeeeee;" bgcolor="#eeeeee">
                                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                                    <tr>
                                        <td align="center" valign="top" style="font-size:0; padding: 35px;" bgcolor="#F44336">
                                            <div style="display:inline-block; max-width:50%; min-width:100px; vertical-align:top; width:100%;">
                                                <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:300px;">
                                                    <tr>
                                                        <td align="left" valign="top" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 36px; font-weight: 800; line-height: 48px;" class="mobile-center">
                                                            <h1 style="font-size: 36px; font-weight: 800; margin: 0; color: #ffffff;">${cust_name}</h1>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                           
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="padding: 35px 35px 20px 35px; background-color: #ffffff;" bgcolor="#ffffff">
                                            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                                                <tr>
                                                    <td align="center" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding-top: 25px;"> <img src="https://img.icons8.com/carbon-copy/100/000000/checked-checkbox.png" width="125" height="120" style="display: block; border: 0px;" /><br>
                                                        <h2 style="font-size: 30px; font-weight: 800; line-height: 36px; color: #333333; margin: 0;"> Woo hoo! Your order is on its way. Your order details can be found below.</h2>
                                                    </td>
                                                </tr>
    
                                                <tr>
                                                    <td align="left" style="padding-top: 20px;">
                                                        <table cellspacing="0" cellpadding="0" border="0" width="100%">
                                                            <tr>
                                                                <td width="75%" align="left" bgcolor="#eeeeee" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px;"> Order Confirmation # </td>
                                                                <td width="25%" align="left" bgcolor="#eeeeee" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px;"> ${order_id} </td>
                                                            </tr>
                                                            <tr>
                                                                <td width="75%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;"> Order Date </td>
                                                                <td width="25%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;"> ${new Date()} </td>
                                                            </tr>
                                                            <tr>
                                                                <td width="75%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 5px 10px;"> Order Total:  </td>
                                                                <td width="25%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 5px 10px;"> ${total}</td>
                                                            </tr>
                                
                                                        </table>
                                                    </td>
                                                </tr>
                
                                            </table>
                                        </td>
                                    </tr>
                            
                                 
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                
                </html>`
            };

            client.messages.create(DOMAIN, messageData)
                .then((res) => {
                    resolve(res);
                })
                .catch((err) => {
                    resolve(err);
                });
        })
    };

    this.newsData = async (email_id) => {
        return new Promise((resolve, reject) => {
            const messageData = {
                from: "harshit.moshimoshi@gmail.com",
                to: 'support@wechimni.org',
                subject: 'NewsLetter',
                text: email_id,
            };

            client.messages.create(DOMAIN, messageData)
                .then((res) => {
                    resolve(res);
                })
                .catch((err) => {
                    resolve(err);
                });
        })
    };
}