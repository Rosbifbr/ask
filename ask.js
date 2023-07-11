#!/usr/bin/node
const https = require('https')
const fs = require('fs')

//Settings
const API_KEY = ""
const TRANSCRIPT_PATH = `/tmp/gpt_transcript-${process.ppid}`

const MODEL = "gpt-4"
const HOST = "api.openai.com"
const ENDPOINT = "/v1/chat/completions"
const MAX_TOKENS = 2048
const TEMPERATURE = 0.6

//Globals
var input = process.argv[2]
var conversation_state = {}
var answer

const init = () => {
  if (API_KEY == "") throw ("Missing API key! Add one to the script and try again.")
  if (fs.existsSync(TRANSCRIPT_PATH)){
    conversation_state = JSON.parse(fs.readFileSync(TRANSCRIPT_PATH, 'utf-8'))
  }
  else {
    conversation_state = {
      'model': MODEL,
      "messages": [
        {
          'role':'system',
          'content':'You are a very advanced assistant AI. You are talking to a power user.'
        }
      ],
    }
  }

  switch(input){
    case undefined:
        showHistory()
        break;
    default:
        performRequest()
        break;
  }
}

const showHistory = () => {
	console.log(JSON.stringify(conversation_state['messages'], null, 2))
}

//Chat functions.
const processResponse = (data) => {
  try {
    answer = data.choices[0]
    console.log(answer['message']['content'])

    conversation_state['messages'].push(answer['message'])
    fs.writeFileSync(TRANSCRIPT_PATH, JSON.stringify(conversation_state))
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
  //Adding our message to state.
  conversation_state['messages'].push({
    'role': 'user',
    'content': input,
  })

  const body = JSON.stringify({
    messages: conversation_state['messages'],
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    user: 'new_user' //dinamyze
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