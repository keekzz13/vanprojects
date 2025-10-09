let embedCount = 0;
let files = [];
let isPreviewVisible = true;
const API_URL = 'https://vanprojects.netlify.app/.netlify/functions/embeds';

const templates = {
    welcome: {
        content: "Welcome to our server! 🎉",
        embeds: [{
            title: "Welcome to Our Community!",
            description: "We're thrilled to have you here! Explore our channels and join the fun.",
            color: 0x57f287,
            thumbnail: { url: "https://i.imgur.com/sample-welcome.png" },
            fields: [
                { name: "Rules", value: "Read our rules in #welcome", inline: true },
                { name: "Roles", value: "Grab your roles in #roles", inline: true }
            ],
            footer: { text: "Joined today", icon_url: "https://i.imgur.com/sample-icon.png" }
        }]
    },
    announcement: {
        content: "📢 New Announcement!",
        embeds: [{
            title: "Big Update Released!",
            url: "https://example.com/update",
            description: "Check out the latest features and improvements in our newest update.",
            color: 0x5865f2,
            image: { url: "https://i.imgur.com/sample-update.png" },
            author: { name: "EmbedForge Team", icon_url: "https://i.imgur.com/sample-author.png" }
        }]
    },
    event: {
        content: "🗓 Upcoming Event!",
        embeds: [{
            title: "Community Game Night",
            description: "Join us for a fun game night this Friday at 8 PM!",
            color: 0xffb800,
            timestamp: new Date(Date.now() + 86400000).toISOString(),
            fields: [
                { name: "Date", value: "Friday, 8 PM", inline: true },
                { name: "Game", value: "Among Us", inline: true }
            ]
        }]
    }
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
        liveUsesDiv.innerHTML = embeds.length
            ? embeds.map(embed => `
                <div class="bg-gray-700 rounded-lg p-4 animate-fadeIn">
                    <p class="text-gray-400 text-sm mb-2">Posted ${new Date(embed.created_at).toLocaleString()}</p>
                    <div class="preview-embed p-4 mb-2" style="border-left: 4px solid ${embed.payload.embeds[0]?.color ? '#' + embed.payload.embeds[0].color.toString(16).padStart(6, '0') : '#5865f2'};">
                        ${embed.payload.content ? `<p class="text-gray-300 mb-3 embed-content">${parseDiscordMarkdown(embed.payload.content)}</p>` : ''}
                        ${embed.payload.embeds?.map((e, i) => `
                            <div class="embed-content">
                                ${e.author?.name ? `
                                    <div class="flex items-center mb-3">
                                        ${e.author.icon_url ? `<img src="${e.author.icon_url}" alt="Author Icon" class="w-6 h-6 rounded-full mr-2" onerror="this.style.display='none'">` : ''}
                                        <span class="font-semibold">${parseDiscordMarkdown(e.author.name)}</span>
                                    </div>` : ''}
                                ${e.title ? `<h3 class="font-bold text-lg mb-1 text-white">${parseDiscordMarkdown(e.title)}</h3>` : ''}
                                ${e.description ? `<p class="text-gray-300 mb-3">${parseDiscordMarkdown(e.description)}</p>` : ''}
                                ${e.thumbnail?.url ? `<img src="${e.thumbnail.url}" alt="Thumbnail" class="w-20 h-20 object-cover rounded mb-3 float-right" onerror="this.style.display='none'">` : ''}
                                ${e.image?.url ? `<img src="${e.image.url}" alt="Image" class="w-full h-auto rounded mb-3" onerror="this.style.display='none'">` : ''}
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
    } catch (e) {
        console.error('Error fetching Live Uses:', e.message);
        document.getElementById('liveUses').innerHTML = '<p class="text-gray-400 italic">Live Uses not available. Deploying Netlify function...</p>';
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
    } catch (e) {
        console.error('Error loading template:', e.message);
        showNotification('error', `Failed to load template: ${e.message}`);
    }
}

