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
