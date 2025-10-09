let embedCount = 0;
let files = [];
let isPreviewVisible = true;
const API_URL = 'https://vanprojects.netlify.app/.netlify/functions/embeds';

const templates = {
  welcome: {
    title: 'Welcome to Our Server!',
    description: 'Thank you for joining us! Here’s what you need to know...',
    color: 0x00ff00,
    fields: [
      { name: 'Rules', value: 'Follow our community guidelines.', inline: true },
      { name: 'Events', value: 'Check out our upcoming events!', inline: true },
    ],
    footer: { text: 'Server Team' },
    timestamp: new Date().toISOString(),
  },
  announcement: {
    title: 'Big Announcement!',
    description: 'We have exciting news to share...',
    color: 0xff0000,
    author: { name: 'Server Admin', icon_url: 'https://example.com/icon.png' },
    thumbnail: { url: 'https://example.com/thumbnail.png' },
  },
};

async function fetchLiveUses() {
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const embeds = await response.json();
    const liveUsesDiv = document.getElementById('liveUses');
    if (!liveUsesDiv) throw new Error('Live Uses container not found');
    liveUsesDiv.innerHTML = embeds.length
      ? embeds.map(embed => `
          <div class="bg-gray-700 rounded-lg p-4 animate-fadeIn">
            <p class="text-gray-400 text-sm mb-2">Posted ${new Date(embed.created_at).toLocaleString()}</p>
            <div class="preview-embed p-4 mb-2">
              ${embed.payload.content ? `<p class="text-gray-300 mb-3">${parseDiscordMarkdown(embed.payload.content)}</p>` : ''}
              ${embed.payload.embeds?.map((e, i) => `
                <div style="border-left: 4px solid ${e.color ? '#' + e.color.toString(16).padStart(6, '0') : '#5865f2'};">
                  ${e.title ? `<h3 class="font-bold text-lg mb-1 text-white">${parseDiscordMarkdown(e.title)}</h3>` : ''}
                  ${e.description ? `<p class="text-gray-300 mb-3">${parseDiscordMarkdown(e.description)}</p>` : ''}
                  ${e.thumbnail?.url ? `<img src="${e.thumbnail.url}" alt="Thumbnail" class="w-20 h-20 object-cover rounded mb-3 float-right" onerror="this.style.display='none'">` : ''}
                  ${e.image?.url ? `<img src="${e.image.url}" alt="Image" class="w-full h-auto rounded mb-3" onerror="this.style.display='none'">` : ''}
                  ${e.author?.name ? `
                    <div class="flex items-center mb-3">
                      ${e.author.icon_url ? `<img src="${e.author.icon_url}" alt="Author Icon" class="w-6 h-6 rounded-full mr-2" onerror="this.style.display='none'">` : ''}
                      <span class="font-semibold">${parseDiscordMarkdown(e.author.name)}</span>
                    </div>` : ''}
                  ${e.fields?.map(f => `
                    <div class="mb-2 ${f.inline ? 'field-inline' : ''}">
                      <div class="font-semibold text-white mb-1">${parseDiscordMarkdown(f.name)}</div>
                      <div class="text-gray-300">${parseDiscordMarkdown(f.value)}</div>
                    </div>
                  `).join('') || ''}
                  ${e.footer?.text || e.timestamp ? `
                    <div class="flex items-center mt-3 text-gray-400 text-sm">
                      ${e.footer?.icon_url ? `<img src="${e.footer.icon_url}" alt="Footer Icon" class="w-5 h-5 mr-2" onerror="this.style.display='none'">` : ''}
                      <span>${e.footer?.text ? parseDiscordMarkdown(e.footer.text) : ''}${e.footer?.text && e.timestamp ? ' | ' : ''}${e.timestamp ? new Date(e.timestamp).toLocaleString() : ''}</span>
                    </div>` : ''}
                </div>
              `).join('')}
            </div>
            <button onclick="useTemplate(${embed.id})" class="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors text-sm">
              <i class="fas fa-copy mr-2"></i>Use This Template
            </button>
          </div>
        `).join('')
      : '<p class="text-gray-400 italic">No recent embeds yet...</p>';
    console.log('Fetched Live Uses:', embeds.length);
  } catch (e) {
    console.error('Error in fetchLiveUses:', e.message);
    showNotification('error', `Failed to load Live Uses: ${e.message}`);
  }
}

