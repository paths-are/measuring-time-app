// import * as functions from "firebase-functions";
const functions = require("firebase-functions");

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

const data = {
  first: "shinkawa",
  last: "shinji",
};

const createUserDocument = functions.auth.user().onCreate(async (user: any) => {
  console.log(user);
  // ユーザーコレクションに追加
  // user = { ...user, groups: [] };

  await db
    .collection("user")
    .doc(user.uid)
    .set(JSON.parse(JSON.stringify(user)));
  //   await db.collection("user").doc(user.uid).set(user);
});
exports.createUserDocument = createUserDocument;