function formatText(type) {
    const textarea = document.activeElement;
    if (!textarea || textarea.tagName !== 'TEXTAREA') return;

    const selection = window.getSelection();
    let selectedText = '';
    let start, end;

    if (selection.rangeCount > 0 && selection.toString()) {
        selectedText = selection.toString();
        const range = selection.getRangeAt(0);
        const textareaText = textarea.value;
        const textareaRange = document.createRange();
        textareaRange.selectNodeContents(textarea);
        start = textarea.selectionStart;
        end = textarea.selectionEnd;
    } else if (textarea.selectionStart !== textarea.selectionEnd) {
        start = textarea.selectionStart;
        end = textarea.selectionEnd;
        selectedText = textarea.value.substring(start, end);
    } else {
        return;
    }

    if (!selectedText) return;

    let formattedText = selectedText;
    switch (type) {
        case 'bold': formattedText = `**${selectedText}**`; break;
        case 'italic': formattedText = `*${selectedText}*`; break;
        case 'underline': formattedText = `__${selectedText}__`; break;
        case 'strikethrough': formattedText = `~~${selectedText}~~`; break;
        case 'code': formattedText = `\`${selectedText}\``; break;
        case 'spoiler': formattedText = `||${selectedText}||`; break;
    }

    textarea.value = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    textarea.setSelectionRange(start, start + formattedText.length);
    updatePreview();
    document.getElementById('textContextMenu').classList.add('hidden');
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

function addEmbed(embedData = {}) {
    const container = document.getElementById('embedsContainer');
    const embedDiv = document.createElement('div');
    embedDiv.className = 'embed-item bg-gray-700 rounded-lg p-4 mb-4 relative animate-fadeIn';
    embedDiv.id = `embed-${embedCount}`;
    embedDiv.innerHTML = `
        <div class="flex justify-between items-center mb-3">
            <h3 class="font-semibold text-purple-300">Embed ${embedCount + 1}</h3>
            <button onclick="removeEmbed(${embedCount})" class="text-red-400 hover:text-red-300">&times;</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <label class="block text-sm font-medium mb-2">Title</label>
                <input type="text" value="${embedData.title || ''}" class="w-full p-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white" placeholder="Embed title...">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">URL</label>
                <input type="url" value="${embedData.url || ''}" class="w-full p-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white" placeholder="https://example.com">
            </div>
        </div>
        <div class="mb-4 emoji-picker-container relative">
            <label class="block text-sm font-medium mb-2">Description</label>
            <textarea rows="3" class="w-full p-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white resize-none" placeholder="Embed description...">${embedData.description || ''}</textarea>
            <button onclick="toggleEmojiPicker('embedDescEmojiPicker-${embedCount}')" class="absolute top-10 right-3 text-gray-400 hover:text-purple-500"><i class="fas fa-smile"></i></button>
            <emoji-picker id="embedDescEmojiPicker-${embedCount}" class="emoji-picker"></emoji-picker>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <label class="block text-sm font-medium mb-2">Color</label>
                <input type="color" value="${embedData.color ? '#' + embedData.color.toString(16).padStart(6, '0') : '#5865f2'}" class="w-full h-10 p-1 bg-gray-600 rounded border border-gray-500 cursor-pointer">
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Timestamp</label>
                <input type="datetime-local" value="${embedData.timestamp ? embedData.timestamp.slice(0, 16) : ''}" class="w-full p-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white">
            </div>
        </div>
        <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Thumbnail URL</label>
            <input type="url" value="${embedData.thumbnail?.url || ''}" class="w-full p-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white" placeholder="https://example.com/thumbnail.png">
        </div>
        <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Image URL</label>
            <input type="url" value="${embedData.image?.url || ''}" class="w-full p-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white" placeholder="https://example.com/image.png">
        </div>
        <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Author Name</label>
            <input type="text" value="${embedData.author?.name || ''}" class="w-full p-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white" placeholder="Author name">
            <input type="url" value="${embedData.author?.icon_url || ''}" class="w-full p-2 mt-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white" placeholder="Author icon URL">
        </div>
        <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Footer Text</label>
            <input type="text" value="${embedData.footer?.text || ''}" class="w-full p-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white" placeholder="Footer text">
            <input type="url" value="${embedData.footer?.icon_url || ''}" class="w-full p-2 mt-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white" placeholder="Footer icon URL">
        </div>
        <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Fields</label>
            <div id="fields-${embedCount}" class="space-y-2 mt-2"></div>
            <button onclick="addField(${embedCount})" class="mt-2 px-3 py-1 bg-green-600 rounded hover:bg-green-700 transition-colors text-sm">
                <i class="fas fa-plus mr-1"></i>Add Field
            </button>
        </div>
    `;
    container.appendChild(embedDiv);
    if (embedData.fields) {
        embedData.fields.forEach(field => addField(embedCount, field));
    }
    embedCount++;
    updatePreview();
    setupEmojiPickers();
}

function removeEmbed(index) {
    const embed = document.getElementById(`embed-${index}`);
    if (embed) {
        embed.remove();
        updateEmbedIndices();
        updatePreview();
        showNotification('success', 'Embed removed successfully!');
    }
}

function updateEmbedIndices() {
    const embeds = document.querySelectorAll('.embed-item');
    embeds.forEach((embed, i) => {
        embed.id = `embed-${i}`;
        embed.querySelector('h3').textContent = `Embed ${i + 1}`;
        const emojiPicker = embed.querySelector('emoji-picker');
        if (emojiPicker) emojiPicker.id = `embedDescEmojiPicker-${i}`;
        const fieldsContainer = embed.querySelector('.space-y-2');
        if (fieldsContainer) fieldsContainer.id = `fields-${i}`;
        const addFieldBtn = embed.querySelector('button[onclick*="addField"]');
        if (addFieldBtn) addFieldBtn.setAttribute('onclick', `addField(${i})`);
    });
    embedCount = embeds.length;
}

function addField(embedIndex, fieldData = {}) {
    const fieldsContainer = document.getElementById(`fields-${embedIndex}`);
    if (!fieldsContainer) return;
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'field-item bg-gray-600 p-3 rounded flex flex-col space-y-2 animate-fadeIn';
    fieldDiv.innerHTML = `
        <div class="flex space-x-2">
            <input type="text" value="${fieldData.name || ''}" placeholder="Field name" class="flex-1 p-2 bg-gray-700 rounded border border-gray-600 focus:border-green-500 focus:outline-none text-white">
            <input type="text" value="${fieldData.value || ''}" placeholder="Field value" class="flex-1 p-2 bg-gray-700 rounded border border-gray-600 focus:border-green-500 focus:outline-none text-white">
            <label class="flex items-center space-x-1 cursor-pointer">
                <input type="checkbox" ${fieldData.inline ? 'checked' : ''} class="accent-green-500"> <span class="text-sm">Inline</span>
            </label>
            <button onclick="this.parentElement.parentElement.remove(); updatePreview()" class="text-red-400 hover:text-red-300 p-1">&times;</button>
        </div>
    `;
    fieldsContainer.appendChild(fieldDiv);
    updatePreview();
}

function handleFiles() {
    const input = document.getElementById('fileInput');
    if (!input) return;
    files = Array.from(input.files).filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
    const attachmentsDiv = document.getElementById('attachments');
    if (!attachmentsDiv) return;
    attachmentsDiv.innerHTML = '';
    files.forEach((file, i) => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'flex items-center justify-between p-2 bg-gray-700 rounded animate-fadeIn';
        fileDiv.innerHTML = `
            <span class="text-sm">${file.name}</span>
            <button onclick="removeFile(${i})" class="text-red-400 hover:text-red-300">&times;</button>
        `;
        attachmentsDiv.appendChild(fileDiv);
    });
    updatePreview();
    showNotification('success', 'Files added successfully!');
}

