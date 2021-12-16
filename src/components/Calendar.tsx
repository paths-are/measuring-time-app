import { useRecoilValue } from "recoil";
import { measure as measureAtom, measuredItems } from "@/src/recoilAtoms";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

const MyCalendar = () => {
  const measure = useRecoilValue(measureAtom);
  const items = useRecoilValue(measuredItems);
  return (
    <div>
      <Calendar
        localizer={localizer}
        events={measure.times.map((time: any) => {
          const item: any = items.find(
            (item: any) => item["_id"] === time.itemId
          );

          const subItem: any = time.subItemId
            ? item.subItems.find(
                (subItem: any) => subItem["_id"] === time.subItemId
              )
            : null;
          return {
            start: new Date(time.start),
            end: new Date(time.end),
            title: subItem ? subItem.name : item?.name,
          };
        })}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
      />
    </div>
  );
};

export default MyCalendar;
