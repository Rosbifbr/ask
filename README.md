## node-gpt
Node GPT arose of my need to use LLM-based chatbots in a terminal without wasting the time to open a heavy browser or to switch screens. The application is light, fast and keeps one separate conversation history per terminal.

## Installation
To use it on UNIX-based systems, all you need to do is have a node binary installed and run 'add_to_path.sh'.

## Usage
The application is of very simple usage. Call it with the 'ask' command and pass a string argument, such as in:
```
ask "What are the top 5 partition editors in linux?"
```

You may customize the application by editing the ask.js file and setting custom values for:

INTERNAL_PROMPT - String that will be prepended to each session on it's start
PRE_PROMPT - String that will be prepended to each user input

These prompts allow for an easier setup and steering of the model into a 'chat mode', such as in:

```
INTERNAL_PROMPT = "This is a transcript of a converation between BOB, a very intelligent, helpful and ethical LLM and a human user.\nBOB: How may I help you today?\n"
PRE_PROMPT = "HUMAN:"
```
