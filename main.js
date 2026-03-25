document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadSection = document.getElementById('upload-section');
    const editorSection = document.getElementById('editor-section');
    const imageToCrop = document.getElementById('image-to-crop');
    const downloadBtn = document.getElementById('download-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const ratioBtns = document.querySelectorAll('.ratio-btn');
    const actionBtns = document.querySelectorAll('.action-btn');
    const inputWidth = document.getElementById('input-width');
    const inputHeight = document.getElementById('input-height');
    const applySizeBtn = document.getElementById('apply-size-btn');
    const presetBtns = document.querySelectorAll('.preset-btn');

    let cropper = null;
    let isFixedSize = true; // Track if we strictly format output to the input fields
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
            showEditor();
            initCropper();
        };
        reader.readAsDataURL(file);
    }

    // ----- UI Transitions -----

    function showEditor() {
        uploadSection.classList.remove('active');
        // Small delay to allow CSS transitions
        setTimeout(() => {
            editorSection.classList.add('active');
            // Ensure cropper gets correct dimensions when unhidden
            if (cropper) cropper.resize();
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
        setTimeout(() => {
            uploadSection.classList.add('active');
        }, 300);
    }

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
        presetBtns.forEach(btn => btn.classList.remove('active'));
        if (presetBtns.length > 0) presetBtns[0].classList.add('active');
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
            presetBtns.forEach(btn => btn.classList.remove('active'));
            isFixedSize = true;
        }
    });

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const w = parseInt(btn.dataset.width);
            const h = parseInt(btn.dataset.height);
            
            inputWidth.value = w;
            inputHeight.value = h;
            
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            ratioBtns.forEach(b => b.classList.remove('active'));
            
            if (cropper) {
                cropper.setAspectRatio(w / h);
                maximizeCropBox();
                isFixedSize = true;
            }
        });
    });

    ratioBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            ratioBtns.forEach(b => b.classList.remove('active'));
            presetBtns.forEach(b => b.classList.remove('active'));
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
                        presetBtns.forEach(btn => btn.classList.remove('active'));
                        const matchPreset = Array.from(presetBtns).find(b => parseInt(b.dataset.width) === targetW && parseInt(b.dataset.height) === targetH);
                        if (matchPreset) matchPreset.classList.add('active');
                        
                        isFixedSize = true;
                    }, 0);
                    break;
            }
        });
    });

    // ----- Actions -----

    cancelBtn.addEventListener('click', showUpload);

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
