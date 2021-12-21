import * as React from "react";
import Box from "@mui/material/Box";
import { Button, TextField, Grid, Typography } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import DescriptionIcon from "@mui/icons-material/Description";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import PlayCircleOutlinedIcon from "@mui/icons-material/PlayCircleOutlined";
import { formatDate } from "@/src/lib/utils";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CheckIcon from "@mui/icons-material/Check";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";

import { v4 as uuidv4 } from "uuid";
import { useUser } from "@/src/lib/auth";
import {
  addMeasuredItem,
  updateMeasuredItem,
  deleteMeasuredItem,
  updateMeasuredTime,
} from "@/src/lib/firestore";
import {
  // formatDate,
  orgFloor,
  minutesToHoursDisplay,
  updateListOfObjects,
} from "@/src/lib/utils";
import { useRecoilValue, useRecoilState } from "recoil";
import {
  measuredItems,
  totalTimes as totalTimesAtom,
  measure as measureAtom,
  Todo,
  Item,
  SubItem,
  MeasuredItems as Items,
} from "@/src/recoilAtoms";

import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

import LocalizationProvider from "@mui/lab/LocalizationProvider";
import DateAdapterMoment from "@mui/lab/AdapterMoment";
import DatePicker from "@mui/lab/DatePicker";
import Slider from "@mui/material/Slider";

function createNewTime(measuringItem: any) {
  let newTime: any = {};
  newTime = {
    itemId: measuringItem["_id"],
    _id: `time_${uuidv4()}`,
    start: measuringItem.start,
    end: new Date().getTime(),
  };
  if (measuringItem.subItemId) {
    newTime.subItemId = measuringItem.subItemId;
  }
  if (measuringItem.todoId) {
    newTime.todoId = measuringItem.todoId;
  }
  if (measuringItem.memo) {
    newTime.memo = measuringItem.memo;
  }
  return newTime;
}

