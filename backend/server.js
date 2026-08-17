const express = require("express");
const cors = require("cors");

const employeeRoutes = require("./routes/employees.routes");
const assignmentHistoryRouter =
  require("./routes/assignmentHistory");
  const assignmentRoutes =
  require("./routes/assignments");
  const configRoutes =
  require("./routes/config.routes");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/assignment-history", assignmentHistoryRouter);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/config", configRoutes);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(` API running on http://localhost:${PORT}`);
});