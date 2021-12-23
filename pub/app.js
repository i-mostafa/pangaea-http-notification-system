const express = require("express");
const {
  catchAsync,
  sendNotification,
  logger,
  validateSubscriber,
} = require("./utils");

const app = express();

// init a subscribers array to store all subscribers
// On real app this would be stored in a database or redis cache
app.set("subscribers", []);

// middleware to parse incoming json
app.use(express.json());

/**
 * route to subscribe to a topic
 */
app.post("/subscribe/:topic", validateSubscriber, (req, res) => {
  const { topic } = req.params;
  const { url } = req.body;

  const subscribers = app.get("subscribers");

  // create a new topic if it doesn't exist
  if (!subscribers[topic]) {
    // it's better to use object here not array in order to prevent duplicate subscribers for the same topic (same url)
    subscribers[topic] = {};
  }

  // add subscriber to the topic subscribers array if it doesn't exist
  if (!subscribers[topic][url]) {
    subscribers[topic][url] = true;
    logger(`New subscriber added to ${topic} topic: ${url}`);
  }

  res.send({
    url,
    topic,
  });
});

// route to publish a message to a topic
app.post(
  "/publish/:topic",
  catchAsync(async (req, res) => {
    const { topic } = req.params;

    const subscribers = app.get("subscribers");
    const topicSubscribers = subscribers[topic];

    const progress = await sendNotification(topicSubscribers, req.body);

    // check if there is any failed subscribers
    // TODO: add a retry mechanism to send notifications to failed subscribers

    if (progress.failed.length > 0)
      res.status(500).send({
        message: `Failed to send notifications to ${progress.failed.length} subscriber(s)`,
        progress,
      });
    else
      res.send({
        message: "Notifications sent to all subscribers successfully",
      });
  })
);

app.listen(8000, () => {
  console.log("SubServer listening on port 8000");
});
