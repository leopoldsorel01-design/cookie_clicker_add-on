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
