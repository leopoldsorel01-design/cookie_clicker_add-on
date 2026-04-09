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
