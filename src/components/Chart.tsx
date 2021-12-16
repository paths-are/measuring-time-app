import * as React from "react";
import { measuredItems, totalTimes as totalTimesAtom } from "@/src/recoilAtoms";
import { useRecoilValue } from "recoil";
import dynamic from "next/dynamic";
import { orgFloor, minutesToHours } from "@/src/lib/utils";

const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false });

const ChartComponent = () => {
  const items = useRecoilValue(measuredItems);
  const totalTimes = useRecoilValue(totalTimesAtom);
  const [options, setOptions] = React.useState({
    chart: {
      id: "apexchart-example",
    },
    yaxis: {
      labels: {
        formatter: function (value: number) {
          return orgFloor(value, 2);
        },
      },
    },
    xaxis: {
      categories: [],
      labels: {
        formatter: function (value: number) {
          return value;
        },
      },
    },
  });
  const [series, setSeries] = React.useState<any>([]);

  React.useEffect(() => {
    let timeData: any = [];
    let xTitles: any = [];
    Object.keys(totalTimes).forEach((key) => {
      const result: any = items.find((item: any) => item["_id"] === key);
      if (key !== "sum") {
        let data = minutesToHours(totalTimes[key].sum / 60);
        if (data >= 1) {
          data = orgFloor(data, 1);
        } else {
          data = Math.floor(data * 100) / 100;
        }
        timeData.push(data);
        xTitles.push(result?.name);
      }
    });
    setSeries([{ name: "testData", data: timeData }]);
    setOptions({
      ...options,
      xaxis: {
        ...options.xaxis,
        categories: xTitles,
      },
    });
  }, []);

  return <ApexCharts options={options as any} series={series} type="bar" />;
};
export default ChartComponent;
