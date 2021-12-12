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
var admin = require("firebase-admin");

/**
 *
 * typee measuredTimeData {
 *   YYYYMMDD:{
 *    measuringItem:
 *    times:{
 *
 *    }
 *   }
 * }
 *
 * 現状
 * Users/:userid/userdata
 * MeasuredTimes/:userid/measuredTimeData
 *
 *
 * structure 案 改修後
 *
 * type measuredTimeData {
 *  start:number;
 *  end:number;
 *  _itemId:refference(MeasuredItem.id)
 * }
 *
 * Users/:userid/userdata
 *
 * Users/:userId/MeasuredTimes/:measuredTimeId/measuredTimeData1
 *                            /:measuredTimeId/measuredTimeData2
 *                            /:measuredTimeId/measuredTimeData3
 *                            /:measuredTimeId/measuredTimeData4
 *
 * Users/:userId/MeasuredTimes/:measuredTimeId/measuredTimeData1
 *                            /:measuredItemId/measuredItemData2
 *                            /:measuredItemId/measuredItemData3
 */
function formatDate(dateobject, format) {
  const pad = (n) => (n > 9 ? n : "0" + n);
  dateobject = new Date(dateobject);
  const year = dateobject.getFullYear();
  const month = pad(dateobject.getMonth() + 1);
  const date = pad(dateobject.getDate());
  const hours = pad(dateobject.getHours());
  const minutes = pad(dateobject.getMinutes());
  const secounds = pad(dateobject.getSeconds());
  // return `${year}/${month}/${date} ${hours}:${minutes}:${secounds}`;
  // return `${hours}:${minutes}:${secounds}`;
  if (format === "hh:mm") return `${hours}:${minutes}`;
  if (format === "hh") return `${hours}`;
  if (format === "mm") return `${minutes}`;
  if (format === "YYYYMMDD") return `${year}${month}${date}`;
  if (format === "YYYY/MM/DD hh:mm:ss")
    // return `${year}/${month}/${date} ${hours}:${minutes}:${secounds}`;
    return `${year}/${month}/${date} ${hours}:${minutes}:${secounds}`;
  if (format === "YYYY/MM/DD") return `${year}/${month}/${date}`;
  return `${year}${month}${date}`;
}
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
/**
 * TODO : FIRESTORE_EMULATOR_HOSTが環境変数に設定してあれば、削除する必要がある
 */
// bash : export -n FIRESTORE_EMULATOR_HOST // 削除するとき
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: cert(serviceAccount),
});

/**
 * TODO : ローカルエミュレータに接続するには、ターミナル起動後に下記コマンドを実行する必要がある
 */
// bash : export FIRESTORE_EMULATOR_HOST="localhost:8080" // 設定するとき
//
// initializeApp({ projectId: "your-project-id" });
// initializeApp();

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
 * userデータを登録（し忘れていた分）
 */
exports.createUserData = async () => {
  const uids = ["PkfO1eeEDyamSB0vXqMXcCVBssr2", "Oc1eF8L2K3Zy7mPlxjjyf2ayGSH2"];
  uids.map((uid) => {
    admin
      .auth()
      .getUser(uid)
      .then(async (userRecord) => {
        await db
          .collection("User")
          .doc(uid)
          .set(JSON.parse(JSON.stringify(userRecord)));
      })
      .catch((error) => {
        console.log("Error fetching user data:", error);
      });
  });
};

/**
 * show times
 */
exports.insertNewTimes = async () => {
  const json = await fs.readFile(
    "./creates/uniqueTimes_20211213_0031.json",
    "utf-8"
  );
  const times = JSON.parse(json);
  const scope = {
    start: new Date("2021/12/01 00:00:00").getTime(),
    end: new Date("2022/01/01 00:00:00").getTime(),
  };

  const scopedTimes = [];
  times.map((time) => {
    const start = formatDate(time.start, "YYYY/MM/DD hh:mm:ss");
    const end = formatDate(time.end, "YYYY/MM/DD hh:mm:ss");

    if (
      (time.start >= scope.start && time.start < scope.end) ||
      (time.end >= scope.start && time.end < scope.end)
      // スタートかエンドが範囲内であれば
    ) {
      scopedTimes.push(time);
      console.log(start, end);
    }
  });
  const uid = "Oc1eF8L2K3Zy7mPlxjjyf2ayGSH2";
  const docRef = db.collection(`User/${uid}/times`).doc("202112");
  const measure = {
    measuringItem: {
      name: "timer-app",
      start: 1639317756414,
      isActive: true,
      _id: "0437fcea-402b-4f96-9d24-5d75e842ec0c",
    },
    times: scopedTimes,
  };
  importJsonToFirestore(docRef, measure);
};

/**
 * merge times
 */
exports._mergeTimes = async () => {
  let json = await fs.readFile(
    "./exports/20211212_2317_MeasuredTime.json",
    "utf-8"
  );
  json = JSON.parse(json);

  const target = json["MeasuredTime"][0]["Oc1eF8L2K3Zy7mPlxjjyf2ayGSH2"];
  console.log(json);
  console.log(target);
  let allTimes = [];
  Object.keys(target).forEach((key) => {
    allTimes = [...allTimes, ...target[key].times];
  });

  const timeIds = [];
  const duplicates = [];
  const someTimes = [];
  const uniqueTimes = [];

  allTimes.forEach((time) => {
    if (!timeIds.includes(time._id)) {
      timeIds.push(time._id);
      uniqueTimes.push(time);
    } else {
      duplicates.push(time._id);
    }
  });
  console.log(allTimes.length);
  console.log(duplicates.length);

  try {
    await fs.writeFile(
      `creates/uniqueTimes_${nowFormat()}.json`,
      JSON.stringify(allTimes)
    );
  } catch (e) {
    console.log(e.message);
  }
};

exports.importTimes = async () => {
  const json = require("./exports/20211212_2317_MeasuredTime.json");

  const uids = ["Oc1eF8L2K3Zy7mPlxjjyf2ayGSH2", "PkfO1eeEDyamSB0vXqMXcCVBssr2"];

  uids.map((uid) => {
    const docRef = db.collection(`User/${uid}/times`).doc("202112");
    importJsonToFirestore(docRef, json);
  });
};

/**
 * MeasuredItemをSubcollection型に移行
 */
const importJsonToFirestore = async (toRef, data) => {
  // const collectionName = "MeasuredItem";

  await toRef.set(data);

  // const json = require("./exports/20211201_0046_MeasuredItem.json");

  // for (const measuredItem of json["MeasuredItem"]) {
  //   for (const key in measuredItem) {
  //     const collectionRef = db.collection(`MeasuredItem/${key}/items`);
  //     for (const item of measuredItem[key].items) {
  //       await collectionRef.doc().set(item);
  //     }
  //   }
  // }

  // return;
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
    // console.log(doc.id, " => ",doc.data())
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
exports._importJsonToFirestore = async () => {
  // const collectionName = "MeasuredItem";
  const json = require("./exports/20211201_0046_MeasuredItem.json");

  for (const measuredItem of json["MeasuredItem"]) {
    for (const key in measuredItem) {
      const collectionRef = db.collection(`MeasuredItem/${key}/items`);
      for (const item of measuredItem[key].items) {
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
