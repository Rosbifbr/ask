#!/usr/bin/node
import fetch from 'node-fetch'
import fs from 'fs'

//Settings
const DEBUG = false //Does very little as of now.
const API_KEY = ""
const TRANSCRIPT_PATH = `/tmp/gpt_transcript-${process.ppid}`

//Model parameters
const MODEL = "text-davinci-003"
const ENDPOINT = "https://api.openai.com/v1/completions"
const MAX_TOKENS = 2048
const TEMPERATURE = 0.6

var input = process.argv[2]
var answer

const init = () => {
  if (API_KEY == "") throw ("Missing API key! Add one to the script and try again.")
  if (DEBUG) console.log(`Prompting ${MODEL} with "${input}"`)
  
  if (fs.existsSync(TRANSCRIPT_PATH)){
    input = fs.readFileSync(TRANSCRIPT_PATH, 'utf-8') + input
  }

  performRequest()
}

const processResponse = (data) => {
  try {
    answer = data.choices[0]['text']
    console.log(answer)

    let present_state = input + answer + '\n'
    fs.writeFileSync(TRANSCRIPT_PATH, present_state)
  }
  catch (e) {
    console.error('Error processing API return. Full response ahead:\n' +
      JSON.stringify(data, null, 2) +
      "Full error:" + e
    )
  }

  process.exit()
}

const performRequest = () => {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + API_KEY,
    },
    body: JSON.stringify({
      prompt: input,
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE
    }),
  }

  //Phoning home. TODO:Check if the other endpoints are supported.
  fetch(ENDPOINT, options)
    .then((response) => response.json())
    .then(processResponse)
    .catch((e) => {
      console.error('Fetch request error. Message ahead:\n' + e)
    })
}

init()