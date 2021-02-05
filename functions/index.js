const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
admin.initializeApp();

const gmailEmail = functions.config().gmail.email;
const gmailPass = functions.config().gmail.password;
const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPass,
    },
});

exports.addAdmin = functions.https.onCall((data, context) => {
    // if (context.auth.token.admin !== true) {
    //     console.log("Only admins can add other admins");
    // }
    return admin.auth().getUserByEmail(data.email).then(user => {
        return admin.auth().setCustomUserClaims(user.uid, {
            admin: true
        })
    }).then(() => {
        console.log("Success! " + data.email + " has been made an admin.");
    }).catch(err => {
        console.log("There was an error while deleting user: " + err);
    });
});

exports.addInstitution = functions.firestore.document('institutions/{userID}').onCreate((snap, context) => {
    return admin.auth().setCustomUserClaims(snap.id, {
        institution: true
    }).then(() => {
        console.log("Success!");
    }).catch(err => {
        console.log("There was an error while deleting user: " + err);
    });
});

exports.deleteInstitution = functions.firestore.document('institutions/{userID}').onDelete((snap, context) => {
    return admin.auth().deleteUser(snap.id).then(() => {
        console.log("Deleted user with ID: " + snap.id);
    }).catch((err) => {
        console.log("There was an error while deleting user: " + err);
    });
});

exports.deletePicker = functions.firestore.document('pickers/{userID}').onDelete((snap, context) => {
    return admin.auth().deleteUser(snap.id).then(() => {
        console.log("User successful deleted");
    }).catch((err) => {
        console.log("There was an error while deleting user: " + err);
    });
});

exports.sendMail = functions.https.onCall((data, context) => {
    const dest = data.email;
    const pass = data.pass;
    const name = data.name;

    return sendWelcomeEmail(dest, pass, name);
});

async function sendWelcomeEmail(dest, pass, name) {
    const mailOptions = {
        from: 'RECICLE+ <noreply.recicle@gmail.com>',
        to: dest,
        subject: 'BEM-VINDX AO RECICLE+',
        html: `<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Strict//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'><html xmlns='http://www.w3.org/1999/xhtml'><head> <meta http-equiv='Content-Type' content='text/html; charset=utf-8'> <meta name='viewport' content='width=device-width'></head><body style='background-color: #059b9a;font-size: 14px;min-width: 100%;margin: 0;padding: 0;color: #212121;font-family: "Arial";font-weight: 400;line-height: 1.429;letter-spacing: 0.001em;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;width: 100% !important;'> <table class='mui-body' cellpadding='0' cellspacing='0' border='0' style='border-spacing: 0;border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;background-color: #FFF;font-size: 14px;margin: 0;padding: 0;height: 100%;width: 100%;color: #212121;font-family: "Arial";font-weight: 400;line-height: 1.429;letter-spacing: 0.001em;'> <tr> <td style='padding: 0;text-align: left;word-break: break-word;-webkit-hyphens: auto;-moz-hyphens: auto;hyphens: auto;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;border-collapse: collapse !important;'> <center style='background-color: #059b9a;'> <div class='mui-container' style='padding-top: 15px;padding-bottom: 15px;max-width: 600px;display: block;margin: 0 auto;clear: both;text-align: left;padding-left: 15px;padding-right: 15px;'> <h3 class='mui--text-center' style='margin-top: 20px;margin-bottom: 10px;font-weight: bold;font-size: 28px;line-height: 28px;text-align: center;font-family: "Arial Black";color: #fff;'> RECICLE+</h3> <table cellpadding='0' cellspacing='0' border='0' width='100%' style='border-spacing: 0;border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;'> <tr> <td class='mui-panel' style='padding: 15px;text-align: left;word-break: break-word;-webkit-hyphens: auto;-moz-hyphens: auto;hyphens: auto;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;border-radius: 0;background-color: #FFF;border-top: 1px solid #ededed;border-left: 1px solid #e6e6e6;border-right: 1px solid #e6e6e6;border-bottom: 2px solid #d4d4d4;border-collapse: collapse !important;'> <table id='content-wrapper' border='0' cellpadding='0' cellspacing='0' width='100%' style='border-spacing: 0;border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;'> <tbody> <tr> <td style='padding: 0;text-align: left;word-break: break-word;-webkit-hyphens: auto;-moz-hyphens: auto;hyphens: auto;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;padding-bottom: 15px;border-collapse: collapse !important;'> <h2 style='margin-top: 0px;margin-bottom: 0px;font-weight: 400;font-size: 24px;line-height: 32px;'> DADOS PARA ACESSO</h2> </td></tr><tr> <td class='mui--divider-top' style='padding: 0;text-align: left;word-break: break-word;-webkit-hyphens: auto;-moz-hyphens: auto;hyphens: auto;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;border-top: 1px solid #e0e0e0;padding-bottom: 15px;padding-top: 15px;border-collapse: collapse !important;'> Seja Bem-Vindx ${name}</td></tr><tr> <td style='padding: 0;text-align: left;word-break: break-word;-webkit-hyphens: auto;-moz-hyphens: auto;hyphens: auto;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;padding-bottom: 15px;border-collapse: collapse !important;'> Utilize os dados abaixo para acessar o RECICLE+.<br>Se você não realizou nenhuma solicitação apenas ignore esse email. </td></tr><tr> <td style='padding: 0;text-align: left;word-break: break-word;-webkit-hyphens: auto;-moz-hyphens: auto;hyphens: auto;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;padding-bottom: 15px;border-collapse: collapse !important;'> <center><b>SEU EMAIL:</b></center> <center>${dest}</center><br><center><b>SUA SENHA:</b></center> <center>${pass}</center> </td></tr><tr> <td style='padding: 0;text-align: left;word-break: break-word;-webkit-hyphens: auto;-moz-hyphens: auto;hyphens: auto;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;padding-bottom: 15px;border-collapse: collapse !important;'> <center> <table class='mui-btn mui-btn--primary' border='0' cellspacing='0' cellpadding='0' style='border-spacing: 0;border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;cursor: pointer;white-space: nowrap;'> <tr> <td style='padding: 0;text-align: left;word-break: break-word;-webkit-hyphens: auto;-moz-hyphens: auto;hyphens: auto;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;background-color: #059b9a;border-radius: 3px;border-collapse: collapse !important;'> <a href='https://recicle.web.app/' style='background-color: #059b9a;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;color: #FFF;text-decoration: none;border-top: 1px solid #059b9a;border-left: 1px solid #059b9a;border-right: 1px solid #059b9a;border-bottom: 1px solid #059b9a;font-weight: 500;font-size: 14px;line-height: 14px;letter-spacing: 0.03em;text-transform: uppercase;display: inline-block;text-align: center;border-radius: 3px;padding: 10px 25px;'>ACESSAR GERENCIAMENTO</a> </td></tr></table> </center> </td></tr><tr> <td style='padding: 0;text-align: left;word-break: break-word;-webkit-hyphens: auto;-moz-hyphens: auto;hyphens: auto;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;padding-bottom: 15px;border-collapse: collapse !important;'> Obrigado, </td></tr><tr> <td id='last-cell' style='padding: 0;text-align: left;word-break: break-word;-webkit-hyphens: auto;-moz-hyphens: auto;hyphens: auto;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;padding-bottom: 15px;border-collapse: collapse !important;'> <a href='https://recicle.web.app/' style='-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;color: #059b9a;text-decoration: none;'>Equipe RECICLE+</a> </td></tr></tbody> </table> </td></tr></table> </div></center> </td></tr></table></body></html>`
    };
    await mailTransport.sendMail(mailOptions);
    console.log('New welcome email sent to:', dest);
    return null;
}