function removeFile(index) {
    if (index >= 0 && index < files.length) {
        files.splice(index, 1);
        handleFiles();
        showNotification('success', 'File removed successfully!');
    }
}

function loadTemplate() {
    const template = document.getElementById('templateSelect').value;
    if (!template) return;
    const data = templates[template];
    document.getElementById('content').value = data.content || '';
    document.getElementById('embedsContainer').innerHTML = '';
    embedCount = 0;
    data.embeds.forEach(embed => addEmbed(embed));
    showNotification('success', 'Template loaded successfully!');
    updatePreview();
}

function loadFromJSON() {
    try {
        const jsonInput = document.getElementById('jsonInput').value;
        if (!jsonInput) throw new Error('No JSON provided');
        const data = JSON.parse(jsonInput);
        if (!data) throw new Error('Invalid JSON');
        document.getElementById('content').value = data.content || '';
        document.getElementById('embedsContainer').innerHTML = '';
        embedCount = 0;
        if (data.embeds) {
            data.embeds.forEach(embed => addEmbed(embed));
        }
        showNotification('success', 'JSON loaded successfully!');
        updatePreview();
    } catch (e) {
        showNotification('error', `Invalid JSON format: ${e.message}`);
    }
}

function generateJSON(returnPayload = false) {
    try {
        const webhookUrl = document.getElementById('webhookUrl')?.value;
        if (!webhookUrl) {
            showNotification('error', 'Webhook URL is required!');
            return null;
        }
        const payload = {
            content: document.getElementById('content')?.value || '',
            embeds: [],
            attachments: []
        };

        const embedItems = document.querySelectorAll('.embed-item');
        embedItems.forEach(item => {
            const embed = {};
            const titleInput = item.querySelector('input[placeholder="Embed title..."]');
            const urlInput = item.querySelector('input[placeholder="https://example.com"]');
            const descriptionInput = item.querySelector('textarea[placeholder="Embed description..."]');
            const colorInput = item.querySelector('input[type="color"]');
            const timestampInput = item.querySelector('input[type="datetime-local"]');
            const thumbnailInput = item.querySelector('input[placeholder*="thumbnail"]');
            const imageInput = item.querySelector('input[placeholder*="image"]');
            const authorNameInput = item.querySelector('input[placeholder="Author name"]');
            const authorIconInput = item.querySelector('input[placeholder="Author icon URL"]');
            const footerTextInput = item.querySelector('input[placeholder="Footer text"]');
            const footerIconInput = item.querySelector('input[placeholder="Footer icon URL"]');

            if (titleInput?.value) embed.title = titleInput.value;
            if (urlInput?.value) embed.url = urlInput.value;
            if (descriptionInput?.value) embed.description = descriptionInput.value;
            if (colorInput?.value) embed.color = parseInt(colorInput.value.slice(1), 16);
            if (timestampInput?.value) embed.timestamp = new Date(timestampInput.value).toISOString();
            if (thumbnailInput?.value) embed.thumbnail = { url: thumbnailInput.value };
            if (imageInput?.value) embed.image = { url: imageInput.value };
            if (authorNameInput?.value) {
                embed.author = { name: authorNameInput.value };
                if (authorIconInput?.value) embed.author.icon_url = authorIconInput.value;
            }
            if (footerTextInput?.value) {
                embed.footer = { text: footerTextInput.value };
                if (footerIconInput?.value) embed.footer.icon_url = footerIconInput.value;
            }
            const fields = item.querySelectorAll('.field-item');
            if (fields.length > 0) {
                embed.fields = Array.from(fields).map(field => {
                    const inputs = field.querySelectorAll('input');
                    return {
                        name: inputs[0]?.value || '',
                        value: inputs[1]?.value || '',
                        inline: inputs[2]?.checked || false
                    };
                }).filter(field => field.name && field.value);
            }
            if (embed.title || embed.description || embed.fields?.length) payload.embeds.push(embed);
        });

        if (files.length > 0) {
            payload.attachments = files.map((file, i) => ({ id: i, filename: file.name, description: '' }));
        }

        if (returnPayload) return payload;

        const jsonString = JSON.stringify(payload, null, 2);
        const jsonOutput = document.getElementById('jsonOutput');
        if (jsonOutput) {
            jsonOutput.value = jsonString;
            document.getElementById('jsonModal').classList.remove('hidden');
            showNotification('success', 'JSON generated successfully!');
        } else {
            showNotification('error', 'JSON output element not found');
        }
        return null;
    } catch (e) {
        console.error('Error generating JSON:', e.message);
        showNotification('error', `Failed to generate JSON: ${e.message}`);
        return null;
    }
}

