#!/usr/bin/node
const https = require('https')
const fs = require('fs')

//Settings
const DEBUG = false //Does very little as of now.
const API_KEY = ""
const TRANSCRIPT_PATH = `/tmp/gpt_transcript-${process.ppid}`

//Model parameters
const MODEL = "text-davinci-003"
const HOST = "api.openai.com"
const ENDPOINT = "/v1/completions"
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

//TODO: Adapt to chat APIs
const performRequest = () => {
  const body = JSON.stringify({
    prompt: input,
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE
  })
  
  const options = {
    host: HOST,
    path: ENDPOINT,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + API_KEY,
    }
  }

  const request = https.request(options, (response) => {
    let data = ""
    response.on('data', (chunk) => {
      data += chunk
    })

    response.on('end', () => {
      processResponse(JSON.parse(data))
    })
  })
  request.write(body)
  request.on('error', (e) => {
    console.error('Fetch request error. Message ahead:\n' + e)
  })
  request.end()
}

init()