import * as React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Button, TextField, Divider } from "@mui/material";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import LogoutIcon from "@mui/icons-material/Logout";
import IconButton from "@mui/material/IconButton";
import { withinRange } from "@/src/lib/utils";

import { useUser, login, logout } from "@/src/lib/auth";
import {
  fetchMeasuredItem,
  fetchMeasuredTime,
  updateMeasuredTime,
} from "@/src/lib/firestore";
import { formatDate } from "@/src/lib/utils";
import MeasuredItems from "@/src/components/MeasuredItems";
import MeasuredTimesTable from "@/src/components/MeasuredTimesTable";
import Calendar from "@/src/components/Calendar";
import {
  measuredItems,
  totalTimes as totalTimesAtom,
  measure as measureAtom,
  measureHistory as measureHistoryAtom,
  fixedHeight as fixedHeightAtom,
} from "@/src/recoilAtoms";
import { useRecoilValue, useRecoilState, useSetRecoilState } from "recoil";
import SwipeableViews from "react-swipeable-views";
import { useTheme } from "@mui/material/styles";
import { Scrollbar } from "react-scrollbars-custom";

import LocalizationProvider from "@mui/lab/LocalizationProvider";
import DesktopTimePicker from "@mui/lab/DesktopTimePicker";
import DateAdapterMoment from "@mui/lab/AdapterMoment";

