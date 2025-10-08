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
        content: "📢 **New Announcement!**",
        embeds: [{
            title: "**Big Update Released!**",
            url: "https://example.com/update",
            description: "Check out the latest features and improvements in our newest update.",
            color: 0x5865f2,
            image: { url: "https://i.imgur.com/sample-update.gif" },
            author: { name: "EmbedForge Team", icon_url: "https://i.imgur.com/sample-author.png" }
        }]
    },
    event: {
        content: "🗓 **Upcoming Event!**",
        embeds: [{
            title: "**Community Game Night**",
            description: "Join us for a fun game night this **Friday** at *8 PM*!",
            color: 0xffb800,
            timestamp: new Date(Date.now() + 86400000).toISOString(),
            fields: [
                { name: "Date", value: "Friday, 8 PM", inline: true },
                { name: "Game", value: "Among Us", inline: true }
            ]
        }]
    }
};

function parseDiscordMarkdown(text) {
    try {
        if (!text) return '';
        // Escape HTML to prevent XSS
        let result = text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        // Handle Discord Markdown
        result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
        result = result.replace(/(?:\*|_)(.*?)(?:\*|_)/g, '<em>$1</em>'); // Italic
        result = result.replace(/__(.*?)__/g, '<u>$1</u>'); // Underline
        result = result.replace(/~~(.*?)~~/g, '<s>$1</s>'); // Strikethrough
        result = result.replace(/`(.*?)`/g, '<code>$1</code>'); // Inline code
        result = result.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>'); // Code block
        result = result.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" class="text-blue-400 hover:underline" target="_blank">$1</a>'); // Links
        console.log('Parsed Markdown:', text, '→', result);
        return result;
    } catch (e) {
        console.error('Error in parseDiscordMarkdown:', e.message);
        return text; // Fallback to raw text
    }
}

function addEmbed(embedData = {}) {
    try {
        const container = document.getElementById('embedsContainer');
        if (!container) throw new Error('Embeds container not found');
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
                    <input type="text" class="embed-title w-full p-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white" placeholder="Embed title..." value="${embedData.title || ''}" oninput="updatePreview()">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">URL</label>
                    <input type="url" class="embed-url w-full p-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white" placeholder="https://example.com" value="${embedData.url || ''}" oninput="updatePreview()">
                </div>
            </div>
            <div class="mb-4 emoji-picker-container relative">
                <label class="block text-sm font-medium mb-2">Description</label>
                <textarea rows="3" class="embed-description w-full p-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white resize-none" placeholder="Embed description..." oninput="updatePreview()">${embedData.description || ''}</textarea>
                <button onclick="toggleEmojiPicker('embedDescEmojiPicker-${embedCount}')" class="absolute top-10 right-3 text-gray-400 hover:text-purple-500"><i class="fas fa-smile"></i></button>
                <emoji-picker id="embedDescEmojiPicker-${embedCount}" class="emoji-picker"></emoji-picker>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Color</label>
                    <input type="color" class="embed-color w-full h-10 p-1 bg-gray-600 rounded border border-gray-500 cursor-pointer" value="${embedData.color ? '#' + embedData.color.toString(16).padStart(6, '0') : '#5865f2'}" onchange="updatePreview()">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Timestamp</label>
                    <input type="datetime-local" class="embed-timestamp w-full p-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white" value="${embedData.timestamp ? embedData.timestamp.slice(0, 16) : ''}" onchange="updatePreview()">
                </div>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Thumbnail URL</label>
                <input type="url" class="embed-thumbnail w-full p-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white" placeholder="https://example.com/thumbnail.png" value="${embedData.thumbnail?.url || ''}" oninput="updatePreview()">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Image URL</label>
                <input type="url" class="embed-image w-full p-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white" placeholder="https://example.com/image.gif" value="${embedData.image?.url || ''}" oninput="updatePreview()">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Author Name</label>
                <input type="text" class="embed-author-name w-full p-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white" placeholder="Author name" value="${embedData.author?.name || ''}" oninput="updatePreview()">
                <input type="url" class="embed-author-icon w-full p-2 mt-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white" placeholder="Author icon URL" value="${embedData.author?.icon_url || ''}" oninput="updatePreview()">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Footer Text</label>
                <input type="text" class="embed-footer-text w-full p-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white" placeholder="Footer text" value="${embedData.footer?.text || ''}" oninput="updatePreview()">
                <input type="url" class="embed-footer-icon w-full p-2 mt-2 bg-gray-600 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-white" placeholder="Footer icon URL" value="${embedData.footer?.icon_url || ''}" oninput="updatePreview()">
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
        embedCount++;
        updateEmbedIndices();
        updatePreview();
        console.log('Added embed:', embedDiv.id);
    } catch (e) {
        console.error('Error in addEmbed:', e.message);
        showNotification('error', `Failed to add embed: ${e.message}`);
    }
}

