import * as React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Button, TextField } from "@mui/material";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { v4 as uuidv4 } from "uuid";
// import { useUser, login, logout } from "../src/lib/auth";
import { useUser, login, logout } from "@/src/lib/auth";
// import { useUser as useUserDoc } from "@/src/lib/firestore/useUser";
import {
  fetchMeasuredItem,
  addMeasuredItem,
  updateMeasuredTime,
  fetchMeasuredTime,
} from "@/src/lib/firestore";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

function formatDate(dateobject: Date, format: string) {
  const pad = (n: number) => (n > 9 ? n : "0" + n);
  dateobject = new Date(dateobject);
  const year = dateobject.getFullYear();
  const month = dateobject.getMonth() + 1;
  const date = dateobject.getDate();
  const hours = pad(dateobject.getHours());
  const minutes = pad(dateobject.getMinutes());
  // const secounds = pad(dateobject.getSeconds());
  // return `${year}/${month}/${date} ${hours}:${minutes}:${secounds}`;
  // return `${hours}:${minutes}:${secounds}`;
  if (format === "hh:mm") return `${hours}:${minutes}`;
  if (format === "YYYYMMDD") return `${year}${month}${date}`;
  if (format === "YYYY/MM/DD") return `${year}/${month}/${date}`;
  return `${year}${month}${date}`;
}
/**
 * 任意の桁で切り捨てする関数
 * @param {number} value 切り捨てする数値
 * @param {number} base どの桁で切り捨てするか（10→10の位、0.1→小数第１位）
 * @return {number} 切り捨てした値
 */
function orgFloor(value: number, base: number) {
  return Math.floor(value * base) / base;
}

const MeasuredItems = (props: any) => {
  // console.log("MeasuredItems:render");
  const { items, measure, handleClickItem, handleShowItems } = props;
  const user: any = useUser();
  const [newItem, setNewItem] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [totalTimes, setTotalTimes] = React.useState<any>({});

  const handleClickDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
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
        console.log(
          time,
          formatDate(time.start, "hh:mm"),
          (time.end - time.start) / 1000
        );
        const _id = time["_id"];

        totalTimes[_id] = totalTimes[_id]
          ? totalTimes[_id] + (time.end - time.start) / 1000
          : (time.end - time.start) / 1000;
      });
      setTotalTimes(totalTimes);
    };
    if (user) init();
  }, [measure.times]);

  return (
    <>
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
      <Box sx={{ p: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "end" }}>
          <Button onClick={handleClickDialogOpen} sx={{ mb: 1 }}>
            追加
          </Button>
        </Box>
        {items?.map((item: any) => {
          const _id = item["_id"];
          if (_id)
            return (
              <Box
                key={_id}
                sx={{ mb: 1, display: "flex", alignItems: "center" }}
              >
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
                <Typography>{orgFloor(totalTimes[_id] / 60, 2)}分</Typography>
              </Box>
            );
        })}
      </Box>
    </>
  );
};

