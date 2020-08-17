//FIREBASSE INICIALIZATION
var config = {
    apiKey: "AIzaSyDcO8_VIP2P2ztqncbgGhLA_mJpuoaC9vo",
    authDomain: "recicleplus.firebaseapp.com",
    databaseURL: "https://recicleplus.firebaseio.com",
    projectId: "recicleplus",
    storageBucket: "recicleplus.appspot.com",
};
firebase.initializeApp(config);
var scnd = firebase.initializeApp(config, "scnd");

const auth = firebase.auth();
const uAuth = scnd.auth();
const db = firebase.firestore();
const functions = firebase.functions();