// ==UserScript==
// @name         TwitchChestClicker
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  AutoClick bonus chests on twitch pages
// @author       CorentinGC
// @match        https://www.twitch.tv/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/CorentinGC/UserScripts/main/TwitchChestClicker/TwitchChestClicker.js
// @downloadURL  https://raw.githubusercontent.com/CorentinGC/UserScripts/main/TwitchChestClicker/TwitchChestClicker.js
// ==/UserScript==

const DATA_KEY = 'bot_data';
const POINTS_ADDED = 50;
const BONUS_CLASS = ['tw-button', 'tw-button--success']

window.history.pushState = ( f => function pushState(){
    var ret = f.apply(this, arguments);
    window.dispatchEvent(new Event('pushstate'));
    window.dispatchEvent(new Event('locationchange'));
    return ret;
})(window.history.pushState);

window.history.replaceState = ( f => function replaceState(){
    var ret = f.apply(this, arguments);
    window.dispatchEvent(new Event('replacestate'));
    window.dispatchEvent(new Event('locationchange'));
    return ret;
})(window.history.replaceState);

class TwitchClicker {
    constructor(){
        this.points = this.getPoints();

        this._loop();
    }

    // return points earned for current streamer
    getPoints(){
        let data = this._getLocalData()
        let streamer = data.streamer.find(e => e.name === this.who())

        return streamer  ? parseFloat(streamer.points) : 0;
    }
    // return current streamer
    who(){
        let el = document.querySelectorAll('h1.tw-title');
        return el.length === 1 ? el[0].innerHTML : false;
    }
    // start bot
    start(){
        this._loop();
        this._log('Bot started');
    }
    // stop bot
    stop(){
        removeEventListener('DOMNodeInserted', e => this._listenDOMChanges(e, this), false);
        this._log('Bot stopped');
    }
// Private methods
    // get local data
    _getLocalData(){
        return JSON.parse(localStorage.getItem(DATA_KEY)) || {streamer: []};
    }
    // save local data
    _saveLocalData(data){
        this._log('Data saved');
        return localStorage.setItem(DATA_KEY, JSON.stringify(data));
    }

    // add and save points of current streamer
    _addPoints(points){
        let newPoints = this.getPoints();
        newPoints += points;

        let data = this._getLocalData();
        let name = this.who();
        let streamer = data.streamer.findIndex(e => e.name === name);

        if(streamer !== -1){
            data.streamer[streamer].points = newPoints
        } else {
            data.streamer.push({name, points: newPoints})
        }

        this._updateUi(newPoints);
        this._saveLocalData(data)
    }
    _updateUi(points){
        let ui = document.querySelector('#points-earned')
        ui.textContent = this.who() + ' - ' + points + 'pts';
    }
    // click on element
    _clickEvent(el){
        let evt;
        if (document.createEvent) {
            evt = document.createEvent("MouseEvents");
            evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        }
        (evt) ? el.dispatchEvent(evt) : (el.click && el.click());
    }
    // search bonus button
    _checkButton(){
        let target = document.querySelectorAll(BONUS_CLASS.map(e => '.'+e).join(''));
        if(target.length === 1){
            this._clickEvent(target[0]);
            this._log(POINTS_ADDED, 'points added!');
            this._addPoints(POINTS_ADDED);
        }
    }
    // custom log rendering
    _log(){
        const prefix = new Date().toLocaleTimeString() + '- [TwitchAutoClicker] - '
        console.log(prefix, ...arguments);
    }
    _showUI(){
        let ui = document.createElement('div');
        ui.id = 'twitchbot-ui-container';

        ui.style.position = 'fixed';
        ui.style.bottom = '40px';
        ui.style.left = 0;
        ui.style.display = 'flex';
        ui.style.justifyContent = 'center';
        ui.style.alignItems = 'center';
        ui.style.backgroundColor = '#9C9C9C';
        ui.style.minWidth = '140px';
        ui.style.padding = '0 5px'
        ui.style.height = '50px';
        ui.style.zIndex = '999';
        ui.style.borderTopRightRadius = '.25em';
        ui.style.borderTop = '1px solid black';
        ui.style.borderRight = '1px solid black';

        let textContainer = document.createElement('span');
        textContainer.id = 'points-earned';
        let text = document.createTextNode(this.who() + ' - ' + this.getPoints() + 'pts');
        textContainer.style.fontSize = '1em';
        textContainer.style.color = 'black';

        textContainer.appendChild(text)
        ui.appendChild(textContainer);

        document.body.appendChild(ui);
    }
    _pageChange(){
        window.addEventListener('locationchange', (event) => {
            setTimeout(() => {
                this._log('update UI done')
                this._updateUi(this.getPoints())
            }, 2500);
        })
    }
    // bot loop
    _listenDOMChanges(e, self) {
        const ELEMENT_CLASS = ["tw-transition", "tw-transition--enter-done", "tw-transition__slide-over-left", "tw-transition__slide-over-left--enter-done"]
        const CHAT_MSG_CLASS = ["chat-scrollable-area__message-container", "tw-flex-grow-1", "tw-pd-b-1"]
        const ANIMATE_CLASS = ["tw-animated-number", "tw-animated-number--monospaced"]

        let isChat = CHAT_MSG_CLASS.every(h => e.relatedNode.classList.contains(h) )
        let isEffect = ANIMATE_CLASS.every(h => e.relatedNode.classList.contains(h) )

        if(isChat || isEffect) return

        let exists = ELEMENT_CLASS.every(h => e.relatedNode.classList.contains(h) )
        if(exists) setTimeout(e => self._checkButton(), 1000);
    }
    _loop(){
        if(!this.who()) {
            setTimeout(() => this._loop(), 5000);
            return;
        }

        this._showUI();
        this._pageChange();

        this._log('Init auto clicker');
        this._checkButton();

        addEventListener('DOMNodeInserted', e => this._listenDOMChanges(e, this), false)

    }
}
window.TwitchBot = new TwitchClicker();