//Chat Notification
exports.sendMessageNotification = functions.firestore
    .document('requests/{request}/messages/{message}')
    .onCreate((snap, context) => {
        const doc = snap.data();
        console.log(doc);

        var fromCollection;
        var toCollection;

        const idTo = doc.to;
        const idFrom = doc.from;
        const contentMessage = doc.text;
        const requestId = doc.requestId;
        const sentByDonor = doc.sentByDonor;

        console.log(idFrom);
        console.log(sentByDonor);
        if (!sentByDonor) {
            fromCollection = 'pickers';
            toCollection = 'donors';
        }
        else {
            fromCollection = 'donors';
            toCollection = 'pickers';
        }
        console.log(fromCollection);
        console.log(toCollection);

        // Get push token user to (receive)
        admin
            .firestore()
            .collection(toCollection)
            .where('userId', '==', idTo)
            .get()
            .then(querySnapshot => {
                querySnapshot.forEach(userTo => {
                    console.log(`Found user to: ${userTo.data().name}`);
                    console.log('User to Token: ' + userTo.data().pushToken);
                    if (userTo.data().pushToken && userTo.data().isActive) {
                        // Get info user from (sent)
                        admin
                            .firestore()
                            .collection(fromCollection)
                            .where('userId', '==', idFrom)
                            .get()
                            .then(querySnapshot2 => {
                                querySnapshot2.forEach(userFrom => {
                                    console.log(`Found user from: ${userFrom.data().name}`);
                                    const payload = {
                                        "notification": {
                                            title: `Mensagem de ${userFrom.data().name}`,
                                            body: contentMessage,
                                        },
                                        "data": {
                                            click_action: 'FLUTTER_NOTIFICATION_CLICK',
                                            type: 'message',
                                            donorId: sentByDonor ? idFrom : idTo,
                                            pickerId: sentByDonor ? idTo : idFrom,
                                            requestId: requestId
                                        }
                                    }
                                    // Let push to the target device
                                    admin
                                        .messaging()
                                        .sendToDevice(userTo.data().pushToken, payload)
                                        .then(response => {
                                            console.log('Successfully sent message:', response);
                                        })
                                        .catch(error => {
                                            console.log('Error sending message:', error);
                                        })
                                })
                            })
                    } else {
                        console.log('Can not find pushToken target user');
                    }
                });
            });
        return null;
    });