const MeasuredItems = () => {
  const items = useRecoilValue<Items>(measuredItems);
  const [measure, setMeasure] = useRecoilState(measureAtom);

  const user: any = useUser();
  const [newItem, setNewItem] = React.useState("");
  const [newDialog, setNewDialog] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [editDialog, setEditDialog] = React.useState(false);
  const [targetItem, setTargetItem] = React.useState<any>({});
  const totalTimes = useRecoilValue(totalTimesAtom);
  const [editMode, setEditMode] = React.useState(false);
  const [noteEditDialog, setNoteEditDialog] = React.useState(false);
  const [addTodoDialog, setAddTodoDialog] = React.useState(false);
  type todo = {
    itemId?: string;
    itemName?: string;
    subItemId?: string | null;
    subItemName?: string | null;
    _id: string;
    description: string | null;
    estimatedTime: number | null;
    unit: "MINUTES" | "HOURS" | "PERSON_DAY";
    status: "NOT_STARTED" | "IN_PROGRESS" | "FINISHED";
    dueDate: Date | null;
    finishedDate: Date | null;
  };
  type ClientTodo = Todo & {
    itemId?: string;
    itemName?: string;
    subItemId?: string | null;
    subItemName?: string | null;
  };
  const newTodoDefaultValues: ClientTodo = {
    itemId: "",
    subItemId: "",
    _id: "",
    description: null,
    estimatedTime: 0,
    unit: "MINUTES",
    status: "NOT_STARTED",
    dueDate: null,
    finishedDate: null,
  };
  const [newTodo, setNewTodo] =
    React.useState<ClientTodo>(newTodoDefaultValues);
  const [editTodoDialog, setEditTodoDialog] = React.useState(false);

  const colorList = [
    "#3f51b5",
    "#2196f3",
    "#e91e63",
    "#009688",
    "#ffeb3b",
    "#673ab7",
    "#757575",
  ];

  const todoUnits: {
    [key: string]: string;
  } = {
    MINUTES: "分",
    HOURS: "時間",
    PERSON_DAY: "人日",
  };

  /**
   * 新規Todo追加
   */
  const openAddTodoDialog = (itemId: string, subItemId?: string) => {
    setAddTodoDialog(true);
    const item: any = items.find((item: Item) => item["_id"] === itemId);
    console.log(item);
    const subItem: any = subItemId
      ? item.subItems.find((item: SubItem) => item["_id"] === subItemId)
      : null;
    setNewTodo({
      ...newTodo,
      itemId: itemId,
      itemName: item.name,
      subItemId: subItemId,
      subItemName: subItem?.name || null,
    });
  };
  const closeAddTodoDialog = () => {
    setAddTodoDialog(false);
    setNewTodo(newTodoDefaultValues);
  };
  const changeTodoTimeUnit = (e: any): void => {
    const newUnit = e.target.value;
    if (!newUnit) return;
    setNewTodo({
      ...newTodo,
      unit: newUnit,
      estimatedTime: 0,
    });
  };
  const todoTimeConfig = (
    unit: "MINUTES" | "HOURS" | "PERSON_DAY",
    config: "min" | "max" | "step"
  ) => {
    if (unit === "MINUTES") {
      if (config === "min") return 0;
      if (config === "max") return 60;
      if (config === "step") return 5;
    }
    if (unit === "HOURS") {
      if (config === "min") return 0;
      if (config === "max") return 10;
      if (config === "step") return 0.5;
    }
    if (unit === "PERSON_DAY") {
      if (config === "min") return 0;
      if (config === "max") return 30;
      if (config === "step") return 0.5;
    }
  };
  const timeSliderValue = (value: number | null) => {
    if (value === null) return 0;
    return value;
  };
  const handleChangeNewTodo = (event: any) => {
    const newDescription = event.target?.value;
    setNewTodo({
      ...newTodo,
      description: newDescription,
    });
  };
  const handleChangeNewTodoTimeSlider = (
    event: Event,
    value: number | Array<number>
  ) => {
    if (!event) return;
    if (Array.isArray(value)) return;
    setNewTodo({
      ...newTodo,
      estimatedTime: value,
    });
  };
  const handleClickAddNewTodoButton = () => {
    console.log("newTodo", newTodo);
    console.log(items);
    const item: any = items.find((item: any) => item["_id"] === newTodo.itemId);

    let newItems;
    const newTodoObj = {
      _id: `todo_${uuidv4()}`,
      description: newTodo.description,
      estimatedTime: newTodo.estimatedTime,
      unit: newTodo.unit,
      status: newTodo.status,
      dueDate: newTodo.dueDate ? new Date(newTodo.dueDate).getTime() : null,
    };
    const newItem: any = { ...item };
    if (!newTodo.subItemId) {
      // アイテムへのTODOの追加
      console.log("A");
      console.log("newTodoObj", newTodoObj);
      const newTodos = newItem.todos
        ? [...newItem.todos, newTodoObj]
        : [newTodoObj];
      newItem.todos = newTodos;
      newItems = updateListOfObjects({
        listOfObjects: [...items],
        newObject: newItem,
        filter: { key: "_id", value: newItem._id },
        processType: "REPLACE",
      });
    }
    if (newTodo.subItemId) {
      // サブアイテムへのTODOの追加
      console.log("B");
      console.log("sub---");
      // const subItem: any = item.subItems.find(
      //   (item: any) => item["_id"] === newTodo.subItemId
      // );
      // const newSubItem: any = { ...subItem };
      // const newTodos = subItem.todos
      //   ? [...subItem.todos, newTodoObj]
      //   : [newTodoObj];
      // newSubItem.todos = newTodos;

      const newSubItems = item.subItems.map((x: any) => {
        return x._id === newTodo.subItemId
          ? { ...x, todos: x.todos ? [...x.todos, newTodoObj] : [newTodoObj] }
          : x;
      });
      newItems = items.map((x: any) => {
        return x._id === newTodo.itemId ? { ...x, subItems: newSubItems } : x;
      });
      // newItem.subItems = newSubItems;
      console.log(newItems);
    }
    // return;
    updateMeasuredItem(user.uid, newItems);
    setNewTodo(newTodoDefaultValues);

    closeAddTodoDialog();
  };
  // const formatDueDate = (dueDate: Date | null) => {
  // };

  /**
   * Edit Todo
   */
  const opeEditTodoDialog = ({
    itemId,
    subItemId,
    todo,
  }: {
    itemId: string;
    subItemId?: string;
    todo: todo;
  }) => {
    setEditTodoDialog(true);
    setNewTodo({
      ...todo,
      itemId: itemId,
      subItemId: subItemId ? subItemId : null,
    });
  };
  const closeEditTodoDialog = () => {
    setEditTodoDialog(false);
    setNewTodo(newTodoDefaultValues);
  };
  const handleClickUpdateTodoButton = () => {
    const item: any = items.find((item: any) => item["_id"] === newTodo.itemId);
    const newItem = { ...item };
    const subItem: any = newTodo.subItemId
      ? item.subItems.find(
          (subItem: any) => subItem["_id"] === newTodo.subItemId
        )
      : null;
    const newSubItem = subItem ? { ...subItem } : subItem;
    const newTodoObj = {
      _id: newTodo._id,
      description: newTodo.description,
      estimatedTime: newTodo.estimatedTime,
      unit: newTodo.unit,
      status: newTodo.status,
      dueDate:
        newTodo.dueDate !== null ? new Date(newTodo.dueDate).getTime() : null,
      finishedDate: null,
    }; // new object

    let newTodos = [],
      newItems = [],
      newSubItems = [];

    if (!newTodo.subItemId) {
      newTodos = updateListOfObjects({
        listOfObjects: [...item.todos],
        newObject: newTodoObj,
        filter: { key: "_id", value: newTodo._id },
        processType: "REPLACE",
      });

      newItem.todos = newTodos;
    }
    if (newTodo.subItemId) {
      newTodos = updateListOfObjects({
        listOfObjects: [...subItem.todos],
        newObject: newTodoObj,
        filter: { key: "_id", value: newTodo._id },
        processType: "REPLACE",
      });
      newSubItem.todos = newTodos;
      newSubItems = updateListOfObjects({
        listOfObjects: [...item.subItems],
        newObject: newSubItem,
        filter: { key: "_id", value: newTodo.subItemId },
        processType: "REPLACE",
      });
      newItem.subItems = newSubItems;
    }

    newItems = updateListOfObjects({
      listOfObjects: [...items],
      newObject: newItem,
      filter: { key: "_id", value: newTodo.itemId as string },
      processType: "REPLACE",
    });

    updateMeasuredItem(user.uid, newItems);
    setNewTodo(newTodoDefaultValues);

    // if (newTodo.subItemId) {
    //   const subItem: any = item.subItems.find(
    //     (item: any) => item["_id"] === newTodo.subItemId
    //   );
    // }
    closeEditTodoDialog();
  };

  /**
   * 操作 Todo
   */
  const updateTodoStatus = ({
    itemId,
    subItemId,
    todoId,
    statusToBe,
  }: {
    itemId: string;
    subItemId?: string;
    todoId: string;
    statusToBe: "IN_PROGRESS" | "FINISHED";
  }) => {
    console.log(itemId, subItemId, todoId);
    const item: any = items.find((item: any) => item["_id"] === itemId);
    const newItem = { ...item };

    let newItems;
    if (!subItemId) {
      console.log("AA");
      const todos = [...item.todos];
      const targetTodo: todo = todos.find(
        (todo: todo) => todo["_id"] === todoId
      );

      const newTodo = {
        ...targetTodo,
        status: statusToBe,
        finishedDate:
          statusToBe === "IN_PROGRESS" ? null : new Date().getTime(),
      };

      const newTodos = updateListOfObjects({
        listOfObjects: todos,
        newObject: newTodo,
        filter: { key: "_id", value: newTodo._id },
        processType: "REPLACE",
      });

      newItem.todos = newTodos;
    }
    if (subItemId) {
      console.log("BB");
      const subItem: any = item.subItems.find(
        (subItem: any) => subItem["_id"] === subItemId
      );

      const todos = [...subItem.todos];
      const targetTodo: todo = todos.find(
        (todo: todo) => todo["_id"] === todoId
      );
      const newTodo = {
        ...targetTodo,
        status: statusToBe,
        finishedDate:
          statusToBe === "IN_PROGRESS" ? null : new Date().getTime(),
      };
      const newTodos = updateListOfObjects({
        listOfObjects: todos,
        newObject: newTodo,
        filter: { key: "_id", value: newTodo._id },
        processType: "REPLACE",
      });
      newItem.subItems = item.subItems.map((x: any) => {
        return x._id === subItem._id ? { ...x, todos: newTodos } : x;
      });
      console.log("newItem", newItem);
    }
    newItems = updateListOfObjects({
      listOfObjects: [...items],
      newObject: newItem,
      filter: { key: "_id", value: item._id },
      processType: "REPLACE",
    });
    console.log("newItems", newItems);

    updateMeasuredItem(user.uid, newItems);
    setNewTodo(newTodoDefaultValues);

    if (measure.measuringItem.todoId === todoId) {
      const newMeasuringItem = stoppedMeasuringItem();

      const newTime = createNewTime(measure.measuringItem);

      const newMeasure = {
        measuringItem: newMeasuringItem,
        times: [...measure.times, newTime],
      };
      setMeasure(newMeasure);
      const tmpMonth = "202112";
      console.log("newMeasure", newMeasure);
      updateMeasuredTime(user.uid, tmpMonth, newMeasure);
    }
  };

  /**
   * 新規アイテム追加
   */
  const openNewDialog = () => {
    setNewDialog(true);
  };
  const closeNewDialog = () => {
    setNewDialog(false);
  };
  const handleOnChange = (e: any): void => {
    setNewItem(e.target.value);
  };
  const handleSendItem = () => {
    closeNewDialog();
    addMeasuredItem(user.uid, {
      _id: uuidv4(),
      name: newItem,
      category: "work1",
      color: "#3f51b5",
    });
    setNewItem("");
  };

  /**
   * Delete
   */
  const openDeleteDialog = () => {
    setDeleteDialog(true);
  };
  const closeDeleteDialog = () => {
    setDeleteDialog(false);
  };
  const handleDeleteItem = () => {
    deleteMeasuredItem(user.uid, targetItem);
    closeDeleteDialog();
    closeEditDialog();
  };

  /**
   * Edit
   */
  const editModeToggle = () => {
    setEditMode(!editMode);
  };
  const handleClickEditIcon = (item: any): void => {
    setTargetItem(item);
    openEditDialog();
  };
  const openEditDialog = () => {
    setEditDialog(true);
  };
  const closeEditDialog = () => {
    setEditDialog(false);
    setTargetItem({});
  };
  const handleDeleteSubItem = (subItemId: string) => {
    let newSubItems = [...targetItem.subItems];
    let obj = newSubItems.find((x: any) => x["_id"] === subItemId);
    let index = newSubItems.indexOf(obj);
    newSubItems.splice(index, 1); // 削除
    setTargetItem({ ...targetItem, subItems: newSubItems });
  };
  const handleOnChangeTargetItem = (e: any): void => {
    if (e.target.name === "itemName") {
      setTargetItem({ ...targetItem, name: e.target.value });
      return;
    }
    if (e.target.name.substring(0, 8) === "subItems") {
      const newSubItems = targetItem.subItems.map((subItem: any) => {
        if (subItem._id === e.target.id) {
          return { ...subItem, name: e.target.value };
        } else {
          return subItem;
        }
      });

      setTargetItem({ ...targetItem, subItems: newSubItems });
      return;
    }
    if (e.target.name === "newSubItem") {
      setTargetItem({ ...targetItem, newSubItem: e.target.value });
      return;
    }
    if (e.target.name === "color") {
      setTargetItem({ ...targetItem, color: e.target.value });
      return;
    }
  };
  const handleUpdateItem = () => {
    const newItems = [...items];
    let obj: any = newItems.find((x: Item) => x["_id"] === targetItem["_id"]);
    let index = newItems.indexOf(obj);

    let newItem = { ...targetItem };
    if (targetItem.newSubItem) {
      newItem.subItems = targetItem.subItems
        ? [
            ...targetItem.subItems,
            {
              _id: `subitem_${uuidv4()}`,
              name: targetItem.newSubItem,
            },
          ]
        : [
            {
              _id: `subitem_${uuidv4()}`,
              name: targetItem.newSubItem,
            },
          ];
      newItem.newSubItem = null;
    }

    newItems.splice(index, 1, newItem);

    updateMeasuredItem(user.uid, newItems);
    setTargetItem({});
    closeEditDialog();
    closeNoteDialog();
  };

  /**
   * 計測アイテムがクリックされたときの処理
   * @param _id
   */
  // ストップ
  function stoppedMeasuringItem() {
    return {
      isActive: false,
      _id: null,
      start: null,
      name: null,
      subItemId: null,
      todoId: null,
    };
  }
  const handleClickItem = ({
    itemId,
    subItemId,
    todoId,
  }: {
    itemId: string;
    subItemId?: string | null;
    todoId?: string | null;
  }): void => {
    if (todoId) console.log(todoId);
    console.log("subItemId", subItemId);
    if (subItemId === undefined) subItemId = null;
    if (todoId === undefined) todoId = null;
    const clickedItem: any = items.find((item: any) => item["_id"] === itemId);
    const clickedSubItem: any = subItemId
      ? clickedItem.subItems.find((item: any) => item["_id"] === subItemId)
      : null;
    const clickedTodo: any = todoId
      ? subItemId
        ? clickedSubItem.todos.find((todo: any) => todo["_id"] === todoId)
        : clickedItem.todos.find((todo: any) => todo["_id"] === todoId)
      : null;
    const measuringItem: any = {};

    // スタート
    function startMeasuringItem(): void {
      measuringItem.isActive = true;

      measuringItem["_id"] = itemId;
      measuringItem.start = new Date().getTime();
      measuringItem.name = clickedItem.name;

      if (subItemId) {
        measuringItem.subItemId = subItemId;
        measuringItem.subItemName = clickedSubItem.name;
      } else {
        measuringItem.subItemId = null;
      }
      if (todoId) {
        measuringItem.todoId = todoId;
        measuringItem.todoDescription = clickedTodo.description;
      } else {
        measuringItem.todoId = null;
      }
      console.log(measuringItem);
    }

    let newMeasure: any = {};

    if (!measure.measuringItem.isActive) {
      // アイテムクリック時（何も計測されていない状態）
      startMeasuringItem();

      newMeasure = { ...measure, measuringItem: measuringItem };
      setMeasure(newMeasure);

      const tmpMonth = "202112";
      const updateKey = "measuringItem";
      console.log("newMeasure", newMeasure);
      updateMeasuredTime(user.uid, tmpMonth, newMeasure, updateKey);
    } else {
      // アイテムクリック時（計測されている状態）
      if (
        measure.measuringItem?.["_id"] === itemId &&
        measure.measuringItem?.["subItemId"] === subItemId &&
        measure.measuringItem?.["todoId"] === todoId
      ) {
        // 同じアイテムをクリックして停止するとき
        console.log("A");
        const newMeasuringItem = stoppedMeasuringItem();

        const newTime = createNewTime(measure.measuringItem);

        newMeasure = {
          measuringItem: newMeasuringItem,
          times: [...measure.times, newTime],
        };
        setMeasure(newMeasure);
      } else if (
        measure.measuringItem?.["_id"] !== itemId ||
        measure.measuringItem?.["subItemId"] !== subItemId ||
        measure.measuringItem?.["todoId"] !== todoId
      ) {
        // 　別のアイテムをクリックして違うアイテムの計測を開始するとき
        console.log("B");
        startMeasuringItem();

        const newTime = createNewTime(measure.measuringItem);

        newMeasure = {
          measuringItem: measuringItem,
          times: [...measure.times, newTime],
        };
        setMeasure(newMeasure);
      } else {
        console.log("C");
        console.log("measure.measuringItem", measure.measuringItem);
      }

      const tmpMonth = "202112";
      console.log("newMeasure", newMeasure);
      updateMeasuredTime(user.uid, tmpMonth, newMeasure);
    }

    /**
     * Todoのステータス更新
     */
    if (todoId) {
      const item: any = items.find((item: any) => item["_id"] === itemId);
      const newItem = { ...item };

      if (!subItemId) {
        const todos = [...item.todos];
        const targetTodo: todo = todos.find(
          (todo: todo) => todo["_id"] === todoId
        );
        const newTodo: todo = {
          ...targetTodo,
          status: "IN_PROGRESS",
        };
        const newTodos = updateListOfObjects({
          listOfObjects: todos,
          newObject: newTodo,
          filter: { key: "_id", value: newTodo._id },
          processType: "REPLACE",
        });
        newItem.todos = newTodos;
      }
      if (subItemId) {
        const subItem: any = item.subItems.find(
          (subItem: any) => subItem["_id"] === subItemId
        );
        const newSubItem = { ...subItem };
        const todos = [...subItem.todos];
        const targetTodo: todo = todos.find(
          (todo: todo) => todo["_id"] === todoId
        );
        const newTodo: todo = {
          ...targetTodo,
          status: "IN_PROGRESS",
        };
        const newTodos = updateListOfObjects({
          listOfObjects: todos,
          newObject: newTodo,
          filter: { key: "_id", value: newTodo._id },
          processType: "REPLACE",
        });
        newSubItem.todos = newTodos;
        // newItem.subItems = newSubItem;
        newItem.subItems = item.subItems.map((x: any) => {
          return x._id === subItem._id ? { ...x, subItems: newSubItem } : x;
        });
        console.log("newSubItem", newSubItem);
      }

      console.log("newItem", newItem);
      const newItems = updateListOfObjects({
        listOfObjects: [...items],
        newObject: newItem,
        filter: { key: "_id", value: item._id },
        processType: "REPLACE",
      });
      console.log("newItems", newItems);
      updateMeasuredItem(user.uid, newItems);
    }
  };

  /**
   * サブアイテム表示機能
   */
  const onClickExpandSubItems = (_id: string): void => {
    const newItems = [...items];
    let obj: any = newItems.find((x: Item) => x["_id"] === _id);
    let index = newItems.indexOf(obj);

    let newItem = { ...obj, expandSubItems: !obj.expandSubItems };

    newItems.splice(index, 1, newItem);

    updateMeasuredItem(user.uid, newItems);
  };

  /**
   * ノート機能
   */
  const openNoteDialog = () => {
    setNoteEditDialog(true);
  };
  const closeNoteDialog = () => {
    setNoteEditDialog(false);
  };
  const handleClickEmptyNote = (item: any): void => {
    openNoteDialog();
    setTargetItem(item);
  };
  const handleOnChangeNote = (e: any) => {
    setTargetItem({ ...targetItem, note: e.target.value });
  };
  return (
    <>
      {/* Todo追加フォーム */}
      <Dialog open={addTodoDialog} onClose={closeAddTodoDialog} fullWidth>
        <DialogTitle>Todoの追加</DialogTitle>
        <DialogContent>
          <DialogContentText>
            「{`${newTodo.itemName}`}
            {newTodo.subItemName && ` > ${newTodo.subItemName}`}」
            へTodoを追加しよう！！
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            name="newTodoDescription"
            label="タイトル"
            type="text"
            fullWidth
            variant="standard"
            value={newTodo.description}
            onChange={handleChangeNewTodo}
            required
          />
          <Box sx={{ py: 1 }}>
            <LocalizationProvider
              name="startTime"
              dateAdapter={DateAdapterMoment as any}
            >
              <DatePicker
                // minDate={new Date().getTime()} // TODO 設定する 2021/12/19
                label="期日"
                value={newTodo.dueDate}
                onChange={(value) => {
                  setNewTodo({
                    ...newTodo,
                    dueDate: value,
                  });
                }}
                renderInput={(params) => <TextField {...params} />}
              />
            </LocalizationProvider>
          </Box>
          このタスクにおける見積時間
          <Box sx={{ py: 1 }} display="flex" alignItems="center">
            <FormControl variant="standard" sx={{ p: 1, width: 50 }}>
              <TextField
                type="text"
                variant="standard"
                value={newTodo.estimatedTime}
                disabled
              />
            </FormControl>
            <FormControl variant="standard" sx={{ p: 1 }}>
              <Select
                name="unit"
                value={newTodo?.unit}
                onChange={changeTodoTimeUnit}
              >
                {(() => {
                  const menuItems: any = [];
                  Object.keys(todoUnits).forEach((key) => {
                    menuItems.push(
                      <MenuItem key={key} value={key}>
                        {todoUnits[key]}
                      </MenuItem>
                    );
                  });
                  return menuItems;
                })()}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ py: 1 }}>
            時間
            <Slider
              aria-label="todoTime"
              onChange={handleChangeNewTodoTimeSlider}
              value={timeSliderValue(newTodo.estimatedTime)}
              step={todoTimeConfig(newTodo.unit, "step")}
              min={todoTimeConfig(newTodo.unit, "min")}
              max={todoTimeConfig(newTodo.unit, "max")}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddTodoDialog}>戻る</Button>
          <Button onClick={handleClickAddNewTodoButton}>追加</Button>
        </DialogActions>
      </Dialog>

      {/* Todo編集フォーム */}
      <Dialog open={editTodoDialog} onClose={closeEditTodoDialog} fullWidth>
        <DialogTitle>Todoの編集</DialogTitle>
        <DialogContent>
          <DialogContentText>Todoアイテムを編集しよう！！</DialogContentText>
          <TextField
            margin="dense"
            name="editTodoDescription"
            label="タイトル"
            type="text"
            fullWidth
            variant="standard"
            value={newTodo?.description}
            onChange={handleChangeNewTodo}
            required
          />
          <Box sx={{ py: 1 }}>
            <LocalizationProvider
              name="startTime"
              dateAdapter={DateAdapterMoment as any}
            >
              <DatePicker
                // minDate={new Date().getTime()} // TODO 設定する 2021/12/19
                label="期日"
                value={newTodo?.dueDate}
                onChange={(value) => {
                  if (value)
                    setNewTodo({
                      ...newTodo,
                      dueDate: value,
                    });
                }}
                renderInput={(params) => <TextField {...params} />}
              />
            </LocalizationProvider>
          </Box>
          このタスクにおける見積時間
          <Box sx={{ py: 1 }} display="flex" alignItems="center">
            <FormControl variant="standard" sx={{ p: 1, width: 50 }}>
              <TextField
                type="text"
                variant="standard"
                value={newTodo?.estimatedTime}
                disabled
              />
            </FormControl>
            <FormControl variant="standard" sx={{ p: 1 }}>
              <Select
                name="unit"
                value={newTodo?.unit}
                onChange={changeTodoTimeUnit}
              >
                {(() => {
                  const menuItems: any = [];
                  Object.keys(todoUnits).forEach((key) => {
                    menuItems.push(
                      <MenuItem key={key} value={key}>
                        {todoUnits[key]}
                      </MenuItem>
                    );
                  });
                  return menuItems;
                })()}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ py: 1 }}>
            時間
            <Slider
              aria-label="todoTime"
              onChange={handleChangeNewTodoTimeSlider}
              value={timeSliderValue(newTodo.estimatedTime)}
              step={todoTimeConfig(newTodo.unit, "step")}
              min={todoTimeConfig(newTodo.unit, "min")}
              max={todoTimeConfig(newTodo.unit, "max")}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditTodoDialog}>戻る</Button>
          <Button onClick={handleClickUpdateTodoButton}>更新</Button>
        </DialogActions>
      </Dialog>

      {/* 項目追加フォーム */}
      <Dialog open={newDialog} onClose={closeNewDialog} fullWidth>
        <DialogTitle>項目の追加</DialogTitle>
        <DialogContent>
          <DialogContentText>
            計測したいアイテムを追加しよう！
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="item"
            label="項目名"
            type="text"
            fullWidth
            variant="standard"
            value={newItem}
            onChange={handleOnChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeNewDialog}>戻る</Button>
          <Button onClick={handleSendItem}>追加</Button>
        </DialogActions>
      </Dialog>

      {/* 項目 編集フォーム */}
      <Dialog open={editDialog} onClose={closeEditDialog} fullWidth>
        <DialogTitle>項目の編集</DialogTitle>
        <DialogContent>
          <DialogContentText>アイテムを編集しよう！</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            name="itemName"
            label="項目名"
            type="text"
            fullWidth
            variant="standard"
            value={targetItem?.name}
            onChange={handleOnChangeTargetItem}
          />
          <FormControl variant="standard" sx={{ my: 1 }} fullWidth>
            <InputLabel>色</InputLabel>
            <Select
              name="color"
              value={targetItem?.color}
              label="アイテム"
              onChange={handleOnChangeTargetItem}
              sx={{ color: targetItem?.color }}
            >
              {(() => {
                const menuItems = [];
                for (const color of colorList) {
                  menuItems.push(
                    <MenuItem key={color} value={color}>
                      {color}
                      <div style={{ flexGrow: 1 }} />
                      <div
                        style={{
                          backgroundColor: color,
                          width: 20,
                          height: 20,
                          display: "inline",
                        }}
                      />
                    </MenuItem>
                  );
                }
                return menuItems;
              })()}
            </Select>
          </FormControl>
          {targetItem?.subItems?.map((ele: any, index: number) => {
            return (
              <Box sx={{ display: "flex", width: "100%" }}>
                <FormControl variant="standard" sx={{ pl: 2 }} fullWidth>
                  <TextField
                    autoFocus
                    margin="dense"
                    id={ele._id}
                    name={`subItems.${index}`}
                    label="サブアイテム"
                    type="text"
                    fullWidth
                    variant="standard"
                    value={ele.name}
                    onChange={handleOnChangeTargetItem}
                  />
                </FormControl>
                <Button
                  onClick={() => {
                    handleDeleteSubItem(ele["_id"]);
                  }}
                  sx={{ color: "red" }}
                >
                  削除
                </Button>
              </Box>
            );
          })}
          <FormControl variant="standard" sx={{ pl: 2 }} fullWidth>
            <TextField
              autoFocus
              margin="dense"
              name="newSubItem"
              label="新規 サブアイテム"
              type="text"
              fullWidth
              variant="standard"
              value={targetItem?.newSubItem}
              onChange={handleOnChangeTargetItem}
            />
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={openDeleteDialog} sx={{ color: "red" }}>
            削除
          </Button>
          <div style={{ flexGrow: 1 }} />
          <Button onClick={closeEditDialog}>戻る</Button>
          <Button onClick={handleUpdateItem}>更新</Button>
        </DialogActions>
      </Dialog>

      {/* 項目削除確認ダイアログ */}
      <Dialog open={deleteDialog} onClose={closeNewDialog} fullWidth>
        <DialogTitle>注意</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`「${targetItem.name}」を削除します。よろしいですか？`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>いいえ</Button>
          <Button onClick={handleDeleteItem}>はい</Button>
        </DialogActions>
      </Dialog>

      {/* ノート機能 */}
      <Dialog open={noteEditDialog} onClose={closeNoteDialog} fullWidth>
        <DialogTitle>{targetItem?.name}のノート</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ノートやTodoとしてメモしておきたいことを追加しよう！
          </DialogContentText>
          <TextField
            margin="dense"
            id="note"
            label="ノート"
            type="text"
            fullWidth
            multiline
            rows={10}
            variant="filled"
            value={targetItem?.note}
            onChange={handleOnChangeNote}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeNoteDialog}>戻る</Button>
          <Button onClick={handleUpdateItem}>更新</Button>
        </DialogActions>
      </Dialog>

      {editMode ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "end",
            alignItems: "center",
            mb: 1,
            position: "sticky",
            top: 0,
            backgroundColor: "white",
            zIndex: 1200,
            // boxShadow:1
          }}
        >
          <Button onClick={editModeToggle}>閉じる</Button>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "end",
              alignItems: "center",
              mb: 1,
              position: "sticky",
              top: 0,
              backgroundColor: "white",
              zIndex: 1200,
              // boxShadow:1
            }}
          >
            <Button onClick={openNewDialog}>追加</Button>
            <Button onClick={editModeToggle}>編集</Button>
          </Box>
        </>
      )}

      {/* アイテム一覧表示 */}
      {items?.map((item: any, index: number) => {
        const _id = item["_id"];
        const baseTime = 60 * 5; // 1日5時間同じ事やってればすごいということで。（なんとなく）
        const totalTime = totalTimes[_id]?.sum
          ? orgFloor(totalTimes[_id]?.sum / 60, 2)
          : 0; // そのアイテムに関する合計時間
        const totalTimeItem = totalTimes[_id]?.[_id]
          ? orgFloor(totalTimes[_id]?.[_id] / 60, 2)
          : 0; // そのアイテムだけの合計時間
        const rate = (totalTimeItem / baseTime) * 100;
        const isActive =
          measure.measuringItem?.["_id"] === _id &&
          !measure.measuringItem?.subItemId
            ? true
            : false;

        if (!item.isDelete)
          return (
            <Grid
              container
              key={index}
              sx={{
                mb: 1,
                display: "flex",
                justifyContent: "right",
              }}
            >
              {/* アイテム表示 */}
              <Grid item xs={12} sx={{ display: "flex" }}>
                <IconButton onClick={() => handleClickEmptyNote(item)}>
                  {item.note ? (
                    <DescriptionIcon />
                  ) : (
                    <InsertDriveFileOutlinedIcon />
                  )}
                </IconButton>
                <IconButton
                  onClick={() => {
                    openAddTodoDialog(item._id);
                  }}
                >
                  <AddTaskOutlinedIcon />
                </IconButton>
                <Button
                  variant={isActive ? "outlined" : "contained"}
                  onClick={
                    editMode
                      ? () => handleClickEditIcon(item)
                      : () => handleClickItem({ itemId: _id })
                  }
                  sx={{
                    flexGrow: 1,
                    mr: 1,
                    background: editMode
                      ? item.color
                      : isActive
                      ? null
                      : `linear-gradient(75deg, ${item.color}f3 ${rate}%, ${
                          item.color
                        }b0 ${rate === 0 ? 0 : rate + 3}% 100%)`,
                  }}
                  fullWidth
                >
                  {item.name}
                  <span style={{ flexGrow: 1 }}></span>
                  {totalTimeItem === totalTime
                    ? minutesToHoursDisplay(totalTime)
                    : `${minutesToHoursDisplay(
                        totalTimeItem
                      )}/${minutesToHoursDisplay(totalTime)}`}

                  {/* <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton> */}
                </Button>
                {!editMode && (
                  <IconButton
                    onClick={() => {
                      onClickExpandSubItems(_id);
                    }}
                    sx={{
                      // TODO たぶん、item.todosを変更する必要がある
                      visibility: item.subItems || item.todos ? null : "hidden",
                    }}
                  >
                    {item.expandSubItems ? (
                      <CloseOutlinedIcon fontSize="small" />
                    ) : (
                      <ExpandMoreOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                )}
              </Grid>

              {/* Todo表示 */}
              {!editMode &&
                item.expandSubItems &&
                item.todos?.map((todo: any, index: number) => {
                  // console.log(new Date(todo.finishedDate));
                  if (
                    (todo.finishedDate >= new Date().setHours(0, 0, 0) &&
                      todo.ststus !== "FINISHED") ||
                    // 完了時刻が今日の完了済みTODO or
                    todo.ststus !== "FINISHED"
                    // 完了してないTODO
                  ) {
                    return (
                      <Grid
                        container
                        key={index}
                        sx={{
                          my: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "right",
                        }}
                      >
                        <Grid
                          item
                          xs={10}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 1,
                          }}
                        >
                          {todo.status === "FINISHED" ? (
                            <IconButton
                              onClick={() => {
                                updateTodoStatus({
                                  itemId: item._id,
                                  todoId: todo._id,
                                  statusToBe: "IN_PROGRESS",
                                });
                              }}
                            >
                              <CheckIcon />
                            </IconButton>
                          ) : (
                            <IconButton
                              onClick={() => {
                                updateTodoStatus({
                                  itemId: item._id,
                                  todoId: todo._id,
                                  statusToBe: "FINISHED",
                                });
                              }}
                            >
                              <CircleOutlinedIcon />
                            </IconButton>
                          )}
                          <Button
                            variant="text"
                            sx={{
                              flexGrow: 1,
                              textDecoration:
                                todo.status === "FINISHED"
                                  ? "line-through"
                                  : "",
                            }}
                            onClick={() => {
                              opeEditTodoDialog({ itemId: item._id, todo });
                            }}
                          >
                            <Typography
                              textAlign="left"
                              sx={{
                                flexGrow: 1,
                                color:
                                  measure.measuringItem.todoId === todo._id
                                    ? "red"
                                    : "",
                              }}
                            >
                              {todo.description}
                            </Typography>
                            <Typography textAlign="right">
                              {totalTimes[todo._id] &&
                                `${minutesToHoursDisplay(totalTimes[todo._id] / 60)}/`}
                            </Typography>
                            {todo.estimatedTime !== 0 && (
                              <Typography textAlign="right">
                                {todo.estimatedTime}
                                {todoUnits[todo.unit]}
                              </Typography>
                            )}
                            {todo.dueDate && (
                              <Typography textAlign="right" sx={{ pl: 1 }}>
                                {formatDate(todo.dueDate, "M/D")}
                              </Typography>
                            )}
                          </Button>
                          {todo.status !== "FINISHED" ? (
                            measure.measuringItem.todoId === todo._id ? (
                              <IconButton
                                onClick={() =>
                                  handleClickItem({
                                    itemId: item._id,
                                    todoId: todo._id,
                                  })
                                }
                              >
                                <StopCircleOutlinedIcon />
                              </IconButton>
                            ) : (
                              <IconButton
                                onClick={() =>
                                  handleClickItem({
                                    itemId: item._id,
                                    todoId: todo._id,
                                  })
                                }
                              >
                                <PlayCircleOutlinedIcon />
                              </IconButton>
                            )
                          ) : null}

                          {/* 同じ幅を保つために同じエレメントを非表示で作成。 */}
                          <IconButton sx={{ visibility: "hidden" }}>
                            <ExpandMoreOutlinedIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    );
                  }
                })}

              {/* サブアイテム表示 */}
              {!editMode &&
                item.expandSubItems &&
                item.subItems?.map((subItem: any, index: number) => {
                  const subItemId = subItem["_id"];
                  const baseTime = 60 * 5; // 1日5時間同じ事やってればすごいということで。（なんとなく）

                  const totalTimeSubItem = totalTimes[_id]?.[subItemId]
                    ? orgFloor(totalTimes[_id]?.[subItemId] / 60, 2)
                    : 0;
                  const rate = (totalTimeSubItem / baseTime) * 100;
                  return (
                    <Grid
                      container
                      key={index}
                      sx={{
                        my: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "right",
                      }}
                    >
                      {/* サブアイテム */}
                      <Grid item xs={10} sx={{ display: "flex" }}>
                        <IconButton
                          onClick={() => {
                            openAddTodoDialog(item._id, subItemId);
                          }}
                        >
                          <CheckCircleOutlineIcon />
                        </IconButton>
                        <Button
                          variant={
                            measure.measuringItem?.["subItemId"] === subItemId
                              ? "outlined"
                              : "contained"
                          }
                          onClick={() =>
                            handleClickItem({ itemId: _id, subItemId })
                          }
                          sx={{
                            flexGrow: 1,
                            mr: 1,
                            background: editMode
                              ? item.color
                              : measure.measuringItem?.["subItemId"] ===
                                subItemId
                              ? null
                              : `linear-gradient(75deg, ${
                                  item.color
                                }f3 ${rate}%, ${item.color}b0 ${
                                  rate === 0 ? 0 : rate + 3
                                }% 100%)`,
                          }}
                          fullWidth
                        >
                          {subItem.name}
                          <span style={{ flexGrow: 1 }}></span>
                          {minutesToHoursDisplay(totalTimeSubItem)}
                        </Button>
                        {/* 同じ幅を保つために同じエレメントを非表示で作成。 */}
                        <IconButton sx={{ visibility: "hidden" }}>
                          <ExpandMoreOutlinedIcon />
                        </IconButton>
                      </Grid>

                      {/* Todo表示 */}
                      {subItem.todos?.map((todo: any, index: number) => {
                        if (
                          (todo.finishedDate >= new Date().setHours(0, 0, 0) &&
                            todo.ststus !== "FINISHED") ||
                          // 完了時刻が今日の完了済みTODO or
                          todo.ststus !== "FINISHED"
                          // 完了してないTODO
                        ) {
                          return (
                            <Grid
                              container
                              key={index}
                              sx={{
                                my: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "right",
                              }}
                            >
                              <Grid
                                item
                                xs={10}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 1,
                                }}
                              >
                                {todo.status === "FINISHED" ? (
                                  <IconButton
                                    onClick={() => {
                                      updateTodoStatus({
                                        itemId: item._id,
                                        subItemId: subItem._id,
                                        todoId: todo._id,
                                        statusToBe: "IN_PROGRESS",
                                      });
                                    }}
                                  >
                                    <CheckIcon />
                                  </IconButton>
                                ) : (
                                  <IconButton
                                    onClick={() => {
                                      updateTodoStatus({
                                        itemId: item._id,
                                        subItemId: subItem._id,
                                        todoId: todo._id,
                                        statusToBe: "FINISHED",
                                      });
                                    }}
                                  >
                                    <CircleOutlinedIcon />
                                  </IconButton>
                                )}
                                <Button
                                  variant="text"
                                  sx={{
                                    flexGrow: 1,
                                    textDecoration:
                                      todo.status === "FINISHED"
                                        ? "line-through"
                                        : "",
                                  }}
                                  onClick={() => {
                                    opeEditTodoDialog({
                                      itemId: item._id,
                                      subItemId: subItem._id,
                                      todo,
                                    });
                                  }}
                                >
                                  <Typography
                                    textAlign="left"
                                    sx={{
                                      flexGrow: 1,
                                      color:
                                        measure.measuringItem.todoId ===
                                        todo._id
                                          ? "red"
                                          : "",
                                    }}
                                  >
                                    {todo.description}
                                  </Typography>
                                  {todo.estimatedTime !== 0 && (
                                    <Typography textAlign="right">
                                      {todo.estimatedTime}
                                      {todoUnits[todo.unit]}
                                    </Typography>
                                  )}
                                  {todo.dueDate && (
                                    <Typography
                                      textAlign="right"
                                      sx={{ pl: 1 }}
                                    >
                                      {formatDate(todo.dueDate, "M/D")}
                                    </Typography>
                                  )}
                                </Button>
                                {todo.status !== "FINISHED" ? (
                                  measure.measuringItem.todoId === todo._id ? (
                                    <IconButton
                                      onClick={() =>
                                        handleClickItem({
                                          itemId: item._id,
                                          subItemId: subItem._id,
                                          todoId: todo._id,
                                        })
                                      }
                                    >
                                      <StopCircleOutlinedIcon />
                                    </IconButton>
                                  ) : (
                                    <IconButton
                                      onClick={() =>
                                        handleClickItem({
                                          itemId: item._id,
                                          subItemId: subItem._id,
                                          todoId: todo._id,
                                        })
                                      }
                                    >
                                      <PlayCircleOutlinedIcon />
                                    </IconButton>
                                  )
                                ) : null}

                                {/* 同じ幅を保つために同じエレメントを非表示で作成。 */}
                                <IconButton sx={{ visibility: "hidden" }}>
                                  <ExpandMoreOutlinedIcon />
                                </IconButton>
                              </Grid>
                            </Grid>
                          );
                        }
                      })}
                    </Grid>
                  );
                })}
            </Grid>
          );
      })}
      <Grid container sx={{ mb: 1, display: "flex", alignItems: "center" }}>
        <Grid item xs={12} sx={{ display: "flex" }}>
          <div style={{ flexGrow: 1 }}></div>
          {minutesToHoursDisplay(totalTimes.sum / 60)}
          {/* 同じ幅を保つために同じエレメントを非表示で作成。 */}
          <IconButton sx={{ visibility: "hidden" }}>
            <ExpandMoreOutlinedIcon />
          </IconButton>
        </Grid>
      </Grid>
    </>
  );
};
export default MeasuredItems;