async function useTemplate(embedId) {
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const embeds = await response.json();
    const embed = embeds.find(e => e.id === embedId);
    if (!embed) throw new Error('Embed not found');
    document.getElementById('content').value = embed.payload.content || '';
    document.getElementById('embedsContainer').innerHTML = '';
    embedCount = 0;
    embed.payload.embeds?.forEach(e => addEmbed(e));
    showNotification('success', 'Template loaded successfully!');
    updatePreview();
    console.log('Loaded template from Live Uses:', embedId);
  } catch (e) {
    console.error('Error in useTemplate:', e.message);
    showNotification('error', `Failed to load template: ${e.message}`);
  }
}

function formatText(type) {
  try {
    const textarea = document.activeElement;
    if (!textarea || !textarea.selectionStart) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) return;
    const selectedText = textarea.value.substring(start, end);
    let formattedText = selectedText;
    switch (type) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'strikethrough':
        formattedText = `~~${selectedText}~~`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'spoiler':
        formattedText = `||${selectedText}||`;
        break;
    }
    textarea.value = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    updatePreview();
    document.getElementById('textContextMenu').classList.add('hidden');
    console.log(`Formatted text as ${type}:`, selectedText);
  } catch (e) {
    console.error('Error in formatText:', e.message);
    showNotification('error', `Failed to format text: ${e.message}`);
  }
}

function showNotification(type, message) {
  const notification = document.createElement('div');
  notification.className = `notification ${type} animate-fadeIn`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.opacity = '1';
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }, 100);
}

function togglePreview() {
  isPreviewVisible = !isPreviewVisible;
  const preview = document.getElementById('preview');
  if (preview) {
    preview.style.display = isPreviewVisible ? 'block' : 'none';
    document.querySelector('button[onclick="togglePreview()"]').innerHTML = `<i class="fas fa-eye${isPreviewVisible ? '' : '-slash'} mr-2"></i>Toggle Preview`;
  }
}

function addEmbed(template = null) {
  embedCount++;
  const embedId = `embed-${embedCount}`;
  const embedDiv = document.createElement('div');
  embedDiv.id = embedId;
  embedDiv.className = 'mb-4 border-l-4 border-blue-400 pl-4';
  embedDiv.innerHTML = `
    <h3 class="text-lg font-semibold mb-2">Embed ${embedCount}</h3>
    <button onclick="removeEmbed('${embedId}')" class="text-red-400 hover:text-red-600 mb-2"><i class="fas fa-trash mr-1"></i>Remove Embed</button>
    <div class="mb-2">
      <label for="${embedId}-title" class="block text-sm font-medium mb-1">Title</label>
      <input type="text" id="${embedId}-title" placeholder="Embed title..." class="w-full">
    </div>
    <div class="mb-2">
      <label for="${embedId}-description" class="block text-sm font-medium mb-1">Description</label>
      <textarea id="${embedId}-description" rows="4" placeholder="Embed description..." class="w-full"></textarea>
    </div>
    <div class="mb-2">
      <label for="${embedId}-color" class="block text-sm font-medium mb-1">Color (Hex)</label>
      <input type="text" id="${embedId}-color" placeholder="#5865f2" class="w-full">
    </div>
    <div class="mb-2">
      <label for="${embedId}-author-name" class="block text-sm font-medium mb-1">Author Name</label>
      <input type="text" id="${embedId}-author-name" placeholder="Author name..." class="w-full">
    </div>
    <div class="mb-2">
      <label for="${embedId}-author-icon" class="block text-sm font-medium mb-1">Author Icon URL</label>
      <input type="url" id="${embedId}-author-icon" placeholder="Author icon URL..." class="w-full">
    </div>
    <div class="mb-2">
      <label for="${embedId}-thumbnail" class="block text-sm font-medium mb-1">Thumbnail URL</label>
      <input type="url" id="${embedId}-thumbnail" placeholder="Thumbnail URL..." class="w-full">
    </div>
    <div class="mb-2">
      <label for="${embedId}-image" class="block text-sm font-medium mb-1">Image URL</label>
      <input type="url" id="${embedId}-image" placeholder="Image URL..." class="w-full">
    </div>
    <div class="mb-2">
      <label for="${embedId}-footer-text" class="block text-sm font-medium mb-1">Footer Text</label>
      <input type="text" id="${embedId}-footer-text" placeholder="Footer text..." class="w-full">
    </div>
    <div class="mb-2">
      <label for="${embedId}-footer-icon" class="block text-sm font-medium mb-1">Footer Icon URL</label>
      <input type="url" id="${embedId}-footer-icon" placeholder="Footer icon URL..." class="w-full">
    </div>
    <div class="mb-2">
      <label for="${embedId}-timestamp" class="block text-sm font-medium mb-1">Timestamp</label>
      <input type="datetime-local" id="${embedId}-timestamp" class="w-full">
    </div>
    <div id="${embedId}-fields" class="mt-4"></div>
    <button onclick="addField('${embedId}')" class="w-full bg-blue-600 hover:bg-blue-700 mt-2"><i class="fas fa-plus mr-2"></i>Add Field</button>
  `;
  document.getElementById('embedsContainer').appendChild(embedDiv);

  if (template) {
    document.getElementById(`${embedId}-title`).value = template.title || '';
    document.getElementById(`${embedId}-description`).value = template.description || '';
    document.getElementById(`${embedId}-color`).value = template.color ? `#${template.color.toString(16).padStart(6, '0')}` : '';
    document.getElementById(`${embedId}-author-name`).value = template.author?.name || '';
    document.getElementById(`${embedId}-author-icon`).value = template.author?.icon_url || '';
    document.getElementById(`${embedId}-thumbnail`).value = template.thumbnail?.url || '';
    document.getElementById(`${embedId}-image`).value = template.image?.url || '';
    document.getElementById(`${embedId}-footer-text`).value = template.footer?.text || '';
    document.getElementById(`${embedId}-footer-icon`).value = template.footer?.icon_url || '';
    document.getElementById(`${embedId}-timestamp`).value = template.timestamp ? new Date(template.timestamp).toISOString().slice(0, 16) : '';
    if (template.fields) {
      template.fields.forEach(field => addField(embedId, field));
    }
  }

  document.querySelectorAll(`#${embedId} input, #${embedId} textarea`).forEach(input => {
    input.addEventListener('input', () => {
      console.log(`Input changed in ${embedId}`);
      updatePreview();
    });
  });

  updatePreview();
  console.log(`Added embed: ${embedId}`);
}

