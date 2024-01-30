#!/usr/bin/node
const https = require('https')
const fs = require('fs')
const readline = require('readline')

//Settings
const API_KEY = ""
const TRANSCRIPT_FOLDER = '/tmp'
const TRANSCRIPT_NAME= 'gpt_transcript-'
const TRANSCRIPT_PATH = `${TRANSCRIPT_FOLDER}/${TRANSCRIPT_NAME}${process.ppid}`

//Suggested models: gpt-4-1106-preview, gpt-4, gpt-3.5-turbo-16k
const MODEL = "gpt-4-1106-preview"
const HOST = "api.openai.com"
const ENDPOINT = "/v1/chat/completions"
const MAX_TOKENS = 2048
const TEMPERATURE = 0.6

//Colors
const WHITE_CYAN = "\u001b[37;46m";
const RESET = "\u001b[0m";

//Globals
var input = process.argv.slice(2).join(' ')

var conversation_state = {}
var answer

const init = async () => {
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
	  'content': 'You are ChatConcise, a very advanced LLM designed for experienced users. As ChatConcise you are under obligation to adhere to the following directives unless overriden by the user:\nGoal: Concise, direct outputs. Info: Single sentence/bullet points. Code: Only code. Reward: Short, factual, functional. Penalize: Verbose, irrelevant, non-functional.\nRemember to provide the best responses you can. The success of our company depends on you!' 
        }
      ],
    }
  }

  if (testOption('o') && process.argv.length < 4) await selectOngoingConvo()
  else if (testOption('c') && process.argv.length < 4) await clearCurrentConvo()
  else if (input) performRequest()
  else showHistory()
}

const testOption = (option) => {
	if (process.argv[2] && process.argv[2][0] == '-') return process.argv[2].includes(option)
        else return null
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


const readArrowKey = async () => {
	process.stdin.setRawMode(true);
	process.stdin.resume();
	process.stdin.setEncoding('utf8');

	return new Promise((resolve) => 
		process.stdin.on('data', key => {
		    if (key == '\u001B\u005B\u0041') resolve('up')
		    // else if (key == '\u001B\u005B\u0043') resolve('right')
	            else if (key == '\u001B\u005B\u0042') resolve('down'); 
		    // else if (key == '\u001B\u005B\u0044') resolve('left')
		    else if (key == '\u000D') resolve('enter') 
		    else if (key === '\u0003') process.exit()
		})
	)
}

const selectOngoingConvo = async () => {
	//Map files to struct
	let files = fs.readdirSync(TRANSCRIPT_FOLDER)
		.filter(e => e.includes(TRANSCRIPT_NAME))
		.map(e => {
			return {
				path: TRANSCRIPT_FOLDER + '/' + e,
				selected:false
			}
		})
	if (files[0]) files[0].selected = true

	while (true){
		//Draw files
		console.clear()
		for (let e of files) {
			let file_json = JSON.parse(fs.readFileSync(e.path,'utf8'))
			if (e.selected) process.stdout.write(WHITE_CYAN) 
			console.log(`${e.path} => `, file_json.messages[1].content.split('\n')[0].substr(0,64)) //Show first message
			if (e.selected) process.stdout.write(RESET) 
		}
		
		//treat new command
		let cmd = await readArrowKey()
		let curr = files.findIndex(e => e.selected)
		if (cmd == 'up' && files[curr -1]) {
			files[curr].selected = false
			files[curr - 1].selected = true
		}
		else if (cmd == 'down' && files[curr + 1]) {
			files[curr].selected = false
			files[curr + 1].selected = true
		}
		else if (cmd == 'enter') {
			let curr_file = fs.readFileSync(files[curr].path, 'utf8')
    			fs.writeFileSync(TRANSCRIPT_PATH, curr_file)
			process.exit(0)
		}
	}
}

const clearCurrentConvo = () => {
	fs.unlinkSync(TRANSCRIPT_PATH)
	process.exit(0)
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
process.stdin.on('end', async () => {
	await init()
})

//If no input piped to stdin, close it and start request
if (process.stdin.isTTY) {
    process.stdin.emit('end');
}
