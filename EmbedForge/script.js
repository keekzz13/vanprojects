let embedCount = 0;
let files = [];
let isPreviewVisible = true;

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
    setupEmojiPicker(`embedDescEmojiPicker-${embedCount}`);
    setupInputListeners(embedDiv);
    embedCount++;
    updateEmbedIndices();
    updatePreview();
}

function removeEmbed(index) {
    const embed = document.getElementById(`embed-${index}`);
    if (embed) embed.remove();
    updateEmbedIndices();
    updatePreview();
    showNotification('success', 'Embed removed successfully!');
}

function updateEmbedIndices() {
    const embeds = document.querySelectorAll('.embed-item');
    embeds.forEach((embed, i) => {
        embed.id = `embed-${i}`;
        embed.querySelector('h3').textContent = `Embed ${i + 1}`;
        const removeButton = embed.querySelector('button[onclick*="removeEmbed"]');
        if (removeButton) removeButton.setAttribute('onclick', `removeEmbed(${i})`);
        const addFieldButton = embed.querySelector('button[onclick*="addField"]');
        if (addFieldButton) addFieldButton.setAttribute('onclick', `addField(${i})`);
        const fieldsContainer = embed.querySelector(`div[id^="fields-"]`);
        if (fieldsContainer) fieldsContainer.id = `fields-${i}`;
        const emojiPicker = embed.querySelector('emoji-picker');
        if (emojiPicker) {
            emojiPicker.id = `embedDescEmojiPicker-${i}`;
            setupEmojiPicker(`embedDescEmojiPicker-${i}`);
        }
    });
    embedCount = embeds.length;
}

function addField(embedIndex, fieldData = {}) {
    const fieldsContainer = document.getElementById(`fields-${embedIndex}`);
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
    setupInputListeners(fieldDiv);
    updatePreview();
}

function handleFiles() {
    const input = document.getElementById('fileInput');
    files = Array.from(input.files).filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
    const attachmentsDiv = document.getElementById('attachments');
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
    files.splice(index, 1);
    handleFiles();
    showNotification('success', 'File removed successfully!');
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
        showNotification('error', 'Invalid JSON format. Please check and try again.');
    }
}

function generateJSON() {
    const webhookUrl = document.getElementById('webhookUrl').value;
    if (!webhookUrl) {
        showNotification('error', 'Webhook URL is required!');
        return null;
    }
    const payload = {
        content: document.getElementById('content').value,
        embeds: [],
        attachments: []
    };

    const embedItems = document.querySelectorAll('.embed-item');
    embedItems.forEach(item => {
        const embed = {};
        embed.title = item.querySelector('input[placeholder="Embed title..."]').value;
        embed.url = item.querySelector('input[placeholder="https://example.com"]').value;
        if (embed.title && embed.url && !/^https?:\/\//.test(embed.url)) {
            showNotification('error', 'Embed URL must be a valid HTTP/HTTPS link!');
            return;
        }
        embed.description = item.querySelector('textarea[placeholder="Embed description..."]').value;
        embed.color = parseInt(item.querySelector('input[type="color"]').value.slice(1), 16);
        const timestampInput = item.querySelector('input[type="datetime-local"]');
        if (timestampInput.value) embed.timestamp = new Date(timestampInput.value).toISOString();
        embed.thumbnail = { url: item.querySelector('input[placeholder*="Thumbnail"]').value };
        embed.image = { url: item.querySelector('input[placeholder*="Image"]').value };
        const authorName = item.querySelector('input[placeholder="Author name"]').value;
        if (authorName) {
            embed.author = { name: authorName };
            const authorIcon = item.querySelector('input[placeholder="Author icon URL"]').value;
            if (authorIcon) embed.author.icon_url = authorIcon;
        }
        const footerText = item.querySelector('input[placeholder="Footer text"]').value;
        if (footerText) {
            embed.footer = { text: footerText };
            const footerIcon = item.querySelector('input[placeholder="Footer icon URL"]').value;
            if (footerIcon) embed.footer.icon_url = footerIcon;
        }
        const fields = item.querySelectorAll('.field-item');
        if (fields.length > 0) {
            embed.fields = Array.from(fields).map(field => {
                const inputs = field.querySelectorAll('input');
                return {
                    name: inputs[0].value,
                    value: inputs[1].value,
                    inline: inputs[2].checked
                };
            }).filter(field => field.name && field.value);
        }
        if (embed.title || embed.description || embed.fields?.length) payload.embeds.push(embed);
    });

    if (files.length > 0) {
        payload.attachments = files.map((file, i) => ({ id: i, filename: file.name, description: '' }));
    }

    const jsonString = JSON.stringify(payload, null, 2);
    document.getElementById('jsonOutput').value = jsonString;
    document.getElementById('jsonModal').classList.remove('hidden');
    showNotification('success', 'JSON generated successfully!');
    return payload;
}