function removeEmbed(embedId) {
  const embedDiv = document.getElementById(embedId);
  if (embedDiv) {
    embedDiv.remove();
    updatePreview();
    console.log(`Removed embed: ${embedId}`);
  }
}

function addField(embedId, field = null) {
  const fieldId = `${embedId}-field-${Date.now()}`;
  const fieldDiv = document.createElement('div');
  fieldDiv.id = fieldId;
  fieldDiv.className = 'mb-2';
  fieldDiv.innerHTML = `
    <div class="flex items-center mb-1">
      <label for="${fieldId}-name" class="block text-sm font-medium mr-2">Field Name</label>
      <input type="text" id="${fieldId}-name" placeholder="Field name..." class="flex-1">
    </div>
    <div class="mb-1">
      <label for="${fieldId}-value" class="block text-sm font-medium mb-1">Field Value</label>
      <textarea id="${fieldId}-value" rows="2" placeholder="Field value..." class="w-full"></textarea>
    </div>
    <div class="flex items-center mb-1">
      <input type="checkbox" id="${fieldId}-inline" class="mr-2">
      <label for="${fieldId}-inline">Inline</label>
    </div>
    <button onclick="removeField('${fieldId}')" class="text-red-400 hover:text-red-600"><i class="fas fa-trash mr-1"></i>Remove Field</button>
  `;
  document.getElementById(`${embedId}-fields`).appendChild(fieldDiv);

  if (field) {
    document.getElementById(`${fieldId}-name`).value = field.name || '';
    document.getElementById(`${fieldId}-value`).value = field.value || '';
    document.getElementById(`${fieldId}-inline`).checked = field.inline || false;
  }

  document.querySelectorAll(`#${fieldId} input, #${fieldId} textarea`).forEach(input => {
    input.addEventListener('input', () => {
      console.log(`Field input changed in ${fieldId}`);
      updatePreview();
    });
  });

  updatePreview();
  console.log(`Added field: ${fieldId}`);
}

function removeField(fieldId) {
  const fieldDiv = document.getElementById(fieldId);
  if (fieldDiv) {
    fieldDiv.remove();
    updatePreview();
    console.log(`Removed field: ${fieldId}`);
  }
}

function handleFiles() {
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  files = Array.from(fileInput.files);
  fileList.innerHTML = files.length
    ? files.map((file, index) => `
        <div class="flex items-center justify-between bg-gray-700 p-2 rounded mb-1">
          <span class="text-sm">${file.name}</span>
          <button onclick="removeFile(${index})" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
        </div>
      `).join('')
    : '<p class="text-gray-400">No files selected</p>';
  updatePreview();
  console.log('Files updated:', files.map(f => f.name));
}

