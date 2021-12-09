import * as React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Button, TextField, IconButton, Grid } from "@mui/material";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@/src/lib/auth";
import {
  addMeasuredItem,
  updateMeasuredItem,
  deleteMeasuredItem,
  updateMeasuredTime,
} from "@/src/lib/firestore";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { formatDate, orgFloor } from "@/src/lib/utils";
import { useRecoilValue, useRecoilState } from "recoil";
import {
  measuredItems,
  totalTimes as totalTimesAtom,
  measure as measureAtom,
} from "@/src/recoilAtoms";

import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

const MeasuredItems = () => {
  const [items, setItems] = useRecoilState(measuredItems);
  const [measure, setMeasure] = useRecoilState(measureAtom);

  const user: any = useUser();
  const [newItem, setNewItem] = React.useState("");
  const [newDialog, setNewDialog] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [editDialog, setEditDialog] = React.useState(false);
  const [targetItem, setTargetItem] = React.useState<any>({});
  const totalTimes = useRecoilValue(totalTimesAtom);
  const [editMode, setEditMode] = React.useState(false);

  const colorList = [
    "#3f51b5",
    "#2196f3",
    "#e91e63",
    "#009688",
    "#ffeb3b",
    "#673ab7",
    "#757575",
    "yellow",
  ];

  /**
   * 新規アイテム追加
   */
  const openNewDialog = () => {
    setNewDialog(true);
  };
  const closeNewDialog = () => {
    setNewDialog(false);
  };
  const handleSendItem = () => {
    closeNewDialog();
    addMeasuredItem(user.uid, {
      _id: uuidv4(),
      name: newItem,
      category: "work1",
      color: "yellow",
    });
    setNewItem("");
  };
  const handleOnChange = (e: any): void => {
    setNewItem(e.target.value);
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
      let newSubItems = [...targetItem.subItems];
      let obj = newSubItems.find((x: any) => x["_id"] === e.target.id);
      let index = newSubItems.indexOf(obj);
      const newSubItem = { ...obj, name: e.target.value };

      newSubItems.splice(index, 1, newSubItem);

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
    let obj = newItems.find((x: any) => x["_id"] === targetItem["_id"]);
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

    setItems(newItems);
    console.log("newItems", newItems);

    updateMeasuredItem(user.uid, newItems);
    setTargetItem({});
    closeEditDialog();
  };

  /**
   * 計測アイテムがクリックされたときの処理
   * @param _id
   */
  const handleClickItem = (_id: string): void => {
    const result: any = items.find((item: any) => item["_id"] === _id);
    const newMeasuringItem: any = {};

    let newMeasure: any = {};

    if (!measure.measuringItem.isActive) {
      // アイテムクリック時（何も計測されていない状態）
      newMeasuringItem.isActive = true;

      newMeasuringItem["_id"] = _id;
      newMeasuringItem.start = new Date().getTime();
      newMeasuringItem.name = result.name;
      newMeasure = { ...measure, measuringItem: newMeasuringItem };
      setMeasure(newMeasure);
      // setMeasure({ ...measure, measuringItem: newMeasuringItem });
    } else {
      // アイテムクリック時（計測されている状態）
      if (measure.measuringItem?.["_id"] === _id) {
        // 同じアイテムをクリックして停止するとき
        const defaultMeasuringItem = {
          isActive: false,
          _id: null,
          name: null,
          start: null,
          end: null,
        };
        const newTime = {
          itemId: measure.measuringItem["_id"],
          _id: `time_${uuidv4()}`,
          start: measure.measuringItem.start,
          end: new Date().getTime(),
        };
        newMeasure = {
          measuringItem: defaultMeasuringItem,
          times: [...measure.times, newTime],
        };
        setMeasure(newMeasure);
      }
      if (measure.measuringItem?.["_id"] !== _id) {
        // 　別のアイテムをクリックして違うアイテムの計測を開始するとき
        newMeasuringItem.isActive = true;

        newMeasuringItem["_id"] = _id;
        newMeasuringItem.start = new Date().getTime();
        newMeasuringItem.name = result.name;
        const newTime = {
          itemId: measure.measuringItem["_id"],
          _id: `time_${uuidv4()}`,
          start: measure.measuringItem.start,
          end: new Date().getTime(),
        };
        newMeasure = {
          measuringItem: newMeasuringItem,
          times: [...measure.times, newTime],
        };
        setMeasure(newMeasure);
      }
    }

    const now = new Date();
    const yyyymmdd = formatDate(now, "YYYYMMDD");
    updateMeasuredTime(user.uid, yyyymmdd, newMeasure);
  };

  return (
    <>
      {/* 項目追加フォーム */}
      <Dialog open={newDialog} onClose={closeNewDialog}>
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
      <Dialog open={editDialog} onClose={closeEditDialog}>
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
                    handleDeleteSubItem(ele._id);
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
      <Dialog open={deleteDialog} onClose={closeNewDialog}>
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
          <Box
            sx={{
              display: "flex",
              justifyContent: "end",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography>合計(分)</Typography>
          </Box>
        </>
      )}
      {items?.map((item: any, index: number) => {
        const _id = item["_id"];
        const baseTime = 60 * 5; // 1日5時間同じ事やってればすごいということで。（なんとなく）
        const totalTime = totalTimes[_id]
          ? orgFloor(totalTimes[_id] / 60, 2)
          : 0;
        const rate = (totalTime / baseTime) * 100;
        // console.log(rate);

        if (!item.isDelete)
          return (
            <Grid
              container
              key={index}
              sx={{ mb: 1, display: "flex", alignItems: "center" }}
            >
              <Grid item xs={editMode ? 12 : 10}>
                <Button
                  variant={
                    measure.measuringItem?.["_id"] === _id
                      ? "outlined"
                      : "contained"
                  }
                  onClick={
                    editMode
                      ? () => handleClickEditIcon(item)
                      : () => handleClickItem(_id)
                  }
                  sx={{
                    flexGrow: 1,
                    mr: 1,
                    border: "none",
                    background: !editMode
                      ? measure.measuringItem?.["_id"] === _id
                        ? `linear-gradient(75deg, ${item.color}5c ${rate}%, #aaaaaa9e ${rate}% 100%)`
                        : `linear-gradient(75deg, ${
                            item.color
                          } ${rate}%, #aaaaaa ${
                            rate === 0 ? 0 : rate + 3
                          }% 100%)`
                      : item.color,
                    ":hover": {
                      border: "grey solid 1px",
                    },
                  }}
                  fullWidth
                >
                  {item.name}
                </Button>
              </Grid>
              {!editMode && (
                <Grid item xs={2}>
                  <Typography textAlign="right">{totalTime}分</Typography>
                </Grid>
              )}
            </Grid>
          );
      })}
    </>
  );
};
export default MeasuredItems;
