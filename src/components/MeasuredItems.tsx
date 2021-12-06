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
  fetchMeasuredItem,
  addMeasuredItem,
  deleteMeasuredItem,
  updateMeasuredTime,
} from "@/src/lib/firestore";
import DeleteIcon from "@mui/icons-material/Delete";
import { formatDate, orgFloor } from "@/src/lib/utils";
import {useRecoilState } from "recoil";
import { measuredItems, measure as measureAtom } from "@/src/recoilAtoms";

const MeasuredItems = () => {
  const [items, setItems] = useRecoilState(measuredItems);
  const [measure, setMeasure] = useRecoilState(measureAtom);

  const user: any = useUser();
  const [newItem, setNewItem] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [totalTimes, setTotalTimes] = React.useState<any>({});
  const [deleteTargetItem, setDeleteTargetItem] = React.useState<any>({});

  const handleClickDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleClickDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };
  const handleClickDeleteIcon = (item: any): void => {
    setDeleteTargetItem(item);
    handleClickDeleteDialogOpen();
  };

  const handleDeleteItem = () => {
    deleteMeasuredItem(user.uid, deleteTargetItem);
    handleDeleteDialogClose();
  };

  const handleSendItem = () => {
    handleDialogClose();
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

  const handleShowItems = (items: any): void => {
    setItems(items);
  };

  React.useEffect(() => {
    const init = async () => {
      await fetchMeasuredItem(user.uid, handleShowItems);
    };
    if (user) init();
  }, [user]);

  React.useEffect(() => {
    const init = async () => {
      let totalTimes: any = {};
      measure.times?.map((time: any) => {
        const _id = time["itemId"];

        totalTimes[_id] = totalTimes[_id]
          ? totalTimes[_id] + (time.end - time.start) / 1000
          : (time.end - time.start) / 1000;
      });
      setTotalTimes(totalTimes);
    };
    if (user) init();
  }, [measure.times]);

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
      newMeasure = { ...measure, measuringItem: newMeasuringItem }
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
        // setMeasure({
        //   measuringItem: defaultMeasuringItem,
        //   times: [...measure.times, newTime],
        // });
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
        }
        setMeasure(newMeasure);
        // setMeasure({
        //   measuringItem: newMeasuringItem,
        //   times: [...measure.times, newTime],
        // });
      }
    }

    const now = new Date();
    const yyyymmdd = formatDate(now, "YYYYMMDD");
    updateMeasuredTime(user.uid, yyyymmdd, newMeasure);
  };

  return (
    <>
      {/* 項目追加フォーム */}
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
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
            type="email"
            fullWidth
            variant="standard"
            value={newItem}
            onChange={handleOnChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>戻る</Button>
          <Button onClick={handleSendItem}>追加</Button>
        </DialogActions>
      </Dialog>

      {/* 項目削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>注意</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`「${deleteTargetItem.name}」を削除します。よろしいですか？`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>いいえ</Button>
          <Button onClick={handleDeleteItem}>はい</Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ p: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "end" }}>
          <Button onClick={handleClickDialogOpen} sx={{ mb: 1 }}>
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
