import * as React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Button } from "@mui/material";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import { useUser, login, logout } from "@/src/lib/auth";
import { fetchMeasuredItem, fetchMeasuredTime } from "@/src/lib/firestore";
import { formatDate } from "@/src/lib/utils";
import MeasuredItems from "@/src/components/MeasuredItems";
import MeasuredTimesTable from "@/src/components/MeasuredTimesTable";
import Calendar from "@/src/components/Calendar";
import {
  measuredItems,
  totalTimes as totalTimesAtom,
  measure as measureAtom,
} from "@/src/recoilAtoms";
import { useRecoilState, useSetRecoilState } from "recoil";
import SwipeableViews from "react-swipeable-views";
import { useTheme } from "@mui/material/styles";

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: { xs: 1, sm: 3 } }}>{children}</Box>}
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
  const [value, setValue] = React.useState(0);
  const theme = useTheme();
  const [measure, setMeasure] = useRecoilState(measureAtom);
  const setItems = useSetRecoilState(measuredItems);
  const setTotalTimes = useSetRecoilState(totalTimesAtom);

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
   * times初期化系
   */
  const renderMeasuredTimesTable = (response: any): void => {
    const today = formatDate(new Date(), "YYYYMMDD");
    // const today = formatDate(new Date(), "2021/12/08 00:11:11");
    if (today in response) {
      console.log(today)
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
    <Container maxWidth="sm" sx={{ pb: 4 }}>
      <div>
        {user !== null ? (
          <>
            <Box sx={{ display: "flex" }}>
              <h1>Timer App</h1>
              <div style={{ flexGrow: 1 }} />
              <Button onClick={handleLogout}>ログアウト</Button>
            </Box>

            <Box>
              <Typography align="center">
                計測中のアイテム：{measure.measuringItem.name}
              </Typography>
              <Typography align="center">
                開始時間：
                {measure.measuringItem.start
                  ? formatDate(measure.measuringItem.start, "hh:mm")
                  : null}
              </Typography>
            </Box>
            <Box sx={{ width: "100%" }}>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
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
