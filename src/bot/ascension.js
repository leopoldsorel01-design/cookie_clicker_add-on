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