function removeEmbed(index) {
    try {
        const embed = document.getElementById(`embed-${index}`);
        if (!embed) throw new Error(`Embed ${index} not found`);
        embed.remove();
        updateEmbedIndices();
        updatePreview();
        showNotification('success', 'Embed removed successfully!');
        console.log('Removed embed:', index);
    } catch (e) {
        console.error('Error in removeEmbed:', e.message);
        showNotification('error', `Failed to remove embed: ${e.message}`);
    }
}

function updateEmbedIndices() {
    try {
        const embeds = document.querySelectorAll('.embed-item');
        embeds.forEach((embed, i) => {
            embed.id = `embed-${i}`;
            const header = embed.querySelector('h3');
            if (header) header.textContent = `Embed ${i + 1}`;
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
        console.log('Updated embed indices, count:', embedCount);
    } catch (e) {
        console.error('Error in updateEmbedIndices:', e.message);
        showNotification('error', `Failed to update embed indices: ${e.message}`);
    }
}

function addField(embedIndex, fieldData = {}) {
    try {
        const fieldsContainer = document.getElementById(`fields-${embedIndex}`);
        if (!fieldsContainer) throw new Error(`Fields container for embed ${embedIndex} not found`);
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'field-item bg-gray-600 p-3 rounded flex flex-col space-y-2 animate-fadeIn';
        fieldDiv.innerHTML = `
            <div class="flex space-x-2">
                <input type="text" class="field-name w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-green-500 focus:outline-none text-white" placeholder="Field name" value="${fieldData.name || ''}" oninput="updatePreview()">
                <input type="text" class="field-value w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-green-500 focus:outline-none text-white" placeholder="Field value" value="${fieldData.value || ''}" oninput="updatePreview()">
                <label class="flex items-center space-x-1 cursor-pointer">
                    <input type="checkbox" class="field-inline accent-green-500" ${fieldData.inline ? 'checked' : ''} onchange="updatePreview()"> <span class="text-sm">Inline</span>
                </label>
                <button onclick="this.parentElement.parentElement.remove(); updatePreview()" class="text-red-400 hover:text-red-300 p-1">&times;</button>
            </div>
        `;
        fieldsContainer.appendChild(fieldDiv);
        updatePreview();
        console.log('Added field to embed:', embedIndex);
    } catch (e) {
        console.error('Error in addField:', e.message);
        showNotification('error', `Failed to add field: ${e.message}`);
    }
}

function handleFiles() {
    try {
        const input = document.getElementById('fileInput');
        if (!input) throw new Error('File input not found');
        const newFiles = Array.from(input.files).filter(file => {
            if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return false;
            if (file.size > 8 * 1024 * 1024) {
                showNotification('error', `File ${file.name} exceeds 8MB limit`);
                return false;
            }
            return true;
        });
        files = [...files, ...newFiles];
        if (files.length > 10) {
            files = files.slice(0, 10);
            showNotification('error', 'Maximum 10 files allowed, extra files ignored');
        }
        const attachmentsDiv = document.getElementById('attachments');
        if (!attachmentsDiv) throw new Error('Attachments container not found');
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
        console.log('Handled files:', files.map(f => f.name));
    } catch (e) {
        console.error('Error in handleFiles:', e.message);
        showNotification('error', `Failed to handle files: ${e.message}`);
    }
}

function removeFile(index) {
    try {
        if (index < 0 || index >= files.length) throw new Error(`Invalid file index: ${index}`);
        files.splice(index, 1);
        const input = document.getElementById('fileInput');
        if (input) input.value = '';
        const attachmentsDiv = document.getElementById('attachments');
        if (!attachmentsDiv) throw new Error('Attachments container not found');
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
        showNotification('success', 'File removed successfully!');
        console.log('Removed file at index:', index, 'Remaining files:', files.map(f => f.name));
    } catch (e) {
        console.error('Error in removeFile:', e.message);
        showNotification('error', `Failed to remove file: ${e.message}`);
    }
}

function loadTemplate() {
    try {
        const template = document.getElementById('templateSelect')?.value;
        if (!template) return;
        const data = templates[template];
        document.getElementById('content').value = data.content || '';
        document.getElementById('embedsContainer').innerHTML = '';
        embedCount = 0;
        data.embeds.forEach(embed => addEmbed(embed));
        showNotification('success', 'Template loaded successfully!');
        updatePreview();
        console.log('Loaded template:', template);
    } catch (e) {
        console.error('Error in loadTemplate:', e.message);
        showNotification('error', `Failed to load template: ${e.message}`);
    }
}

function loadFromJSON() {
    try {
        const jsonInput = document.getElementById('jsonInput')?.value;
        if (!jsonInput) throw new Error('JSON input is empty');
        const data = JSON.parse(jsonInput);
        document.getElementById('content').value = data.content || '';
        document.getElementById('embedsContainer').innerHTML = '';
        embedCount = 0;
        if (data.embeds) {
            data.embeds.forEach(embed => addEmbed(embed));
        }
        showNotification('success', 'JSON loaded successfully!');
        updatePreview();
        console.log('Loaded JSON:', jsonInput);
    } catch (e) {
        console.error('Error in loadFromJSON:', e.message);
        showNotification('error', `Invalid JSON format: ${e.message}`);
    }
}

function isValidImageUrl(url) {
    return !url || /\.(png|jpg|jpeg|gif)$/i.test(url);
}

function generateJSON(skipModal = false) {
    try {
        const webhookUrl = document.getElementById('webhookUrl')?.value;
        if (!webhookUrl) {
            showNotification('error', 'Webhook URL is required!');
            return null;
        }
        const payload = {
            content: document.getElementById('content')?.value || '',
            embeds: []
        };

        const embedItems = document.querySelectorAll('.embed-item');
        if (embedItems.length > 10) throw new Error('Maximum 10 embeds allowed');
        embedItems.forEach((item, index) => {
            const embed = {};
            const titleInput = item.querySelector('.embed-title');
            if (!titleInput) {
                console.error(`Title input not found for embed ${index}`);
                return;
            }
            embed.title = titleInput.value || '';
            const urlInput = item.querySelector('.embed-url');
            if (!urlInput) {
                console.error(`URL input not found for embed ${index}`);
                return;
            }
            embed.url = urlInput.value || '';
            if (embed.title && embed.url && !/^https?:\/\//.test(embed.url)) {
                throw new Error(`Invalid URL for embed ${index + 1}`);
            }
            const descriptionInput = item.querySelector('.embed-description');
            if (!descriptionInput) {
                console.error(`Description input not found for embed ${index}`);
                return;
            }
            embed.description = descriptionInput.value || '';
            const colorInput = item.querySelector('.embed-color');
            if (!colorInput) {
                console.error(`Color input not found for embed ${index}`);
                return;
            }
            embed.color = parseInt(colorInput.value.slice(1), 16) || 0x5865f2;
            const timestampInput = item.querySelector('.embed-timestamp');
            if (timestampInput && timestampInput.value) {
                embed.timestamp = new Date(timestampInput.value).toISOString();
            }
            const thumbnailInput = item.querySelector('.embed-thumbnail');
            if (thumbnailInput && thumbnailInput.value) {
                if (!isValidImageUrl(thumbnailInput.value)) {
                    showNotification('error', `Invalid thumbnail URL for embed ${index + 1}: must end in .png, .jpg, .jpeg, or .gif`);
                    console.error(`Invalid thumbnail URL for embed ${index}: ${thumbnailInput.value}`);
                } else {
                    embed.thumbnail = { url: thumbnailInput.value };
                }
            }
            const imageInput = item.querySelector('.embed-image');
            if (imageInput && imageInput.value) {
                if (!isValidImageUrl(imageInput.value)) {
                    showNotification('error', `Invalid image URL for embed ${index + 1}: must end in .png, .jpg, .jpeg, or .gif`);
                    console.error(`Invalid image URL for embed ${index}: ${imageInput.value}`);
                } else {
                    embed.image = { url: imageInput.value };
                }
            }
            const authorNameInput = item.querySelector('.embed-author-name');
            if (authorNameInput && authorNameInput.value) {
                embed.author = { name: authorNameInput.value };
                const authorIconInput = item.querySelector('.embed-author-icon');
                if (authorIconInput && authorIconInput.value) {
                    if (!isValidImageUrl(authorIconInput.value)) {
                        showNotification('error', `Invalid author icon URL for embed ${index + 1}: must end in .png, .jpg, .jpeg, or .gif`);
                        console.error(`Invalid author icon URL for embed ${index}: ${authorIconInput.value}`);
                    } else {
                        embed.author.icon_url = authorIconInput.value;
                    }
                }
            }
            const footerTextInput = item.querySelector('.embed-footer-text');
            if (footerTextInput && footerTextInput.value) {
                embed.footer = { text: footerTextInput.value };
                const footerIconInput = item.querySelector('.embed-footer-icon');
                if (footerIconInput && footerIconInput.value) {
                    if (!isValidImageUrl(footerIconInput.value)) {
                        showNotification('error', `Invalid footer icon URL for embed ${index + 1}: must end in .png, .jpg, .jpeg, or .gif`);
                        console.error(`Invalid footer icon URL for embed ${index}: ${footerIconInput.value}`);
                    } else {
                        embed.footer.icon_url = footerIconInput.value;
                    }
                }
            }
            const fields = item.querySelectorAll('.field-item');
            if (fields.length > 0) {
                if (fields.length > 25) throw new Error(`Maximum 25 fields per embed allowed for embed ${index + 1}`);
                embed.fields = Array.from(fields).map(field => {
                    const nameInput = field.querySelector('.field-name');
                    const valueInput = field.querySelector('.field-value');
                    const inlineInput = field.querySelector('.field-inline');
                    if (!nameInput || !valueInput || !inlineInput) {
                        console.error(`Field inputs missing for embed ${index}`);
                        return null;
                    }
                    return {
                        name: nameInput.value || '',
                        value: valueInput.value || '',
                        inline: inlineInput.checked
                    };
                }).filter(field => field && field.name && field.value);
            }
            if (embed.title || embed.description || embed.fields?.length) {
                payload.embeds.push(embed);
                console.log(`Added embed ${index} to payload`);
            } else {
                console.warn(`Skipped embed ${index}: no title, description, or fields`);
            }
        });

        if (!skipModal) {
            const jsonString = JSON.stringify(payload, null, 2);
            document.getElementById('jsonOutput').value = jsonString;
            document.getElementById('jsonModal').classList.remove('hidden');
            showNotification('success', 'JSON generated successfully!');
            console.log('Generated JSON:', jsonString);
        }
        console.log('Generated payload:', payload);
        return payload;
    } catch (e) {
        console.error('Error in generateJSON:', e.message);
        showNotification('error', `Failed to generate JSON: ${e.message}`);
        return null;
    }
}

function copyJSON() {
    try {
        const textarea = document.getElementById('jsonOutput');
        if (!textarea) throw new Error('JSON output textarea not found');
        textarea.select();
        document.execCommand('copy');
        showNotification('success', 'JSON copied to clipboard!');
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check mr-2"></i>Copied!';
        setTimeout(() => { button.innerHTML = originalText; }, 2000);
        console.log('Copied JSON to clipboard');
    } catch (e) {
        console.error('Error in copyJSON:', e.message);
        showNotification('error', `Failed to copy JSON: ${e.message}`);
    }
}

function closeModal() {
    try {
        document.getElementById('jsonModal').classList.add('hidden');
        showNotification('success', 'Modal closed!');
        console.log('Closed JSON modal');
    } catch (e) {
        console.error('Error in closeModal:', e.message);
        showNotification('error', `Failed to close modal: ${e.message}`);
    }
}

function showClearConfirm() {
    try {
        document.getElementById('clearConfirmModal').classList.remove('hidden');
        console.log('Opened clear confirm modal');
    } catch (e) {
        console.error('Error in showClearConfirm:', e.message);
        showNotification('error', `Failed to open clear modal: ${e.message}`);
    }
}

function closeClearConfirm() {
    try {
        const modal = document.getElementById('clearConfirmModal');
        if (!modal) throw new Error('Clear confirm modal not found');
        modal.classList.add('animate-fadeOut');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('animate-fadeOut');
            console.log('Closed clear confirm modal');
        }, 300);
    } catch (e) {
        console.error('Error in closeClearConfirm:', e.message);
        showNotification('error', `Failed to close clear modal: ${e.message}`);
    }
}

