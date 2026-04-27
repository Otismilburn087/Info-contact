document.addEventListener('DOMContentLoaded', function() {
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

    const PHONE_POPUP_STORAGE_KEY = 'contactPopupStatus';
    const PHONE_NUMBER_STORAGE_KEY = 'contactPhoneNumber';
    const popupOverlay = document.getElementById('contactPopupOverlay');
    const popupInput = document.getElementById('popupPhoneInput');
    const popupError = document.getElementById('popupPhoneError');
    const popupSubmitBtn = document.getElementById('popupSubmitBtn');
    const popupSkipBtn = document.getElementById('popupSkipBtn');
    const popupCloseBtn = document.getElementById('popupCloseBtn');

    function safeStorageGet(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (err) {
            console.warn('localStorage unavailable:', err);
            return null;
        }
    }

    function safeStorageSet(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (err) {
            console.warn('localStorage unavailable:', err);
        }
    }

    function isPhoneValid(value) {
        return /^[0-9]{8,}$/.test(value);
    }

    function closePopup(choice) {
        if (!popupOverlay) return;
        safeStorageSet(PHONE_POPUP_STORAGE_KEY, choice === 'submitted' ? 'submitted' : 'skipped');
        popupOverlay.classList.remove('popup-visible');
        popupOverlay.setAttribute('aria-hidden', 'true');
    }

    function showPopup() {
        if (!popupOverlay) return;
        if (safeStorageGet(PHONE_POPUP_STORAGE_KEY)) return;
        popupOverlay.classList.add('popup-visible');
        popupOverlay.setAttribute('aria-hidden', 'false');
        popupInput?.focus();
    }

    if (popupSubmitBtn) {
        popupSubmitBtn.addEventListener('click', function () {
            const rawValue = popupInput?.value || '';
            const normalized = rawValue.replace(/\s+/g, '');
            if (!isPhoneValid(normalized)) {
                if (popupError) {
                    popupError.textContent = 'Entrez uniquement des chiffres, au moins 8 caractères.';
                }
                popupInput?.focus();
                return;
            }
            safeStorageSet(PHONE_NUMBER_STORAGE_KEY, normalized);
            if (popupError) {
                popupError.textContent = 'Merci ! Votre numéro a été enregistré.';
            }
            closePopup('submitted');
        });
    }

    if (popupSkipBtn) {
        popupSkipBtn.addEventListener('click', function () {
            closePopup('skipped');
        });
    }

    if (popupCloseBtn) {
        popupCloseBtn.addEventListener('click', function () {
            closePopup('skipped');
        });
    }

    if (popupInput) {
        popupInput.addEventListener('input', function () {
            if (popupError) {
                popupError.textContent = '';
            }
        });
    }

    setTimeout(showPopup, 700);

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
