const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const PptxGenJS = require('pptxgenjs');

const router = express.Router();

// Helper function to load deck data
async function loadDeck(deckId) {
    try {
        const deckPath = path.join(__dirname, '../../storage/decks', `${deckId}.json`);
        const deckData = JSON.parse(await fs.readFile(deckPath, 'utf8'));
        
        if (!deckData.slides || !Array.isArray(deckData.slides)) {
            throw new Error('Invalid deck data: slides must be an array');
        }
        
        return deckData;
    } catch (error) {
        console.error('Error loading deck:', error);
        throw error;
    }
}

// GET /editor/:deckId - Enhanced PowerPoint-style slide editor
router.get('/editor/:deckId', async (req, res) => {
    try {
        const { deckId } = req.params;
        
        // Load deck data
        const deckData = await loadDeck(deckId);
        
        if (!deckData.slides || !Array.isArray(deckData.slides)) {
            return res.status(400).send('<h1>Error: Invalid deck data</h1>');
        }

        console.log(`Opening Enhanced PowerPoint editor for deck: ${deckId}`);
        
        // Generate editable slides
        const slidesData = JSON.stringify(deckData.slides);
        
        // Create enhanced PowerPoint-style editor with advanced features
        const editorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎨 Enhanced PowerPoint Editor - ${deckData.metadata?.deckTitle || 'Pitch Deck'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        :root {
            --primary-color: #2563eb;
            --primary-dark: #1d4ed8;
            --success-color: #10b981;
            --warning-color: #f59e0b;
            --danger-color: #ef4444;
            --text-primary: #1f2937;
            --text-secondary: #6b7280;
            --bg-primary: #ffffff;
            --bg-secondary: #f8fafc;
            --border-color: #e5e7eb;
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: var(--bg-secondary);
            color: var(--text-primary);
            height: 100vh;
            overflow: hidden;
        }
        
        .editor-container {
            display: grid;
            grid-template-areas: 
                "header header header"
                "toolbar toolbar toolbar"
                "sidebar main panel";
            grid-template-rows: 60px 60px 1fr;
            grid-template-columns: 280px 1fr 320px;
            height: 100vh;
            background: var(--bg-primary);
        }
        
        /* Header */
        .header {
            grid-area: header;
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            box-shadow: var(--shadow-md);
            color: white;
        }
        
        .header h1 {
            font-size: 20px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .header-actions {
            display: flex;
            gap: 12px;
        }
        
        /* Toolbar */
        .toolbar {
            grid-area: toolbar;
            background: var(--bg-primary);
            border-bottom: 2px solid var(--border-color);
            display: flex;
            align-items: center;
            padding: 0 24px;
            gap: 20px;
            overflow-x: auto;
        }
        
        .toolbar-group {
            display: flex;
            align-items: center;
            gap: 8px;
            padding-right: 20px;
            border-right: 1px solid var(--border-color);
        }
        
        .toolbar-group:last-child {
            border-right: none;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
        }
        
        .btn-primary {
            background: var(--primary-color);
            color: white;
        }
        
        .btn-primary:hover {
            background: var(--primary-dark);
            transform: translateY(-1px);
        }
        
        .btn-success {
            background: var(--success-color);
            color: white;
        }
        
        .btn-success:hover {
            background: #059669;
            transform: translateY(-1px);
        }
        
        .btn-secondary {
            background: var(--bg-secondary);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
        }
        
        .btn-secondary:hover {
            background: #e5e7eb;
        }
        
        .btn-sm {
            padding: 6px 12px;
            font-size: 12px;
        }
        
        /* Sidebar */
        .sidebar {
            grid-area: sidebar;
            background: var(--bg-primary);
            border-right: 2px solid var(--border-color);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .sidebar-header {
            padding: 20px;
            border-bottom: 1px solid var(--border-color);
            background: var(--bg-secondary);
        }
        
        .sidebar-title {
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 4px;
        }
        
        .sidebar-subtitle {
            font-size: 12px;
            color: var(--text-secondary);
        }
        
        .slide-thumbnails {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        }
        
        .thumbnail {
            width: 100%;
            height: 140px;
            background: white;
            border: 2px solid var(--border-color);
            border-radius: 12px;
            margin-bottom: 12px;
            cursor: pointer;
            position: relative;
            transition: all 0.3s ease;
            overflow: hidden;
            box-shadow: var(--shadow-sm);
        }
        
        .thumbnail:hover {
            border-color: var(--primary-color);
            box-shadow: var(--shadow-md);
            transform: translateY(-2px);
        }
        
        .thumbnail.active {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(37,99,235,0.2);
        }
        
        .thumbnail-content {
            padding: 12px;
            font-size: 10px;
            line-height: 1.4;
            height: 100%;
            overflow: hidden;
        }
        
        .slide-number {
            position: absolute;
            top: 6px;
            left: 6px;
            background: var(--primary-color);
            color: white;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
        }
        
        .slide-actions {
            position: absolute;
            top: 6px;
            right: 6px;
            display: none;
            gap: 4px;
        }
        
        .thumbnail:hover .slide-actions {
            display: flex;
        }
        
        .slide-action-btn {
            width: 24px;
            height: 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }
        
        .btn-duplicate {
            background: var(--success-color);
            color: white;
        }
        
        .btn-delete {
            background: var(--danger-color);
            color: white;
        }
        
        /* Main Content */
        .main-content {
            grid-area: main;
            display: flex;
            flex-direction: column;
            background: #f1f5f9;
            overflow: hidden;
        }
        
        .slide-editor {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
        }
        
        .slide-canvas {
            width: 960px;
            height: 720px;
            background: white;
            border: 2px solid var(--border-color);
            border-radius: 16px;
            box-shadow: var(--shadow-lg);
            position: relative;
            overflow: hidden;
        }
        
        .slide-content {
            width: 100%;
            height: 100%;
            padding: 60px;
            outline: none;
            font-size: 18px;
            line-height: 1.6;
            color: var(--text-primary);
            overflow-y: auto;
        }
        
        .slide-content:focus {
            box-shadow: inset 0 0 0 4px rgba(37,99,235,0.1);
        }
        
        .slide-content h1 {
            font-size: 48px;
            margin-bottom: 32px;
            color: var(--text-primary);
            font-weight: 700;
            line-height: 1.2;
        }
        
        .slide-content h2 {
            font-size: 36px;
            margin-bottom: 24px;
            color: var(--text-primary);
            font-weight: 600;
            line-height: 1.3;
        }
        
        .slide-content h3 {
            font-size: 28px;
            margin-bottom: 20px;
            color: var(--text-primary);
            font-weight: 500;
        }
        
        .slide-content p {
            margin-bottom: 20px;
            color: var(--text-secondary);
        }
        
        .slide-content ul, .slide-content ol {
            margin-left: 32px;
            margin-bottom: 20px;
        }
        
        .slide-content li {
            margin-bottom: 12px;
            color: var(--text-secondary);
        }
        
        .slide-content strong {
            color: var(--text-primary);
        }
        
        /* Design Panel */
        .design-panel {
            grid-area: panel;
            background: var(--bg-primary);
            border-left: 2px solid var(--border-color);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .panel-header {
            padding: 20px;
            border-bottom: 1px solid var(--border-color);
            background: var(--bg-secondary);
        }
        
        .panel-title {
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .panel-content {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }
        
        .design-section {
            margin-bottom: 32px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 16px;
        }
        
        .theme-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .theme-option {
            height: 64px;
            border-radius: 8px;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .theme-option:hover {
            border-color: var(--primary-color);
            transform: scale(1.05);
        }
        
        .theme-option.active {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(37,99,235,0.2);
        }
        
        .theme-blue { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
        .theme-green { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .theme-purple { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
        .theme-orange { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
        .theme-red { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
        .theme-teal { background: linear-gradient(135deg, #14b8a6 0%, #0f766e 100%); }
        
        .font-selector, .color-picker-input {
            width: 100%;
            padding: 12px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
        }
        
        .color-picker {
            width: 100%;
            height: 40px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            cursor: pointer;
            margin-bottom: 16px;
        }
        
        /* Status Bar */
        .status-bar {
            background: var(--bg-secondary);
            padding: 12px 24px;
            border-top: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: var(--text-secondary);
        }
        
        .status-left, .status-right {
            display: flex;
            gap: 16px;
        }
        
        /* Save Indicator */
        .save-indicator {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
        }
        
        .save-indicator.saved {
            background: #dcfce7;
            color: #16a34a;
        }
        
        .save-indicator.saving {
            background: #fef3c7;
            color: #d97706;
        }
        
        .save-indicator.error {
            background: #fee2e2;
            color: #dc2626;
        }
        
        /* Responsive Design */
        @media (max-width: 1400px) {
            .editor-container {
                grid-template-columns: 260px 1fr 280px;
            }
            
            .slide-canvas {
                width: 800px;
                height: 600px;
            }
        }
        
        @media (max-width: 1024px) {
            .editor-container {
                grid-template-areas: 
                    "header header"
                    "toolbar toolbar"
                    "main panel";
                grid-template-columns: 1fr 280px;
            }
            
            .sidebar {
                display: none;
            }
            
            .slide-canvas {
                width: 600px;
                height: 450px;
            }
        }
        
        @media (max-width: 768px) {
            .editor-container {
                grid-template-areas: 
                    "header"
                    "toolbar"
                    "main";
                grid-template-columns: 1fr;
            }
            
            .design-panel {
                display: none;
            }
            
            .slide-canvas {
                width: 90%;
                height: 400px;
            }
        }
    </style>
</head>
<body>
    <div class="editor-container">
        <!-- Header -->
        <div class="header">
            <h1>🎨 ${deckData.metadata?.deckTitle || 'Pitch Deck Editor'}</h1>
            <div class="header-actions">
                <button class="btn btn-success btn-sm" onclick="savePresentation()">
                    💾 Save
                </button>
                <button class="btn btn-primary btn-sm" onclick="exportPresentation()">
                    📤 Export PPT
                </button>
            </div>
        </div>
        
        <!-- Toolbar -->
        <div class="toolbar">
            <div class="toolbar-group">
                <button class="btn btn-secondary btn-sm" onclick="addNewSlide()" title="Add Slide">
                    ➕ New Slide
                </button>
                <button class="btn btn-secondary btn-sm" onclick="duplicateSlide()" title="Duplicate Slide">
                    📋 Duplicate
                </button>
                <button class="btn btn-secondary btn-sm" onclick="deleteSlide()" title="Delete Slide">
                    🗑️ Delete
                </button>
            </div>
            
            <div class="toolbar-group">
                <button class="btn btn-secondary btn-sm" onclick="formatText('bold')" title="Bold">
                    <strong>B</strong>
                </button>
                <button class="btn btn-secondary btn-sm" onclick="formatText('italic')" title="Italic">
                    <em>I</em>
                </button>
                <button class="btn btn-secondary btn-sm" onclick="formatText('underline')" title="Underline">
                    <u>U</u>
                </button>
            </div>
            
            <div class="toolbar-group">
                <select class="font-selector" onchange="changeFontSize(this.value)">
                    <option value="16">16px</option>
                    <option value="18" selected>18px</option>
                    <option value="20">20px</option>
                    <option value="24">24px</option>
                    <option value="28">28px</option>
                    <option value="32">32px</option>
                    <option value="36">36px</option>
                    <option value="48">48px</option>
                </select>
            </div>
            
            <div class="toolbar-group">
                <button class="btn btn-secondary btn-sm" onclick="undoAction()" title="Undo">
                    ↶ Undo
                </button>
                <button class="btn btn-secondary btn-sm" onclick="redoAction()" title="Redo">
                    ↷ Redo
                </button>
            </div>
        </div>
        
        <!-- Sidebar - Slide Thumbnails -->
        <div class="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-title">Slides</div>
                <div class="sidebar-subtitle" id="slide-count">${deckData.slides.length} slides</div>
            </div>
            <div class="slide-thumbnails" id="slide-thumbnails">
                ${deckData.slides.map((slide, index) => `
                    <div class="thumbnail ${index === 0 ? 'active' : ''}" data-slide="${index}">
                        <div class="slide-number">${index + 1}</div>
                        <div class="slide-actions">
                            <button class="slide-action-btn btn-duplicate" onclick="duplicateSlide(${index})" title="Duplicate">
                                📋
                            </button>
                            <button class="slide-action-btn btn-delete" onclick="deleteSlide(${index})" title="Delete">
                                🗑️
                            </button>
                        </div>
                        <div class="thumbnail-content">
                            <div style="font-weight: bold; margin-bottom: 4px;">${slide.title || `Slide ${index + 1}`}</div>
                            <div style="font-size: 8px; opacity: 0.7;">
                                ${Array.isArray(slide.content) ? slide.content.slice(0, 2).join(', ') + (slide.content.length > 2 ? '...' : '') : (slide.content || '').substring(0, 80)}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Main Editor -->
        <div class="main-content">
            <div class="slide-editor">
                <div class="slide-canvas">
                    <div class="slide-content" id="slide-content" contenteditable="true" data-slide="0">
                        <!-- Content will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Design Panel -->
        <div class="design-panel">
            <div class="panel-header">
                <div class="panel-title">Design</div>
            </div>
            <div class="panel-content">
                <div class="design-section">
                    <div class="section-title">Themes</div>
                    <div class="theme-grid">
                        <div class="theme-option theme-blue active" data-theme="blue" onclick="applyTheme('blue')"></div>
                        <div class="theme-option theme-green" data-theme="green" onclick="applyTheme('green')"></div>
                        <div class="theme-option theme-purple" data-theme="purple" onclick="applyTheme('purple')"></div>
                        <div class="theme-option theme-orange" data-theme="orange" onclick="applyTheme('orange')"></div>
                        <div class="theme-option theme-red" data-theme="red" onclick="applyTheme('red')"></div>
                        <div class="theme-option theme-teal" data-theme="teal" onclick="applyTheme('teal')"></div>
                    </div>
                </div>
                
                <div class="design-section">
                    <div class="section-title">Font Family</div>
                    <select class="font-selector" onchange="changeFontFamily(this.value)">
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Helvetica, sans-serif">Helvetica</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="'Times New Roman', serif">Times New Roman</option>
                        <option value="'Courier New', monospace">Courier New</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                        <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                    </select>
                </div>
                
                <div class="design-section">
                    <div class="section-title">Background Color</div>
                    <input type="color" class="color-picker" id="bg-color-picker" value="#ffffff" onchange="changeBackgroundColor(this.value)">
                </div>
                
                <div class="design-section">
                    <div class="section-title">Text Color</div>
                    <input type="color" class="color-picker" id="text-color-picker" value="#1f2937" onchange="changeTextColor(this.value)">
                </div>
            </div>
        </div>
    </div>
    
    <!-- Status Bar -->
    <div class="status-bar">
        <div class="status-left">
            <span>Slide <span id="current-slide-num">1</span> of <span id="total-slides">${deckData.slides.length}</span></span>
            <div class="save-indicator saved" id="save-status">All changes saved</div>
        </div>
        <div class="status-right">
            <span id="last-saved">Last saved: Never</span>
        </div>
    </div>

    <script>
        let slidesData = ${slidesData};
        let currentSlideIndex = 0;
        let undoStack = [];
        let redoStack = [];
        let autoSaveTimer;
        let hasUnsavedChanges = false;
        
        // Initialize editor
        document.addEventListener('DOMContentLoaded', function() {
            loadSlide(0);
            setupAutoSave();
            setupKeyboardShortcuts();
        });
        
        // Load slide content into editor
        function loadSlide(slideIndex) {
            if (slideIndex < 0 || slideIndex >= slidesData.length) return;
            
            currentSlideIndex = slideIndex;
            const slide = slidesData[slideIndex];
            const slideContent = document.getElementById('slide-content');
            
            // Update active thumbnail
            document.querySelectorAll('.thumbnail').forEach((thumb, idx) => {
                thumb.classList.toggle('active', idx === slideIndex);
            });
            
            // Format slide content
            let content = '';
            if (slide.title) {
                content += '<h1>' + escapeHtml(slide.title) + '</h1>';
            }
            
            if (Array.isArray(slide.content)) {
                slide.content.forEach(item => {
                    if (typeof item === 'string' && item.trim()) {
                        if (item.includes(':') && !item.includes('http')) {
                            content += '<h2>' + escapeHtml(item) + '</h2>';
                        } else {
                            content += '<p>' + escapeHtml(item) + '</p>';
                        }
                    }
                });
            } else if (typeof slide.content === 'string') {
                content += '<p>' + escapeHtml(slide.content) + '</p>';
            }
            
            slideContent.innerHTML = content;
            slideContent.setAttribute('data-slide', slideIndex);
            
            // Update status bar
            document.getElementById('current-slide-num').textContent = slideIndex + 1;
            
            // Save state for undo
            saveStateForUndo();
        }
        
        // Save current state for undo functionality
        function saveStateForUndo() {
            const state = {
                slideIndex: currentSlideIndex,
                content: document.getElementById('slide-content').innerHTML,
                timestamp: Date.now()
            };
            
            undoStack.push(state);
            if (undoStack.length > 50) undoStack.shift();
            redoStack = []; // Clear redo stack
        }
        
        // Undo action
        function undoAction() {
            if (undoStack.length < 2) return; // Need at least current + previous state
            
            const currentState = undoStack.pop();
            redoStack.push(currentState);
            
            const previousState = undoStack[undoStack.length - 1];
            document.getElementById('slide-content').innerHTML = previousState.content;
            
            updateSlideFromEditor();
            markAsUnsaved();
        }
        
        // Redo action
        function redoAction() {
            if (redoStack.length === 0) return;
            
            const state = redoStack.pop();
            undoStack.push(state);
            
            document.getElementById('slide-content').innerHTML = state.content;
            updateSlideFromEditor();
            markAsUnsaved();
        }
        
        // Add new slide
        function addNewSlide() {
            const newSlide = {
                title: 'New Slide ' + (slidesData.length + 1),
                content: ['Click here to add content']
            };
            
            slidesData.push(newSlide);
            updateThumbnails();
            loadSlide(slidesData.length - 1);
            markAsUnsaved();
        }
        
        // Duplicate slide
        function duplicateSlide(index = currentSlideIndex) {
            const slideToClone = JSON.parse(JSON.stringify(slidesData[index]));
            slideToClone.title = (slideToClone.title || 'Slide') + ' (Copy)';
            
            slidesData.splice(index + 1, 0, slideToClone);
            updateThumbnails();
            loadSlide(index + 1);
            markAsUnsaved();
        }
        
        // Delete slide
        function deleteSlide(index = currentSlideIndex) {
            if (slidesData.length <= 1) {
                alert('Cannot delete the last remaining slide.');
                return;
            }
            
            if (confirm('Are you sure you want to delete this slide?')) {
                slidesData.splice(index, 1);
                
                // Adjust current slide index if necessary
                if (currentSlideIndex >= slidesData.length) {
                    currentSlideIndex = slidesData.length - 1;
                }
                
                updateThumbnails();
                loadSlide(currentSlideIndex);
                markAsUnsaved();
            }
        }
        
        // Update thumbnails
        function updateThumbnails() {
            const thumbnailsContainer = document.getElementById('slide-thumbnails');
            thumbnailsContainer.innerHTML = slidesData.map((slide, index) => \`
                <div class="thumbnail \${index === currentSlideIndex ? 'active' : ''}" data-slide="\${index}" onclick="loadSlide(\${index})">
                    <div class="slide-number">\${index + 1}</div>
                    <div class="slide-actions">
                        <button class="slide-action-btn btn-duplicate" onclick="event.stopPropagation(); duplicateSlide(\${index})" title="Duplicate">
                            📋
                        </button>
                        <button class="slide-action-btn btn-delete" onclick="event.stopPropagation(); deleteSlide(\${index})" title="Delete">
                            🗑️
                        </button>
                    </div>
                    <div class="thumbnail-content">
                        <div style="font-weight: bold; margin-bottom: 4px;">\${slide.title || \`Slide \${index + 1}\`}</div>
                        <div style="font-size: 8px; opacity: 0.7;">
                            \${Array.isArray(slide.content) ? slide.content.slice(0, 2).join(', ') + (slide.content.length > 2 ? '...' : '') : (slide.content || '').substring(0, 80)}
                        </div>
                    </div>
                </div>
            \`).join('');
            
            // Update slide count
            document.getElementById('slide-count').textContent = slidesData.length + ' slides';
            document.getElementById('total-slides').textContent = slidesData.length;
        }
        
        // Format text
        function formatText(command) {
            document.execCommand(command, false, null);
            updateSlideFromEditor();
            markAsUnsaved();
        }
        
        // Change font size
        function changeFontSize(size) {
            document.execCommand('fontSize', false, '7'); // Use size 7 as placeholder
            const fontElements = document.querySelectorAll('font[size="7"]');
            fontElements.forEach(element => {
                element.removeAttribute('size');
                element.style.fontSize = size + 'px';
            });
            updateSlideFromEditor();
            markAsUnsaved();
        }
        
        // Change font family
        function changeFontFamily(family) {
            document.getElementById('slide-content').style.fontFamily = family;
            markAsUnsaved();
        }
        
        // Apply theme
        function applyTheme(themeName) {
            const themes = {
                blue: { bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', text: '#ffffff' },
                green: { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', text: '#ffffff' },
                purple: { bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', text: '#ffffff' },
                orange: { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', text: '#ffffff' },
                red: { bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', text: '#ffffff' },
                teal: { bg: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)', text: '#ffffff' }
            };
            
            const theme = themes[themeName];
            if (theme) {
                const canvas = document.querySelector('.slide-canvas');
                const content = document.getElementById('slide-content');
                
                canvas.style.background = theme.bg;
                content.style.color = theme.text;
                
                // Update active theme
                document.querySelectorAll('.theme-option').forEach(option => {
                    option.classList.toggle('active', option.dataset.theme === themeName);
                });
                
                markAsUnsaved();
            }
        }
        
        // Change background color
        function changeBackgroundColor(color) {
            document.querySelector('.slide-canvas').style.background = color;
            markAsUnsaved();
        }
        
        // Change text color
        function changeTextColor(color) {
            document.getElementById('slide-content').style.color = color;
            markAsUnsaved();
        }
        
        // Update slide data from editor content
        function updateSlideFromEditor() {
            const slideContent = document.getElementById('slide-content');
            const content = slideContent.innerHTML;
            
            // Parse content back to slide format
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            
            const h1 = tempDiv.querySelector('h1');
            const title = h1 ? h1.textContent : \`Slide \${currentSlideIndex + 1}\`;
            
            const contentElements = tempDiv.querySelectorAll('h2, h3, p, li');
            const contentArray = Array.from(contentElements).map(el => el.textContent.trim()).filter(text => text);
            
            slidesData[currentSlideIndex] = {
                title: title,
                content: contentArray.length > 0 ? contentArray : ['']
            };
            
            updateThumbnails();
        }
        
        // Mark as unsaved
        function markAsUnsaved() {
            hasUnsavedChanges = true;
            const saveStatus = document.getElementById('save-status');
            saveStatus.textContent = 'Unsaved changes';
            saveStatus.className = 'save-indicator error';
            
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(autoSave, 2000); // Auto-save after 2 seconds
        }
        
        // Auto-save functionality
        function setupAutoSave() {
            const slideContent = document.getElementById('slide-content');
            
            slideContent.addEventListener('input', function() {
                updateSlideFromEditor();
                markAsUnsaved();
            });
            
            slideContent.addEventListener('blur', function() {
                if (hasUnsavedChanges) {
                    autoSave();
                }
            });
        }
        
        // Auto-save function
        async function autoSave() {
            if (!hasUnsavedChanges) return;
            
            const saveStatus = document.getElementById('save-status');
            saveStatus.textContent = 'Saving...';
            saveStatus.className = 'save-indicator saving';
            
            try {
                await saveToServer();
                
                hasUnsavedChanges = false;
                saveStatus.textContent = 'All changes saved';
                saveStatus.className = 'save-indicator saved';
                document.getElementById('last-saved').textContent = 'Last saved: ' + new Date().toLocaleTimeString();
                
            } catch (error) {
                console.error('Auto-save failed:', error);
                saveStatus.textContent = 'Save failed';
                saveStatus.className = 'save-indicator error';
            }
        }
        
        // Save to server
        async function saveToServer() {
            const deckId = '${deckId}';
            const response = await fetch('/api/export/save-deck', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deckId: deckId,
                    slides: slidesData,
                    metadata: {
                        deckTitle: '${deckData.metadata?.deckTitle || 'Pitch Deck'}',
                        lastModified: new Date().toISOString()
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save presentation');
            }
            
            return response.json();
        }
        
        // Manual save function
        async function savePresentation() {
            try {
                await saveToServer();
                alert('Presentation saved successfully!');
            } catch (error) {
                console.error('Save failed:', error);
                alert('Failed to save presentation. Please try again.');
            }
        }
        
        // Export presentation
        async function exportPresentation() {
            try {
                // Update current slide before export
                updateSlideFromEditor();
                
                const response = await fetch('/api/export/editor-pptx', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        slides: slidesData,
                        metadata: {
                            deckTitle: '${deckData.metadata?.deckTitle || 'Pitch Deck'}',
                            lastModified: new Date().toISOString()
                        }
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Export failed');
                }
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = '${deckData.metadata?.deckTitle || 'presentation'}.pptx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
            } catch (error) {
                console.error('Export failed:', error);
                alert('Failed to export presentation. Please try again.');
            }
        }
        
        // Keyboard shortcuts
        function setupKeyboardShortcuts() {
            document.addEventListener('keydown', function(e) {
                // Ctrl+S for save
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    savePresentation();
                }
                
                // Ctrl+Z for undo
                if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    undoAction();
                }
                
                // Ctrl+Shift+Z or Ctrl+Y for redo
                if ((e.ctrlKey && e.shiftKey && e.key === 'Z') || (e.ctrlKey && e.key === 'y')) {
                    e.preventDefault();
                    redoAction();
                }
                
                // Arrow keys for navigation
                if (e.ctrlKey && e.key === 'ArrowLeft' && currentSlideIndex > 0) {
                    loadSlide(currentSlideIndex - 1);
                } else if (e.ctrlKey && e.key === 'ArrowRight' && currentSlideIndex < slidesData.length - 1) {
                    loadSlide(currentSlideIndex + 1);
                }
                
                // Ctrl+N for new slide
                if (e.ctrlKey && e.key === 'n') {
                    e.preventDefault();
                    addNewSlide();
                }
                
                // Delete key for delete slide (when not in content area)
                if (e.key === 'Delete' && !e.target.closest('#slide-content')) {
                    e.preventDefault();
                    deleteSlide();
                }
            });
        }
        
        // Utility function to escape HTML
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Handle thumbnail clicks
        document.addEventListener('click', function(e) {
            if (e.target.closest('.thumbnail')) {
                const slideIndex = parseInt(e.target.closest('.thumbnail').dataset.slide);
                if (!isNaN(slideIndex)) {
                    loadSlide(slideIndex);
                }
            }
        });
        
        // Prevent data loss on page unload
        window.addEventListener('beforeunload', function(e) {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    </script>
</body>
</html>`;

        // Send enhanced PowerPoint-style editor
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(editorHtml);

    } catch (error) {
        console.error('Error loading PowerPoint editor:', error);
        res.status(500).send(`
            <h1>Error Loading Editor</h1>
            <p>${error.message}</p>
            <a href="/">Return to Home</a>
        `);
    }
});

// POST /save-deck - Save edited deck data
router.post('/save-deck', async (req, res) => {
    try {
        const { deckId, slides, metadata } = req.body;
        
        if (!deckId || !slides || !Array.isArray(slides)) {
            return res.status(400).json({ error: 'Invalid deck data' });
        }
        
        // Prepare deck data
        const deckData = {
            slides: slides,
            metadata: {
                ...metadata,
                lastModified: new Date().toISOString(),
                version: '2.0'
            }
        };
        
        // Save to storage
        const deckPath = path.join(__dirname, '../../storage/decks', `${deckId}.json`);
        await fs.writeFile(deckPath, JSON.stringify(deckData, null, 2), 'utf8');
        
        console.log(`Deck saved successfully: ${deckId}`);
        
        res.json({
            success: true,
            message: 'Deck saved successfully',
            deckId: deckId,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error saving deck:', error);
        res.status(500).json({
            error: 'Save Failed',
            message: error.message
        });
    }
});

// POST /editor-pptx - Generate PowerPoint from edited slides
router.post('/editor-pptx', async (req, res) => {
    try {
        const { slides, metadata } = req.body;
        
        if (!slides || !Array.isArray(slides)) {
            return res.status(400).json({ error: 'Invalid slides data' });
        }
        
        console.log('Generating PowerPoint from edited slides...');
        
        // Create PowerPoint presentation
        const pptx = new PptxGenJS();
        
        // Set presentation properties
        pptx.author = 'Enhanced Pitch Deck Editor';
        pptx.company = 'AI Pitch Deck Generator';
        pptx.subject = metadata?.deckTitle || 'Pitch Deck';
        pptx.title = metadata?.deckTitle || 'Enhanced Presentation';
        
        // Create slides
        slides.forEach((slideData, index) => {
            const slide = pptx.addSlide();
            
            // Add title
            const title = slideData.title || `Slide ${index + 1}`;
            slide.addText(title, {
                x: 0.5,
                y: 0.5,
                w: 9,
                h: 1.2,
                fontSize: 32,
                fontFace: 'Arial',
                color: '1f2937',
                bold: true,
                align: 'center'
            });
            
            // Add content
            if (Array.isArray(slideData.content)) {
                const contentText = slideData.content
                    .filter(item => item && typeof item === 'string' && item.trim())
                    .join('\\n\\n');
                
                if (contentText) {
                    slide.addText(contentText, {
                        x: 0.5,
                        y: 2.0,
                        w: 9,
                        h: 5.5,
                        fontSize: 18,
                        fontFace: 'Arial',
                        color: '374151',
                        align: 'left',
                        valign: 'top'
                    });
                }
            }
        });
        
        // Generate PowerPoint buffer
        const buffer = await pptx.write('nodebuffer');
        
        if (!buffer || buffer.length === 0) {
            throw new Error('Generated PowerPoint file is empty');
        }
        
        console.log('Enhanced PowerPoint generation completed, buffer size:', buffer.length, 'bytes');
        
        // Clean filename
        const cleanTitle = (metadata?.deckTitle || 'enhanced-presentation')
            .replace(/[^a-zA-Z0-9\s\-_]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase();
        const filename = `${cleanTitle}.pptx`;
        
        // Send PowerPoint file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);

    } catch (error) {
        console.error('Enhanced PowerPoint generation error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Generation Failed',
                message: error.message
            });
        }
    }
});

module.exports = router;