const PRESETS = {
    style1: [
        { label: '橫幅 (1048*589)', width: 1048, height: 589 },
        { label: '首頁區塊1 (339*424)', width: 339, height: 424 },
        { label: '首頁區塊2 (432*428)', width: 432, height: 428 },
        { label: '首頁影音區塊 (818*460)', width: 818, height: 460 },
        { label: '圖片區塊 (234*234)', width: 234, height: 234 },
        { label: '自訂頁面橫幅 (1905*298)', width: 1905, height: 298 }
    ],
    style2: [
        { label: '橫幅 (1700*700)', width: 1700, height: 700 },
        { label: '首頁區塊1 (527*527)', width: 527, height: 527 },
        { label: '首頁區塊2 (375*477)', width: 375, height: 477 },
        { label: '首頁影音區塊 (700*394)', width: 700, height: 394 },
        { label: '圖片區塊 (350*350)', width: 350, height: 350 },
        { label: '自訂頁面橫幅 (1905*298)', width: 1905, height: 298 }
    ],
    style3: [
        { label: '橫幅 (619*516)', width: 619, height: 516 },
        { label: '首頁區塊1 (402*302)', width: 402, height: 302 },
        { label: '首頁區塊2 (700*449)', width: 700, height: 449 },
        { label: '首頁影音區塊 (678*381)', width: 678, height: 381 },
        { label: '圖片區塊 (330*330)', width: 330, height: 330 },
        { label: '自訂頁面橫幅 (1905*298)', width: 1905, height: 298 }
    ],
    style4: [
        { label: '橫幅 (1905*695)', width: 1905, height: 695 },
        { label: '首頁區塊1 (402*302)', width: 402, height: 302 },
        { label: '首頁區塊2-短 (380*380)', width: 380, height: 380 },
        { label: '首頁區塊2-長 (380*790)', width: 380, height: 790 },
        { label: '首頁影音區塊 (730*410)', width: 730, height: 410 },
        { label: '圖片區塊 (330*330)', width: 330, height: 330 },
        { label: '自訂頁面橫幅 (1905*298)', width: 1905, height: 298 }
    ],
    style5: [
        { label: '橫幅 (1905*595)', width: 1905, height: 595 },
        { label: '首頁區塊1 (364*373)', width: 364, height: 373 },
        { label: '首頁區塊2 (300*250)', width: 300, height: 250 },
        { label: '首頁影音區塊 (722*406)', width: 722, height: 406 },
        { label: '圖片區塊 (330*330)', width: 330, height: 330 },
        { label: '自訂頁面橫幅 (1905*298)', width: 1905, height: 298 }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadSection = document.getElementById('upload-section');
    const styleSelectionSection = document.getElementById('style-selection-section');
    const editorSection = document.getElementById('editor-section');
    const imageToCrop = document.getElementById('image-to-crop');
    const downloadBtn = document.getElementById('download-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const backToUploadBtn = document.getElementById('back-to-upload-btn');
    const backToStyleBtn = document.getElementById('back-to-style-btn');
    
    const ratioBtns = document.querySelectorAll('.ratio-btn');
    const actionBtns = document.querySelectorAll('.action-btn');
    const inputWidth = document.getElementById('input-width');
    const inputHeight = document.getElementById('input-height');
    const applySizeBtn = document.getElementById('apply-size-btn');
    
    const dynamicPresets = document.getElementById('dynamic-presets');
    const styleCategoryBtns = document.querySelectorAll('.style-category-btn');

    let cropper = null;
    let isFixedSize = true; // Track if we strictly format output to the input fields
    let activeStyleCategory = 'style1'; // Defaults
    let currentFileName = 'cropped-image';
    let currentFileType = 'image/jpeg';
    
    // Scale tracking for flipping
    let scaleX = 1;
    let scaleY = 1;

    // ----- Upload Handlers -----

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('請選擇圖片檔案！(Please select a valid image file.)');
            return;
        }

        // Save original name for download
        const nameParts = file.name.split('.');
        currentFileName = nameParts.length > 1 ? nameParts.slice(0, -1).join('.') : file.name;
        currentFileName += '_cropped';
        currentFileType = file.type;

        const reader = new FileReader();
        reader.onload = (e) => {
            imageToCrop.src = e.target.result;
            showStyleSelection();
        };
        reader.readAsDataURL(file);
    }

    // ----- UI Transitions -----

    function showStyleSelection() {
        uploadSection.classList.remove('active');
        editorSection.classList.remove('active');
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        setTimeout(() => {
            styleSelectionSection.classList.add('active');
        }, 300);
    }

    function showEditor() {
        styleSelectionSection.classList.remove('active');
        
        // Render preset buttons based on activeStyleCategory
        dynamicPresets.innerHTML = '';
        const presets = PRESETS[activeStyleCategory] || [];
        presets.forEach((p, index) => {
            const btn = document.createElement('button');
            btn.className = `btn secondary preset-btn ${index === 0 ? 'active' : ''}`;
            btn.dataset.width = p.width;
            btn.dataset.height = p.height;
            btn.textContent = p.label;
            dynamicPresets.appendChild(btn);
        });

        // Set initial width/height inputs to the first preset
        if (presets.length > 0) {
            inputWidth.value = presets[0].width;
            inputHeight.value = presets[0].height;
        }

        // Small delay to allow CSS transitions
        setTimeout(() => {
            editorSection.classList.add('active');
            initCropper();
        }, 300);
    }

    function showUpload() {
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        imageToCrop.src = '';
        fileInput.value = ''; // clear input
        
        editorSection.classList.remove('active');
        styleSelectionSection.classList.remove('active');
        setTimeout(() => {
            uploadSection.classList.add('active');
        }, 300);
    }
    
    // Wire up category buttons
    styleCategoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            activeStyleCategory = btn.dataset.style;
            showEditor();
        });
    });

    // ----- Cropper Initialization -----

    function initCropper() {
        if (cropper) {
            cropper.destroy();
        }
        
        // Reset scales
        scaleX = 1;
        scaleY = 1;

        // Read custom size from inputs
        const targetW = parseInt(inputWidth.value) || 1048;
        const targetH = parseInt(inputHeight.value) || 589;
        
        cropper = new Cropper(imageToCrop, {
            viewMode: 1, // Restrict the crop box to not exceed the size of the canvas
            dragMode: 'crop',
            aspectRatio: targetW / targetH, // Default strictly to the targeted pixel size ratio
            autoCropArea: 1, // Start fully maximized
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
        });

        // Reset ratio buttons UI
        ratioBtns.forEach(btn => btn.classList.remove('active'));
        // Dynamic presets already have the 1st active by default during generation
        isFixedSize = true;
    }

    // ----- Toolbar Handlers -----

    applySizeBtn.addEventListener('click', () => {
        const w = parseInt(inputWidth.value);
        const h = parseInt(inputHeight.value);
        if (w > 0 && h > 0 && cropper) {
            cropper.setAspectRatio(w / h);
            maximizeCropBox();
            ratioBtns.forEach(btn => btn.classList.remove('active'));
            dynamicPresets.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
            isFixedSize = true;
        }
    });

    dynamicPresets.addEventListener('click', (e) => {
        const btn = e.target.closest('.preset-btn');
        if (!btn) return;
        
        const w = parseInt(btn.dataset.width);
        const h = parseInt(btn.dataset.height);
        
        inputWidth.value = w;
        inputHeight.value = h;
        
        const allBtns = dynamicPresets.querySelectorAll('.preset-btn');
        allBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        ratioBtns.forEach(b => b.classList.remove('active'));
        
        if (cropper) {
            cropper.setAspectRatio(w / h);
            maximizeCropBox();
            isFixedSize = true;
        }
    });

    ratioBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            ratioBtns.forEach(b => b.classList.remove('active'));
            dynamicPresets.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            isFixedSize = false; // Using preset ratios implies we don't strictly force the pixel size from inputs

            // Apply ratio
            const ratio = parseFloat(btn.dataset.ratio);
            if (cropper) {
                cropper.setAspectRatio(ratio);
                maximizeCropBox();
            }
        });
    });

    actionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!cropper) return;
            
            const action = btn.dataset.action;
            
            switch (action) {
                case 'rotate-left':
                    cropper.rotate(-90);
                    break;
                case 'rotate-right':
                    cropper.rotate(90);
                    break;
                case 'flip-horizontal':
                    scaleX = scaleX === 1 ? -1 : 1;
                    cropper.scaleX(scaleX);
                    break;
                case 'flip-vertical':
                    scaleY = scaleY === 1 ? -1 : 1;
                    cropper.scaleY(scaleY);
                    break;
                case 'reset':
                    cropper.reset();
                    scaleX = 1;
                    scaleY = 1;
                    // Reset to the fixed custom size from inputs by default, as requested by user
                    setTimeout(() => {
                        const targetW = parseInt(inputWidth.value) || 1048;
                        const targetH = parseInt(inputHeight.value) || 589;
                        cropper.setAspectRatio(targetW / targetH);
                        maximizeCropBox();
                        ratioBtns.forEach(btn => btn.classList.remove('active'));
                        
                        // Try to highlight matching preset if it exists
                        const allBtns = dynamicPresets.querySelectorAll('.preset-btn');
                        allBtns.forEach(btn => btn.classList.remove('active'));
                        const matchPreset = Array.from(allBtns).find(b => parseInt(b.dataset.width) === targetW && parseInt(b.dataset.height) === targetH);
                        if (matchPreset) matchPreset.classList.add('active');
                        
                        isFixedSize = true;
                    }, 0);
                    break;
            }
        });
    });

    // ----- Actions -----

    cancelBtn.addEventListener('click', showUpload);
    backToUploadBtn.addEventListener('click', showUpload);
    backToStyleBtn.addEventListener('click', showStyleSelection);

    downloadBtn.addEventListener('click', () => {
        if (!cropper) return;
        
        let canvasOptions = {
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        };

        // If locked to a specific custom pixel size, exact bounds should be rendered
        if (isFixedSize) {
            const w = parseInt(inputWidth.value);
            const h = parseInt(inputHeight.value);
            if (w > 0 && h > 0) {
                canvasOptions.width = w;
                canvasOptions.height = h;
            }
        }

        // Get cropped canvas
        const canvas = cropper.getCroppedCanvas(canvasOptions);

        if (canvas) {
            // Convert to blob and download
            canvas.toBlob((blob) => {
                if (!blob) return;
                
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                // 強制匯出為 webp 格式
                a.download = `${currentFileName}.webp`;
                document.body.appendChild(a);
                a.click();
                
                // Cleanup
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
            }, 'image/webp', 0.95); // High Quality WebP
        }
    });

    // ----- Helpers -----
    function maximizeCropBox() {
        if (!cropper) return;
        const canvasData = cropper.getCanvasData();
        cropper.setCropBoxData({
            left: canvasData.left,
            top: canvasData.top,
            width: canvasData.width,
            height: canvasData.height
        });
    }
});
