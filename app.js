const PORT = 8000;
const fetch = require("node-fetch");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { IamAuthenticator } = require("ibm-watson/auth");
const AssistantV2 = require("ibm-watson/assistant/v2");
const morgan = require("morgan");
const OPEN_AI_KEY = process.env.OPEN_AI_KEY;
const ASSISTANT_APIKEY = process.env.ASSISTANT_APIKEY;
const ASSISTANT_URL = process.env.ASSISTANT_URL;
const ASSISTANT_ID = process.env.ASSISTANT_ID;

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));


const assistant = new AssistantV2({
  version: "2021-04-01",
  authenticator: new IamAuthenticator({
    apikey: ASSISTANT_APIKEY,
  }),
  url: ASSISTANT_URL,
});

app.post("/request", async (req, res) => {
  const question = req.body.question;
  try {
    const answer = await fetchOpenAI(question);
    const response = await sendToWatsonAssistant(answer);
    res.send(response.result.output.generic[0].text);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Something went wrong" });
  }
});


app.post("/completions", async (req, res) => {
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPEN_AI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: req.body.message }],
      max_tokens: 100,
    }),
  };
  try {
    const answer = await fetch(
      "https://api.openai.com/v1/chat/completions",
      options
    );
    const response = await answer.json();
    res.send(response.choices[0].message.content);
  } catch (error) {
    console.error(error);
  }
});

async function fetchOpenAI(input) {
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPEN_AI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: input }],
      max_tokens: 100,
    }),
  };
  const response = awaitfetch(
    "https://api.openai.com/v1/chat/completions",
    options
  );
  const data = await response.json();
  return data.choices[0].message.content;
}

async function sendToWatsonAssistant(input) {
  const response = await assistant.message({
    input: { text: input },
    assistantId: ASSISTANT_ID,
  });
  return response;
}

app.listen(PORT, () => console.log("Your server is running on PORT " + PORT));