function clearAll() {
    try {
        document.getElementById('content').value = '';
        document.getElementById('webhookUrl').value = '';
        document.getElementById('embedsContainer').innerHTML = '';
        document.getElementById('attachments').innerHTML = '';
        document.getElementById('jsonInput').value = '';
        files = [];
        const input = document.getElementById('fileInput');
        if (input) input.value = '';
        embedCount = 0;
        updatePreview();
        closeClearConfirm();
        showNotification('success', 'All fields cleared!');
        console.log('Cleared all fields');
    } catch (e) {
        console.error('Error in clearAll:', e.message);
        showNotification('error', `Failed to clear fields: ${e.message}`);
    }
}

function sendToDiscord() {
    try {
        const webhookUrl = document.getElementById('webhookUrl')?.value;
        if (!webhookUrl || !/^https:\/\/(discord\.com|discordapp\.com|ptb\.discord\.com)\/api\/webhooks\/[0-9]+\/[A-Za-z0-9_-]+/.test(webhookUrl)) {
            showNotification('error', 'Please provide a valid Discord webhook URL (e.g., discord.com, discordapp.com, or ptb.discord.com)!');
            console.error('Invalid webhook URL:', webhookUrl);
            return;
        }

        const payload = generateJSON(true);
        if (!payload) return;

        if (!payload.content && (!payload.embeds || payload.embeds.length === 0) && (!files || files.length === 0)) {
            showNotification('error', 'Please add content, embeds, or files before sending!');
            console.error('Empty payload: no content, embeds, or files');
            return;
        }

        if (files.length > 10) {
            showNotification('error', 'Maximum 10 files allowed');
            console.error('Too many files:', files.length);
            return;
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
                console.log('Sending payload to proxy (no files):', payload);
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

function togglePreview() {
    try {
        const panel = document.getElementById('previewPanel');
        const hideBtn = document.getElementById('hidePreviewBtn');
        const viewBtn = document.getElementById('viewPreviewBtn');
        const builderPanel = document.getElementById('builderPanel');
        if (!panel || !hideBtn || !viewBtn || !builderPanel) throw new Error('Preview panel or buttons not found');
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
        console.log('Toggled preview visibility:', isPreviewVisible);
    } catch (e) {
        console.error('Error in togglePreview:', e.message);
        showNotification('error', `Failed to toggle preview: ${e.message}`);
    }
}

function showNotification(type, message) {
    try {
        const notification = document.getElementById('notification');
        const content = document.getElementById('notificationContent');
        if (!notification || !content) throw new Error('Notification elements not found');
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
        console.log('Notification shown:', type, message);
    } catch (e) {
        console.error('Error in showNotification:', e.message);
    }
}

function isValidUrl(url) {
    return !url || /^https?:\/\/[^\s$.?#].[^\s]*$/.test(url);
}

function updatePreview() {
    try {
        console.log('Updating preview...');
        const preview = document.getElementById('preview');
        if (!preview) throw new Error('Preview element not found');
        const content = document.getElementById('content')?.value || '';
        let html = '';

        // Attachments first to match Discord's rendering order
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

        if (content) {
            html += `<div class="bg-discord-bg p-4 rounded-lg mb-4">${parseDiscordMarkdown(content)}</div>`;
        }

        const embedItems = document.querySelectorAll('.embed-item');
        embedItems.forEach((item, index) => {
            let embedHtml = '<div class="preview-embed rounded-lg p-4 mb-4">';
            const titleInput = item.querySelector('.embed-title');
            if (titleInput && titleInput.value) {
                embedHtml += `<h3 class="font-bold text-lg mb-1 text-white">${parseDiscordMarkdown(titleInput.value)}</h3>`;
            } else {
                console.warn(`Title input missing or empty for embed ${index}`);
            }
            const descriptionInput = item.querySelector('.embed-description');
            if (descriptionInput && descriptionInput.value) {
                embedHtml += `<p class="text-gray-300 mb-3">${parseDiscordMarkdown(descriptionInput.value)}</p>`;
            } else {
                console.warn(`Description input missing or empty for embed ${index}`);
            }
            const thumbnailInput = item.querySelector('.embed-thumbnail');
            if (thumbnailInput && thumbnailInput.value && isValidUrl(thumbnailInput.value) && isValidImageUrl(thumbnailInput.value)) {
                embedHtml += `<img src="${thumbnailInput.value}" alt="Thumbnail" class="w-20 h-20 object-cover rounded mb-3 float-right" onerror="this.style.display='none'">`;
            } else if (thumbnailInput) {
                console.warn(`Invalid or empty thumbnail URL for embed ${index}`);
            }
            const imageInput = item.querySelector('.embed-image');
            if (imageInput && imageInput.value && isValidUrl(imageInput.value) && isValidImageUrl(imageInput.value)) {
                embedHtml += `<img src="${imageInput.value}" alt="Image" class="w-full h-auto rounded mb-3" onerror="this.style.display='none'">`;
            } else if (imageInput) {
                console.warn(`Invalid or empty image URL for embed ${index}`);
            }
            const authorNameInput = item.querySelector('.embed-author-name');
            const authorIconInput = item.querySelector('.embed-author-icon');
            if (authorNameInput && authorNameInput.value) {
                embedHtml += `<div class="flex items-center mb-3">`;
                if (authorIconInput && authorIconInput.value && isValidUrl(authorIconInput.value) && isValidImageUrl(authorIconInput.value)) {
                    embedHtml += `<img src="${authorIconInput.value}" alt="Author Icon" class="w-6 h-6 rounded-full mr-2" onerror="this.style.display='none'">`;
                }
                embedHtml += `<span class="font-semibold">${parseDiscordMarkdown(authorNameInput.value)}</span></div>`;
            } else if (authorNameInput) {
                console.warn(`Author name input missing or empty for embed ${index}`);
            }
            const fields = item.querySelectorAll('.field-item');
            fields.forEach((field, fieldIndex) => {
                const nameInput = field.querySelector('.field-name');
                const valueInput = field.querySelector('.field-value');
                const inlineInput = field.querySelector('.field-inline');
                if (nameInput && valueInput && nameInput.value && valueInput.value) {
                    embedHtml += `<div class="mb-2 ${inlineInput?.checked ? 'field-inline' : ''}">
                        <div class="font-semibold text-white mb-1">${parseDiscordMarkdown(nameInput.value)}</div>
                        <div class="text-gray-300">${parseDiscordMarkdown(valueInput.value)}</div>
                    </div>`;
                } else {
                    console.warn(`Field ${fieldIndex} missing name or value for embed ${index}`);
                }
            });
            const footerTextInput = item.querySelector('.embed-footer-text');
            const footerIconInput = item.querySelector('.embed-footer-icon');
            const timestampInput = item.querySelector('.embed-timestamp');
            if ((footerTextInput && footerTextInput.value) || (timestampInput && timestampInput.value)) {
                embedHtml += `<div class="flex items-center mt-3 text-gray-400 text-sm">`;
                if (footerIconInput && footerIconInput.value && isValidUrl(footerIconInput.value) && isValidImageUrl(footerIconInput.value)) {
                    embedHtml += `<img src="${footerIconInput.value}" alt="Footer Icon" class="w-5 h-5 mr-2" onerror="this.style.display='none'">`;
                }
                const footerText = footerTextInput?.value ? parseDiscordMarkdown(footerTextInput.value) : '';
                const timestamp = timestampInput?.value ? new Date(timestampInput.value).toLocaleString() : '';
                embedHtml += `<span>${footerText}${footerText && timestamp ? ' | ' : ''}${timestamp}</span></div>`;
            }
            const colorInput = item.querySelector('.embed-color');
            const color = colorInput?.value || '#5865f2';
            embedHtml = embedHtml.replace('preview-embed', `preview-embed border-l-[4px] border-l-[${color}]`);
            embedHtml += '</div>';
            html += embedHtml;
        });

        preview.innerHTML = html || '<p class="text-gray-400 italic">Build your embed to see a live preview here...</p>';
        console.log('Preview updated with order: attachments, content, embeds', html);
    } catch (e) {
        console.error('Error in updatePreview:', e.message);
        showNotification('error', `Failed to update preview: ${e.message}`);
    }
}

function toggleEmojiPicker(pickerId) {
    try {
        const picker = document.getElementById(pickerId);
        if (!picker) throw new Error(`Emoji picker ${pickerId} not found`);
        const isActive = picker.classList.contains('active');
        document.querySelectorAll('emoji-picker').forEach(p => p.classList.remove('active'));
        if (!isActive) {
            picker.classList.add('active');
            console.log(`Toggled emoji picker ${pickerId} to active`);
        }
    } catch (e) {
        console.error('Error in toggleEmojiPicker:', e.message);
        showNotification('error', `Failed to toggle emoji picker: ${e.message}`);
    }
}

function setupEmojiPicker(pickerId) {
    try {
        const picker = document.getElementById(pickerId);
        if (!picker) throw new Error(`Emoji picker ${pickerId} not found`);
        if (!picker.dataset.listenerAdded) {
            console.log(`Setting up emoji picker: ${pickerId}`);
            picker.addEventListener('emoji-click', event => {
                console.log(`Emoji clicked: ${event.detail.unicode}`);
                const textarea = picker.closest('.emoji-picker-container')?.querySelector('textarea');
                if (textarea) {
                    textarea.value += event.detail.unicode;
                    updatePreview();
                }
                picker.classList.remove('active');
            });
            picker.dataset.listenerAdded = true;
        }
    } catch (e) {
        console.error('Error in setupEmojiPicker:', e.message);
        showNotification('error', `Failed to setup emoji picker: ${e.message}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('DOM loaded, initializing...');
        addEmbed();
        setupEmojiPicker('contentEmojiPicker');

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

        updatePreview();
    } catch (e) {
        console.error('Error in DOMContentLoaded:', e.message);
        showNotification('error', `Failed to initialize: ${e.message}`);
    }
});