function copyJSON() {
    const textarea = document.getElementById('jsonOutput');
    textarea.select();
    document.execCommand('copy');
    showNotification('success', 'JSON copied to clipboard!');
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check mr-2"></i>Copied!';
    setTimeout(() => { button.innerHTML = originalText; }, 2000);
}

function closeModal() {
    document.getElementById('jsonModal').classList.add('hidden');
    showNotification('success', 'Modal closed!');
}

function showClearConfirm() {
    document.getElementById('clearConfirmModal').classList.remove('hidden');
}

function closeClearConfirm() {
    const modal = document.getElementById('clearConfirmModal');
    modal.classList.add('animate-fadeOut');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('animate-fadeOut');
    }, 300);
}

function clearAll() {
    document.getElementById('content').value = '';
    document.getElementById('webhookUrl').value = '';
    document.getElementById('embedsContainer').innerHTML = '';
    document.getElementById('attachments').innerHTML = '';
    document.getElementById('jsonInput').value = '';
    files = [];
    embedCount = 0;
    updatePreview();
    closeClearConfirm();
    showNotification('success', 'All fields cleared!');
}

function sendToDiscord() {
    const webhookUrl = document.getElementById('webhookUrl').value;
    if (!webhookUrl || !/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/[0-9]+\/[A-Za-z0-9_-]+/.test(webhookUrl)) {
        showNotification('error', 'Please provide a valid Discord webhook URL!');
        return;
    }

    const payload = generateJSON();
    if (!payload) return;

    const formData = new FormData();
    formData.append('payload_json', JSON.stringify(payload));
    files.forEach((file, i) => {
        formData.append(`file${i}`, file, file.name);
    });

    // Test webhook URL validity
    fetch(webhookUrl, { method: 'HEAD' })
        .then(response => {
            if (!response.ok) throw new Error('Invalid webhook URL');
            return fetch(webhookUrl, {
                method: 'POST',
                body: formData
            });
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            showNotification('success', 'Message sent to Discord successfully!');
        })
        .catch(error => {
            console.error('Error sending to Discord:', error);
            showNotification('error', 'Failed to send to Discord. Check webhook URL or try again.');
        });
}

function togglePreview() {
    const panel = document.getElementById('previewPanel');
    const hideBtn = document.getElementById('hidePreviewBtn');
    const viewBtn = document.getElementById('viewPreviewBtn');
    const builderPanel = document.getElementById('builderPanel');
    if (isPreviewVisible) {
        panel.classList.add('animate-fadeOut');
        setTimeout(() => {
            panel.classList.add('hidden');
            panel.classList.remove('animate-fadeOut');
            hideBtn.classList.add('hidden');
            viewBtn.classList.remove('hidden');
            builderPanel.classList.remove('lg:col-span-2');
            builderPanel.classList.add('lg:col-span-3');
        }, 300);
    } else {
        panel.classList.remove('hidden');
        panel.classList.add('animate-fadeIn');
        setTimeout(() => {
            panel.classList.remove('animate-fadeIn');
            hideBtn.classList.remove('hidden');
            viewBtn.classList.add('hidden');
            builderPanel.classList.remove('lg:col-span-3');
            builderPanel.classList.add('lg:col-span-2');
        }, 300);
    }
    isPreviewVisible = !isPreviewVisible;
}

