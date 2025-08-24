const chatBox = document.getElementById("chatBox");
const input = document.getElementById("promptInput");
const sendBtn = document.getElementById("sendBtn");

function addMessage(text, sender) {
  const p = document.createElement("p");
  p.className = sender;
  if (sender === "user") {
    p.textContent = "You: " + text;
  } else {
    // Append creator credit
    p.innerHTML = "GPT: " + text + "<br><small style='color:gray;'>🤖 I was made by <b>Aivan Abanto</b> using a custom API.</small>";
  }
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const prompt = input.value.trim();
  if (!prompt) return;

  addMessage(prompt, "user");
  input.value = "";

  try {
    const res = await fetch(`https://urangkapolka.vercel.app/api/chatgpt4?prompt=${encodeURIComponent(prompt)}`);
    const data = await res.text(); // API might return text
    addMessage(data, "bot");
  } catch (err) {
    addMessage("Error: " + err.message, "bot");
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });
