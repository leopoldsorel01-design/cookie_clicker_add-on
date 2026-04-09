/** Cookie Clicker Bot - Automated Build **/
(function() { 'use strict';

/* ========= File: src/core/state.js ========= */

/* src/core/state.js */
window.CookieBot = window.CookieBot || {};

window.CookieBot.Config = {
    autoBuy: false,
    autoClick: false, // For Golden Cookies and Big Cookie
    autoAscend: false,
    ascendMultiplier: 2.0, // Default: ascend when prestige is doubled
    autoMinigames: false,
    updateRate: 500 // In milliseconds
};

window.CookieBot.State = {
    intervals: [],
    ascensionState: 0, // 0: None, 1: Waiting for OnAscend, 2: Buying, 3: Reincarnating
    log: []
};

window.CookieBot.init = function() {
    console.log("%c[CookieBot] Initialized!","color: #4CAF50; font-weight: bold; font-size: 14px;");
    if(this.State.intervals.length > 0) this.stop();
    
    // Main Loop
    const mainLoopId = setInterval(() => {
        if(window.CookieBot.Engine) window.CookieBot.Engine.tick();
        if(window.CookieBot.Ascension) window.CookieBot.Ascension.tick();
        if(window.CookieBot.Minigames) window.CookieBot.Minigames.tick();
    }, this.Config.updateRate);
    
    this.State.intervals.push(mainLoopId);
    
    // Init UI if available
    if(window.CookieBot.UI) window.CookieBot.UI.init();
};

window.CookieBot.stop = function() {
    this.State.intervals.forEach(clearInterval);
    this.State.intervals = [];
    console.log("[CookieBot] Main loops stopped.");
};



/* ========= File: src/core/engine.js ========= */

/* src/core/engine.js */
window.CookieBot.Engine = {
    // Liste noire d'IDs stricts si jamais les filtres "toggle" ne suffisent pas.
    // 331: Golden Switch, 452: Shimmering veil, 64-73 & 87: Seasons
    bannedUpgradeIds: [
        331, 332, 452, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 87, 74, 84, 333
    ],

    isValidUpgrade(upgrade) {
        if(upgrade.bought || !upgrade.unlocked) return false;
        if(upgrade.pool === 'toggle') return false;
        if(this.bannedUpgradeIds.includes(upgrade.id)) return false;
        if(upgrade.pool === 'tech' && !this.isTechProfitable(upgrade)) return false; 
        return true;
    },

    isTechProfitable(upgrade) {
        // Par défaut on accepte la tech
        return true;
    },

    calculatePayback(item, isUpgrade) {
        const price = isUpgrade ? item.getPrice() : item.price;
        let deltaCps = 0;

        if (!isUpgrade) {
            deltaCps = item.storedCps * Game.globalCpsMult;
            if (deltaCps === 0) deltaCps = 0.1; // fallback pour éviter div. par 0
        } else {
            if(item.buildingTie) { 
                deltaCps = item.buildingTie.storedCps * item.buildingTie.amount * Game.globalCpsMult;
            } else if (item.pool === 'cookie') {
                deltaCps = Game.cookiesPs * 0.02; // Approximation modeste 2%
            } else {
                deltaCps = Game.cookiesPs * 0.05; // Approximation pifométrique 5%
            }
        }

        if(deltaCps <= 0) return Infinity;
        return price / deltaCps; // Payback en secondes (plus c'est bas, mieux c'est)
    },

    getBestPurchase() {
        let bestTarget = null;
        let bestPayback = Infinity;

        // Evaluer les batiments (Game.ObjectsById)
        if (typeof Game !== 'undefined' && Game.ObjectsById) {
            for (let i = 0; i < Game.ObjectsById.length; i++) {
                let building = Game.ObjectsById[i];
                if(building.locked) continue; 
                
                let payback = this.calculatePayback(building, false);
                building._botPayback = payback;

                if (payback < bestPayback) {
                    bestPayback = payback;
                    bestTarget = { type: 'building', obj: building };
                }
            }
        }

        // Evaluer les améliorations (Game.UpgradesById)
        if (typeof Game !== 'undefined' && Game.UpgradesById) {
            for(let i = 0; i < Game.UpgradesById.length; i++) {
                let up = Game.UpgradesById[i];
                if (!this.isValidUpgrade(up)) {
                    up._botPayback = Infinity;
                    continue;
                }
                
                let payback = this.calculatePayback(up, true);
                up._botPayback = payback;
                
                if (payback < bestPayback) {
                    bestPayback = payback;
                    bestTarget = { type: 'upgrade', obj: up };
                }
            }
        }

        return { target: bestTarget, payback: bestPayback };
    },

    tick() {
        if(typeof Game === 'undefined') return;

        let best = this.getBestPurchase();

        // AutoBuy logic
        if (best && best.target && window.CookieBot.Config.autoBuy) {
            let item = best.target.obj;
            let price = best.target.type === 'upgrade' ? item.getPrice() : item.price;
            
            if (Game.cookies >= price) {
                if (best.target.type === 'upgrade') {
                    item.buy(true);
                } else {
                    item.buy(1);
                }
            }
        }

        // AutoClick (Golden Cookies + Big Cookie)
        if (window.CookieBot.Config.autoClick) {
            Game.shimmers.forEach((shimmer) => {
                if(shimmer.type === "golden" || shimmer.type === "reindeer") {
                    shimmer.pop();
                }
            });
            Game.ClickCookie();
        }
    }
};



/* ========= File: src/ui/menu.js ========= */

/* src/ui/menu.js */
window.CookieBot.UI = {
    init() {
        this.injectCSS();
        this.injectMenu();
        if(window.CookieBot.Tooltips) window.CookieBot.Tooltips.init();
    },

    injectCSS() {
        if(document.getElementById('cookiebot-css')) return;
        const style = document.createElement('style');
        style.id = 'cookiebot-css';
        style.innerHTML = `
            #cookiebot-panel {
                position: absolute;
                top: 10px;
                left: 10px;
                background: rgba(0, 0, 0, 0.85);
                border: 1px solid #4CAF50;
                border-radius: 8px;
                padding: 15px;
                z-index: 100000;
                color: #fff;
                font-family: 'Merriweather', Helvetica, sans-serif;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                width: 200px;
                transition: transform 0.3s;
                pointer-events: auto;
            }
            #cookiebot-panel h3 {
                margin: 0 0 10px 0;
                font-size: 16px;
                text-align: center;
                border-bottom: 1px solid #4CAF50;
                padding-bottom: 5px;
                color: #4CAF50;
                text-shadow: 0 0 4px #4CAF50;
            }
            .cb-toggle {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                font-size: 12px;
                cursor: pointer;
            }
            .cb-toggle input {
                cursor: pointer;
            }
            .cb-payback {
                padding-top: 8px;
                border-top: 1px dashed rgba(255,255,255,0.2);
                margin-top: 8px;
                font-size: 11px;
                color: #ccc;
                text-align: center;
            }
            .cb-color-dot {
                display: inline-block;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                margin-right: 5px;
                border: 1px solid rgba(255,255,255,0.5);
                vertical-align: middle;
            }
            .cb-green { background-color: #4CAF50; box-shadow: 0 0 5px #4CAF50; }
            .cb-yellow { background-color: #FFEB3B; box-shadow: 0 0 5px #FFEB3B; }
            .cb-red { background-color: #F44336; box-shadow: 0 0 5px #F44336; }
            .cb-gray { background-color: #9E9E9E; }
        `;
        document.head.appendChild(style);
    },

    createToggle(id, label, configKey) {
        const div = document.createElement('label');
        div.className = 'cb-toggle';
        
        const span = document.createElement('span');
        span.innerText = label;

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = window.CookieBot.Config[configKey];
        input.onchange = (e) => {
            window.CookieBot.Config[configKey] = e.target.checked;
        };

        div.appendChild(span);
        div.appendChild(input);
        return div;
    },

    injectMenu() {
        if(document.getElementById('cookiebot-panel')) return;
        
        const panel = document.createElement('div');
        panel.id = 'cookiebot-panel';
        
        const title = document.createElement('h3');
        title.innerText = "CookieBot v1.0";
        panel.appendChild(title);

        panel.appendChild(this.createToggle('cb-autobuy', 'Auto-Buy', 'autoBuy'));
        panel.appendChild(this.createToggle('cb-autoclick', 'Auto-Click', 'autoClick'));
        panel.appendChild(this.createToggle('cb-autoascend', 'Auto-Ascend', 'autoAscend'));
        panel.appendChild(this.createToggle('cb-autominigames', 'Auto-Minigames', 'autoMinigames'));
        
        document.body.appendChild(panel);
    }
};



/* ========= File: src/ui/tooltips.js ========= */

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



/* ========= File: src/bot/ascension.js ========= */

/* src/bot/ascension.js */
window.CookieBot.Ascension = {
    // 0: Idle, 1: Triggered, 2: InHeaven, 3: Reincarnating, 4: Waiting for Earth
    state: 0,
    checkInterval: 2000, 
    lastCheck: 0,

    tick() {
        if (!window.CookieBot.Config.autoAscend) return;

        let now = Date.now();
        if (now - this.lastCheck < this.checkInterval) return;
        this.lastCheck = now;

        switch(this.state) {
            case 0:
                this.checkAscendConditions();
                break;
            case 1:
                if (Game.OnAscend == 1) {
                    console.log("[CookieBot] Transitioning to Heavenly State...");
                    this.state = 2; 
                }
                break;
            case 2:
                // Attendre que le décor finisse de se charger avant d'acheter (1 seconde)
                setTimeout(() => {
                    this.buyHeavenlyUpgrades();
                    // On lance le retour 2 sec après achat pour laisser l'UI respirer
                    setTimeout(() => { this.state = 3; }, 2000);
                }, 1000);
                this.state = 99; // Transient sleep state
                break;
            case 3:
                console.log("[CookieBot] Forcing Reincarnation...");
                this.forceReincarnate();
                this.state = 4;
                break;
            case 4:
                if (Game.OnAscend == 0) {
                    console.log("[CookieBot] Ascended successfully. Back on Earth.");
                    // Reset everything cleanly
                    this.state = 0; 
                }
                break;
        }
    },

    checkAscendConditions() {
        if (typeof Game === 'undefined' || !Game.prestige) return;
        
        let targetPrestige = Game.prestige * window.CookieBot.Config.ascendMultiplier;
        let pending = Game.HowMuchPrestige(Game.cookiesReset + Game.cookiesEarned);
        let potentialPrestige = Game.prestige + pending;

        if (pending > 0 && potentialPrestige >= targetPrestige) {
            console.log(`[CookieBot] Targets met (${potentialPrestige} >= ${targetPrestige}). Ascending!`);
            this.state = 1;

            // Déclenche l'ascension. Game.Ascend(true) passe le bypass visuel dans les versions récentes du jeu,
            // mais on blinde en surveillant Game.promptOn
            Game.Ascend(true); 

            // Kill the 'are you sure?' confirmation
            setTimeout(() => {
                if(Game.promptOn) Game.ClosePrompt();
            }, 150);
        }
    },

    buyHeavenlyUpgrades() {
        let available = [];
        for(let i=0; i<Game.UpgradesById.length; i++) {
            let up = Game.UpgradesById[i];
            if (up.pool !== 'prestige') continue;
            if (up.bought) continue;
            
            // Les Heavenly Chips se gèrent différemment des cookies purs côté achat UI, 
            // mais getPrice() et buy() fonctionnent nativement si on est OnAscend == 1
            if (up.getPrice() <= Game.heavenlyChips) {
                available.push(up);
            }
        }

        // Tri par prix pour maximiser l'arbre
        available.sort((a,b) => a.getPrice() - b.getPrice());
        
        for(let up of available) {
            if (up.getPrice() <= Game.heavenlyChips) {
                up.buy(true); 
            }
        }
    },

    forceReincarnate() {
        Game.Reincarnate(true);
        
        // Surveillance active pour éviter le blocage du mod pop-up
        let attempts = 0;
        const killerInterval = setInterval(() => {
            if(typeof Game !== 'undefined' && Game.promptOn) {
                Game.ClosePrompt();
            }
            if(typeof Game !== 'undefined' && Game.OnAscend == 0) {
                clearInterval(killerInterval);
            }
            attempts++;
            if(attempts > 30) clearInterval(killerInterval); 
        }, 1000);
    }
};



/* ========= File: src/bot/minigames.js ========= */

/* src/bot/minigames.js */
window.CookieBot.Minigames = {
    tick() {
        if(!window.CookieBot.Config.autoMinigames) return;
        this.runGrimoire();
        this.runBank();
    },

    getMinigame(buildingName) {
        if (typeof Game === 'undefined') return null;
        let b = Game.Objects[buildingName];
        if(b && b.minigameLoaded && b.minigame) {
            return b.minigame;
        }
        return null;
    },

    runGrimoire() {
        let mg = this.getMinigame('Wizard tower');
        if(!mg) return;

        // Sort 1: Force the Hand of Fate
        // On le lance dès qu'on a la jauge de mana pleine pour ne pas gâcher la régénération.
        // Idéalement on l'alignerait avec un buff (Frenzy) existant.
        if (mg.magic >= mg.magicM) {
            let spell = mg.spellsById[1];
            if (this.canCast(mg, spell)) {
                console.log("[CookieBot] Casting 'Force the Hand of Fate' (Max Mana Reached)");
                mg.castSpell(spell);
            }
        }
    },

    canCast(minigame, spell) {
        let cost = minigame.getSpellCost(spell);
        return minigame.magic >= cost;
    },

    runBank() {
        let mg = this.getMinigame('Bank');
        if(!mg) return;

        for(let i=0; i<mg.goodsById.length; i++) {
            let good = mg.goodsById[i];
            
            // Algorithme rapide: La "Resting Value" varie pour chaque stock. (+ ou - 10 * l'ID du batiment)
            let restingVal = 10 + 10 * good.id;

            // ACHAT : Si le prix s'effondre (40% de sa valeur de repos)
            if (good.val < restingVal * 0.4) {
                if(good.stock < mg.getGoodMaxStock(good)) {
                   // Le dernier paramètre stipule de tenter tte la quantité
                   mg.buyGood(good.id, 10000); 
                }
            }

            // VENTE : Si le prix s'envole (150% de sa valeur de repos)
            if (good.val > restingVal * 1.5 && good.stock > 0) {
                mg.sellGood(good.id, 10000);
            }
        }
    }
};



/* ========= File: src/main.js ========= */

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




})();
