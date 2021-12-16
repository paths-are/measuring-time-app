import * as React from "react";
import Box from "@mui/material/Box";
import { Button, TextField, Grid } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import DescriptionIcon from "@mui/icons-material/Description";
import FileOpenOutlinedIcon from "@mui/icons-material/FileOpenOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import ExpandLessOutlinedIcon from "@mui/icons-material/ExpandLessOutlined";

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
} from "@/src/lib/utils";
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

function createNewTime(measuringItem: any) {
  let newTime: any = {};
  newTime = {
    itemId: measuringItem["_id"],
    _id: `time_${uuidv4()}`,
    start: measuringItem.start,
    end: new Date().getTime(),
  };
  measuringItem.subItemId
    ? (newTime.subItemId = measuringItem.subItemId)
    : null;
  measuringItem.memo ? (newTime.memo = measuringItem.memo) : null;
  return newTime;
}

const MeasuredItems = () => {
  const items = useRecoilValue(measuredItems);
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
  // const [note, setNote] = React.useState(null);

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
      color: "#3f51b5",
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

    updateMeasuredItem(user.uid, newItems);
    setTargetItem({});
    closeEditDialog();
    closeNoteDialog();
  };

  /**
   * 計測アイテムがクリックされたときの処理
   * @param _id
   */
  const handleClickItem = (_id: string, subItemId?: string): void => {
    console.log("subItemId", subItemId);
    const clickedItem: any = items.find((item: any) => item["_id"] === _id);
    const clickedSubItem: any = subItemId
      ? clickedItem.subItems.find((item: any) => item["_id"] === subItemId)
      : null;
    const measuringItem: any = {};

    // スタート
    function startMeasuringItem(): void {
      measuringItem.isActive = true;

      measuringItem["_id"] = _id;
      measuringItem.start = new Date().getTime();
      measuringItem.name = clickedItem.name;

      if (subItemId) {
        measuringItem.subItemId = subItemId;
        measuringItem.subItemName = clickedSubItem.name;
      }
    }
    // ストップ
    function stopMeasuringItem(): void {
      measuringItem.isActive = false;

      measuringItem["_id"] = null;
      measuringItem.start = null;
      measuringItem.name = null;
      measuringItem.subItemId ? (measuringItem.subItemId = null) : null;
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
      // アイテムクリック時（計測されている状態） // サブアイテムが計測されていないとき
      if (
        measure.measuringItem?.["_id"] === _id &&
        measure.measuringItem?.["subItemId"] === subItemId
      ) {
        // 同じアイテムをクリックして停止するとき
        stopMeasuringItem();

        const newTime = createNewTime(measure.measuringItem);

        newMeasure = {
          measuringItem: measuringItem,
          times: [...measure.times, newTime],
        };
        setMeasure(newMeasure);
      }
      if (
        measure.measuringItem?.["_id"] !== _id ||
        measure.measuringItem?.["subItemId"] !== subItemId
      ) {
        // 　別のアイテムをクリックして違うアイテムの計測を開始するとき
        startMeasuringItem();

        const newTime = createNewTime(measure.measuringItem);

        newMeasure = {
          measuringItem: measuringItem,
          times: [...measure.times, newTime],
        };
        setMeasure(newMeasure);
      }

      const tmpMonth = "202112";
      console.log("newMeasure", newMeasure);
      updateMeasuredTime(user.uid, tmpMonth, newMeasure);
    }
  };

  /**
   * サブアイテム表示機能
   */
  const onClickExpandSubItems = (_id: string): void => {
    const newItems = [...items];
    let obj = newItems.find((x: any) => x["_id"] === _id);
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
              sx={{ mb: 1, display: "flex", alignItems: "center" }}
            >
              <Grid item xs={editMode ? 12 : 12} sx={{ display: "flex" }}>
                <IconButton onClick={() => handleClickEmptyNote(item)}>
                  {item.note ? <DescriptionIcon /> : <FileOpenOutlinedIcon />}
                </IconButton>
                <Button
                  variant={isActive ? "outlined" : "contained"}
                  onClick={
                    editMode
                      ? () => handleClickEditIcon(item)
                      : () => handleClickItem(_id)
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
                    : `${minutesToHoursDisplay(totalTimeItem)}/${minutesToHoursDisplay(
                        totalTime
                      )}`}
                </Button>
                {!editMode && (
                  <IconButton
                    onClick={() => {
                      onClickExpandSubItems(_id);
                    }}
                    sx={{ visibility: item.subItems ? null : "hidden" }}
                  >
                    {item.expandSubItems ? (
                      <ExpandLessOutlinedIcon />
                    ) : (
                      <ExpandMoreOutlinedIcon />
                    )}
                  </IconButton>
                )}
              </Grid>
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
                      <Grid item xs={10} sx={{ display: "flex" }}>
                        <Button
                          variant={
                            measure.measuringItem?.["subItemId"] === subItemId
                              ? "outlined"
                              : "contained"
                          }
                          onClick={() => handleClickItem(_id, subItemId)}
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