function copyJSON() {
    const textarea = document.getElementById('jsonOutput');
    if (textarea) {
        textarea.select();
        document.execCommand('copy');
        showNotification('success', 'JSON copied to clipboard!');
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check mr-2"></i>Copied!';
        setTimeout(() => { button.innerHTML = originalText; }, 2000);
    }
}

function closeModal() {
    const jsonModal = document.getElementById('jsonModal');
    if (jsonModal) {
        jsonModal.classList.add('hidden');
    }
}

function showClearModal() {
    const clearModal = document.getElementById('clearModal');
    if (clearModal) {
        clearModal.classList.remove('hidden');
    }
}

function closeClearModal() {
    const clearModal = document.getElementById('clearModal');
    if (clearModal) {
        clearModal.classList.add('animate-fadeOut');
        setTimeout(() => {
            clearModal.classList.add('hidden');
            clearModal.classList.remove('animate-fadeOut');
        }, 300);
    }
}

function confirmClear() {
    const content = document.getElementById('content');
    const webhookUrl = document.getElementById('webhookUrl');
    const embedsContainer = document.getElementById('embedsContainer');
    const attachments = document.getElementById('attachments');
    const jsonInput = document.getElementById('jsonInput');
    if (content) content.value = '';
    if (webhookUrl) webhookUrl.value = '';
    if (embedsContainer) embedsContainer.innerHTML = '';
    if (attachments) attachments.innerHTML = '';
    if (jsonInput) jsonInput.value = '';
    files = [];
    embedCount = 0;
    updatePreview();
    showNotification('success', 'All fields cleared!');
    closeClearModal();
}

