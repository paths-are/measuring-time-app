import { atom } from "recoil";

export type Todo = {
  _id: string;
  description: string | null;
  estimatedTime: number | null;
  unit: "MINUTES" | "HOURS" | "PERSON_DAY";
  status: "NOT_STARTED" | "IN_PROGRESS" | "FINISHED";
  dueDate: Date | null;
  finishedDate: Date | null;
};
export type SubItem = {
  _id: string;
  name: string;
  todos: Todo[];
};
export type Item = {
  _id: string;
  category: string;
  color: string;
  expandSubItems: boolean;
  name: string;
  note: string;
  subItems: [SubItem];
  todos?: [Todo];
  isDelete?: boolean;
};
export type MeasuredItems = [Item] | [];

export const measuredItems = atom<MeasuredItems>({
  key: "measuredItems",
  default: [],
});

export const totalTimes = atom<any>({
  key: "totalTimes",
  default: {},
});

type MeasuringItem = {
  isActive: boolean;
  _id: string | null;
  name: string | null;
  start: number | null;
  end?: number | null;
  subItemId?: string | null;
  subItemName?: string | null;
  todoId?: string | null;
  memo?: string;
};
type Time = {
  _id: string;
  start: number;
  end: number;
  itemId: string;
  subItemId?: string;
  todoId?: string;
};
export type Measure = {
  measuringItem: MeasuringItem;
  times: Time[] | [];
};
export const measure = atom<Measure>({
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
