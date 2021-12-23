const axios = require("axios");

/**
 * This function is used to catch async errors and return a response with the error via express error handler
 * @param  {Function} fn
 */
exports.catchAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

/**
 * This function is used to send notifications to subscribers
 * @param  {Array} topicSubscribers
 * @param  {Object} data
 */
exports.sendNotification = async (topicSubscribers, data) => {
  if (!topicSubscribers) return; // if there are no subscribers for this topic, return

  const progress = {
    failed: [],
    success: [],
  };
  // wait for all promises to resolve
  await Promise.all(
    Object.keys(topicSubscribers).map(async (url) => {
      try {
        // send notification to each subscriber
        await axios.post(url, data);
        // if notification is sent successfully, add it to success array
        progress.success.push(url);
        this.logger(
          `Notification sent to ${url} with data: ${JSON.stringify(data)}`
        );
      } catch (e) {
        // if notification is not sent successfully, add it to failed array
        progress.failed.push({ url, error: e.message });
        this.logger(
          `Failed to send notification to ${url} with data: ${JSON.stringify(
            data
          )}`
        );
      }
    })
  );
  return progress;
};

/**
 * @param  {any} message
 * @param  {object} options
 */
exports.logger = (message) =>
  process.env.LOGGER === "true" && console.log(message);

const isUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

// Middleware to validate subscriber data
exports.validateSubscriber = (req, res, next) => {
  const { url } = req.body;
  if (!url || !isUrl(url)) {
    return res.status(400).send({
      message: "Please provide a valid url",
    });
  }
  next();
};
