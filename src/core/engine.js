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
