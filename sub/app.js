const express = require("express");

const app = express();

app.use(express.json());

app.post("/:topic", (req, res) => {
  const { topic } = req.params;
  console.log(
    `incoming message to topic: ${topic} with data: ${JSON.stringify(req.body)}`
  );
  res.send({
    status: "success",
  });
});

app.listen(9000, () => {
  console.log("SubServer listening on port 9000");
});
