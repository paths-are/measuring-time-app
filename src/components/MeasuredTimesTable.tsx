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
import {
  measuredItems,
  measure as measureAtom,
  fixedHeight as fixedHeightAtom,
} from "@/src/recoilAtoms";
import { updateMeasuredTime } from "@/src/lib/firestore";
import { useUser } from "@/src/lib/auth";
import { withinRange } from "@/src/lib/utils";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { Box, Button, Divider, TextField } from "@mui/material";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

import LocalizationProvider from "@mui/lab/LocalizationProvider";
import DateAdapterMoment from "@mui/lab/AdapterMoment";
import MobileDateTimePicker from "@mui/lab/MobileDateTimePicker";

const pad = (n: number) => (n > 9 ? String(n) : "0" + n);

const MeasuredTimesTable = React.memo(() => {
  const user: any = useUser();
  const [measure, setMeasure] = useRecoilState(measureAtom);
  const items = useRecoilValue(measuredItems);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedTime, setSelectedTime] = React.useState<any | null>(null);
  const [rangeOn, setRangeOn] = React.useState(true);
  const fixedHeight = useRecoilValue(fixedHeightAtom);
  let displayDate = null;

  const handleMemoChange = (event: any) => {
    setSelectedTime({
      ...selectedTime,
      memo: event.target.value,
    });
  };

  const handleChangeItem = (event: any) => {
    if (event.target.name === "measuredItem") {
      setSelectedTime({
        ...selectedTime,
        itemId: event.target.value,
      });
    }
    if (event.target.name === "measuredSubItem") {
      setSelectedTime({
        ...selectedTime,
        subItemId: event.target.value,
      });
    }
  };

  const handleChangeTimeStart = (newTime: any) => {
    const newTimeObject = {
      ...selectedTime,
      start: new Date(newTime).getTime(),
    };
    setSelectedTime(newTimeObject);
  };
  
  const handleChangeTimeEnd = (newTime: any) => {
    const newTimeObject = {
      ...selectedTime,
      end: new Date(newTime).getTime(),
    };
    setSelectedTime(newTimeObject);
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

    const tmpMonth = "202112";
    const updateKey = "times";
    // TODO arrayRemove()を使えそう？
    console.log("newMeasure", newMeasure);
    updateMeasuredTime(user.uid, tmpMonth, newMeasure, updateKey);

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

    const tmpMonth = "202112";
    const updateKey = "times";
    // TODO arrayRemove()を使えそう？
    updateMeasuredTime(user.uid, tmpMonth, newMeasure, updateKey);
  };

  const toggleRange = () => {
    setRangeOn(!rangeOn);
  };

  React.useEffect(() => {
    // console.log(selectedTime);
  }, [selectedTime]);

  return (
    <>
      {/* Time 編集Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>アクション</DialogTitle>
        <DialogContent>
          <FormControl variant="standard" sx={{ p: 1 }} fullWidth>
            <InputLabel>アイテム</InputLabel>
            <Select
              name="measuredItem"
              value={selectedTime?.itemId}
              label="アイテム"
              onChange={handleChangeItem}
            >
              {(() => {
                const selectItems = [];
                for (let i = 0; i < items?.length; i++) {
                  if (!items[i].isDelete) {
                    selectItems.push(
                      <MenuItem key={pad(i)} value={items[i]._id}>
                        {items[i].name}
                      </MenuItem>
                    );
                  }
                }
                /**
                 * Todo いつか消すこと！
                 */
                selectItems.push(
                  <MenuItem key={"unde"} value={"undefined"}>
                    {"undefined"}
                  </MenuItem>
                );
                return selectItems;
              })()}
            </Select>
          </FormControl>
          <Divider sx={{ my: 1 }} />
          <FormControl variant="standard" sx={{ p: 1 }} fullWidth>
            <InputLabel>サブアイテム</InputLabel>
            <Select
              name="measuredSubItem"
              value={selectedTime?.subItemId}
              label="サブアイテム"
              onChange={handleChangeItem}
            >
              {(() => {
                const selectItems = [];
                const result: any = items.find(
                  (item: any) => item["_id"] === selectedTime?.itemId
                );
                if (result?.subItems) {
                  for (const subItem of result.subItems) {
                    selectItems.push(
                      <MenuItem key={subItem._id} value={subItem._id}>
                        {` -- ${subItem.name}`}
                      </MenuItem>
                    );
                  }
                }
                return selectItems;
              })()}
            </Select>
          </FormControl>
          <Divider sx={{ my: 1 }} />

          <LocalizationProvider dateAdapter={DateAdapterMoment as any}>
            <MobileDateTimePicker
              // maxTime={new Date().getTime()}
              openTo="minutes"
              value={selectedTime?.start}
              onChange={handleChangeTimeStart}
              renderInput={(params) => <TextField {...params} />}
            />
          </LocalizationProvider>
          <Divider sx={{ my: 1 }} />
          <LocalizationProvider dateAdapter={DateAdapterMoment as any}>
            <MobileDateTimePicker
              // maxTime={new Date().getTime()}
              openTo="minutes"
              value={selectedTime?.end}
              onChange={handleChangeTimeEnd}
              renderInput={(params) => <TextField {...params} />}
            />
          </LocalizationProvider>
          <Divider sx={{ my: 1 }} />
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

      <Box display="flex">
        <Button
          onClick={() => {
            function compare(a: any, b: any) {
              if (a.start < b.start) {
                return -1;
              }
              if (a.start > b.start) {
                return 1;
              }
              return 0;
            }

            const newTimes = [...measure.times];
            newTimes.sort(compare);
            console.log(newTimes);

            const newMeasure = {
              ...measure,
              times: newTimes,
            };

            setMeasure(newMeasure);
            console.log("newMeasure", newMeasure);

            const tmpMonth = "202112";
            const updateKey = "times";
            updateMeasuredTime(user.uid, tmpMonth, newMeasure, updateKey);
          }}
        >
          並び替え
        </Button>
        <div style={{ flexGrow: 1 }} />
        <Button onClick={toggleRange}>
          {rangeOn ? "範囲解除" : "範囲指定"}
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          width: "100%",
          overflowX: "scroll",
          height: `calc(100vh - ${fixedHeight}px - 32px)`,
          maxHeight: `calc(100vh - ${fixedHeight} - 32px)`,
          "::-webkit-scrollbar": {
            backgroundImage: "linear-gradient(180deg, #D0368A 0%, #708AD4 99%)",
            boxShadow: "inset 2px 2px 5px 0 rgba(#fff, 0.5)",
            borderRadius: "100px",
            width: "10px",
            height: "0px",
          },
          "::-webkit-scrollbar-thumb": {
            backgroundColor: "#35affbde",
            borderRadius: "100px",
          },
        }}
      >
        <Table stickyHeader aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell align="left">番号</TableCell>
              <TableCell>項目</TableCell>
              <TableCell align="left">サブ</TableCell>
              <TableCell align="left">memo</TableCell>
              <TableCell align="right">開始</TableCell>
              <TableCell align="right">終了</TableCell>
              <TableCell align="right">時間(分)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {measure.times?.map((time: any, index: number) => {
              const range = {
                start: new Date(new Date().setHours(0, 0, 0)).getTime(),
                end: new Date(new Date().setHours(24, 0, 0)).getTime(),
              };
              const result: any = withinRange(time, range, "AND_OR");
              if (!result.start && result.end) {
                time = {
                  ...time,
                  start: new Date(time.start).setHours(24, 0, 0),
                };
              }
              if (rangeOn && !result.start && !result.end) return;
              // if (rangeOn && !withinRange(time, range, "AND_OR")) return;
              const measuredItem: any = items.find(
                (item: any) => item["_id"] === time.itemId
              );
              const measuredSubItem: any = measuredItem?.subItems
                ? measuredItem.subItems.find(
                    (subItem: any) => subItem["_id"] === time.subItemId
                  )
                : null;
              displayDate = formatDate(time.start, "YYYYMMDD");
              let beforeTime = index !== 0 ? measure.times[index - 1] : 0;
              let beforeDate = formatDate(beforeTime.start, "YYYYMMDD");
              return (
                <>
                  {displayDate !== beforeDate && (
                    <TableRow
                      key={index}
                      sx={{
                        backgroundColor: "gray",
                        "&:last-child td, &:last-child th": { border: 0 },
                        ":hover": {
                          backgroundColor: "gray",
                        },
                      }}
                      onClick={() => handleClickDialogOpen(time)}
                    >
                      <TableCell align="left">{index}</TableCell>
                      <TableCell component="th" scope="row">
                        {formatDate(time.start, "MM月DD日")}
                      </TableCell>
                      <TableCell align="left"></TableCell>
                      <TableCell align="left"></TableCell>
                      <TableCell align="right"></TableCell>
                      <TableCell align="right"></TableCell>
                      <TableCell align="right"></TableCell>
                    </TableRow>
                  )}
                  <TableRow
                    key={index}
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      ":hover": {
                        backgroundColor: "gray",
                      },
                    }}
                    onClick={() => handleClickDialogOpen(time)}
                  >
                    <TableCell align="left">{index}</TableCell>
                    <TableCell component="th" scope="row">
                      {measuredItem?.name}
                    </TableCell>
                    <TableCell align="left">{measuredSubItem?.name}</TableCell>
                    <TableCell align="left">{time?.memo}</TableCell>
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
                </>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
});
export default MeasuredTimesTable;
