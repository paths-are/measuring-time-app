import * as React from "react";
import Box from "@mui/material/Box";
import { Button, TextField, Grid, Typography } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import PlayCircleOutlinedIcon from "@mui/icons-material/PlayCircleOutlined";
import { formatDate } from "@/src/lib/utils";
import CheckIcon from "@mui/icons-material/Check";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";

import { v4 as uuidv4 } from "uuid";
import { useUser } from "@/src/lib/auth";
import { updateMeasuredItem, updateMeasuredTime } from "@/src/lib/firestore";
import { minutesToHoursDisplay, updateListOfObjects } from "@/src/lib/utils";
import { useRecoilValue, useRecoilState } from "recoil";
import {
  measuredItems,
  totalTimes as totalTimesAtom,
  measure as measureAtom,
  Todo,
  Item,
  SubItem,
  MeasuredItems as Items,
  MeasuringItem,
  Time,
} from "@/src/recoilAtoms";

import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";

import LocalizationProvider from "@mui/lab/LocalizationProvider";
import DateAdapterMoment from "@mui/lab/AdapterMoment";
import DatePicker from "@mui/lab/DatePicker";
import Slider from "@mui/material/Slider";

function createNewTime(measuringItem: MeasuringItem): Time | void {
  if (!measuringItem._id || !measuringItem.start) return;
  let newTime: Time = {
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

type Props = {
  todo: Todo;
  itemId: string;
  subItemId?: string | null;
};

const TodoItem = ({ todo, itemId, subItemId = null }: Props) => {
  console.log("TodoItem", todo, itemId);
  const items = useRecoilValue<Items>(measuredItems);
  const [measure, setMeasure] = useRecoilState(measureAtom);

  const user: any = useUser();
  const totalTimes = useRecoilValue(totalTimesAtom);
  type ClientTodo = Todo & {
    itemId?: string; // 追加
    itemName?: string; // 追加
    subItemId?: string | null; // 追加
    subItemName?: string | null; // 追加
    dueDate: Date | number | null; // 上書き
    finishedDate?: Date | number | null; // 上書き
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

  const todoUnits: {
    [key: string]: string;
  } = {
    MINUTES: "分",
    HOURS: "時間",
    PERSON_DAY: "人日",
  };

  const changeTodoTimeUnit = (event: SelectChangeEvent): void => {
    const newUnit = event.target.value;
    if (!newUnit) return;
    setNewTodo({
      ...newTodo,
      unit: newUnit as "MINUTES" | "HOURS" | "PERSON_DAY",
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
  /**
   * Edit Todo
   */
  const opeEditTodoDialog = ({
    itemId,
    subItemId,
    todo,
  }: {
    itemId: string;
    subItemId?: string | null;
    todo: Todo;
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
    const item = items.find((item: Item) => item["_id"] === newTodo.itemId);
    if (!item) return;
    const newItem = { ...item };
    const subItem = newTodo.subItemId
      ? item.subItems.find(
          (subItem: SubItem) => subItem["_id"] === newTodo.subItemId
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
    };

    let newTodos = [],
      newItems = [],
      newSubItems = [];

    if (!newTodo.subItemId) {
      if (!item.todos) return;
      newTodos = updateListOfObjects({
        listOfObjects: [...item.todos],
        newObject: newTodoObj,
        filter: { key: "_id", value: newTodo._id },
        processType: "REPLACE",
      });

      newItem.todos = newTodos;
    }
    if (newTodo.subItemId) {
      if (!newSubItem || !subItem || !subItem.todos) return;
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
    subItemId?: string | null;
    todoId: string;
    statusToBe: "IN_PROGRESS" | "FINISHED";
  }) => {
    const item = items.find((item: Item) => item["_id"] === itemId);
    if (!item) return;
    const newItem = { ...item };

    let newItems;
    if (!subItemId) {
      console.log("AA");
      if (!item.todos) return;
      const todos = [...item.todos];
      const targetTodo = todos.find((todo: Todo) => todo["_id"] === todoId);

      if (!targetTodo) return;

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
      const subItem = item.subItems.find(
        (subItem) => subItem["_id"] === subItemId
      );
      if (!subItem) return;
      if (!subItem.todos) subItem.todos = [];

      const todos = [...subItem.todos];
      const targetTodo = todos.find((todo: Todo) => todo["_id"] === todoId);
      if (!targetTodo) return;
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
      if (!newTime) return;

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
   * 計測アイテムがクリックされたときの処理
   * @param _id
   */
  // ストップ
  function stoppedMeasuringItem(): MeasuringItem {
    return {
      isActive: false,
      _id: null,
      start: null,
      name: null,
      subItemId: null,
      todoId: null,
    };
  }
  type Option = {
    subItemId: string | null;
    subItemName: string | null | undefined;
    todoId: string | null;
    todoDescription: string | null | undefined;
  };
  function startedMeasuringItem(
    itemId: string,
    itemName: string,
    option?: Option
  ): MeasuringItem {
    let measuringItem: MeasuringItem = {
      isActive: false,
      _id: null,
      start: null,
      name: null,
    };
    measuringItem.isActive = true;

    measuringItem["_id"] = itemId;
    measuringItem.start = new Date().getTime();
    measuringItem.name = itemName; // clickedItem.name;

    if (option?.subItemId) {
      measuringItem.subItemId = option.subItemId;
      measuringItem.subItemName = option.subItemName; // clickedSubItem.name;
    } else {
      measuringItem.subItemId = null;
    }
    if (option?.todoId) {
      measuringItem.todoId = option.todoId;
      measuringItem.todoDescription = option.todoDescription; // clickedTodo.description;
    } else {
      measuringItem.todoId = null;
    }
    console.log(measuringItem);
    return measuringItem;
  }
  const handleClickItem = ({
    itemId,
    subItemId = null,
    todoId = null,
  }: {
    itemId: string;
    subItemId?: string | null;
    todoId?: string | null;
  }): void => {
    const clickedItem = items.find((item: Item) => item["_id"] === itemId);
    if (!clickedItem) return;

    const clickedSubItem = subItemId
      ? clickedItem.subItems.find((item: SubItem) => item["_id"] === subItemId)
      : null;

    const clickedTodo = todoId
      ? subItemId
        ? clickedSubItem?.todos?.find((todo: Todo) => todo["_id"] === todoId)
        : clickedItem?.todos?.find((todo: Todo) => todo["_id"] === todoId)
      : null;

    let newMeasure: any = {};

    if (!measure.measuringItem.isActive) {
      // アイテムクリック時（何も計測されていない状態）
      const option = {
        subItemId,
        subItemName: clickedSubItem?.name,
        todoId,
        todoDescription: clickedTodo?.description,
      };
      const newMeasuringItem = startedMeasuringItem(
        itemId,
        clickedItem.name,
        option
      );

      newMeasure = { ...measure, measuringItem: newMeasuringItem };
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
        // startMeasuringItem();
        const option = {
          subItemId,
          subItemName: clickedSubItem?.name,
          todoId,
          todoDescription: clickedTodo?.description,
        };
        const newMeasuringItem = startedMeasuringItem(
          itemId,
          clickedItem.name,
          option
        );

        const newTime = createNewTime(measure.measuringItem);

        newMeasure = {
          measuringItem: newMeasuringItem,
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
     * .Todoのステータス更新
     */
    if (todoId) {
      const item: any = items.find((item: any) => item["_id"] === itemId);
      const newItem = { ...item };

      if (!subItemId) {
        const todos = [...item.todos];
        const targetTodo: Todo = todos.find(
          (todo: Todo) => todo["_id"] === todoId
        );
        const newTodo: Todo = {
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
        const targetTodo: Todo = todos.find(
          (todo: Todo) => todo["_id"] === todoId
        );
        const newTodo: Todo = {
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

  return (
    <>
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
      {((todo.finishedDate === null || todo.finishedDate === undefined
        ? true
        : todo.finishedDate >= new Date().setHours(0, 0, 0) &&
          todo.status === "FINISHED") ||
        todo.status !== "FINISHED") && (
        <Grid
          container
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
                    itemId,
                    todoId: todo._id,
                    subItemId,
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
                    itemId,
                    todoId: todo._id,
                    subItemId,
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
                  todo.status === "FINISHED" ? "line-through" : "",
              }}
              onClick={() => {
                opeEditTodoDialog({ itemId, subItemId, todo });
              }}
            >
              <Typography
                textAlign="left"
                sx={{
                  flexGrow: 1,
                  color: measure.measuringItem.todoId === todo._id ? "red" : "",
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
              {todo.finishedDate && (
                <Typography textAlign="right" sx={{ pl: 1, color: "red" }}>
                  {formatDate(todo.finishedDate, "M/D")}
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
                      itemId,
                      subItemId,
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
                      itemId: itemId,
                      subItemId,
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
      )}
    </>
  );
};
export default TodoItem;