const pad = (n: number) => (n > 9 ? String(n) : "0" + n);

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  const paddingBottom = 32;
  const fixedHeight = useRecoilValue(fixedHeightAtom);

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Scrollbar
          style={{
            width: "100%",
            height: `calc(100vh - ${fixedHeight}px - ${paddingBottom}px)`,
          }}
        >
          <Box
            sx={{
              p: { xs: 1, sm: 3 },
            }}
          >
            {children}
          </Box>
        </Scrollbar>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function Index() {
  const user: any = useUser();
  const items = useRecoilValue(measuredItems);
  const [value, setValue] = React.useState(0);
  const theme = useTheme();
  const [measure, setMeasure] = useRecoilState(measureAtom);
  const [measureHistory, setMeasureHistory] =
    useRecoilState(measureHistoryAtom);
  const setItems = useSetRecoilState(measuredItems);
  const setTotalTimes = useSetRecoilState(totalTimesAtom);

  const fixedIds = ["app-header", "top-container", "tab-container"];
  const setFixedHeight = useSetRecoilState(fixedHeightAtom);

  const [editDialog, setEditDialog] = React.useState(false);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    console.log(event);
    setValue(newValue);
  };

  const handleLogin = (): void => {
    login().catch((error) => console.error(error));
  };

  const handleLogout = (): void => {
    logout().catch((error) => console.error(error));
  };

  const handleChangeIndex = (index: number) => {
    setValue(index);
  };

  /**
   * Edit
   */
  const toggleEditDialog = () => {
    setEditDialog(!editDialog);
  };
  const closeEditDialog = () => {
    setEditDialog(false);
  };
  const handleChangeMeasuringItem = (e: any) => {
    let newMeasure: any = {};

    if (e.target.name === "measuredItem") {
      const itemId = e.target.value;

      const result: any = items.find((item: any) => item["_id"] === itemId);

      newMeasure = {
        ...measure,
        measuringItem: {
          ...measure.measuringItem,
          _id: itemId,
          name: result?.name || null,
          subItemId: null,
          subItemName: null,
        },
      };
      setMeasure(newMeasure);
    }
    if (e.target.name === "measuredSubItem") {
      const itemId = measure.measuringItem._id;
      const subItemId = e.target.value;

      const result: any = items.find((item: any) => item["_id"] === itemId);
      const subResult: any = result.subItems.find(
        (item: any) => item["_id"] === subItemId
      );

      newMeasure = {
        ...measure,
        measuringItem: {
          ...measure.measuringItem,
          subItemId: subItemId,
          subItemName: subResult.name,
        },
      };
      setMeasure(newMeasure);
    }
    if (e.target.name === "measuredItemMemo") {
      newMeasure = {
        ...measure,
        measuringItem: { ...measure.measuringItem, memo: e.target.value },
      };
      setMeasure(newMeasure);
    }

    const tmpMonth = "202112";
    const updateKey = "measuringItem";
    updateMeasuredTime(user.uid, tmpMonth, newMeasure, updateKey);
  };
  const handleChangeMeasuringItemStartTime = (newValue: any) => {
    console.log(newValue._d.getTime());
    let newMeasure: any = {};
    newMeasure = {
      ...measure,
      measuringItem: {
        ...measure.measuringItem,
        start: newValue._d.getTime(),
      },
    };
    setMeasure(newMeasure);

    const tmpMonth = "202112";
    const updateKey = "measuringItem";
    updateMeasuredTime(user.uid, tmpMonth, newMeasure, updateKey);
  };

  const deleteMeasuringItem = () => {
    setMeasure({
      ...measure,
      measuringItem: {
        isActive: false,
        _id: null,
        name: null,
        start: null,
        end: null,
      },
    });
    toggleEditDialog();
  };

  /**
   * 上部固定アイテムの高さを取得
   */
  React.useEffect(() => {
    let height = 0;
    for (let fixedId of fixedIds) {
      console.log(fixedId);
      const ele = document.getElementById(fixedId);
      if (ele) height += ele.clientHeight;
    }
    setFixedHeight(height);
  }, []);

  /**
   * アイテム初期化系
   */
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
    const calculateTotalTimes = async (range?: any) => {
      let totalTimes: any = {};
      measure.times?.map((time: any) => {
        if (range) {
          const result: any = withinRange(time, range, "AND_OR");
          if (!result.start && result.end) {
            time = { ...time, start: new Date(time.start).setHours(24, 0, 0) };
          }
          if (!result.start && !result.end) return;
        }

        const duration = (time.end - time.start) / 1000;
        const _id = time["itemId"];
        const subItemId = time["subItemId"] || null;

        if (!totalTimes[_id]) totalTimes[_id] = {};

        if (subItemId) {
          totalTimes[_id][subItemId] = totalTimes[_id][subItemId]
            ? totalTimes[_id][subItemId] + duration
            : duration;
        } else {
          totalTimes[_id][_id] = totalTimes[_id][_id]
            ? totalTimes[_id][_id] + duration
            : duration;
        }
        totalTimes[_id].sum = totalTimes[_id].sum
          ? totalTimes[_id].sum + duration
          : duration;
        totalTimes.sum = totalTimes.sum ? totalTimes.sum + duration : duration;
      });
      setTotalTimes(totalTimes);
      console.log(totalTimes);
    };

    const range = {
      start: new Date().setHours(0, 0, 0),
      end: new Date().setHours(24, 0, 0),
    };
    console.log(range);
    if (user) calculateTotalTimes(range);
  }, [measure.times]);

  React.useEffect(() => {
    console.log(measureHistory);
  }, [measureHistory]);

  /**
   * times初期化系
   */
  const renderMeasuredTimesTable = (response: any): void => {
    console.log(response);
    setMeasureHistory(response);
    setMeasure(response);
  };

  React.useEffect(() => {
    const tmpMonth = "202112";
    const init = async () => {
      await fetchMeasuredTime(user.uid, tmpMonth, renderMeasuredTimesTable);
    };
    if (user) init();
  }, [user]);

  return (
    <Container maxWidth="md" sx={{ pb: 4 }}>
      <div>
        {user !== null ? (
          <>
            {/* 計測中のアイテム変更ダイアログ */}
            <Dialog open={editDialog} onClose={closeEditDialog}>
              <DialogTitle>計測中アイテムを編集しよう！</DialogTitle>
              <DialogContent>
                <FormControl variant="standard" sx={{ p: 1 }} fullWidth>
                  <InputLabel>アイテム</InputLabel>
                  <Select
                    name="measuredItem"
                    value={measure.measuringItem?._id}
                    label="アイテム"
                    onChange={handleChangeMeasuringItem}
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
                      return selectItems;
                    })()}
                  </Select>
                </FormControl>
                <FormControl variant="standard" sx={{ p: 1 }} fullWidth>
                  <InputLabel>サブアイテム</InputLabel>
                  <Select
                    name="measuredSubItem"
                    value={measure.measuringItem?.subItemId}
                    label="サブアイテム"
                    onChange={handleChangeMeasuringItem}
                  >
                    {(() => {
                      const selectItems = [];
                      const result: any = items.find(
                        (item: any) => item["_id"] === measure.measuringItem._id
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
                <Box sx={{ py: 1 }}>
                  <LocalizationProvider
                    name="startTime"
                    dateAdapter={DateAdapterMoment as any}
                  >
                    <DesktopTimePicker
                      disableIgnoringDatePartForTimeValidation
                      maxTime={new Date().getTime()}
                      label="開始時間"
                      value={measure.measuringItem?.start}
                      onChange={handleChangeMeasuringItemStartTime}
                      renderInput={(params) => <TextField {...params} />}
                    />
                  </LocalizationProvider>
                </Box>
                <Divider sx={{ my: 1 }} />
                <TextField
                  margin="dense"
                  label="メモ"
                  type="text"
                  name="measuredItemMemo"
                  multiline
                  rows={2}
                  variant="filled"
                  fullWidth
                  value={measure.measuringItem?.memo}
                  onChange={handleChangeMeasuringItem}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={deleteMeasuringItem} sx={{ color: "red" }}>
                  削除
                </Button>
                <div style={{ flexGrow: 1 }} />
                <Button onClick={closeEditDialog}>閉じる</Button>
              </DialogActions>
            </Dialog>

            <Box
              id="top-container"
              display="flex"
              sx={{
                py: 2,
                px: 1,
              }}
            >
              <Box
                flexGrow={1}
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                {measure.measuringItem.isActive && (
                  <>
                    <Button
                      variant="text"
                      sx={{ py: 0, flexGrow: 1 }}
                      onClick={toggleEditDialog}
                    >
                      <Typography align="left" display="inline">
                        {measure.measuringItem.name}
                        {measure.measuringItem.subItemName &&
                          ` >> ${measure.measuringItem.subItemName}`}
                        <Typography align="left" display="inline">
                          ：
                        </Typography>
                      </Typography>
                      <Typography align="left" display="inline">
                        {measure.measuringItem.start &&
                          formatDate(measure.measuringItem.start, "hh:mm")}
                        ~
                      </Typography>
                    </Button>
                  </>
                )}
              </Box>
              <IconButton aria-label="logout" onClick={handleLogout}>
                <LogoutIcon />
              </IconButton>
            </Box>

            <Box sx={{ width: "100%" }}>
              <Box
                id="tab-container"
                sx={{ borderBottom: 1, borderColor: "divider" }}
              >
                <Tabs
                  value={value}
                  onChange={handleChange}
                  aria-label="basic tabs example"
                >
                  <Tab label="Measure" {...a11yProps(0)} />
                  <Tab label="History" {...a11yProps(1)} />
                  <Tab label="Calendar" {...a11yProps(2)} />
                </Tabs>
              </Box>
              <SwipeableViews
                axis={theme.direction === "rtl" ? "x-reverse" : "x"}
                index={value}
                onChangeIndex={handleChangeIndex}
              >
                <TabPanel value={value} index={0} dir={theme.direction}>
                  <MeasuredItems />
                </TabPanel>
                <TabPanel value={value} index={1} dir={theme.direction}>
                  <MeasuredTimesTable />
                </TabPanel>
                <TabPanel value={value} index={2} dir={theme.direction}>
                  <Calendar />
                </TabPanel>
              </SwipeableViews>
            </Box>
          </>
        ) : (
          <>
            <h1>Wellcome to Timer App!</h1>
            <Button onClick={handleLogin}>ログイン</Button>
          </>
        )}
      </div>
    </Container>
  );
}