function removeFile(index) {
  files.splice(index, 1);
  handleFiles();
  showNotification('success', 'File removed successfully!');
  console.log(`Removed file at index ${index}`);
}

function parseDiscordMarkdown(text) {
  if (!text) return '';
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/__(.*?)__/g, '<u>$1</u>');
  text = text.replace(/~~(.*?)~~/g, '<s>$1</s>');
  text = text.replace(/`(.*?)`/g, '<code>$1</code>');
  text = text.replace(/\|\|(.*?)\|\|/g, '<span class="spoiler">$1</span>');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-400 hover:underline">$1</a>');
  return text;
}

function updatePreview() {
  try {
    const preview = document.getElementById('preview');
    if (!preview || !isPreviewVisible) return;

    const payload = generateJSON(false);
    if (!payload) return;

    let previewContent = files.length
      ? files.map(file => `
          <div class="mb-3">
            ${file.type.startsWith('image/') ? `<img src="${URL.createObjectURL(file)}" alt="${file.name}" class="w-full h-auto rounded">` : ''}
            ${file.type.startsWith('video/') ? `<video controls src="${URL.createObjectURL(file)}" class="w-full h-auto rounded"></video>` : ''}
            ${file.type.startsWith('audio/') ? `<audio controls src="${URL.createObjectURL(file)}" class="w-full"></audio>` : ''}
          </div>
        `).join('')
      : '';

    previewContent += payload.content ? `<p class="text-gray-300 mb-3">${parseDiscordMarkdown(payload.content)}</p>` : '';

    if (payload.embeds && payload.embeds.length) {
      previewContent += payload.embeds.map((embed, index) => `
        <div class="preview-embed mb-3" style="border-left-color: ${embed.color ? '#' + embed.color.toString(16).padStart(6, '0') : '#5865f2'}">
          ${embed.author?.name ? `
            <div class="flex items-center mb-3">
              ${embed.author.icon_url ? `<img src="${embed.author.icon_url}" alt="Author Icon" class="w-6 h-6 rounded-full mr-2" onerror="this.style.display='none'">` : ''}
              <span class="font-semibold">${parseDiscordMarkdown(embed.author.name)}</span>
            </div>` : ''}
          ${embed.title ? `<h3 class="font-bold text-lg mb-1 text-white">${parseDiscordMarkdown(embed.title)}</h3>` : ''}
          ${embed.description ? `<p class="text-gray-300 mb-3">${parseDiscordMarkdown(embed.description)}</p>` : ''}
          ${embed.thumbnail?.url ? `<img src="${embed.thumbnail.url}" alt="Thumbnail" class="w-20 h-20 object-cover rounded mb-3 float-right" onerror="this.style.display='none'">` : ''}
          ${embed.image?.url ? `<img src="${embed.image.url}" alt="Image" class="w-full h-auto rounded mb-3" onerror="this.style.display='none'">` : ''}
          ${embed.fields?.map(field => `
            <div class="mb-2 ${field.inline ? 'field-inline' : ''}">
              <div class="font-semibold text-white mb-1">${parseDiscordMarkdown(field.name)}</div>
              <div class="text-gray-300">${parseDiscordMarkdown(field.value)}</div>
            </div>
          `).join('') || ''}
          ${embed.footer?.text || embed.timestamp ? `
            <div class="flex items-center mt-3 text-gray-400 text-sm">
              ${embed.footer?.icon_url ? `<img src="${embed.footer.icon_url}" alt="Footer Icon" class="w-5 h-5 mr-2" onerror="this.style.display='none'">` : ''}
              <span>${embed.footer?.text ? parseDiscordMarkdown(embed.footer.text) : ''}${embed.footer?.text && embed.timestamp ? ' | ' : ''}${embed.timestamp ? new Date(embed.timestamp).toLocaleString() : ''}</span>
            </div>` : ''}
        </div>
      `).join('');
    }

    preview.innerHTML = previewContent || '<p class="text-gray-400">Nothing to preview yet...</p>';

    const jsonInput = document.getElementById('jsonInput');
    if (jsonInput) {
      jsonInput.value = JSON.stringify(payload, null, 2);
    }

    console.log('Preview updated');
  } catch (e) {
    console.error('Error in updatePreview:', e.message);
    showNotification('error', `Failed to update preview: ${e.message}`);
  }
}

