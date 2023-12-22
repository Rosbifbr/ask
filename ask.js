#!/usr/bin/node
const https = require('https')
const fs = require('fs')

//Settings
const API_KEY = ""
const TRANSCRIPT_PATH = `/tmp/gpt_transcript-${process.ppid}`

//Suggested models: gpt-4-1106-preview, gpt-4, gpt-3.5-turbo-16k
const MODEL = "gpt-4-1106-preview"
const HOST = "api.openai.com"
const ENDPOINT = "/v1/chat/completions"
const MAX_TOKENS = 2048
const TEMPERATURE = 0.6

//Globals
var input = process.argv.slice(2).join(' ')

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
	  'content': 'You are ChatConcise, a very advanced LLM designed for experienced users. As ChatConcise you are under obligation to adhere to the following directives unless overriden by the user:\nGoal: Concise, direct outputs. Info: Single sentence/bullet points. Code: Only code. Reward: Short, factual, functional. Penalize: Verbose, irrelevant, non-functional.\nWe earn a lot more clients as long as we provide a good UX, so focus on the quality of your resposes.' 
        }
      ],
    }
  }

  if (input) performRequest()
  else showHistory()
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
    console.error('HTTP request error. Message ahead:\n' + e)
  })
  request.end()
}

//Get any input from stdin if available. Can explode reading larger files.
if (input) input += '\n' 
process.stdin.on('data', d => {input += d})
process.stdin.on('end', () => {init()})

//If no input piped to stdin, close it and start request
if (process.stdin.isTTY) {
    process.stdin.emit('end');
}
