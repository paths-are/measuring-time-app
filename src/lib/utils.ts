// import { Timestamp } from "@firebase/firestore";

export function formatDate(dateobject: Date | number, format: string) {
  const pad = (n: number) => (n > 9 ? n : "0" + n);
  dateobject = new Date(dateobject);
  const year = dateobject.getFullYear();
  const month = pad(dateobject.getMonth() + 1);
  const date = pad(dateobject.getDate());
  const hours = pad(dateobject.getHours());
  const minutes = pad(dateobject.getMinutes());
  // const secounds = pad(dateobject.getSeconssds());
  // return `${year}/${month}/${date} ${hours}:${minutes}:${secounds}`;
  // return `${hours}:${minutes}:${secounds}`;
  if (format === "hh:mm") return `${hours}:${minutes}`;
  if (format === "hh") return `${hours}`;
  if (format === "mm") return `${minutes}`;
  if (format === "YYYYMMDD") return `${year}${month}${date}`;
  if (format === "YYYY/MM/DD hh:mm:ss")
    // return `${year}/${month}/${date} ${hours}:${minutes}:${secounds}`;
    return `${year}/${month}/${date} ${hours}:${minutes}:00`;
  if (format === "YYYY/MM/DD") return `${year}/${month}/${date}`;
  return `${year}${month}${date}`;
}

/**
 * 任意の桁で切り捨てする関数
 * @param {number} value 切り捨てする数値
 * @param {number} base どの桁で切り捨てするか（10→10の位、0.1→小数第１位）
 * @return {number} 切り捨てした値
 */
export function orgFloor(value: number, base: number) {
  return Math.floor(value * base) / base;
}

/**
 * 1時間以上なら 「〇時間〇〇分」
 * 1時間未満なら「○○分」と返却
 */
export function getDisplayTime(minutes: number) {
  console.log(minutes)
  if (minutes >= 60) {
    const hour = orgFloor(minutes / 60, 1);
    const minutesAmari = orgFloor(minutes % (hour * 60), 1);
    return `${hour}時間${minutesAmari}分`;
  } else {
    return `${minutes}分`;
  }
}

export function withinRange(
  time: any,
  range: any,
  condition: "AND" | "OR" | "OR_SPECIAL"
) {
  // const range = {
  //   start: new Date("2021/12/01 00:00:00").getTime(),
  //   end: new Date("2022/01/01 00:00:00").getTime(),
  // };
  // const scopedTimes = [];
  // const start = formatDate(time.start, "YYYY/MM/DD hh:mm:ss");
  // const end = formatDate(time.end, "YYYY/MM/DD hh:mm:ss");

  if (condition === "OR") {
    if (
      (time.start >= range.start && time.start < range.end) ||
      (time.end >= range.start && time.end < range.end)
      // スタートかエンドが範囲内であれば
    ) {
      return true;
    } else {
      return false;
    }
  }

  if (condition === "AND") {
    if (
      time.start >= range.start &&
      time.start < range.end &&
      time.end >= range.start &&
      time.end < range.end
      // スタート、エンドの両方が範囲内であれば
    ) {
      return { start: true, end: true };
    } else if (
      time.start < range.start &&
      time.end >= range.start &&
      time.end < range.end
    ) {
      return { start: false, end: true };
    } else if (
      time.start >= range.start &&
      time.start < range.end &&
      time.end >= range.end
    ) {
      return { start: true, end: false };
    } else {
      return { start: false, end: false };
    }
  }
}
