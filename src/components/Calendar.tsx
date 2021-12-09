import Paper from "@material-ui/core/Paper";
import { ViewState } from "@devexpress/dx-react-scheduler";
import {
  Scheduler,
  DayView,
  Appointments,
} from "@devexpress/dx-react-scheduler-material-ui";
import { useRecoilValue } from "recoil";
import { measure as measureAtom, measuredItems } from "@/src/recoilAtoms";

const MeasuredItems = () => {
  const measure = useRecoilValue(measureAtom);
  const items = useRecoilValue(measuredItems);

  return (
    <Paper>
      <Scheduler
        data={measure.times.map((time: any) => {
          const result: any = items.find(
            (item: any) => item["_id"] === time.itemId
          );
          return {
            startDate: time.start,
            endDate: time.end,
            title: result?.name,
          };
        })}
      >
        <ViewState />
        <DayView />
        <Appointments />
      </Scheduler>
    </Paper>
  );
};
export default MeasuredItems;