function showNotification(type, message) {
    const notification = document.getElementById('notification');
    const content = document.getElementById('notificationContent');
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
    console.log('Updating preview...');
    const preview = document.getElementById('preview');
    const content = document.getElementById('content').value;
    let html = '';

    if (content) {
        html += `<div class="bg-discord-bg p-4 rounded-lg mb-4">${content}</div>`;
    }

    const embedItems = document.querySelectorAll('.embed-item');
    embedItems.forEach(item => {
        let embedHtml = '<div class="preview-embed rounded-lg p-4 mb-4">';
        const title = item.querySelector('input[placeholder="Embed title..."]').value;
        if (title) embedHtml += `<h3 class="font-bold text-lg mb-1 text-white">${title}</h3>`;
        const description = item.querySelector('textarea[placeholder="Embed description..."]').value;
        if (description) embedHtml += `<p class="text-gray-300 mb-3">${description}</p>`;
        const thumbnail = item.querySelector('input[placeholder*="Thumbnail"]').value;
        if (thumbnail) embedHtml += `<img src="${thumbnail}" alt="Thumbnail" class="w-20 h-20 object-cover rounded mb-3 float-right">`;
        const image = item.querySelector('input[placeholder*="Image"]').value;
        if (image) embedHtml += `<img src="${image}" alt="Image" class="w-full h-auto rounded mb-3">`;
        const authorName = item.querySelector('input[placeholder="Author name"]').value;
        const authorIcon = item.querySelector('input[placeholder="Author icon URL"]').value;
        if (authorName) {
            embedHtml += `<div class="flex items-center mb-3">`;
            if (authorIcon) embedHtml += `<img src="${authorIcon}" alt="Author Icon" class="w-6 h-6 rounded-full mr-2">`;
            embedHtml += `<span class="font-semibold">${authorName}</span></div>`;
        }
        const fields = item.querySelectorAll('.field-item');
        fields.forEach(field => {
            const inputs = field.querySelectorAll('input');
            const name = inputs[0].value;
            const value = inputs[1].value;
            if (name && value) {
                embedHtml += `<div class="mb-2 ${inputs[2].checked ? 'field-inline' : ''}">
                    <div class="font-semibold text-white mb-1">${name}</div>
                    <div class="text-gray-300">${value}</div>
                </div>`;
            }
        });
        const footerText = item.querySelector('input[placeholder="Footer text"]').value;
        const footerIcon = item.querySelector('input[placeholder="Footer icon URL"]').value;
        const timestamp = item.querySelector('input[type="datetime-local"]').value;
        if (footerText || timestamp) {
            embedHtml += `<div class="flex items-center mt-3 text-gray-400 text-sm">`;
            if (footerIcon) embedHtml += `<img src="${footerIcon}" alt="Footer Icon" class="w-5 h-5 mr-2">`;
            embedHtml += `<span>${footerText}${footerText && timestamp ? ' | ' : ''}${timestamp ? new Date(timestamp).toLocaleString() : ''}</span></div>`;
        }
        const color = item.querySelector('input[type="color"]').value;
        embedHtml = embedHtml.replace('preview-embed', `preview-embed border-l-[4px] border-l-[${color}]`);
        embedHtml += '</div>';
        html += embedHtml;
    });

    if (files.length > 0) {
        html += '<div class="space-y-2"><p class="text-gray-400">Attachments:</p>';
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                html += `<img src="${URL.createObjectURL(file)}" alt="${file.name}" class="w-full h-auto rounded mb-3">`;
            } else if (file.type.startsWith('video/')) {
                html += `<video src="${URL.createObjectURL(file)}" controls class="w-full h-auto rounded mb-3"></video>`;
            }
        });
        html += '</div>';
    }

    preview.innerHTML = html || '<p class="text-gray-400 italic">Build your embed to see a live preview here...</p>';
    console.log('Preview updated with:', html);
}

function toggleEmojiPicker(pickerId) {
    const picker = document.getElementById(pickerId);
    if (!picker) {
        console.error(`Emoji picker ${pickerId} not found`);
        return;
    }
    const isActive = picker.classList.contains('active');
    document.querySelectorAll('emoji-picker').forEach(p => p.classList.remove('active'));
    if (!isActive) picker.classList.add('active');
}

function setupEmojiPicker(pickerId) {
    const picker = document.getElementById(pickerId);
    if (picker && !picker.dataset.listenerAdded) {
        console.log(`Setting up emoji picker: ${pickerId}`);
        picker.addEventListener('emoji-click', event => {
            console.log(`Emoji clicked: ${event.detail.unicode}`);
            const textarea = picker.closest('.emoji-picker-container').querySelector('textarea');
            if (textarea) {
                textarea.value += event.detail.unicode;
                updatePreview();
            }
            picker.classList.remove('active');
        });
        picker.dataset.listenerAdded = true;
    }
}

function setupInputListeners(element) {
    const inputs = element.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        if (!input.dataset.listenerAdded) {
            input.addEventListener('input', () => {
                console.log('Input event on:', input);
                updatePreview();
            });
            if (input.type === 'checkbox' || input.type === 'color' || input.type === 'datetime-local') {
                input.addEventListener('change', () => {
                    console.log('Change event on:', input);
                    updatePreview();
                });
            }
            input.dataset.listenerAdded = true;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    addEmbed();
    setupEmojiPicker('contentEmojiPicker');

    // Static input listeners
    const staticInputs = document.querySelectorAll('#webhookUrl, #content, #jsonInput');
    staticInputs.forEach(input => {
        input.addEventListener('input', () => {
            console.log('Static input event on:', input);
            updatePreview();
        });
        if (input.type === 'checkbox' || input.type === 'color' || input.type === 'datetime-local') {
            input.addEventListener('change', () => {
                console.log('Static change event on:', input);
                updatePreview();
            });
        }
    });

    // File input listener
    document.getElementById('fileInput').addEventListener('change', () => {
        console.log('File input changed');
        handleFiles();
    });

    // Dynamic input delegation
    document.addEventListener('input', e => {
        if (e.target.matches('.embed-item input, .embed-item textarea')) {
            console.log('Dynamic input event on:', e.target);
            updatePreview();
        }
    });
    document.addEventListener('change', e => {
        if (e.target.matches('.embed-item input[type="checkbox"], .embed-item input[type="color"], .embed-item input[type="datetime-local"]')) {
            console.log('Dynamic change event on:', e.target);
            updatePreview();
        }
    });

    updatePreview();
});
