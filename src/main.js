/* src/main.js */
// Injector delay for slow loading games
setTimeout(() => {
    if (typeof Game === 'undefined') {
        console.warn("[CookieBot] Erreur: Cookie Clicker n'est pas chargé sur cette page.");
        return;
    }
    
    if (window.CookieBot) {
        window.CookieBot.init();
    }
}, 500);
