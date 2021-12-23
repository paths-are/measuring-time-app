import * as React from "react";
import Box from "@mui/material/Box";
import { Button, TextField } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";

import { v4 as uuidv4 } from "uuid";
import { useUser } from "@/src/lib/auth";
import {
  updateMeasuredItem,
} from "@/src/lib/firestore";
import {
  updateListOfObjects,
} from "@/src/lib/utils";
import { useRecoilValue } from "recoil";
import {
  measuredItems,
  Todo,
  Item,
  SubItem,
  MeasuredItems as Items,
} from "@/src/recoilAtoms";

import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";

import LocalizationProvider from "@mui/lab/LocalizationProvider";
import DateAdapterMoment from "@mui/lab/AdapterMoment";
import DatePicker from "@mui/lab/DatePicker";
import Slider from "@mui/material/Slider";

type Props = {
  itemId: string;
  subItemId?: string | null;
};
const AddTodo = ({ itemId, subItemId = null }: Props) => {
  const items = useRecoilValue<Items>(measuredItems);

  const user: any = useUser();
  const [addTodoDialog, setAddTodoDialog] = React.useState(false);
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
  const openAddTodoDialog = ({
    itemId,
    subItemId = null,
  }: {
    itemId: string;
    subItemId?: string | null;
  }): void => {
    setAddTodoDialog(true);
    const item = items.find((item: Item) => item["_id"] === itemId);
    if (!item) return;
    const subItem = subItemId
      ? item.subItems.find((subItem: SubItem) => subItem["_id"] === subItemId)
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
  const changeTodoTimeUnit = (
    event: SelectChangeEvent
    // child?: object
  ): void => {
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
  const handleClickAddNewTodoButton = () => {
    const item = items.find((item: Item) => item["_id"] === newTodo.itemId);
    if (!item) return;

    let newItems;
    const newTodoObj = {
      _id: `todo_${uuidv4()}`,
      description: newTodo.description,
      estimatedTime: newTodo.estimatedTime,
      unit: newTodo.unit,
      status: newTodo.status,
      dueDate: newTodo.dueDate ? new Date(newTodo.dueDate).getTime() : null,
    };
    const newItem: Item = { ...item };
    if (!newTodo.subItemId) {
      // アイテムへのTODOの追加
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

      const newSubItems = item.subItems.map((x: SubItem) =>
        x._id === newTodo.subItemId
          ? { ...x, todos: x.todos ? [...x.todos, newTodoObj] : [newTodoObj] }
          : x
      );
      newItems = items.map((x: Item) =>
        x._id === newTodo.itemId ? { ...x, subItems: newSubItems } : x
      );
    }
    updateMeasuredItem(user.uid, newItems);
    setNewTodo(newTodoDefaultValues);

    closeAddTodoDialog();
  };

  return (
    <>
      <IconButton
        onClick={() => {
          openAddTodoDialog({ itemId, subItemId });
        }}
      >
        <AddTaskOutlinedIcon />
      </IconButton>

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
    </>
  );
};
export default AddTodo;
