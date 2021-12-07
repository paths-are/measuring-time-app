import * as React from "react";
import { formatDate, orgFloor } from "@/src/lib/utils";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useRecoilValue, useRecoilState } from "recoil";
import { measuredItems, measure as measureAtom } from "@/src/recoilAtoms";
import { updateMeasuredTime, fetchMeasuredTime } from "@/src/lib/firestore";
import { useUser } from "@/src/lib/auth";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { Box, Button, Typography, Divider, TextField } from "@mui/material";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";

const pad = (n: number) => (n > 9 ? String(n) : "0" + n);

const MeasuredTimesTable = React.memo(() => {
  const user: any = useUser();
  const [measure, setMeasure] = useRecoilState(measureAtom);
  const items = useRecoilValue(measuredItems);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedTime, setSelectedTime] = React.useState<any | null>(null);

  const handleMemoChange = (event: any) => {
    setSelectedTime({
      ...selectedTime,
      memo: event.target.value,
    });
  };

  const handleChange = (event: SelectChangeEvent) => {
    const newTimes = [...measure.times];

    let newTimeObject: any = {};

    if (event.target.name === "startTimeHours") {
      // 開始の時間を変更
      const baseTime = new Date(selectedTime.start).getTime();
      const baseHours = new Date(selectedTime.start).getHours();
      const newHours = event.target.value;
      const diff = baseHours - Number(newHours);
      const newTime = new Date(baseTime - diff * 3600000 /* 1時間 */).getTime();

      newTimeObject = {
        ...selectedTime,
        start: newTime,
        startHh: formatDate(newTime, "hh"),
      };
      setSelectedTime({
        ...selectedTime,
        startHh: formatDate(newTime, "hh"),
      });
    }
    if (event.target.name === "startTimeMinutes") {
      // 開始の分を変更
      const baseTime = new Date(selectedTime.start).getTime();
      const baseMinutes = new Date(selectedTime.start).getMinutes();
      const newMinutes = event.target.value;
      const diff = baseMinutes - Number(newMinutes);
      const newTime = new Date(baseTime - diff * 60000 /* 1分 */).getTime();

      newTimeObject = {
        ...selectedTime,
        start: newTime,
        startMm: formatDate(newTime, "mm"),
      };
      setSelectedTime({
        ...selectedTime,
        startMm: formatDate(newTime, "mm"),
      });
    }
    if (event.target.name === "endTimeHours") {
      // 終了の時間を変更
      const baseTime = new Date(selectedTime.end).getTime();
      const baseHours = new Date(selectedTime.end).getHours();
      const newHours = event.target.value;
      const diff = baseHours - Number(newHours);
      const newTime = new Date(baseTime - diff * 3600000 /* 1時間 */).getTime();

      newTimeObject = {
        ...selectedTime,
        end: newTime,
        endHh: formatDate(newTime, "hh"),
      };
      setSelectedTime({
        ...selectedTime,
        end: newTime,
        endHh: formatDate(newTime, "hh"),
      });
    }
    if (event.target.name === "endTimeMinutes") {
      // 終了の分を変更
      const baseTime = new Date(selectedTime.end).getTime();
      const baseMinutes = new Date(selectedTime.end).getMinutes();
      const newMinutes = event.target.value;
      const diff = baseMinutes - Number(newMinutes);
      const newTime = new Date(baseTime - diff * 60000 /* 1分 */).getTime();

      newTimeObject = {
        ...selectedTime,
        end: newTime,
        endMm: formatDate(newTime, "mm"),
      };
      setSelectedTime({
        ...selectedTime,
        end: newTime,
        endMm: formatDate(newTime, "mm"),
      });
    }
    let obj = newTimes.find((x: any) => x["_id"] === newTimeObject["_id"]);
    let index = newTimes.indexOf(obj);
    newTimes.splice(index, 1, newTimeObject);

    const newMeasure = {
      ...measure,
      times: newTimes,
    };

    setMeasure(newMeasure);
    console.log("newMeasure", newMeasure);
    const now = new Date();
    const yyyymmdd = formatDate(now, "YYYYMMDD");
    updateMeasuredTime(user.uid, yyyymmdd, newMeasure);
  };

  const handleClickDialogOpen = (time: any) => {
    setDialogOpen(true);
    setSelectedTime({
      ...time,
      startHh: formatDate(time.start, "hh"),
      startMm: formatDate(time.start, "mm"),
      endHh: formatDate(time.end, "hh"),
      endMm: formatDate(time.end, "mm"),
    });
  };

  const handleDeleteTime = () => {
    const times = [...measure.times];

    let obj = times.find((x: any) => x["_id"] === selectedTime["_id"]);
    let index = times.indexOf(obj);
    times.splice(index, 1); // 削除

    const newMeasure = {
      ...measure,
      times: times,
    };

    setMeasure(newMeasure);
    const now = new Date();
    const yyyymmdd = formatDate(now, "YYYYMMDD");
    updateMeasuredTime(user.uid, yyyymmdd, newMeasure);

    setDialogOpen(false);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);

    const newTimes = [...measure.times];
    let obj = newTimes.find((x: any) => x["_id"] === selectedTime["_id"]);
    let index = newTimes.indexOf(obj);
    newTimes.splice(index, 1, selectedTime);

    const newMeasure = {
      ...measure,
      times: newTimes,
    };

    setMeasure(newMeasure);
    console.log("newMeasure", newMeasure);
    const now = new Date();
    const yyyymmdd = formatDate(now, "YYYYMMDD");
    updateMeasuredTime(user.uid, yyyymmdd, newMeasure);
  };

  const renderMeasuredTimesTable = (response: any): void => {
    const today = formatDate(new Date(), "YYYYMMDD");
    if (today in response) {
      setMeasure(response[today]);
    } else {
      setMeasure({ ...measure, times: [] });
    }
  };

  React.useEffect(() => {
    const init = async () => {
      await fetchMeasuredTime(user.uid, renderMeasuredTimesTable);
    };
    if (user) init();
  }, [user]);

  return (
    <>
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>アクション</DialogTitle>
        <DialogContent>
          <Typography fontWeight="bold">時間変更</Typography>
          <Box sx={{ p: 1, display: "flex", alignItems: "center" }}>
            <FormControl variant="standard" sx={{ p: 1 }}>
              <InputLabel>時間</InputLabel>
              <Select
                name="startTimeHours"
                value={selectedTime?.startHh}
                label="時間"
                onChange={handleChange}
              >
                {(() => {
                  const items = [];
                  for (let i = 0; i < 24; i++) {
                    items.push(
                      <MenuItem key={pad(i)} value={pad(i)}>
                        {pad(i)}
                      </MenuItem>
                    );
                  }
                  return items;
                })()}
              </Select>
            </FormControl>
            <FormControl variant="standard" sx={{ p: 1 }}>
              <InputLabel>分</InputLabel>
              <Select
                name="startTimeMinutes"
                value={selectedTime?.startMm}
                label="分"
                onChange={handleChange}
              >
                {(() => {
                  const items = [];
                  for (let i = 0; i < 60; i++) {
                    items.push(
                      <MenuItem key={pad(i)} value={pad(i)}>
                        {pad(i)}
                      </MenuItem>
                    );
                  }
                  return items;
                })()}
              </Select>
            </FormControl>
            <Typography>-</Typography>
            <FormControl variant="standard" sx={{ p: 1 }}>
              <InputLabel>時間</InputLabel>
              <Select
                name="endTimeHours"
                value={selectedTime?.endHh}
                label="時間"
                onChange={handleChange}
              >
                {(() => {
                  const items = [];
                  for (let i = 0; i < 24; i++) {
                    items.push(
                      <MenuItem key={pad(i)} value={pad(i)}>
                        {pad(i)}
                      </MenuItem>
                    );
                  }
                  return items;
                })()}
              </Select>
            </FormControl>
            <FormControl variant="standard" sx={{ p: 1 }}>
              <InputLabel>分</InputLabel>
              <Select
                name="endTimeMinutes"
                value={selectedTime?.endMm}
                label="分"
                onChange={handleChange}
              >
                {(() => {
                  const items = [];
                  for (let i = 0; i < 60; i++) {
                    items.push(
                      <MenuItem key={pad(i)} value={pad(i)}>
                        {pad(i)}
                      </MenuItem>
                    );
                  }
                  return items;
                })()}
              </Select>
            </FormControl>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Typography fontWeight="bold">メモ</Typography>
          <TextField
            margin="dense"
            label="メモ"
            type="text"
            multiline
            rows={2}
            fullWidth
            variant="standard"
            value={selectedTime?.memo}
            onChange={handleMemoChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteTime} sx={{ color: "red" }}>
            この時間を削除する
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={handleDialogClose}>確定</Button>
        </DialogActions>
      </Dialog>
      <TableContainer
        component={Paper}
        sx={{ maxHeight: 440, width: "100%", overflow: "scroll" }}
      >
        <Table stickyHeader aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell align="left">番号</TableCell>
              <TableCell>項目</TableCell>
              <TableCell align="left">memo</TableCell>
              <TableCell align="right">開始</TableCell>
              <TableCell align="right">終了</TableCell>
              <TableCell align="right">時間(分)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {measure.times?.map((time: any, index: number) => {
              const result: any = items.find((item: any) => {
                return item["_id"] === time.itemId;
              });
              return (
                <TableRow
                  key={index}
                  sx={{
                    "&:last-child td, &:last-child th": { border: 0 },
                    ":hover": {
                      backgroundColor: "yellow",
                    },
                  }}
                  onClick={() => handleClickDialogOpen(time)}
                >
                  <TableCell align="left">{index}</TableCell>
                  <TableCell component="th" scope="row">
                    {result?.name}
                  </TableCell>
                  <TableCell align="left">{time.memo}</TableCell>
                  <TableCell align="right">
                    {formatDate(time.start, "hh:mm")}
                  </TableCell>
                  <TableCell align="right">
                    {formatDate(time.end, "hh:mm")}
                  </TableCell>
                  <TableCell align="right">
                    {orgFloor((time.end - time.start) / 1000 / 60, 2)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
});
export default MeasuredTimesTable;