const MeasuredTimesTable = React.memo((props: any) => {
  const { measure, items } = props;

  return (
    <TableContainer
      component={Paper}
      sx={{ maxHeight: 440, width: "100%", overflow: "scroll" }}
    >
      <Table stickyHeader aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>項目</TableCell>
            <TableCell align="right">開始</TableCell>
            <TableCell align="right">終了</TableCell>
            <TableCell align="right">時間(分)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {measure.times?.map((time: any, index: number) => {
            const result: any = items.find(
              (item: any) => item["_id"] === time["_id"]
            );

            // console.log(time);
            return (
              <TableRow
                key={index}
                sx={{
                  "&:last-child td, &:last-child th": { border: 0 },
                }}
              >
                <TableCell component="th" scope="row">
                  {result.name}
                </TableCell>
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
  );
});

export default function Index() {
  const user: any = useUser();
  const [items, setItems] = React.useState([{}]);
  // const [newItem, setNewItem] = React.useState("");
  // const [dialogOpen, setDialogOpen] = React.useState(false);
  const [globalCount, setGlobalCount] = React.useState(0); // globalカウント用
  const intervalRef = React.useRef<any>(null); // globalカウント用
  // const [allCounts, setAllCounts] = React.useState({}); // カウント秒付きのItems
  // const [activeId, setActiveId] = React.useState<string | null>(null); // 現在動いているItem
  // const [activeItemName, setActiveItemName] = React.useState<string | null>(
  //   null
  // ); // 現在動いているItem
  // const [times, setTimes] = React.useState([]); // 今日分の分析用
  // const [times, setTimes] = React.useState<any>(null); // 今日分の分析用
  // const [measuringTime, setMeasuringTime] = React.useState<any>(null); //現在計測中の時間

  const [measure, setMeasure] = React.useState<any>({
    // totalMeasuredTime: 0, // 今日の合計時間
    // measuringItem: null, // 計測中のアイテム
    measuringItem: {
      // 計測中のアイテム
      isActive: false,
      _id: null,
      name: null,
      start: null,
      end: null,
    },
    times: null, // 計測された時間
  });

  const start = React.useCallback(() => {
    if (intervalRef.current !== null) {
      return;
    }
    intervalRef.current = setInterval(() => {
      setGlobalCount((c: number) => c + 1);
    }, 1000);
  }, []);
  const stop = React.useCallback(() => {
    if (intervalRef.current === null) {
      return;
    }
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  /**
   * 計測アイテムがクリックされたときの処理
   * @param _id
   */
  const handleClickItem = (_id: string): void => {
    console.log(_id);
    if (measure.measuringItem?.["_id"] === _id) {
      // 現在計測中のアイテムがクリックされたとき
      console.log("will stop");
      stop();
      let newData;
      const time = {
        _id: measure.measuringItem["_id"],
        start: measure.measuringItem.start,
        end: new Date().getTime(),
      };
      if (measure.times === null) {
        measure.times = [time];
      } else {
        measure.times = [...measure.times, time];
      }
      measure.measuringItem.isActive = false;
      measure.measuringItem["_id"] = null;
      measure.measuringItem.name = null;
      measure.measuringItem.start = null;
      measure.measuringItem.end = null;
      newData = Object.assign({}, measure);
      setMeasure(newData);
    } else {
      console.log("will start");
      start();
      console.log(_id);
      const result: any = items.find((item: any) => item["_id"] === _id);
      if (!measure.measuringItem.isActive) {
        // 何も計測されていない状態からの計測開始
        measure.measuringItem.start = new Date().getTime();
        measure.measuringItem["_id"] = _id;
        measure.measuringItem.isActive = true;
        measure.measuringItem.name = result.name;
      } else {
        // 何かが計測されている状態からの違うIDで計測開始
        console.log("had active");
        const time = {
          _id: measure.measuringItem["_id"],
          start: measure.measuringItem.start,
          end: new Date().getTime(),
        };
        if (measure.times === null) {
          measure.times = [time];
        } else {
          measure.times = [...measure.times, time];
        }
        measure.measuringItem.start = new Date().getTime();
        measure.measuringItem["_id"] = _id;
        measure.measuringItem.name = result.name;
      }

      let newData = Object.assign({}, measure);
      setMeasure(newData);
    }
  };

  const handleLogin = (): void => {
    login().catch((error) => console.error(error));
  };

  const handleLogout = (): void => {
    logout().catch((error) => console.error(error));
  };

  const handleShowItems = (items: any): void => {
    setItems(items);
  };
  const renderMeasuredTimesTable = (res: any): void => {
    // const today = formatDate(new Date(), "YYYYMMDD");
    const today = formatDate(new Date("2021/11/29 11:11:11"), "YYYYMMDD");
    console.log(res[today]);
    // return
    if (today in res) {
      // measure = res[today];
      let newData = Object.assign({}, res[today]);
      console.log(newData);
      setMeasure(newData);
    } else {
      measure.times = [];
      let newData = Object.assign({}, measure);
      setMeasure(newData);
    }
  };

  React.useEffect(() => {
    console.log("measure.times:update");
    console.log(measure.times);
    if (measure.times) {
      // 最後に追加されたデータの開始日付と終了日付が一緒ならば、
      // 　そのままDBに保存。
      // もし、違うならば
      //   endを23:59:59に設定し、
      // 　新しい日付でデータを作成する
      const length = measure.times.length;
      const lastStart = measure.times[length - 1].start;
      const lastEnd = measure.times[length - 1].end;
      if (
        formatDate(lastStart, "YYYYMMDD") === formatDate(lastEnd, "YYYYMMDD")
      ) {
        const yyyymmdd = formatDate(
          measure.times[length - 1].start,
          "YYYYMMDD"
        );
        updateMeasuredTime(user.uid, yyyymmdd, measure);
      } else {
        const oneDaySec = 60 * 60 * 24; //86400
        const addSec = oneDaySec - 1;
        const lastStartDate = formatDate(lastStart, "YYYYMMDD");
        const lastEndTime = new Date(lastStartDate).getTime() + addSec * 1000;
        let data = measure;
        data.times[length - 1].end = lastEndTime;
        updateMeasuredTime(user.uid, lastStartDate, data);

        const startTime = lastEndTime + 1 * 1000; // 前の終了時間（23:59:59） + 2秒 = 00:00:00
        const endTime = lastEnd;
        data.times = [
          {
            _id: data.measuringItem["_id"],
            start: startTime,
            end: endTime,
          },
        ];
        updateMeasuredTime(user.uid, lastStartDate, data);
      }
    }
  }, [measure.times]);
  React.useEffect(() => {
    console.log("measure.measuringItem:update");
    console.log(measure.measuringItem);
    if (measure.measuringItem.isActive) {
      console.log(measure);
      const now = new Date();
      const yyyymmdd = formatDate(now, "YYYYMMDD");
      updateMeasuredTime(user.uid, yyyymmdd, measure);
    }
  }, [measure.measuringItem["_id"]]);
  React.useEffect(() => {
    const init = async () => {
      await fetchMeasuredTime(user.uid, renderMeasuredTimesTable);
    };
    if (user) init();
  }, []);

  React.useEffect(() => {
    console.log(measure);
  }, [measure]);

  const renderMeasingItem = (measuringItem: any) => {
    // const [time, setTime] = React.useState(0);
    // const intervalRef = React.useRef<any>(null); // globalカウント用
    // const start = React.useCallback(() => {
    //   if (intervalRef.current !== null) {
    //     return;
    //   }
    //   intervalRef.current = setInterval(() => {
    //     setTime((c: number) => c + 1);
    //   }, 1000);
    // }, []);
    // const stop = React.useCallback(() => {
    //   if (intervalRef.current === null) {
    //     return;
    //   }
    //   clearInterval(intervalRef.current);
    //   intervalRef.current = null;
    // }, []);

    // React.useEffect(() => {
    //   start();
    // }, []);

    if (measuringItem?.name) {
      return (
        <Box>
          <Typography align="center">
            計測中のアイテム：{measuringItem.name}
          </Typography>
          <Typography align="center">
            開始時間：{formatDate(measuringItem.start, "hh:mm")}
          </Typography>
          {/* <Typography align="center">経過時間：{time}</Typography> */}
        </Box>
      );
    } else {
      return null;
    }
  };

  return (
    <Container maxWidth="sm" sx={{ pb: 4 }}>
      <div>
        <div>
          {user !== null ? (
            <>
              <Button onClick={handleLogout}>ログアウト</Button>
              <h1>Timer App</h1>

              <Box>
                <Typography align="center">
                  本日の合計計測時間：{globalCount}秒
                  {/* 本日の合計計測時間：{measure.totalMeasuredTime}秒 */}
                </Typography>
              </Box>
              <Box>
                <Typography align="center">
                  {/* 計測中のアイテム：{activeItemName} */}
                  {/* 計測中のアイテム： */}
                  {renderMeasingItem(measure.measuringItem)}
                  {/* {<RenderMeasingItem measuringItem={measure.measuringItem} />} */}
                  {/* {measure.measuringItem?.name
                    ? measure.measuringItem.name
                    : null} */}
                </Typography>
              </Box>
              <MeasuredItems
                items={items}
                measure={measure}
                handleClickItem={handleClickItem}
                handleShowItems={handleShowItems}
              />
              <MeasuredTimesTable measure={measure} items={items} />
            </>
          ) : (
            <>
              <h1>Wellcome to Timer App!</h1>
              <Button onClick={handleLogin}>ログイン</Button>
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
