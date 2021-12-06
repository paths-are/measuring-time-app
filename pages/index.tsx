import * as React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Button } from "@mui/material";

import { useUser, login, logout } from "@/src/lib/auth";
import { formatDate } from "@/src/lib/utils";
import MeasuredItems from "@/src/components/MeasuredItems";
import MeasuredTimesTable from "@/src/components/MeasuredTimesTable";
import { measure as measureAtom } from "@/src/recoilAtoms";
import { useRecoilValue } from "recoil";

export default function Index() {
  const user: any = useUser();
  // const [measure, setMeasure] = useRecoilState(measureAtom);
  const measure = useRecoilValue(measureAtom);

  const handleLogin = (): void => {
    login().catch((error) => console.error(error));
  };

  const handleLogout = (): void => {
    logout().catch((error) => console.error(error));
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
                  計測中のアイテム：{measure.measuringItem.name}
                </Typography>
                <Typography align="center">
                  開始時間：
                  {measure.measuringItem.start
                    ? formatDate(measure.measuringItem.start, "hh:mm")
                    : null}
                </Typography>
              </Box>
              <MeasuredItems />
              <MeasuredTimesTable />
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