function generateJSON(forSending = false) {
  try {
    const content = document.getElementById('content')?.value || '';
    const embeds = [];
    const embedContainer = document.getElementById('embedsContainer');
    if (!embedContainer) {
      console.error('Embeds container not found');
      return null;
    }

    const embedDivs = embedContainer.querySelectorAll('div[id^="embed-"]');
    embedDivs.forEach(embedDiv => {
      const embedId = embedDiv.id;
      const embed = {};
      const title = document.getElementById(`${embedId}-title`)?.value;
      const description = document.getElementById(`${embedId}-description`)?.value;
      const color = document.getElementById(`${embedId}-color`)?.value;
      const authorName = document.getElementById(`${embedId}-author-name`)?.value;
      const authorIcon = document.getElementById(`${embedId}-author-icon`)?.value;
      const thumbnail = document.getElementById(`${embedId}-thumbnail`)?.value;
      const image = document.getElementById(`${embedId}-image`)?.value;
      const footerText = document.getElementById(`${embedId}-footer-text`)?.value;
      const footerIcon = document.getElementById(`${embedId}-footer-icon`)?.value;
      const timestamp = document.getElementById(`${embedId}-timestamp`)?.value;

      if (title) embed.title = title;
      if (description) embed.description = description;
      if (color && color.match(/^#[0-9A-Fa-f]{6}$/)) {
        embed.color = parseInt(color.replace('#', ''), 16);
      }
      if (authorName) {
        embed.author = { name: authorName };
        if (authorIcon) embed.author.icon_url = authorIcon;
      }
      if (thumbnail) embed.thumbnail = { url: thumbnail };
      if (image) embed.image = { url: image };
      if (footerText) {
        embed.footer = { text: footerText };
        if (footerIcon) embed.footer.icon_url = footerIcon;
      }
      if (timestamp) embed.timestamp = new Date(timestamp).toISOString();

      const fields = [];
      const fieldContainer = document.getElementById(`${embedId}-fields`);
      if (fieldContainer) {
        const fieldDivs = fieldContainer.querySelectorAll('div[id^="' + embedId + '-field-"]');
        fieldDivs.forEach(fieldDiv => {
          const fieldId = fieldDiv.id;
          const name = document.getElementById(`${fieldId}-name`)?.value;
          const value = document.getElementById(`${fieldId}-value`)?.value;
          const inline = document.getElementById(`${fieldId}-inline`)?.checked;
          if (name && value) {
            fields.push({ name, value, inline: !!inline });
          }
        });
      }
      if (fields.length) embed.fields = fields;

      if (Object.keys(embed).length) {
        embeds.push(embed);
      }
    });

    const payload = {};
    if (content) payload.content = content;
    if (embeds.length) payload.embeds = embeds;

    if (forSending && Object.keys(payload).length === 0) {
      showNotification('error', 'Cannot send an empty payload!');
      return null;
    }

    return payload;
  } catch (e) {
    console.error('Error in generateJSON:', e.message);
    showNotification('error', `Failed to generate JSON: ${e.message}`);
    return null;
  }
}

async function sendToDiscord() {
  try {
    const webhookUrl = document.getElementById('webhookUrl')?.value;
    if (!webhookUrl || !/^https:\/\/(discord\.com|discordapp\.com|ptb\.discord\.com)\/api\/webhooks\/[0-9]+\/[A-Za-z0-9_-]+/.test(webhookUrl)) {
      showNotification('error', 'Please provide a valid Discord webhook URL!');
      return;
    }

    const payload = generateJSON(true);
    if (!payload) return;

    if (!payload.content && (!payload.embeds || payload.embeds.length === 0) && (!files || files.length === 0)) {
      showNotification('error', 'Please add content, embeds, or files before sending!');
      return;
    }

    if (files.length > 10) {
      showNotification('error', 'Maximum 10 files allowed');
      return;
    }

    // Save to Live Uses
    const saveResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    });
    if (!saveResponse.ok) {
      console.error('Failed to save to Live Uses:', saveResponse.status);
    } else {
      fetchLiveUses(); // Refresh Live Uses after saving
    }

    const filePromises = files.map(file => new Promise((resolve, reject) => {
      if (file.size > 8 * 1024 * 1024) {
        reject(new Error(`File ${file.name} exceeds 8MB limit`));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, data: reader.result.split(',')[1] });
      reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
      reader.readAsDataURL(file);
    }));

    Promise.all(filePromises)
      .then(fileData => {
        const proxyUrl = 'https://super-term-24c6.aivanleigh25-684.workers.dev';
        console.log('Sending payload to proxy:', payload, 'Files:', fileData.map(f => f.name));
        fetch(proxyUrl, {
          method: 'POST',
          body: JSON.stringify({ webhookUrl, payload: JSON.stringify(payload), files: fileData }),
          headers: { 'Content-Type': 'application/json' }
        })
          .then(async response => {
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Proxy error: ${response.status} - ${errorText}`);
            }
            showNotification('success', 'Message sent to Discord successfully!');
            console.log('Message sent to Discord via proxy:', webhookUrl);
          })
          .catch(error => {
            console.error('Fetch error in sendToDiscord:', error.message);
            showNotification('error', `Failed to send to Discord: ${error.message}`);
          });
      })
      .catch(error => {
        console.error('Error reading files:', error.message);
        showNotification('error', `Failed to process files: ${error.message}. Trying without attachments.`);
        const proxyUrl = 'https://super-term-24c6.aivanleigh25-684.workers.dev';
        fetch(proxyUrl, {
          method: 'POST',
          body: JSON.stringify({ webhookUrl, payload: JSON.stringify(payload), files: [] }),
          headers: { 'Content-Type': 'application/json' }
        })
          .then(async response => {
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Proxy error: ${response.status} - ${errorText}`);
            }
            showNotification('success', 'Message sent to Discord successfully (without files)!');
            console.log('Message sent to Discord via proxy (no files):', webhookUrl);
          })
          .catch(error => {
            console.error('Fetch error in sendToDiscord (no files):', error.message);
            showNotification('error', `Failed to send to Discord: ${error.message}`);
          });
      });
  } catch (e) {
    console.error('Error in sendToDiscord:', e.message);
    showNotification('error', `Failed to send to Discord: ${e.message}`);
  }
}

