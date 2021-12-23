import * as React from "react";
import { Button, TextField } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import { v4 as uuidv4 } from "uuid";
import { useUser } from "@/src/lib/auth";
import { addMeasuredItem } from "@/src/lib/firestore";

const MeasuredItems = () => {
  const user: any = useUser();
  const [newItem, setNewItem] = React.useState("");
  const [newDialog, setNewDialog] = React.useState(false);

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

      <Button onClick={openNewDialog}>追加</Button>
    </>
  );
};
export default MeasuredItems;
