import * as React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Button } from "@mui/material";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import { useUser, login, logout } from "@/src/lib/auth";
import { formatDate } from "@/src/lib/utils";
import MeasuredItems from "@/src/components/MeasuredItems";
import MeasuredTimesTable from "@/src/components/MeasuredTimesTable";
import { measure as measureAtom } from "@/src/recoilAtoms";
import { useRecoilValue } from "recoil";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
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
  // const [measure, setMeasure] = useRecoilState(measureAtom);
  const measure = useRecoilValue(measureAtom);

  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    console.log(event)
    setValue(newValue);
  };

  const handleLogin = (): void => {
    login().catch((error) => console.error(error));
  };

  const handleLogout = (): void => {
    logout().catch((error) => console.error(error));
  };

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
                </Tabs>
              </Box>
              <TabPanel value={value} index={0}>
                <MeasuredItems />
              </TabPanel>
              <TabPanel value={value} index={1}>
                <MeasuredTimesTable />
              </TabPanel>
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
