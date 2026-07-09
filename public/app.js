const notepad = document.getElementById('notepad');
let waitingForAnswer = false;

function getPrompt() {
  const selectedText = notepad.value.slice(notepad.selectionStart, notepad.selectionEnd).trim();
  return selectedText || notepad.value.trim();
}

function appendAnswer(answer) {
  const separator = notepad.value.endsWith('\n') || notepad.value.length === 0 ? '' : '\n';
  notepad.value = `${notepad.value}${separator}${answer}`;
  notepad.selectionStart = notepad.value.length;
  notepad.selectionEnd = notepad.value.length;
}

async function requestAnswer() {
  if (waitingForAnswer) {
    return;
  }

  const prompt = getPrompt();
  if (!prompt) {
    return;
  }

  waitingForAnswer = true;
  notepad.readOnly = true;

  try {
    const response = await fetch('/api/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'The assistant could not answer right now.');
    }

    appendAnswer(payload.text);
  } catch (error) {
    appendAnswer(error.message);
  } finally {
    waitingForAnswer = false;
    notepad.readOnly = false;
    notepad.focus();
  }
}

notepad.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    requestAnswer();
  }
});