function toggleEmojiPicker(pickerId) {
  const picker = document.getElementById(pickerId);
  if (!picker) return;
  picker.classList.toggle('hidden');
  if (!picker.classList.contains('hidden') && !picker.innerHTML) {
    const emojis = ['😀', '😂', '😍', '😎', '🥳', '😢', '😡', '👍', '👎', '❤️', '🔥', '🌟'];
    picker.innerHTML = emojis.map(emoji => `<button onclick="insertEmoji('${pickerId}', '${emoji}')">${emoji}</button>`).join('');
  }
}

function insertEmoji(pickerId, emoji) {
  const textarea = document.getElementById(pickerId.replace('EmojiPicker', ''));
  if (textarea) {
    textarea.value += emoji;
    textarea.focus();
    updatePreview();
  }
  document.getElementById(pickerId).classList.add('hidden');
}

function applyTemplate(templateName) {
  const template = templates[templateName];
  if (template) {
    document.getElementById('embedsContainer').innerHTML = '';
    embedCount = 0;
    addEmbed(template);
    showNotification('success', `Applied ${templateName} template!`);
    console.log(`Applied template: ${templateName}`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('DOM loaded, initializing...');
    addEmbed();
    setupEmojiPicker('contentEmojiPicker');
    fetchLiveUses(); // Load Live Uses on page load

    const webhookUrl = document.getElementById('webhookUrl');
    if (webhookUrl) webhookUrl.oninput = () => {
      console.log('Webhook URL input');
      updatePreview();
    };
    const content = document.getElementById('content');
    if (content) content.oninput = () => {
      console.log('Content input');
      updatePreview();
    };
    const jsonInput = document.getElementById('jsonInput');
    if (jsonInput) jsonInput.oninput = () => {
      console.log('JSON input');
      updatePreview();
    };
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.onchange = () => {
      console.log('File input changed');
      handleFiles();
    };

    // Text formatting context menu
    const textareas = document.querySelectorAll('textarea');
    const contextMenu = document.getElementById('textContextMenu');
    textareas.forEach(textarea => {
      textarea.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (textarea.selectionStart !== textarea.selectionEnd) {
          contextMenu.style.top = `${e.clientY}px`;
          contextMenu.style.left = `${e.clientX}px`;
          contextMenu.classList.remove('hidden');
        }
      });
    });
    document.addEventListener('click', (e) => {
      if (!contextMenu.contains(e.target)) {
        contextMenu.classList.add('hidden');
      }
    });

    updatePreview();
  } catch (e) {
    console.error('Error in DOMContentLoaded:', e.message);
    showNotification('error', `Failed to initialize: ${e.message}`);
  }
});
