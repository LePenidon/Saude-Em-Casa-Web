//FIREBASSE INICIALIZATION
var config = {
    apiKey: "AIzaSyDu6EwbJmI_shg85wfs6Am88KjANjs3rns",
    authDomain: "coronapp-tcc.firebaseapp.com",
    databaseURL: "https://coronapp-tcc.firebaseio.com",
    projectId: "coronapp-tcc",
    storageBucket: "coronapp-tcc.appspot.com",
    messagingSenderId: "11598567402",
    appId: "1:11598567402:web:5f3a398f0dcceca6338493",
    measurementId: "G-S1FF9N0ZF9"
};
firebase.initializeApp(config);
var scnd = firebase.initializeApp(config, "scnd");

const auth = firebase.auth();
const uAuth = scnd.auth();
const db = firebase.firestore();
const functions = firebase.functions();