/* src/ui/tooltips.js */
window.CookieBot.Tooltips = {
    init() {
        if (typeof Game === 'undefined') return;
        this.patchTooltips();
    },

    formatTime(seconds) {
        if (seconds === Infinity || isNaN(seconds)) return "Jamais";
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.floor(seconds/60)}m ${Math.round(seconds%60)}s`;
        return `${Math.floor(seconds/3600)}h ${Math.floor((seconds%3600)/60)}m`;
    },

    getColorClass(payback, bestPayback) {
        if (payback === Infinity || isNaN(payback)) return 'cb-gray';
        // bestPayback peut être évalué globalement via notre Engine.
        if (payback <= bestPayback * 1.1) return 'cb-green';
        if (payback <= bestPayback * 3.0) return 'cb-yellow';
        return 'cb-red';
    },

    appendBotData(html, item) {
        // Cette fonction intercepte le texte HTML généré par le jeu et ajoute la DIV
        if (!item._botPayback) return html;
        
        // On récupère le meilleur payback de l'engine pour la couleur relative
        let bestPaybackStyle = 'cb-gray';
        if (window.CookieBot.Engine) {
            let best = window.CookieBot.Engine.getBestPurchase();
            if (best && best.payback !== Infinity) {
                bestPaybackStyle = this.getColorClass(item._botPayback, best.payback);
            }
        }

        const injectHtml = `
            <div class="cb-payback">
                <span class="cb-color-dot ${bestPaybackStyle}"></span>
                Amortissement : <b>${this.formatTime(item._botPayback)}</b>
            </div>
        `;
        
        // On s'insère à la fin du tooltip natif. Cookie Clicker englobe souvent ses tooltips avec une div wrapper globale, mais ajouter le tag ferme proprement sans casser.
        return html + injectHtml;
    },

    patchTooltips() {
        const self = this;
        
        // 1. Patch des Batiments
        if (Game.Object && Game.Object.prototype && !Game.Object.prototype._cookiebotTooltipPatched) {
            const originalObjTooltip = Game.Object.prototype.tooltip;
            Game.Object.prototype.tooltip = function() {
                let html = originalObjTooltip.call(this);
                if (typeof html === 'function') {
                    // C'est parfois une deferred function
                    const origFunc = html;
                    return function() {
                        return self.appendBotData(origFunc(), this);
                    }.bind(this);
                }
                return self.appendBotData(html, this);
            };
            Game.Object.prototype._cookiebotTooltipPatched = true;
        }

        // 2. Patch des Upgrades
        if (Game.Upgrade && Game.Upgrade.prototype && !Game.Upgrade.prototype._cookiebotTooltipPatched) {
            const originalUpTooltip = Game.Upgrade.prototype.tooltip;
            Game.Upgrade.prototype.tooltip = function() {
                let html = originalUpTooltip.call(this);
                if (typeof html === 'function') {
                    const origFunc = html;
                    return function() {
                        return self.appendBotData(origFunc(), this);
                    }.bind(this);
                }
                return self.appendBotData(html, this);
            };
            Game.Upgrade.prototype._cookiebotTooltipPatched = true;
        }
    }
};
