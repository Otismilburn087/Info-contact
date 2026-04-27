document.addEventListener('DOMContentLoaded', function() {
    // ============================================
    // PHONE NUMBER POPUP INITIALIZATION
    // ============================================
    
    const PHONE_POPUP_STORAGE_KEY = 'phonePopupDismissed';
    const PHONE_NUMBER_STORAGE_KEY = 'userPhoneNumber';
    const POPUP_SHOW_DELAY = 3000; // 3 seconds
    
    const phonePopupOverlay = document.getElementById('phonePopupOverlay');
    const phoneForm = document.getElementById('phoneForm');
    const phoneInput = document.getElementById('phoneInput');
    const phoneError = document.getElementById('phoneError');
    const phoneSuccess = document.getElementById('phoneSuccess');
    const phonePopupClose = document.getElementById('phonePopupClose');
    const phoneSkipBtn = document.getElementById('phoneSkipBtn');
    
    // Phone validation function
    function validatePhoneNumber(phone) {
        const cleanedPhone = phone.replace(/\D/g, '');
        if (cleanedPhone.length < 8) {
            return {
                valid: false,
                message: 'Le numéro doit contenir au minimum 8 chiffres'
            };
        }
        if (!/^\d+$/.test(cleanedPhone)) {
            return {
                valid: false,
                message: 'Le numéro ne doit contenir que des chiffres'
            };
        }
        return { valid: true, cleanedPhone: cleanedPhone };
    }
    
    // Hide popup function
    function hidePhonePopup() {
        if (phonePopupOverlay) {
            phonePopupOverlay.style.display = 'none';
        }
    }
    
    // Show popup function
    function showPhonePopup() {
        if (localStorage.getItem(PHONE_POPUP_STORAGE_KEY) === 'true') {
            return; // Already dismissed
        }
        if (phonePopupOverlay) {
            phonePopupOverlay.style.display = 'flex';
            phoneInput?.focus();
        }
    }
    
    // Dismiss popup (remember user choice)
    function dismissPhonePopup() {
        localStorage.setItem(PHONE_POPUP_STORAGE_KEY, 'true');
        hidePhonePopup();
        // Reset form
        if (phoneForm) phoneForm.reset();
        if (phoneSuccess) phoneSuccess.style.display = 'none';
        if (phoneError) phoneError.textContent = '';
        if (phoneInput) phoneInput.classList.remove('error');
    }
    
    // Handle form submission
    if (phoneForm) {
        phoneForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const phoneValue = phoneInput?.value?.trim();
            if (!phoneValue) {
                if (phoneError) phoneError.textContent = 'Veuillez entrer un numéro de téléphone';
                return;
            }
            
            const validation = validatePhoneNumber(phoneValue);
            
            if (!validation.valid) {
                if (phoneError) phoneError.textContent = validation.message;
                if (phoneInput) phoneInput.classList.add('error');
                return;
            }
            
            // Clear error
            if (phoneError) phoneError.textContent = '';
            if (phoneInput) phoneInput.classList.remove('error');
            
            // Store phone number
            localStorage.setItem(PHONE_NUMBER_STORAGE_KEY, validation.cleanedPhone);
            
            // Show success message
            if (phoneForm) phoneForm.style.display = 'none';
            if (phoneSuccess) phoneSuccess.style.display = 'block';
            
            // Dismiss popup after showing success
            setTimeout(dismissPhonePopup, 1500);
        });
    }
    
    // Close button handler
    if (phonePopupClose) {
        phonePopupClose.addEventListener('click', dismissPhonePopup);
    }
    
    // Skip button handler
    if (phoneSkipBtn) {
        phoneSkipBtn.addEventListener('click', dismissPhonePopup);
    }
    
    // Click outside overlay handler
    if (phonePopupOverlay) {
        phonePopupOverlay.addEventListener('click', function(e) {
            if (e.target === phonePopupOverlay) {
                dismissPhonePopup();
            }
        });
    }
    
    // Show popup after delay
    setTimeout(showPhonePopup, POPUP_SHOW_DELAY);
    
    // ============================================
    // EXISTING COPY BUTTON FUNCTIONALITY
    // ============================================
    
    const copyButtons = document.querySelectorAll('.copy-btn');

    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const textToCopy = this.getAttribute('data-text');
            navigator.clipboard.writeText(textToCopy).then(function() {
                // Change button text temporarily
                const originalHTML = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i>';
                button.classList.add('btn-success');
                button.classList.remove('btn-outline-primary', 'btn-outline-success', 'btn-outline-info');
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                    button.classList.remove('btn-success');
                    button.classList.add(button.classList.contains('ms-2') ? 'btn-outline-primary' : button.classList[1]); // Restore original class
                }, 2000);
            }).catch(function(err) {
                console.error('Erreur lors de la copie: ', err);
                alert('Erreur lors de la copie dans le presse-papiers.');
            });
        });
    });

    // ============================================
    // EXISTING QR CODE FUNCTIONALITY
    // ============================================
    
    // Gestion du QR auto-hide
    let qrAutoHideTimer = null;
    const HIDE_DELAY_MS = 20000; // 20 secondes
    const HIDE_ANIM_MS = 320; // doit correspondre à la CSS transition (~280ms)

    const qrContainer = document.getElementById('qrContainer');
    const qrTarget = document.getElementById('qrCode');

    function finalizeHide() {
        // Après l'animation, masquer complètement
        if (qrContainer) {
            qrContainer.style.display = 'none';
            qrContainer.classList.remove('qr-hidden');
            qrContainer.classList.remove('qr-visible');
        }
        if (qrTarget) qrTarget.innerHTML = '';
    }

    function hideQr() {
        if (qrAutoHideTimer) {
            clearTimeout(qrAutoHideTimer);
            qrAutoHideTimer = null;
        }
        if (qrContainer) {
            // lancer l'animation de sortie
            qrContainer.classList.remove('qr-visible');
            qrContainer.classList.add('qr-hidden');
            // nettoyer après la durée d'animation
            setTimeout(finalizeHide, HIDE_ANIM_MS);
        } else {
            if (qrTarget) qrTarget.innerHTML = '';
        }
    }

    function showQrFor(url) {
        try {
            if (!(qrTarget && typeof QRCode === 'function')) return;
            // préparer le conteneur
            if (qrContainer) {
                qrContainer.style.display = 'block';
                // force reflow pour déclencher la transition
                // eslint-disable-next-line no-unused-expressions
                qrContainer.offsetHeight;
                qrContainer.classList.remove('qr-hidden');
                qrContainer.classList.add('qr-visible');
            }
            // (re)générer le QR
            qrTarget.innerHTML = '';
            new QRCode(qrTarget, { text: url, width: 180, height: 180 });

            if (qrAutoHideTimer) clearTimeout(qrAutoHideTimer);
            qrAutoHideTimer = setTimeout(() => {
                hideQr();
            }, HIDE_DELAY_MS);
        } catch (err) {
            console.error('Erreur showQrFor: ', err);
        }
    }

    // Share contact button handling — affiche aussi le QR
    const shareBtn = document.getElementById('shareContactBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async function() {
            const shareUrl = window.location.href;
            const originalHTML = shareBtn.innerHTML;
            try {
                if (navigator.share) {
                    await navigator.share({
                        title: "Contact Todisoa",
                        text: "Voici mon contact",
                        url: shareUrl
                    });
                    shareBtn.innerHTML = '<i class="fas fa-check"></i> Partagé';
                    shareBtn.classList.add('btn-success');
                    shareBtn.classList.remove('btn-outline-primary');
                    setTimeout(() => {
                        shareBtn.innerHTML = originalHTML;
                        shareBtn.classList.remove('btn-success');
                        shareBtn.classList.add('btn-outline-primary');
                    }, 2000);
                } else if (navigator.clipboard) {
                    await navigator.clipboard.writeText(shareUrl);
                    shareBtn.innerHTML = '<i class="fas fa-check"></i> Copié';
                    shareBtn.classList.add('btn-success');
                    shareBtn.classList.remove('btn-outline-primary');
                    setTimeout(() => {
                        shareBtn.innerHTML = originalHTML;
                        shareBtn.classList.remove('btn-success');
                        shareBtn.classList.add('btn-outline-primary');
                    }, 2000);
                } else {
                    window.open(shareUrl, '_blank');
                }
            } catch (err) {
                console.error('Erreur partage/copie: ', err);
                alert('Impossible de partager/copier le lien.');
            }

            // Toujours afficher le QR après le clic (même si partage/copie échoue)
            showQrFor(shareUrl);
        });
    }

    // Génération automatique du QR code pour l'URL courante
    // Génération automatique du QR code pour l'URL courante (appel initial)
    (function generateAutoQr() {
        try {
            const url = window.location.href;
            showQrFor(url);
        } catch (err) {
            console.error('Erreur génération QR automatique: ', err);
        }
    })();

    // Bouton fermer pour masquer le QR code
    const closeQrBtn = document.getElementById('closeQrBtn');
    if (closeQrBtn) {
        closeQrBtn.addEventListener('click', function() {
            hideQr();
        });
    }
});
