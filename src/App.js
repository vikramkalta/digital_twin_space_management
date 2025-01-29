import "./App.css";
import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import Papa from "papaparse";

import { Model } from "./assets/Model";

function App() {
  const [visibleFloor, setVisibleFloor] = useState("all"); // Default to ground floor
  const [data, setData] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("Select All");
  const [selectedKPI, setSelectedKPI] = useState("CO2"); // Default KPI
  const [kpiValue, setKpiValue] = useState(0);
  const [mode, setMode] = useState("Historical"); // Modes: "Historical", "Forecast"
  const [forecastData, setForecastData] = useState([]);

  // Thresholds for alerts
  const thresholds = {
    CO2: 1000, // CO2 threshold
    Humidity: [30, 60], // Humidity range
    Temperature: [17, 23], // Temperature range
    Occupancy: 50, // Occupancy threshold
    SpaceUtil: [0, 30],
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/forecast_data.csv");
        const text = await response.text();
        const parsedData = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        }).data;
        setForecastData(parsedData);
      } catch (error) {
        console.log("Error in fetchData[forecast]", error);
      }
    };
    fetchData();
  }, []);

  // Load data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/iaq_with_utilization.csv");
        const text = await response.text();
        const parsedData = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        }).data;
        // Process data: extract CO2 values and month
        const dataWithMonths = parsedData.map((row) => {
          const date = new Date(row.start_time); // Ensure the date field exists and is valid
          return {
            co2: parseInt(row.co2),
            humidity: parseInt(row.humidity),
            temperature: parseInt(row.temp),
            occupancy: parseInt(row.Occupancy),
            spaceutil: parseInt(row.SpaceUtil * 100),
            month: date.toLocaleString("default", { month: "long" }), // Extract month name
            rowDate: row.date,
          };
        });

        const uniqueMonths = [
          "Select All",
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ]; // get unique months

        setData(dataWithMonths);
        setMonths(uniqueMonths);
      } catch (error) {
        console.log("Error in fetchData", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (data.length > 0) updateKpiValue();
  }, [data, selectedMonth, selectedKPI, mode]);

  useEffect(() => {
    if (mode === "Historical") {
      return;
    }
    console.log("kpiValue", kpiValue);
    // Check for threshold breaches and show alerts
    if (selectedKPI === "CO2" && kpiValue > thresholds.CO2) {
      alert(`CO2 value (${kpiValue.toFixed(2)}). Needs attention.`);
    } else if (
      selectedKPI === "Humidity" &&
      (kpiValue < thresholds.Humidity[0] || kpiValue > thresholds.Humidity[1])
    ) {
      alert(`Humidity value (${kpiValue.toFixed(2)}%). Needs attention.`);
    } else if (
      selectedKPI === "Temperature" &&
      (kpiValue < thresholds.Temperature[0] ||
        kpiValue > thresholds.Temperature[1])
    ) {
      alert(`Temperature value (${kpiValue.toFixed(2)}°C). Needs attention.`);
    } else if (selectedKPI === "Occupancy" && kpiValue > thresholds.Occupancy) {
      alert(`Occupancy value (${kpiValue.toFixed(2)}). Needs attention.`);
    }
  }, [kpiValue]);

  const updateKpiValue = () => {
    let filteredData = [];
    if (mode === "Historical") {
      filteredData =
        selectedMonth === "Select All"
          ? data
          : data.filter((row) => row.month === selectedMonth);
      const avgHistorical =
        filteredData.reduce((sum, row) => {
          const value = row[selectedKPI.toLowerCase()];
          return sum + (value !== "" && !isNaN(value) ? parseFloat(value) : 0);
        }, 0) / filteredData.length;

      setKpiValue(avgHistorical || 0);
    } else {
      const avgForecast =
        forecastData.reduce((sum, row) => {
          const value = row[selectedKPI];
          return sum + (value !== "" && !isNaN(value) ? parseFloat(value) : 0);
        }, 0) / forecastData.length;
      setKpiValue(avgForecast || 0);
    }
  };

  return (
    <div className="App">
      <div className="floor-selector">
        <button
          className={`tile ${visibleFloor === "all" ? "active" : ""}`}
          onClick={() => setVisibleFloor("all")}
        >
          All Floors
        </button>
        <button
          className={`tile ${visibleFloor === "1st" ? "active" : ""}`}
          onClick={() => setVisibleFloor("1st")}
        >
          1st Floor
        </button>
        <button
          className={`tile ${visibleFloor === "2nd" ? "active" : ""}`}
          onClick={() => setVisibleFloor("2nd")}
        >
          2nd Floor
        </button>
      </div>
      <div className="kpi-selector">
        {["CO2", "Humidity", "Temperature", "Occupancy", "SpaceUtil"].map((kpi) => (
          <button
            key={kpi}
            className={`tile ${selectedKPI === kpi ? "active" : ""}`}
            onClick={() => setSelectedKPI(kpi)}
          >
            {kpi}
          </button>
        ))}
      </div>
      {mode === "Historical" ? (
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="month-dropdown"
        >
          {months.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      ) : null}

      <Canvas camera={{ fov: 18 }}>
        <ambientLight intensity={1.25} />
        <Suspense fallback={null}>
          <Model
            kpi={selectedKPI}
            value={kpiValue}
            visibleFloor={visibleFloor}
          />
        </Suspense>
        <Environment preset="sunset" />
        <OrbitControls />
      </Canvas>
    </div>
  );
}

export default App;