exports.sendNewRequestNotification = functions.firestore
    .document('requests/{request}')
    .onCreate((snap, context) => {
        const doc = snap.data();
        console.log(doc);

        // Get push token user to (receive)
        admin
            .firestore()
            .collection('pickers')
            .get()
            .then(querySnapshot => {
                querySnapshot.forEach(userTo => {
                    console.log(`Found picker to: ${userTo.data().name}`);
                    console.log('User to Token: ' + userTo.data().pushToken);

                    if (userTo.data().pushToken && userTo.data().isActive == true) {
                        // Get info user from (sent)
                        const payload = {
                            "notification": {
                                title: `Nova Coleta em ${doc.address}`,
                                body: doc.trashAmount + " de " + doc.trashType,
                            },
                            "data": {
                                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                                type: 'new'
                            }
                        }

                        admin
                            .messaging()
                            .sendToDevice(userTo.data().pushToken, payload)
                            .then(response => {
                                console.log('Successfully sent message:', response);
                            })
                            .catch(error => {
                                console.log('Error sending message:', error);
                            })
                    } else {
                        console.log('Can not find pushToken target user');
                    }
                });
            });
        return null;
    });

//chat message
exports.sendChangeRequestStateNotification = functions.firestore
    .document('requests/{request}')
    .onUpdate((change, context) => {
        const doc = change.after.data();
        console.log(doc);

        const state = doc.state;
        const previousState = change.before.data().state;
        const previousPickerId = change.before.data().pickerId;
        if (state != previousState) {
            const address = doc.address;
            const trashType = doc.trashType;
            const trashAmount = doc.trashAmount;

            var id;
            var body;
            var type;
            var title;
            var request;

            if (state == 1) {
                const dismissedByDonor = doc.dismissedByDonor;
                if (dismissedByDonor) {
                    id = previousPickerId;
                    type = 'dismiss';
                    request = 'pickers';
                    title = "Coleta cancelada pelo Doador!";
                    body = "Dados da coleta: " + trashAmount + " de " + trashType;
                }
                else {
                    type = 'dismiss';
                    id = doc.donorId;
                    request = 'donors';
                    title = "Coleta cancelada pelo Coletor!";
                    body = "Dados da coleta: " + trashAmount + " de " + trashType;
                }

                admin
                    .firestore()
                    .collection('pickers')
                    .get()
                    .then(querySnapshot => {
                        querySnapshot.forEach(userTo => {
                            console.log(`Found picker to: ${userTo.data().name}`);
                            console.log('User to Token: ' + userTo.data().pushToken);

                            var dismissedPickers = doc.dismissedPickers;

                            if (userTo.data().pushToken
                                && userTo.data().isActive == true
                                && !dismissedPickers.includes(userTo.data().userId)) {
                                // Get info user from (sent)
                                const payload = {
                                    "notification": {
                                        title: `Nova Coleta em ${doc.address}`,
                                        body: doc.trashAmount + " de " + doc.trashType,
                                    },
                                    "data": {
                                        click_action: 'FLUTTER_NOTIFICATION_CLICK',
                                        type: 'new'
                                    }
                                }

                                admin
                                    .messaging()
                                    .sendToDevice(userTo.data().pushToken, payload)
                                    .then(response => {
                                        console.log('Successfully sent message:', response);
                                    })
                                    .catch(error => {
                                        console.log('Error sending message:', error);
                                    })
                            } else {
                                console.log('Can not find pushToken target user');
                            }
                        });
                    });

            } else if (state == 2) {
                type = 'accept';
                id = doc.donorId;
                request = 'donors';
                title = "Coleta Aceita!";
                body = "Mande uma mensagem para combinar a coleta!";

            } else {
                type = 'finish';
                id = doc.donorId;
                request = 'donors';
                title = "Coleta terminada!";
                body = "Visite o histórico e avalie o Coletor!";
            }

            // Get push token user to (receive)
            admin
                .firestore()
                .collection(request)
                .where('userId', '==', id)
                .get()
                .then(querySnapshot => {
                    querySnapshot.forEach(userTo => {
                        const isActive = userTo.data().isActive;
                        console.log('Is user Active: ' + isActive);
                        console.log(`Found user: ${userTo.data().name}`);
                        console.log('User to Token: ' + userTo.data().pushToken);

                        if (userTo.data().pushToken && isActive) {
                            // Get info user from (sent)
                            const payload = {
                                "notification": {
                                    title: title,
                                    body: body,
                                },
                                "data": {
                                    click_action: 'FLUTTER_NOTIFICATION_CLICK',
                                    type: type,
                                    body: "Dados da coleta: " + trashAmount + " de " + trashType + " em " + address
                                }
                            }

                            admin
                                .messaging()
                                .sendToDevice(userTo.data().pushToken, payload)
                                .then(response => {
                                    console.log('Successfully sent message:', response);
                                })
                                .catch(error => {
                                    console.log('Error sending message:', error);
                                })
                        } else {
                            console.log('Can not find pushToken target user');
                        }
                    });
                });
        }
        return null;
    });