function togglePreview() {
    const panel = document.getElementById('previewPanel');
    const hideBtn = document.getElementById('hidePreviewBtn');
    const viewBtn = document.getElementById('viewPreviewBtn');
    const mainGrid = document.getElementById('mainGrid');
    const builderPanel = document.querySelector('.builder-panel');
    if (!panel || !hideBtn || !viewBtn || !mainGrid || !builderPanel) return;
    if (isPreviewVisible) {
        panel.classList.add('animate-fadeOut');
        setTimeout(() => {
            panel.classList.add('hidden');
            panel.classList.remove('animate-fadeOut');
            hideBtn.classList.add('hidden');
            viewBtn.classList.remove('hidden');
            mainGrid.classList.remove('lg:grid-cols-4');
            mainGrid.classList.add('lg:grid-cols-1');
            builderPanel.classList.remove('lg:col-span-3');
            builderPanel.classList.add('lg:col-span-1');
            builderPanel.style.width = '100%';
        }, 300);
    } else {
        panel.classList.remove('hidden');
        panel.classList.add('animate-fadeIn');
        setTimeout(() => {
            panel.classList.remove('animate-fadeIn');
            hideBtn.classList.remove('hidden');
            viewBtn.classList.add('hidden');
            mainGrid.classList.remove('lg:grid-cols-1');
            mainGrid.classList.add('lg:grid-cols-4');
            builderPanel.classList.remove('lg:col-span-1');
            builderPanel.classList.add('lg:col-span-3');
            builderPanel.style.width = '100%';
        }, 300);
    }
    isPreviewVisible = !isPreviewVisible;
}

function closePreview() {
    if (isPreviewVisible) togglePreview();
}

