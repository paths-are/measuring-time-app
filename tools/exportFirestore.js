// import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
// import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
// import fs from "fs/promises";
// import dateFormat, { masks } from "dateformat";

const {
  initializeApp,
  applicationDefault,
  cert,
} = require("firebase-admin/app");
const {
  getFirestore,
  Timestamp,
  FieldValue,
} = require("firebase-admin/firestore");
const fs = require("fs/promises");
// const dateFormat =  require("dateformat");

const nowFormat = () => {
  const now = new Date();
  const pad = (n) => (n > 9 ? n : "0" + n);
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const date = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  // if (format === "hh:mm") return `${hours}:${minutes}`;
  // if (format === "YYYYMMDD") return `${year}${month}${date}`;
  // if (format === "YYYY/MM/DD") return `${year}/${month}/${date}`;
  return `${year}${month}${date}_${hours}${minutes}`;
};

// 本番環境接続時
// const serviceAccount = require('./path/to/serviceAccountKey.json');
// initializeApp({
//   credential: cert(serviceAccount)
// });

/**
 * TODO : ローカルエミュレータに接続するには、ターミナル起動後に下記コマンドを実行する必要がある
 */
// bash : export FIRESTORE_EMULATOR_HOST="localhost:8080"
//
// initializeApp({ projectId: "your-project-id" });
initializeApp();

const db = getFirestore();

const setDoc = async () => {
  const docRef = db.collection("users").doc("alovelace1");
  const res = await docRef.set({
    first: "Ada",
    last: "Lovelace",
    born: 1815,
  });
  console.log(res);
};

/**
 * collectionNameで指定したコレクションの全データをjson形式でエクスポートする
 */
exports.exportCollectionData = async (collectionName) => {
  // const collectionName = "MeasuredItem";
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();

  const json = { [collectionName]: [] };
  snapshot.forEach((doc) => {
    const docment = {
      [doc.id]: doc.data(),
    };
    json[collectionName].push(docment);
  });

  const prefix = nowFormat();
  const exportFileName = `${process.cwd()}/exports/${prefix}_${collectionName}.json`;

  try {
    await fs.writeFile(exportFileName, JSON.stringify(json));
    console.log(exportFileName, "が作成されました");

    const content = await fs.readFile(exportFileName, "utf-8");
    console.log(JSON.parse(content));
  } catch (err) {
    console.log(err.toString());
  }
};

/**
 * MeasuredItemをSubcollection型に移行
 */
exports.importJsonToFirestore = async () => {
  // const collectionName = "MeasuredItem";
  const json = require("./exports/20211201_0046_MeasuredItem.json");
  
  for (const measuredItem of json["MeasuredItem"]) {
    // console.log(measuredItem);
    for (const key in measuredItem) {
      // console.log(measuredItem[key]);
      const collectionRef = db.collection(`MeasuredItem/${key}/items`);
      for (const item of measuredItem[key].items) {
        // console.log(item);
        await collectionRef.doc().set(item);
      }
    }
  }

  return;

  // webの書き方
  // const collectionRef = collection(db, "collection", "doc1", "sub-col1");

  const collectionRef = db.collection("collection/doc1/sub-col1");
  // Docment ID 自動生成
  await collectionRef.doc().set({
    name: "San Francisco",
    state: "CA",
    country: "USA",
    capital: false,
    population: 860000,
  });

  // Docment ID 指定（すでにある場合は上書き）
  await collectionRef.doc("doc-id").set({
    name: "San Francisco",
    state: "CA",
    country: "USA",
    capital: false,
    population: 860000,
  });
};
