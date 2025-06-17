const amqp = require("amqplib");
const logger = require("./logger");

//connection cause no connection
let connection = null;
//channel
let channel = null;

//unique exchange name
const EXCHANGE_NAME = "facebook_events";

const connectToRabbitMQ = async () => {
  try {
    //For connection you need url
    connection = await amqp.connect(process.env.RABBITMQ_URL);

    //For channel you need connection
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
    logger.info("Connected to rabbit mq");
    return channel;
  } catch (error) {
    logger.error("Error connecting to rabbitmq", error);
  }
};
//publish a event when deleting a post
//routing key is unique identifier
const publishEvent = async (routingKey, message) => {
  if (!channel) {
    await connectToRabbitMQ();
  }
  channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message))
  );
  logger.info("Event published", routingKey);
};

//Consume the delete the event

const consumeEvent = async (routingKey, callback) => {
  if (!channel) {
    await connectToRabbitMQ();
  }
  const queue = await channel.assertQueue("", {
    exclusive: true,
  });

  await channel.bindQueue(queue.queue, EXCHANGE_NAME, routingKey);
  channel.consume(queue.queue, (msg) => {
    if (!msg !== null) {
      const content = JSON.parse(msg.content.toString());
      callback(content);
      channel.ack(msg);
    }
  });
  logger.info(`Subcribe to event : ${routingKey}`);
};

module.exports = {
  connectToRabbitMQ,
  publishEvent,
  consumeEvent,
};
