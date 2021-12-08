import * as React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Button, TextField, IconButton } from "@mui/material";

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
  const handleClickDeleteIcon = (item: any): void => {
    setTargetItem(item);
    openDeleteDialog();
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
  const handleOnChangeTargetItem = (e: any): void => {
    setTargetItem({ ...targetItem, name: e.target.value });
  };
  const handleUpdateItem = () => {
    const newItems = [...items];
    let obj = newItems.find((x: any) => x["_id"] === targetItem["_id"]);
    let index = newItems.indexOf(obj);
    newItems.splice(index, 1, targetItem);

    setItems(newItems);
    console.log("newItems", newItems);

    updateMeasuredItem(user.uid, newItems);
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
            id="item"
            label="項目名"
            type="text"
            fullWidth
            variant="standard"
            value={targetItem?.name}
            onChange={handleOnChangeTargetItem}
          />
        </DialogContent>
        <DialogActions>
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

      <Box sx={{ p: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "end" }}>
          <Button onClick={openNewDialog} sx={{ mb: 1 }}>
            追加
          </Button>
        </Box>
        {items?.map((item: any, index: number) => {
          const _id = item["_id"];
          if (!item.isDelete)
            return (
              <Box
                key={index}
                sx={{ mb: 1, display: "flex", alignItems: "center" }}
              >
                <IconButton onClick={() => handleClickEditIcon(item)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleClickDeleteIcon(item)}>
                  <DeleteIcon />
                </IconButton>
                <Button
                  variant={
                    measure.measuringItem?.["_id"] === _id
                      ? "outlined"
                      : "contained"
                  }
                  onClick={() => handleClickItem(_id)}
                  sx={{
                    flexGrow: 1,
                    mr: 1,
                  }}
                >
                  {item.name}
                </Button>
                <Typography>
                  {totalTimes[_id] ? orgFloor(totalTimes[_id] / 60, 2) : "-"}分
                </Typography>
              </Box>
            );
        })}
      </Box>
    </>
  );
};
export default MeasuredItems;