function showNotification(type, message) {
    const notification = document.getElementById('notification');
    const content = document.getElementById('notificationContent');
    if (!notification || !content) return;
    content.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle text-green-500' : 'fa-exclamation-circle text-red-500'}"></i>
        <span>${message}</span>
    `;
    content.className = `p-4 rounded-lg shadow-lg flex items-center space-x-3 ${type === 'success' ? 'bg-green-900' : 'bg-red-900'} animate-fadeIn`;
    notification.classList.remove('hidden');
    setTimeout(() => {
        notification.classList.add('animate-fadeOut');
        setTimeout(() => {
            notification.classList.add('hidden');
            notification.classList.remove('animate-fadeOut');
        }, 300);
    }, 3000);
}

function updatePreview() {
    const preview = document.getElementById('preview');
    if (!preview) return;
    let html = '';

    if (files.length > 0) {
        html += '<div class="space-y-2 mb-4"><p class="text-gray-400">Attachments:</p>';
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                html += `<img src="${URL.createObjectURL(file)}" alt="${file.name}" class="w-full h-auto rounded mb-3">`;
            } else if (file.type.startsWith('video/')) {
                html += `<video src="${URL.createObjectURL(file)}" controls class="w-full h-auto rounded mb-3"></video>`;
            }
        });
        html += '</div>';
    }

    const content = document.getElementById('content')?.value;
    if (content) {
        html += `<div class="bg-discord-bg p-4 rounded-lg mb-4 embed-content">${parseDiscordMarkdown(content)}</div>`;
    }

    const embedItems = document.querySelectorAll('.embed-item');
    embedItems.forEach(item => {
        let embedHtml = '<div class="preview-embed rounded-lg p-4 mb-4">';
        const titleInput = item.querySelector('input[placeholder="Embed title..."]');
        const descriptionInput = item.querySelector('textarea[placeholder="Embed description..."]');
        const thumbnailInput = item.querySelector('input[placeholder*="thumbnail"]');
        const imageInput = item.querySelector('input[placeholder*="image"]');
        const authorNameInput = item.querySelector('input[placeholder="Author name"]');
        const authorIconInput = item.querySelector('input[placeholder="Author icon URL"]');
        const footerTextInput = item.querySelector('input[placeholder="Footer text"]');
        const footerIconInput = item.querySelector('input[placeholder="Footer icon URL"]');
        const timestampInput = item.querySelector('input[type="datetime-local"]');
        const colorInput = item.querySelector('input[type="color"]');

        if (authorNameInput?.value) {
            embedHtml += `<div class="flex items-center mb-3 embed-content">`;
            if (authorIconInput?.value) embedHtml += `<img src="${authorIconInput.value}" alt="Author Icon" class="w-6 h-6 rounded-full mr-2" onerror="this.style.display='none'">`;
            embedHtml += `<span class="font-semibold">${parseDiscordMarkdown(authorNameInput.value)}</span></div>`;
        }
        if (titleInput?.value) embedHtml += `<h3 class="font-bold text-lg mb-1 text-white embed-content">${parseDiscordMarkdown(titleInput.value)}</h3>`;
        if (descriptionInput?.value) embedHtml += `<p class="text-gray-300 mb-3 embed-content">${parseDiscordMarkdown(descriptionInput.value)}</p>`;
        if (thumbnailInput?.value) embedHtml += `<img src="${thumbnailInput.value}" alt="Thumbnail" class="w-20 h-20 object-cover rounded mb-3 float-right" onerror="this.style.display='none'">`;
        if (imageInput?.value) embedHtml += `<img src="${imageInput.value}" alt="Image" class="w-full h-auto rounded mb-3" onerror="this.style.display='none'">`;
        const fields = item.querySelectorAll('.field-item');
        fields.forEach(field => {
            const inputs = field.querySelectorAll('input');
            const name = inputs[0]?.value;
            const value = inputs[1]?.value;
            if (name && value) {
                embedHtml += `<div class="mb-2 ${inputs[2]?.checked ? 'field-inline' : ''} embed-content">
                    <div class="font-semibold text-white mb-1">${parseDiscordMarkdown(name)}</div>
                    <div class="text-gray-300">${parseDiscordMarkdown(value)}</div>
                </div>`;
            }
        });
        if (footerTextInput?.value || timestampInput?.value) {
            embedHtml += `<div class="flex items-center mt-3 text-gray-400 text-sm embed-content">`;
            if (footerIconInput?.value) embedHtml += `<img src="${footerIconInput.value}" alt="Footer Icon" class="w-5 h-5 mr-2" onerror="this.style.display='none'">`;
            embedHtml += `<span>${footerTextInput?.value ? parseDiscordMarkdown(footerTextInput.value) : ''}${footerTextInput?.value && timestampInput?.value ? ' | ' : ''}${timestampInput?.value ? new Date(timestampInput.value).toLocaleString() : ''}</span></div>`;
        }
        if (colorInput?.value) {
            embedHtml = embedHtml.replace('preview-embed', `preview-embed border-l-[4px] border-l-[${colorInput.value}]`);
        }
        embedHtml += '</div>';
        html += embedHtml;
    });

    preview.innerHTML = html || '<p class="text-gray-400 italic">Build your embed to see a live preview here...</p>';
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

        if (!payload.content && (!payload.embeds || payload.embeds.length === 0) && (!payload.attachments || payload.attachments.length === 0)) {
            showNotification('error', 'Please add content, embeds, or files before sending!');
            return;
        }

        if (files.length > 10) {
            showNotification('error', 'Maximum 10 files allowed!');
            return;
        }

        try {
            const saveResponse = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload }),
            });
            if (saveResponse.ok) {
                await fetchLiveUses();
            }
        } catch (e) {
            console.warn('Failed to save to Live Uses:', e.message);
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
                    })
                    .catch(error => {
                        console.error('Fetch error sending to Discord:', error.message);
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
                    })
                    .catch(error => {
                        console.error('Fetch error sending to Discord (no files):', error.message);
                        showNotification('error', `Failed to send to Discord: ${error.message}`);
                    });
            });
    } catch (e) {
        console.error('Error sending to Discord:', e.message);
        showNotification('error', `Failed to send to Discord: ${e.message}`);
    }
}

function toggleEmojiPicker(pickerId) {
    const picker = document.getElementById(pickerId);
    if (!picker) return;
    const isActive = picker.classList.contains('active');
    document.querySelectorAll('emoji-picker').forEach(p => p.classList.remove('active'));
    if (!isActive) {
        picker.classList.add('active');
        picker.style.display = 'block';
    }
}

function setupEmojiPickers() {
    const pickers = document.querySelectorAll('emoji-picker');
    pickers.forEach(picker => {
        picker.removeEventListener('emoji-click', handleEmojiClick);
        picker.addEventListener('emoji-click', handleEmojiClick);
    });
}

function handleEmojiClick(event) {
    const picker = event.target.closest('emoji-picker');
    if (!picker) return;
    const textarea = picker.previousElementSibling.previousElementSibling;
    if (textarea && textarea.tagName === 'TEXTAREA') {
        textarea.value += event.detail.unicode;
        updatePreview();
        picker.classList.remove('active');
        picker.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    addEmbed();
    setupEmojiPickers();
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', updatePreview);
        if (input.type === 'checkbox') {
            input.addEventListener('change', updatePreview);
        }
    });

    const textareas = document.querySelectorAll('textarea');
    const contextMenu = document.getElementById('textContextMenu');
    if (contextMenu) {
        textareas.forEach(textarea => {
            textarea.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const selection = window.getSelection();
                if (selection.toString()) {
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
    }

    const observer = new MutationObserver(() => {
        setupEmojiPickers();
    });
    observer.observe(document.getElementById('embedsContainer'), { childList: true, subtree: true });

    fetchLiveUses();
    updatePreview();
});
