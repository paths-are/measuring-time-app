import { atom } from "recoil";

export const measuredItems = atom<any>({
  key: "measuredItems",
  default: null,
});
export const totalTimes = atom<any>({
  key: "totalTimes",
  default: {},
});

export const measure = atom<any>({
  key: "measure",
  default: {
    measuringItem: {
      // 計測中のアイテム
      isActive: false,
      _id: null,
      name: null,
      start: null,
      end: null,
    },
    times: [], // 計測された時間
  },
});

export const measureHistory = atom<any>({
  key: "measureHistory",
  default: [
    {
      20211201: {
        measuringItem: {
          // 計測中のアイテム
          isActive: false,
          _id: null,
          name: null,
          start: null,
          end: null,
        },
        times: [], // 計測された時間
      },
    },
  ],
});

export const fixedHeight = atom<number>({
  key: "fixedHeight",
  default: 0,
});
