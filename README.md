## node-gpt
NodeGPT arose of my need to use LLM-based chatbots in a terminal without wasting the time to open a heavy browser or to switch screens. The application is lightweight and keeps one separate conversation history per process.

The script uses the newer chat API from OpenAI and is preconfigured to use the GPT-4 model.

## Installation
To use it on UNIX-based systems, all you need to do is have NodeJS installed and run 'add_to_path.sh'.

## Usage and Examples
First off, be sure to configure your API key in your script.

The operating principle is very simple. Call the program, wait for a response and answer at will.
`ask "Hi there"` - Prompts the model.

`ask` - Displays a JSON of the current conversation state.

`ask | jq '.[].content'` - Parses the conversation with jq to display only the text of the messages.

`cat some_file.c | ask "What does this code do?"` - Parses file then question passed as argument.
