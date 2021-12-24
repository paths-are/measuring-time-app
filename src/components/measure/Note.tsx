import * as React from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";

import { v4 as uuidv4 } from "uuid";
import { useUser } from "@/src/lib/auth";
import { updateMeasuredItem } from "@/src/lib/firestore";
import { useRecoilValue } from "recoil";
import { measuredItems, Item, MeasuredItems as Items } from "@/src/recoilAtoms";

type Props = {
  item: Item;
};

const Note = ({ item }: Props) => {
  const items = useRecoilValue<Items>(measuredItems);

  const user: any = useUser();
  type TargetItem = Item & {
    newSubItem?: string | null;
  };
  const [targetItem, setTargetItem] = React.useState<TargetItem | null>(null);
  const [noteEditDialog, setNoteEditDialog] = React.useState(false);

  /**
   * Edit
   */
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
      newItem.newSubItem = undefined;
    }

    newItems.splice(index, 1, newItem);

    updateMeasuredItem(user.uid, newItems);
    setTargetItem(null);
    closeNoteDialog();
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
  const handleClickNoteIcon = (item: Item): void => {
    openNoteDialog();
    setTargetItem(item);
  };
  const handleOnChangeNote = (event: any) => {
    const newValue = event.target.value;
    if (targetItem) {
      setTargetItem({ ...targetItem, note: newValue });
    }
  };

  return (
    <>
      <Box
        display="flex"
        maxWidth="100px"
      >
        <IconButton onClick={() => handleClickNoteIcon(item)}>
          {item.note ? <DescriptionIcon /> : <InsertDriveFileOutlinedIcon />}
        </IconButton>
        <Typography
          sx={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "clip",
            display: "flex",
            alignItems: "center",
            flexGrow: 1,
          }}
        >
          {/* {item.note} */}
        </Typography>
      </Box>
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
    </>
  );
};
export default Note;
