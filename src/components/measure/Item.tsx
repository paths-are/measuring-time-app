import * as React from "react";
import Box from "@mui/material/Box";
import { Button, TextField } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import PlayCircleOutlinedIcon from "@mui/icons-material/PlayCircleOutlined";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";

import { v4 as uuidv4 } from "uuid";
import { useUser } from "@/src/lib/auth";
import {
  updateMeasuredItem,
  deleteMeasuredItem,
  updateMeasuredTime,
} from "@/src/lib/firestore";
import {
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
  MeasuringItem,
  Time,
} from "@/src/recoilAtoms";

import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

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
  item: Item;
  children: React.ReactNode;
};

const ItemComponent = ({ item, children }: Props) => {
  const items = useRecoilValue<Items>(measuredItems);
  const [measure, setMeasure] = useRecoilState(measureAtom);

  const user: any = useUser();
  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [editDialog, setEditDialog] = React.useState(false);
  type TargetItem = Item & {
    newSubItem?: string | null;
  };
  const [targetItem, setTargetItem] = React.useState<TargetItem | null>(null);
  const totalTimes = useRecoilValue(totalTimesAtom);

  const colorList = [
    "#3f51b5",
    "#2196f3",
    "#e91e63",
    "#009688",
    "#ffeb3b",
    "#673ab7",
    "#757575",
  ];

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
  const handleClickEditIcon = (item: Item): void => {
    setTargetItem(item);
    openEditDialog();
  };
  const openEditDialog = () => {
    setEditDialog(true);
  };
  const closeEditDialog = () => {
    setEditDialog(false);
    setTargetItem(null);
  };
  const handleDeleteSubItem = (subItemId: string) => {
    if (!targetItem) return;
    let newSubItems = [...targetItem.subItems];
    let obj = newSubItems.find((x: SubItem) => x["_id"] === subItemId);
    if (!obj) return;
    let index = newSubItems.indexOf(obj);
    newSubItems.splice(index, 1); // 削除
    setTargetItem({ ...targetItem, subItems: newSubItems });
  };
  const handleOnChangeTargetItem = (event: any): void => {
    const newValue = event.target.value;
    if (!targetItem) return;
    if (event.target.name === "itemName") {
      setTargetItem({ ...targetItem, name: newValue });
      return;
    }
    if (event.target.name.substring(0, 8) === "subItems") {
      const newSubItems = targetItem.subItems.map((subItem: any) => {
        if (subItem._id === event.target.id) {
          return { ...subItem, name: newValue };
        } else {
          return subItem;
        }
      });

      setTargetItem({ ...targetItem, subItems: newSubItems });
      return;
    }
    if (event.target.name === "newSubItem") {
      setTargetItem({ ...targetItem, newSubItem: newValue });
      return;
    }
    if (event.target.name === "color") {
      setTargetItem({ ...targetItem, color: newValue });
      return;
    }
  };
  const handleUpdateItem = () => {
    if (!targetItem) return;
    const newItems = [...items];
    let obj = newItems.find((x: Item) => x["_id"] === targetItem["_id"]);
    if (!obj) return;
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
    setTargetItem(null);
    closeEditDialog();
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
      updateMeasuredTime(user.uid, tmpMonth, newMeasure, updateKey);
    } else {
      // アイテムクリック時（計測されている状態）
      if (
        measure.measuringItem?.["_id"] === itemId &&
        measure.measuringItem?.["subItemId"] === subItemId &&
        measure.measuringItem?.["todoId"] === todoId
      ) {
        // 同じアイテムをクリックして停止するとき
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
        console.log("measure.measuringItem", measure.measuringItem);
      }

      const tmpMonth = "202112";
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
      }

      const newItems = updateListOfObjects({
        listOfObjects: [...items],
        newObject: newItem,
        filter: { key: "_id", value: item._id },
        processType: "REPLACE",
      });
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
    measure.measuringItem?.["_id"] === _id && !measure.measuringItem?.subItemId
      ? true
      : false;

  return (
    <>
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
          {/* <Note item={targetItem} /> */}
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
      <Dialog
        open={deleteDialog}
        // onClose={closeNewDialog}
        fullWidth
      >
        <DialogTitle>注意</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`「${targetItem?.name}」を削除します。よろしいですか？`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>いいえ</Button>
          <Button onClick={handleDeleteItem}>はい</Button>
        </DialogActions>
      </Dialog>

      {!item.isDelete && (
        // アイテム表示
        <Box sx={{ display: "flex" }}>
          <Box width="100%" mb={2}>
            <Box display="flex">
              <Button
                variant={isActive ? "outlined" : "contained"}
                onClick={() => handleClickEditIcon(item)}
                sx={{
                  flexGrow: 1,
                  mr: 1,
                  background: isActive
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
              </Button>
              {measure.measuringItem._id === item._id ? (
                <IconButton onClick={() => handleClickItem({ itemId: _id })}>
                  <StopCircleOutlinedIcon />
                </IconButton>
              ) : (
                <IconButton onClick={() => handleClickItem({ itemId: _id })}>
                  <PlayCircleOutlinedIcon />
                </IconButton>
              )}
            </Box>
            {item.expandSubItems && children}
          </Box>

          {/* Expand */}
          <Box>
            <IconButton
              onClick={() => {
                onClickExpandSubItems(_id);
              }}
              sx={{
                visibility: item.subItems || item.todos ? null : "hidden",
              }}
            >
              {item.expandSubItems ? (
                <CloseOutlinedIcon fontSize="small" />
              ) : (
                <ExpandMoreOutlinedIcon fontSize="small" />
              )}
            </IconButton>
          </Box>
        </Box>
      )}
    </>
  );
};
export default ItemComponent;
